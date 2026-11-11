import { openDatabase, type WalletDatabase } from "../../server/db/connection";
import { journalEntries, transactions } from "../../server/db/schema";
import { createJournalFixture } from "../../server/db/test-fixture";
import { MAX_MINOR } from "../money/money";
import { readAccountBalances, readWalletBalance } from "./balances";

describe("journal-derived balances", () => {
  let fixture: ReturnType<typeof createJournalFixture>;
  let sequence: number;
  beforeEach(() => {
    fixture = createJournalFixture();
    sequence = 0;
  });
  afterEach(() => {
    jest.restoreAllMocks();
    fixture.cleanup();
  });

  const record = (
    walletId: string,
    amountMinor: bigint,
    database: WalletDatabase = fixture.database,
  ) => {
    const id = `operation-${sequence++}`;
    const positive = amountMinor > 0n;
    database.sqlite.transaction(() => {
      database.db
        .insert(transactions)
        .values({
          id,
          type: positive ? "deposit" : "withdrawal",
          sourceWalletId: positive ? null : walletId,
          targetWalletId: positive ? walletId : null,
          provider: "demo_bank",
        })
        .run();
      database.db
        .insert(journalEntries)
        .values({ transactionId: id, walletId, amountMinor })
        .run();
    })();
  };

  it("returns zero for empty wallets and distinguishes missing resources", () => {
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(0n);
    expect(readAccountBalances(fixture.database, "main")).toEqual([
      {
        walletId: "main-gbp",
        currencyCode: "GBP",
        minorUnit: 2,
        balanceMinor: 0n,
      },
      {
        walletId: "main-usd",
        currencyCode: "USD",
        minorUnit: 2,
        balanceMinor: 0n,
      },
    ]);
    expect(() => readWalletBalance(fixture.database, "missing")).toThrow(
      "Wallet does not exist",
    );
    expect(() => readAccountBalances(fixture.database, "missing")).toThrow(
      "Account does not exist",
    );
  });

  it("isolates wallets, currencies, and accounts and preserves signed amounts", () => {
    record("main-usd", 9_007_199_254_740_993n);
    record("main-usd", -100n);
    record("main-gbp", 42n);
    record("recipient-usd", 700n);
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(
      9_007_199_254_740_893n,
    );
    expect(readWalletBalance(fixture.database, "main-gbp")).toBe(42n);
    expect(readWalletBalance(fixture.database, "recipient-usd")).toBe(700n);
  });

  it.each([
    [MAX_MINOR, 1n, -MAX_MINOR],
    [-MAX_MINOR, MAX_MINOR, 1n],
    [1n, -MAX_MINOR, MAX_MINOR],
  ])(
    "validates only the final aggregate, not int64 intermediate subtotals",
    (...amounts) => {
      for (const amount of amounts) record("main-usd", amount);
      expect(readWalletBalance(fixture.database, "main-usd")).toBe(1n);
    },
  );

  it.each([[MAX_MINOR, 1n], [-1n]])(
    "rejects an out-of-range final balance",
    (...amounts) => {
      for (const amount of amounts) record("main-usd", amount);
      expect(() => readWalletBalance(fixture.database, "main-usd")).toThrow();
    },
  );

  it("streams a long journal without int64 or floating-point aggregation", () => {
    fixture.database.sqlite.transaction(() => {
      for (let index = 0; index < 512; index++) {
        for (const amount of [MAX_MINOR, 1n, -MAX_MINOR, -1n]) {
          record("main-usd", amount);
        }
      }
      record("main-usd", 1n);
    })();
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(1n);
  });

  it("uses one snapshot for all wallets even when another connection commits", () => {
    const second = openDatabase(fixture.filename);
    const originalPrepare = fixture.database.sqlite.prepare.bind(
      fixture.database.sqlite,
    );
    let inserted = false;
    jest.spyOn(fixture.database.sqlite, "prepare").mockImplementation((sql) => {
      if (sql.startsWith("SELECT amount_minor") && !inserted) {
        inserted = true;
        record("main-usd", 100n, second);
      }
      return originalPrepare(sql);
    });
    try {
      expect(
        readAccountBalances(fixture.database, "main").map(
          (w) => w.balanceMinor,
        ),
      ).toEqual([0n, 0n]);
      expect(inserted).toBe(true);
      expect(readWalletBalance(fixture.database, "main-usd")).toBe(100n);
    } finally {
      second.close();
    }
  });
});
