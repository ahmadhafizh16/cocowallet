import { resolve } from "node:path";
import { Worker } from "node:worker_threads";
import { openDatabase } from "../../server/db/connection";
import {
  accounts,
  journalEntries,
  transactions,
  wallets,
} from "../../server/db/schema";
import { createJournalFixture } from "../../server/db/test-fixture";
import { MAX_MINOR } from "../money/money";
import { readWalletBalance } from "./balances";
import {
  type JournalOperation,
  type JournalWriteScope,
  withJournalWrite,
} from "./write";

describe("serialized journal writes", () => {
  let fixture: ReturnType<typeof createJournalFixture>;
  beforeEach(() => {
    fixture = createJournalFixture();
  });
  afterEach(() => {
    fixture.cleanup();
  });

  const fund = (amountMinor = 100n, id = "fund", targetWalletId = "main-usd") =>
    withJournalWrite(fixture.database, (scope) =>
      scope.record({
        id,
        type: "deposit",
        targetWalletId,
        provider: "demo_bank",
        amountMinor,
      }),
    );
  const transfer = (
    id = "transfer",
  ): Extract<JournalOperation, { type: "conversion" | "transfer" }> => ({
    id,
    type: "transfer",
    sourceWalletId: "main-usd",
    targetWalletId: "recipient-usd",
    amountMinor: 80n,
  });
  const newDestination = (scope: JournalWriteScope) => {
    scope.createDestination({ id: "new-destination", defaultCurrency: "USD" });
    scope.createWallet({
      id: "new-wallet",
      accountId: "new-destination",
      currencyCode: "USD",
    });
    scope.record({
      ...transfer(),
      targetWalletId: "new-wallet",
    });
  };

  it("records deposits, withdrawals, same-currency transfers and exact conversions", () => {
    fund(1000n);
    withJournalWrite(fixture.database, (scope) => {
      scope.record({
        id: "withdraw",
        type: "withdrawal",
        sourceWalletId: "main-usd",
        provider: "community_bank",
        amountMinor: 20n,
      });
      scope.record(transfer());
      scope.record({
        id: "conversion",
        type: "conversion",
        sourceWalletId: "main-usd",
        targetWalletId: "main-gbp",
        amountMinor: 100n,
        rate: {
          value: "1.005",
          date: "2026-11-10",
          fetchedAt: "2026-11-11T00:00:00.000Z",
          source: "fresh",
        },
      });
    });
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(800n);
    expect(readWalletBalance(fixture.database, "recipient-usd")).toBe(80n);
    expect(readWalletBalance(fixture.database, "main-gbp")).toBe(101n);
    expect(fixture.database.db.select().from(transactions).all()).toHaveLength(
      4,
    );
    expect(
      fixture.database.db.select().from(journalEntries).all(),
    ).toHaveLength(6);
  });

  it("creates and credits a destination atomically", () => {
    fund();
    withJournalWrite(fixture.database, newDestination);
    expect(readWalletBalance(fixture.database, "new-wallet")).toBe(80n);
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(20n);
  });

  it("creates a missing cross-currency wallet and retains the exact applied terms", () => {
    fund();
    withJournalWrite(fixture.database, (scope) => {
      scope.createDestination({ id: "jpy-recipient", defaultCurrency: "JPY" });
      scope.createWallet({
        id: "new-jpy",
        accountId: "jpy-recipient",
        currencyCode: "JPY",
      });
      scope.record({
        id: "fx-transfer",
        type: "transfer",
        sourceWalletId: "main-usd",
        targetWalletId: "new-jpy",
        amountMinor: 1n,
        rate: {
          value: "50.000000000000000001",
          date: "2026-11-10",
          fetchedAt: "2026-11-11T00:00:00.000Z",
          source: "cached",
        },
      });
    });
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(99n);
    expect(readWalletBalance(fixture.database, "new-jpy")).toBe(1n);
    const stored = fixture.database.db
      .select()
      .from(transactions)
      .all()
      .find((t) => t.id === "fx-transfer");
    expect(stored).toMatchObject({
      rate: "50.000000000000000001",
      rateDate: "2026-11-10",
      rateFetchedAt: "2026-11-11T00:00:00.000Z",
      rateSource: "cached",
    });
  });

  it.each([
    ["accounts", "NEW.id = 'new-destination'"],
    ["wallets", "NEW.id = 'new-wallet'"],
    ["transactions", "NEW.id = 'transfer'"],
    ["journal_entries", "NEW.amount_minor < 0"],
    ["journal_entries", "NEW.wallet_id = 'new-wallet'"],
  ])(
    "rolls back every row after injected failure on %s (%s)",
    (table, condition) => {
      fund();
      fixture.database.sqlite.exec(
        `CREATE TEMP TRIGGER injected_failure AFTER INSERT ON ${table} WHEN ${condition} BEGIN SELECT RAISE(ABORT, 'injected failure'); END;`,
      );
      expect(() => withJournalWrite(fixture.database, newDestination)).toThrow(
        "injected failure",
      );
      expect(readWalletBalance(fixture.database, "main-usd")).toBe(100n);
      expect(fixture.database.db.select().from(accounts).all()).toHaveLength(2);
      expect(fixture.database.db.select().from(wallets).all()).toHaveLength(4);
      expect(
        fixture.database.db.select().from(transactions).all(),
      ).toHaveLength(1);
      expect(
        fixture.database.db.select().from(journalEntries).all(),
      ).toHaveLength(1);
      expect(fixture.database.sqlite.inTransaction).toBe(false);
    },
  );

  it("cannot commit partial records even if a callback swallows an insertion error", () => {
    fund();
    fixture.database.sqlite.exec(
      "CREATE TEMP TRIGGER reject_credit BEFORE INSERT ON journal_entries WHEN NEW.wallet_id = 'recipient-usd' BEGIN SELECT RAISE(ABORT, 'credit rejected'); END;",
    );
    expect(() =>
      withJournalWrite(fixture.database, (scope) => {
        try {
          scope.record(transfer());
        } catch {
          /* The boundary must still roll back. */
        }
      }),
    ).toThrow("credit rejected");
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(100n);
    expect(fixture.database.db.select().from(transactions).all()).toHaveLength(
      1,
    );
  });

  it("rejects overspending, zero credits and target balance overflow without history", () => {
    fund();
    expect(() =>
      withJournalWrite(fixture.database, (scope) =>
        scope.record({ ...transfer(), amountMinor: 101n }),
      ),
    ).toThrow("insufficient funds");
    expect(() =>
      withJournalWrite(fixture.database, (scope) =>
        scope.record({
          id: "tiny",
          type: "conversion",
          sourceWalletId: "main-usd",
          targetWalletId: "main-gbp",
          amountMinor: 1n,
          rate: {
            value: "0.0001",
            date: "2026-11-10",
            fetchedAt: "2026-11-11T00:00:00.000Z",
            source: "cached",
          },
        }),
      ),
    ).toThrow();
    fund(MAX_MINOR, "full-target", "main-gbp");
    expect(() =>
      withJournalWrite(fixture.database, (scope) =>
        scope.record({
          id: "overflow",
          type: "conversion",
          sourceWalletId: "main-usd",
          targetWalletId: "main-gbp",
          amountMinor: 1n,
          rate: {
            value: "1",
            date: "2026-11-10",
            fetchedAt: "2026-11-11T00:00:00.000Z",
            source: "fresh",
          },
        }),
      ),
    ).toThrow();
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(100n);
    expect(readWalletBalance(fixture.database, "main-gbp")).toBe(MAX_MINOR);
    expect(fixture.database.db.select().from(transactions).all()).toHaveLength(
      2,
    );
  });

  it("enforces main-only actions, no self-transfer, and conversion/FX shape", () => {
    fund();
    const invalid: JournalOperation[] = [
      {
        id: "bad-deposit",
        type: "deposit",
        targetWalletId: "recipient-usd",
        provider: "demo_bank",
        amountMinor: 1n,
      },
      {
        id: "bad-withdrawal",
        type: "withdrawal",
        sourceWalletId: "recipient-usd",
        provider: "demo_bank",
        amountMinor: 1n,
      },
      { ...transfer("bad-source"), sourceWalletId: "recipient-usd" },
      { ...transfer("self"), targetWalletId: "main-gbp" },
      {
        id: "bad-conversion",
        type: "conversion",
        sourceWalletId: "main-usd",
        targetWalletId: "recipient-usd",
        amountMinor: 1n,
      },
      {
        id: "missing-rate",
        type: "conversion",
        sourceWalletId: "main-usd",
        targetWalletId: "main-gbp",
        amountMinor: 1n,
      },
      {
        ...transfer("extra-rate"),
        rate: {
          value: "1",
          date: "2026-11-10",
          fetchedAt: "2026-11-11T00:00:00.000Z",
          source: "fresh",
        },
      },
    ];
    for (const operation of invalid)
      expect(() =>
        withJournalWrite(fixture.database, (scope) => scope.record(operation)),
      ).toThrow();
    expect(fixture.database.db.select().from(transactions).all()).toHaveLength(
      1,
    );
  });

  it("refuses deferred outer transactions, promises and escaped write scopes", async () => {
    let escaped: JournalWriteScope | undefined;
    expect(() =>
      fixture.database.sqlite.transaction(() =>
        withJournalWrite(fixture.database, () => undefined),
      )(),
    ).toThrow("top-level immediate");
    const promise = Promise.resolve();
    expect(() =>
      withJournalWrite(
        fixture.database,
        // @ts-expect-error Async callbacks are invalid; exercise the runtime guard too.
        (scope) => {
          escaped = scope;
          scope.createDestination({
            id: "async-destination",
            defaultCurrency: "USD",
          });
          return promise;
        },
      ),
    ).toThrow("must not return promises");
    await promise;
    expect(() => escaped?.record(transfer())).toThrow("scope is closed");
    expect(fixture.database.db.select().from(accounts).all()).toHaveLength(2);
  });

  it("supports atomic success-result recording and replay after reopening", () => {
    fixture.database.sqlite.exec(
      "CREATE TABLE test_success_results (key TEXT PRIMARY KEY, transaction_id TEXT NOT NULL REFERENCES transactions(id))",
    );
    const execute = (database: typeof fixture.database) =>
      withJournalWrite(database, (scope) => {
        const existing = database.sqlite
          .prepare<[string], { transaction_id: string }>(
            "SELECT transaction_id FROM test_success_results WHERE key = ?",
          )
          .get("same-key");
        if (existing) return { transactionId: existing.transaction_id };
        const result = scope.record({
          id: "replayed-deposit",
          type: "deposit",
          targetWalletId: "main-usd",
          provider: "crypto_gateway",
          amountMinor: 15n,
        });
        database.sqlite
          .prepare("INSERT INTO test_success_results VALUES (?, ?)")
          .run("same-key", result.transactionId);
        return result;
      });
    expect(execute(fixture.database)).toEqual({
      transactionId: "replayed-deposit",
    });
    const reopened = openDatabase(fixture.filename);
    try {
      expect(execute(reopened)).toEqual({ transactionId: "replayed-deposit" });
      expect(readWalletBalance(reopened, "main-usd")).toBe(15n);
      expect(reopened.db.select().from(transactions).all()).toHaveLength(1);
    } finally {
      reopened.close();
    }
  });

  it("rolls back accounting when recording a technical success result fails", () => {
    expect(() =>
      withJournalWrite(fixture.database, (scope) => {
        scope.record({
          id: "not-durable",
          type: "deposit",
          targetWalletId: "main-usd",
          provider: "demo_bank",
          amountMinor: 1n,
        });
        fixture.database.sqlite
          .prepare("INSERT INTO nonexistent_results VALUES (?)")
          .run("key");
      }),
    ).toThrow();
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(0n);
    expect(fixture.database.db.select().from(transactions).all()).toHaveLength(
      0,
    );
  });

  it("reserves the writer lock before the callback's first read or insert", async () => {
    fund();
    const barrier = new SharedArrayBuffer(12);
    const state = new Int32Array(barrier);
    const worker = new Worker(
      `
      const { parentPort, workerData } = require('node:worker_threads');
      require('tsx/cjs');
      const { openDatabase } = require(workerData.connection);
      const { withJournalWrite } = require(workerData.write);
      const database = openDatabase(workerData.filename);
      database.sqlite.pragma('busy_timeout = 100');
      const state = new Int32Array(workerData.barrier);
      parentPort.postMessage('ready');
      Atomics.wait(state, 1, 0);
      let outcome = 1;
      try {
        withJournalWrite(database, scope => scope.record({ id: 'blocked-spend', type: 'withdrawal', sourceWalletId: 'main-usd', provider: 'demo_bank', amountMinor: 80n }));
      } catch (error) { outcome = error.code === 'SQLITE_BUSY' ? 2 : 3; }
      finally {
        database.close();
        Atomics.store(state, 2, outcome);
        Atomics.notify(state, 2);
      }
    `,
      {
        eval: true,
        workerData: {
          barrier,
          filename: fixture.filename,
          connection: resolve("src/server/db/connection.ts"),
          write: resolve("src/features/journal/write.ts"),
        },
      },
    );
    try {
      await new Promise<void>((accept, reject) => {
        worker.once("message", () => accept());
        worker.once("error", reject);
      });
      withJournalWrite(fixture.database, () => {
        // No reads/writes have run in this callback, but BEGIN IMMEDIATE holds a reservation.
        Atomics.store(state, 1, 1);
        Atomics.notify(state, 1);
        expect(Atomics.wait(state, 2, 0, 5_000)).not.toBe("timed-out");
        expect(Atomics.load(state, 2)).toBe(2);
      });
      expect(readWalletBalance(fixture.database, "main-usd")).toBe(100n);
      expect(
        fixture.database.db.select().from(transactions).all(),
      ).toHaveLength(1);
    } finally {
      await worker.terminate();
    }
  }, 15_000);

  it("serializes independent concurrent connections before checking funds", async () => {
    fund();
    const barrier = new SharedArrayBuffer(4);
    const workers: Worker[] = [];
    const ready: Promise<void>[] = [];
    const results: Promise<{ code: string }>[] = [];
    for (const id of ["spend-one", "spend-two"]) {
      const worker = new Worker(
        `
        const { parentPort, workerData } = require('node:worker_threads');
        require('tsx/cjs');
        const { openDatabase } = require(workerData.connection);
        const { withJournalWrite } = require(workerData.write);
        const database = openDatabase(workerData.filename);
        parentPort.postMessage({ type: 'ready' });
        Atomics.wait(new Int32Array(workerData.barrier), 0, 0);
        try {
          withJournalWrite(database, scope => scope.record({ id: workerData.id, type: 'withdrawal', sourceWalletId: 'main-usd', provider: 'demo_bank', amountMinor: 80n }));
          parentPort.postMessage({ type: 'result', code: 'completed' });
        } catch (error) {
          parentPort.postMessage({ type: 'result', code: error.code || error.message });
        } finally { database.close(); }
      `,
        {
          eval: true,
          workerData: {
            id,
            barrier,
            filename: fixture.filename,
            connection: resolve("src/server/db/connection.ts"),
            write: resolve("src/features/journal/write.ts"),
          },
        },
      );
      workers.push(worker);
      ready.push(
        new Promise((accept, reject) => {
          worker.on("message", (message) => {
            if (message.type === "ready") accept();
          });
          worker.once("error", reject);
          worker.once("exit", (code) => {
            if (code !== 0) reject(new Error(`Worker exited ${code}`));
          });
        }),
      );
      results.push(
        new Promise((accept, reject) => {
          worker.on("message", (message) => {
            if (message.type === "result") accept(message);
          });
          worker.once("error", reject);
          worker.once("exit", (code) => {
            if (code !== 0) reject(new Error(`Worker exited ${code}`));
          });
        }),
      );
    }
    try {
      await Promise.all(ready);
      Atomics.store(new Int32Array(barrier), 0, 1);
      Atomics.notify(new Int32Array(barrier), 0);
      expect((await Promise.all(results)).map((r) => r.code).sort()).toEqual([
        "completed",
        "insufficient_funds",
      ]);
      expect(readWalletBalance(fixture.database, "main-usd")).toBe(20n);
      expect(
        fixture.database.db.select().from(transactions).all(),
      ).toHaveLength(2);
    } finally {
      await Promise.all(workers.map((worker) => worker.terminate()));
    }
  }, 15_000);
});
