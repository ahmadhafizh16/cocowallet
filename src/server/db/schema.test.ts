import { eq } from "drizzle-orm";
import { createJournalFixture } from "./test-fixture";
import {
  accounts,
  currencies,
  journalEntries,
  transactions,
  wallets,
} from "./schema";

describe("wallet and journal schema", () => {
  let fixture: ReturnType<typeof createJournalFixture>;
  beforeEach(() => {
    fixture = createJournalFixture();
  });
  afterEach(() => {
    fixture.cleanup();
  });

  const deposit = (id = "deposit") => {
    fixture.database.db
      .insert(transactions)
      .values({
        id,
        type: "deposit",
        targetWalletId: "main-usd",
        provider: "demo_bank",
      })
      .run();
  };

  it("enforces one main account and one wallet per account and currency", () => {
    const { db } = fixture.database;
    expect(() =>
      db
        .insert(accounts)
        .values({ id: "other-main", role: "main", defaultCurrency: "USD" })
        .run(),
    ).toThrow();
    expect(() =>
      db
        .insert(wallets)
        .values({ id: "duplicate", accountId: "main", currencyCode: "USD" })
        .run(),
    ).toThrow();
  });

  it("enforces account, currency, wallet and transaction references", () => {
    const { db } = fixture.database;
    expect(() =>
      db
        .insert(wallets)
        .values({
          id: "missing-account",
          accountId: "missing",
          currencyCode: "USD",
        })
        .run(),
    ).toThrow();
    expect(() =>
      db
        .insert(wallets)
        .values({
          id: "missing-currency",
          accountId: "main",
          currencyCode: "ZZZ",
        })
        .run(),
    ).toThrow();
    expect(() =>
      db
        .insert(journalEntries)
        .values({
          transactionId: "missing",
          walletId: "main-usd",
          amountMinor: 1n,
        })
        .run(),
    ).toThrow();
  });

  it("maps bounded currency exponents to numbers and money to exact bigint", () => {
    const { db } = fixture.database;
    expect(
      db.select().from(currencies).where(eq(currencies.code, "JPY")).get()
        ?.minorUnit,
    ).toBe(0);
    deposit();
    const amount = 9_007_199_254_740_993n;
    db.insert(journalEntries)
      .values({
        transactionId: "deposit",
        walletId: "main-usd",
        amountMinor: amount,
      })
      .run();
    expect(db.select().from(journalEntries).get()?.amountMinor).toBe(amount);
  });

  it.each([0, 0.5, "not a number", null, -9_223_372_036_854_775_808n])(
    "rejects an invalid raw journal amount: %s",
    (amount) => {
      deposit();
      const statement = fixture.database.sqlite.prepare(
        "INSERT INTO journal_entries(id,transaction_id,wallet_id,amount_minor) VALUES ('entry','deposit','main-usd',?)",
      );
      expect(() => statement.run(amount)).toThrow();
    },
  );

  it("rejects fractional raw currency precision", () => {
    expect(() =>
      fixture.database.sqlite
        .prepare(
          "INSERT INTO currencies(code,name,minor_unit) VALUES ('BAD','Bad currency',1.5)",
        )
        .run(),
    ).toThrow();
  });

  it("requires journal direction and wallet to match the completed transaction", () => {
    deposit();
    const { db } = fixture.database;
    expect(() =>
      db
        .insert(journalEntries)
        .values({
          transactionId: "deposit",
          walletId: "main-usd",
          amountMinor: -1n,
        })
        .run(),
    ).toThrow();
    expect(() =>
      db
        .insert(journalEntries)
        .values({
          transactionId: "deposit",
          walletId: "recipient-usd",
          amountMinor: 1n,
        })
        .run(),
    ).toThrow();
  });

  it("prevents duplicate entries and edits to completed accounting history", () => {
    deposit();
    const { db } = fixture.database;
    db.insert(journalEntries)
      .values({
        id: "entry",
        transactionId: "deposit",
        walletId: "main-usd",
        amountMinor: 1n,
      })
      .run();
    expect(() =>
      db
        .insert(journalEntries)
        .values({
          transactionId: "deposit",
          walletId: "main-usd",
          amountMinor: 1n,
        })
        .run(),
    ).toThrow();
    expect(() =>
      db.update(journalEntries).set({ amountMinor: 2n }).run(),
    ).toThrow("immutable");
    expect(() => db.delete(journalEntries).run()).toThrow("immutable");
    expect(() =>
      db.update(transactions).set({ provider: "community_bank" }).run(),
    ).toThrow("immutable");
    expect(() => db.delete(transactions).run()).toThrow("immutable");
  });

  it("preserves wallet identity and historical currency precision", () => {
    const { db } = fixture.database;
    expect(() =>
      db
        .update(wallets)
        .set({ currencyCode: "JPY" })
        .where(eq(wallets.id, "main-usd"))
        .run(),
    ).toThrow("immutable");
    expect(() =>
      db
        .update(currencies)
        .set({ minorUnit: 0 })
        .where(eq(currencies.code, "USD"))
        .run(),
    ).toThrow("immutable");
    expect(() =>
      db
        .update(accounts)
        .set({ defaultCurrency: "USD" })
        .where(eq(accounts.id, "recipient"))
        .run(),
    ).toThrow("inspect-only");
    db.update(accounts)
      .set({ defaultCurrency: "GBP" })
      .where(eq(accounts.id, "main"))
      .run();
    expect(
      db.select().from(accounts).where(eq(accounts.id, "main")).get()
        ?.defaultCurrency,
    ).toBe("GBP");
  });

  it("rejects malformed completed-transaction shapes", () => {
    const { db } = fixture.database;
    expect(() =>
      db
        .insert(transactions)
        .values({
          type: "deposit",
          sourceWalletId: "main-usd",
          provider: "demo_bank",
        })
        .run(),
    ).toThrow();
    expect(() =>
      db
        .insert(transactions)
        .values({ type: "deposit", targetWalletId: "main-usd" })
        .run(),
    ).toThrow();
    expect(() =>
      db
        .insert(transactions)
        .values({
          type: "conversion",
          sourceWalletId: "main-usd",
          targetWalletId: "main-gbp",
          rate: "0.8",
        })
        .run(),
    ).toThrow();
  });
});
