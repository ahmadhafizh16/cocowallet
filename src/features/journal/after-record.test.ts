import { createJournalFixture } from "../../server/db/test-fixture";
import {
  assertJournalAfterRecord,
  withJournalAfterRecord,
  withJournalWrite,
  type JournalWriteScope,
} from "./write";

describe("scoped synchronous success registration", () => {
  let fixture: ReturnType<typeof createJournalFixture>;
  beforeEach(() => {
    fixture = createJournalFixture();
  });
  afterEach(() => fixture.cleanup());
  const operation = {
    id: "test-hook",
    type: "deposit" as const,
    targetWalletId: "main-usd",
    amountMinor: 100n,
    provider: "demo_bank" as const,
  };
  it("runs after complete entries and keeps the original receipt shape", () => {
    const result = withJournalWrite(fixture.database, (scope) =>
      scope.record(operation, (receipt) => {
        expect(receipt).toEqual({ transactionId: operation.id });
        expect(() =>
          assertJournalAfterRecord(fixture.database, receipt.transactionId),
        ).not.toThrow();
        expect(
          fixture.database.sqlite
            .prepare(
              "SELECT amount_minor FROM journal_entries WHERE transaction_id=?",
            )
            .get(receipt.transactionId),
        ).toEqual({ amount_minor: 100n });
      }),
    );
    expect(result).toEqual({ transactionId: operation.id });
    expect(() =>
      assertJournalAfterRecord(fixture.database, result.transactionId),
    ).toThrow("active after-record hook");
    fixture.database.sqlite.transaction(() => {
      expect(() =>
        assertJournalAfterRecord(fixture.database, result.transactionId),
      ).toThrow("active after-record hook");
    })();
  });
  it("rolls back even a swallowed success-registration exception", () => {
    expect(() =>
      withJournalWrite(fixture.database, (scope) => {
        try {
          scope.record(operation, () => {
            throw new Error("late registration failed");
          });
        } catch {
          /* Deliberately swallowed to exercise scope latching. */
        }
      }),
    ).toThrow("late registration failed");
    expect(
      fixture.database.sqlite.prepare("SELECT id FROM transactions").all(),
    ).toEqual([]);
    expect(
      fixture.database.sqlite.prepare("SELECT id FROM journal_entries").all(),
    ).toEqual([]);
  });
  it("rejects thenable/async hook results without committing money", () => {
    const asynchronous = (async () => {}) as unknown as NonNullable<
      Parameters<JournalWriteScope["record"]>[1]
    >;
    expect(() =>
      withJournalWrite(fixture.database, (scope) =>
        scope.record(operation, asynchronous),
      ),
    ).toThrow("synchronous");
    expect(
      fixture.database.sqlite.prepare("SELECT id FROM transactions").all(),
    ).toEqual([]);
  });

  it("latches an extension error caught inside the hook", () => {
    expect(() =>
      withJournalWrite(fixture.database, (scope) => {
        scope.record(operation, ({ transactionId }) => {
          try {
            withJournalAfterRecord(fixture.database, transactionId, () => {
              throw new Error("inner registration failed");
            });
          } catch {
            /* Deliberately caught inside the active hook. */
          }
        });
      }),
    ).toThrow("inner registration failed");
    expect(
      fixture.database.sqlite.prepare("SELECT id FROM transactions").all(),
    ).toEqual([]);
    expect(
      fixture.database.sqlite.prepare("SELECT id FROM journal_entries").all(),
    ).toEqual([]);
  });

  it("latches a mismatched transaction capability and does not run the extension", () => {
    const extension = jest.fn();
    expect(() =>
      withJournalWrite(fixture.database, (scope) => {
        scope.record(operation, () => {
          try {
            withJournalAfterRecord(
              fixture.database,
              "other-transaction",
              extension,
            );
          } catch {
            /* A rejected capability must also poison this write. */
          }
        });
      }),
    ).toThrow("active after-record hook");
    expect(extension).not.toHaveBeenCalled();
    expect(
      fixture.database.sqlite.prepare("SELECT id FROM transactions").all(),
    ).toEqual([]);
  });

  it("closes the extension capability when the hook returns", () => {
    withJournalWrite(fixture.database, (scope) => {
      scope.record(operation, ({ transactionId }) => {
        expect(
          withJournalAfterRecord(
            fixture.database,
            transactionId,
            () => "registered",
          ),
        ).toBe("registered");
      });
      expect(() =>
        withJournalAfterRecord(fixture.database, operation.id, () => {}),
      ).toThrow("active after-record hook");
    });
    expect(() =>
      withJournalAfterRecord(fixture.database, operation.id, () => {}),
    ).toThrow("active after-record hook");
  });

  it("latches a thenable extension even when its error is caught inside the hook", () => {
    const asynchronous = (async () => {}) as unknown as () => undefined;
    expect(() =>
      withJournalWrite(fixture.database, (scope) => {
        scope.record(operation, ({ transactionId }) => {
          try {
            withJournalAfterRecord(
              fixture.database,
              transactionId,
              asynchronous,
            );
          } catch {
            /* Must not permit this operation to commit. */
          }
        });
      }),
    ).toThrow("synchronous");
    expect(
      fixture.database.sqlite.prepare("SELECT id FROM transactions").all(),
    ).toEqual([]);
  });
});
