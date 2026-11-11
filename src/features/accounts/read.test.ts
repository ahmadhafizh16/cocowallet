import { eq } from "drizzle-orm";
import { openDatabase, type WalletDatabase } from "../../server/db/connection";
import {
  accounts,
  currencies,
  journalEntries,
  transactions,
  wallets,
} from "../../server/db/schema";
import { createJournalFixture } from "../../server/db/test-fixture";
import { JournalError } from "../journal/errors";
import { withJournalWrite } from "../journal/write";
import { getCurrencyExponent } from "../money/currency-precision";
import { MAX_MINOR, MoneyError } from "../money/money";
import { AccountDataError } from "./errors";
import {
  listAccounts,
  readAccountWallets,
  readOverviewSnapshot,
  readAccountMetadata,
} from "./read";

describe("persistent account read models", () => {
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
  it("reads one account's metadata without aggregating balances or validating unrelated destinations", () => {
    fixture.database.sqlite
      .prepare("UPDATE accounts SET created_at='invalid' WHERE id='recipient'")
      .run();
    const prepare = fixture.database.sqlite.prepare.bind(
      fixture.database.sqlite,
    );
    jest.spyOn(fixture.database.sqlite, "prepare").mockImplementation((sql) => {
      if (sql.includes("journal_entries"))
        throw new Error("Metadata reads must not aggregate money");
      return prepare(sql);
    });
    fixture.database.sqlite.pragma("query_only=ON");
    expect(readAccountMetadata(fixture.database, "main")).toMatchObject({
      id: "main",
      role: "main",
      inspectOnly: false,
    });
    expect(() => readAccountMetadata(fixture.database, "missing")).toThrow(
      expect.objectContaining({ code: "account_not_found" }),
    );
    expect(() => readAccountMetadata(fixture.database, "recipient")).toThrow(
      expect.objectContaining({ code: "invalid_account_data" }),
    );
  });

  const fund = (
    amountMinor: bigint,
    targetWalletId = "main-usd",
    database: WalletDatabase = fixture.database,
  ) =>
    withJournalWrite(database, (scope) =>
      scope.record({
        id: `test-deposit-${sequence++}`,
        type: "deposit",
        targetWalletId,
        provider: "demo_bank",
        amountMinor,
      }),
    );

  // Deliberately bypass funds checks only to exercise fail-closed stored-data reads.
  const appendUnchecked = (amountMinor: bigint) => {
    const positive = amountMinor > 0n;
    const id = `unchecked-test-operation-${sequence++}`;
    fixture.database.sqlite.transaction(() => {
      fixture.database.db
        .insert(transactions)
        .values({
          id,
          type: positive ? "deposit" : "withdrawal",
          sourceWalletId: positive ? null : "main-usd",
          targetWalletId: positive ? "main-usd" : null,
          provider: "demo_bank",
        })
        .run();
      fixture.database.db
        .insert(journalEntries)
        .values({ transactionId: id, walletId: "main-usd", amountMinor })
        .run();
    })();
  };

  const expectInvalidReads = () => {
    for (const read of [
      () => listAccounts(fixture.database),
      () => readAccountWallets(fixture.database, "main"),
      () => readOverviewSnapshot(fixture.database),
    ]) {
      expect(read).toThrow(AccountDataError);
      expect(read).toThrow(
        expect.objectContaining({ code: "invalid_account_data" }),
      );
    }
  };

  it("returns main first and destinations in stable created-at/id order", () => {
    fixture.database.db
      .update(accounts)
      .set({ createdAt: "2026-11-11T00:00:00.000Z" })
      .where(eq(accounts.id, "main"))
      .run();
    fixture.database.db
      .update(accounts)
      .set({ createdAt: "2026-01-01T00:00:00.000Z" })
      .where(eq(accounts.id, "recipient"))
      .run();
    fixture.database.db
      .insert(accounts)
      .values([
        {
          id: "z-destination",
          role: "destination",
          defaultCurrency: "JPY",
          createdAt: "2025-01-01T00:00:00.000Z",
        },
        {
          id: "a-destination",
          role: "destination",
          defaultCurrency: "USD",
          createdAt: "2025-01-01T00:00:00.000Z",
        },
      ])
      .run();
    expect(listAccounts(fixture.database)).toEqual([
      {
        id: "main",
        role: "main",
        defaultCurrency: "USD",
        createdAt: "2026-11-11T00:00:00.000Z",
        inspectOnly: false,
      },
      {
        id: "a-destination",
        role: "destination",
        defaultCurrency: "USD",
        createdAt: "2025-01-01T00:00:00.000Z",
        inspectOnly: true,
      },
      {
        id: "z-destination",
        role: "destination",
        defaultCurrency: "JPY",
        createdAt: "2025-01-01T00:00:00.000Z",
        inspectOnly: true,
      },
      {
        id: "recipient",
        role: "destination",
        defaultCurrency: "GBP",
        createdAt: "2026-01-01T00:00:00.000Z",
        inspectOnly: true,
      },
    ]);
  });

  it("reads empty wallets with stored names and preserves the current GBP main default", () => {
    fixture.database.db
      .update(accounts)
      .set({ defaultCurrency: "GBP" })
      .where(eq(accounts.id, "main"))
      .run();
    expect(readAccountWallets(fixture.database, "main")).toEqual({
      account: {
        id: "main",
        role: "main",
        defaultCurrency: "GBP",
        createdAt: expect.any(String),
        inspectOnly: false,
      },
      wallets: [
        {
          id: "main-gbp",
          accountId: "main",
          currency: "GBP",
          name: "Pound Sterling",
          exponent: 2,
          balanceMinor: "0",
        },
        {
          id: "main-usd",
          accountId: "main",
          currency: "USD",
          name: "US Dollar",
          exponent: 2,
          balanceMinor: "0",
        },
      ],
    });
    expect(readOverviewSnapshot(fixture.database).activeAccountId).toBe("main");
  });

  it("returns exact JSON-safe balances above Number.MAX_SAFE_INTEGER and at MAX_MINOR", () => {
    fund(9_007_199_254_740_993n);
    fund(MAX_MINOR, "main-gbp");
    const snapshot = readOverviewSnapshot(fixture.database);
    expect(snapshot.wallets).toEqual([
      expect.objectContaining({
        id: "main-gbp",
        balanceMinor: MAX_MINOR.toString(),
      }),
      expect.objectContaining({
        id: "main-usd",
        balanceMinor: "9007199254740993",
      }),
      expect.objectContaining({ id: "recipient-gbp", balanceMinor: "0" }),
      expect.objectContaining({ id: "recipient-usd", balanceMinor: "0" }),
    ]);
    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
  });

  it("includes stored currencies beyond the three startup currencies with pinned exponents", () => {
    fixture.database.db
      .insert(currencies)
      .values(
        ["BHD", "CLF"].map((code) => ({
          code,
          name: `Stored ${code} name`,
          minorUnit: getCurrencyExponent(code),
        })),
      )
      .run();
    fixture.database.db
      .insert(wallets)
      .values(
        ["JPY", "BHD", "CLF"].map((currencyCode) => ({
          id: `main-${currencyCode.toLowerCase()}`,
          accountId: "main",
          currencyCode,
        })),
      )
      .run();
    fund(123n, "main-jpy");
    const result = readAccountWallets(fixture.database, "main");
    expect(result.wallets.map((wallet) => wallet.currency)).toEqual([
      "BHD",
      "CLF",
      "GBP",
      "JPY",
      "USD",
    ]);
    expect(result.wallets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          currency: "BHD",
          exponent: 3,
          balanceMinor: "0",
        }),
        expect.objectContaining({
          currency: "CLF",
          exponent: 4,
          balanceMinor: "0",
        }),
        expect.objectContaining({
          currency: "JPY",
          exponent: 0,
          balanceMinor: "123",
        }),
      ]),
    );
  });

  it("lists an internally created and credited destination as inspect-only", () => {
    fund(100n);
    withJournalWrite(fixture.database, (scope) => {
      scope.createDestination({
        id: "new-destination",
        defaultCurrency: "USD",
      });
      scope.createWallet({
        id: "new-usd",
        accountId: "new-destination",
        currencyCode: "USD",
      });
      scope.record({
        id: "test-only-transfer",
        type: "transfer",
        sourceWalletId: "main-usd",
        targetWalletId: "new-usd",
        amountMinor: 80n,
      });
    });
    expect(listAccounts(fixture.database)).toContainEqual({
      id: "new-destination",
      role: "destination",
      defaultCurrency: "USD",
      createdAt: expect.any(String),
      inspectOnly: true,
    });
    expect(
      readAccountWallets(fixture.database, "new-destination"),
    ).toMatchObject({
      account: { inspectOnly: true },
      wallets: [{ id: "new-usd", balanceMinor: "80" }],
    });
    expect(readAccountWallets(fixture.database, "main").wallets).toContainEqual(
      expect.objectContaining({ id: "main-usd", balanceMinor: "20" }),
    );
    expect(() =>
      withJournalWrite(fixture.database, (scope) =>
        scope.record({
          id: "forbidden-destination-withdrawal",
          type: "withdrawal",
          sourceWalletId: "new-usd",
          provider: "demo_bank",
          amountMinor: 1n,
        }),
      ),
    ).toThrow(expect.objectContaining({ code: "inspect_only" }));
    expect(
      readAccountWallets(fixture.database, "new-destination").wallets,
    ).toEqual([expect.objectContaining({ balanceMinor: "80" })]);
  });

  it("returns no wallets for an empty destination rather than reusing main wallets", () => {
    withJournalWrite(fixture.database, (scope) =>
      scope.createDestination({ id: "empty", defaultCurrency: "JPY" }),
    );
    expect(readAccountWallets(fixture.database, "empty")).toMatchObject({
      account: { id: "empty", inspectOnly: true, defaultCurrency: "JPY" },
      wallets: [],
    });
    expect(readOverviewSnapshot(fixture.database).wallets).toHaveLength(4);
  });

  it.each(["missing", "", "main-usd", "main' OR 1=1 --"])(
    "distinguishes unknown account %j without falling back to the main account",
    (id) => {
      expect(() => readAccountWallets(fixture.database, id)).toThrow(
        expect.objectContaining({ code: "account_not_found" }),
      );
    },
  );

  it("never seeds on a read when the main account is missing, including unknown-id reads", () => {
    fixture.database.sqlite.exec("DELETE FROM wallets; DELETE FROM accounts;");
    fixture.database.sqlite.pragma("query_only = ON");
    const before = fixture.database.sqlite
      .prepare("SELECT total_changes() AS changes")
      .get();
    for (const read of [
      () => listAccounts(fixture.database),
      () => readOverviewSnapshot(fixture.database),
      () => readAccountWallets(fixture.database, "main"),
      () => readAccountWallets(fixture.database, "missing"),
    ]) {
      expect(read).toThrow(
        expect.objectContaining({ code: "account_not_initialized" }),
      );
    }
    expect(fixture.database.db.select().from(accounts).all()).toEqual([]);
    expect(fixture.database.db.select().from(wallets).all()).toEqual([]);
    expect(fixture.database.db.select().from(currencies).all()).toHaveLength(3);
    expect(
      fixture.database.sqlite
        .prepare("SELECT total_changes() AS changes")
        .get(),
    ).toEqual(before);
  });

  it("requires a main account even when a destination exists", () => {
    fixture.database.sqlite.exec(
      "DELETE FROM wallets WHERE account_id = 'main'; DELETE FROM accounts WHERE id = 'main';",
    );
    expect(() => readAccountWallets(fixture.database, "recipient")).toThrow(
      expect.objectContaining({ code: "account_not_initialized" }),
    );
  });

  it("rejects multiple main accounts instead of selecting one arbitrarily", () => {
    fixture.database.sqlite.exec("DROP INDEX one_main_account");
    fixture.database.db
      .insert(accounts)
      .values({ id: "other-main", role: "main", defaultCurrency: "USD" })
      .run();
    expectInvalidReads();
  });

  it("allows nested read snapshots and performs no writes on a query-only connection", () => {
    fund(123n);
    fixture.database.sqlite.pragma("query_only = ON");
    const before = fixture.database.sqlite
      .prepare("SELECT total_changes() AS changes")
      .get();
    fixture.database.sqlite.transaction(() => {
      expect(listAccounts(fixture.database)).toHaveLength(2);
      expect(readAccountWallets(fixture.database, "main").wallets).toHaveLength(
        2,
      );
      expect(readOverviewSnapshot(fixture.database).wallets).toHaveLength(4);
    })();
    expect(
      fixture.database.sqlite
        .prepare("SELECT total_changes() AS changes")
        .get(),
    ).toEqual(before);
    expect(fixture.database.sqlite.inTransaction).toBe(false);
  });

  it.each([
    "",
    "   ",
    "not-a-timestamp",
    "2026",
    "2026-01-01",
    "2026-02-30T00:00:00.000Z",
  ])("rejects malformed stored account timestamp %j", (createdAt) => {
    fixture.database.db
      .update(accounts)
      .set({ createdAt })
      .where(eq(accounts.id, "main"))
      .run();
    expectInvalidReads();
  });

  it("rejects a blank stored account identifier", () => {
    fixture.database.db
      .insert(accounts)
      .values({ id: "", role: "destination", defaultCurrency: "USD" })
      .run();
    expectInvalidReads();
  });

  it("rejects a malformed role even when a valid main account remains", () => {
    fixture.database.sqlite.exec(
      `DROP TRIGGER account_identity_no_update;
       PRAGMA ignore_check_constraints = ON;
       UPDATE accounts SET role = 'unexpected' WHERE id = 'recipient';`,
    );
    expectInvalidReads();
  });

  it.each(["", "  "])("rejects a missing stored currency name %j", (name) => {
    fixture.database.db
      .update(currencies)
      .set({ name })
      .where(eq(currencies.code, "USD"))
      .run();
    expectInvalidReads();
  });

  it.each([0n, 1n, 3n, 5n, 1.5, "invalid"])(
    "rejects unpinned or malformed stored USD precision %s",
    (minorUnit) => {
      fixture.database.sqlite.exec(
        "DROP TRIGGER used_currency_precision_no_update; PRAGMA ignore_check_constraints = ON;",
      );
      fixture.database.sqlite
        .prepare("UPDATE currencies SET minor_unit = ? WHERE code = 'USD'")
        .run(minorUnit);
      expectInvalidReads();
    },
  );

  it.each(["ZZZ", "XXX"])(
    "does not guess an accounting exponent for stored currency %s",
    (code) => {
      fixture.database.db
        .insert(currencies)
        .values({ code, name: "Unknown accounting precision", minorUnit: 2 })
        .run();
      fixture.database.db
        .insert(wallets)
        .values({
          id: "unknown-precision",
          accountId: "main",
          currencyCode: code,
        })
        .run();
      for (const read of [
        () => readAccountWallets(fixture.database, "main"),
        () => readOverviewSnapshot(fixture.database),
      ]) {
        expect(read).toThrow(
          expect.objectContaining({ code: "invalid_account_data" }),
        );
      }
    },
  );

  it("validates an account's default currency even without a matching wallet", () => {
    fixture.database.db
      .insert(currencies)
      .values({ code: "ZZZ", name: "Unknown precision", minorUnit: 2 })
      .run();
    fixture.database.db
      .update(accounts)
      .set({ defaultCurrency: "ZZZ" })
      .where(eq(accounts.id, "main"))
      .run();
    expectInvalidReads();
  });

  it("does not silently drop wallets whose currency metadata is missing", () => {
    fixture.database.sqlite.pragma("foreign_keys = OFF");
    fixture.database.db
      .insert(wallets)
      .values({ id: "orphan-currency", accountId: "main", currencyCode: "EUR" })
      .run();
    expect(() => readAccountWallets(fixture.database, "main")).toThrow(
      expect.objectContaining({ code: "invalid_account_data" }),
    );
    expect(() => readOverviewSnapshot(fixture.database)).toThrow(
      expect.objectContaining({ code: "invalid_account_data" }),
    );
  });

  it("does not hide an account with missing default-currency metadata", () => {
    fixture.database.sqlite.pragma("foreign_keys = OFF");
    fixture.database.db
      .update(accounts)
      .set({ defaultCurrency: "EUR" })
      .where(eq(accounts.id, "main"))
      .run();
    expectInvalidReads();
  });

  it("rejects blank wallet identifiers instead of exposing malformed metadata", () => {
    fixture.database.db
      .insert(wallets)
      .values({ id: "", accountId: "main", currencyCode: "JPY" })
      .run();
    expect(() => readAccountWallets(fixture.database, "main")).toThrow(
      expect.objectContaining({ code: "invalid_account_data" }),
    );
    expect(() => readOverviewSnapshot(fixture.database)).toThrow(
      expect.objectContaining({ code: "invalid_account_data" }),
    );
  });

  it("does not silently omit wallets with missing account metadata from the overview", () => {
    fixture.database.sqlite.pragma("foreign_keys = OFF");
    fixture.database.db
      .insert(wallets)
      .values({
        id: "orphan-account",
        accountId: "missing",
        currencyCode: "USD",
      })
      .run();
    expect(() => readOverviewSnapshot(fixture.database)).toThrow(
      expect.objectContaining({ code: "invalid_account_data" }),
    );
  });

  it.each([[-1n], [MAX_MINOR, 1n]])(
    "propagates invalid final journal balances rather than showing a fabricated zero (%j)",
    (...amounts) => {
      for (const amount of amounts) appendUnchecked(amount);
      expect(() => readAccountWallets(fixture.database, "main")).toThrow(
        MoneyError,
      );
      expect(() => readOverviewSnapshot(fixture.database)).toThrow(MoneyError);
    },
  );

  it("retains arbitrary-precision intermediate aggregation in the existing journal reader", () => {
    for (const amount of [MAX_MINOR, 1n, -MAX_MINOR]) appendUnchecked(amount);
    expect(readAccountWallets(fixture.database, "main").wallets).toContainEqual(
      expect.objectContaining({ id: "main-usd", balanceMinor: "1" }),
    );
  });

  it("propagates malformed journal-entry errors rather than masking them", () => {
    fixture.database.sqlite.exec(
      "DROP TRIGGER journal_entry_matches_transaction_side; PRAGMA ignore_check_constraints = ON;",
    );
    appendUnchecked(0n);
    expect(() => readAccountWallets(fixture.database, "main")).toThrow(
      JournalError,
    );
    expect(() => readOverviewSnapshot(fixture.database)).toThrow(JournalError);
  });

  it("keeps accounts, metadata, and every account's balances in one WAL read snapshot", () => {
    const second = openDatabase(fixture.filename);
    const originalPrepare = fixture.database.sqlite.prepare.bind(
      fixture.database.sqlite,
    );
    let committed = false;
    jest.spyOn(fixture.database.sqlite, "prepare").mockImplementation((sql) => {
      if (sql.startsWith("SELECT amount_minor") && !committed) {
        committed = true;
        withJournalWrite(second, (scope) => {
          second.db
            .update(accounts)
            .set({ defaultCurrency: "GBP" })
            .where(eq(accounts.id, "main"))
            .run();
          second.db
            .update(currencies)
            .set({ name: "Committed new USD name" })
            .where(eq(currencies.code, "USD"))
            .run();
          scope.createDestination({ id: "arrived", defaultCurrency: "USD" });
          scope.createWallet({
            id: "arrived-usd",
            accountId: "arrived",
            currencyCode: "USD",
          });
          scope.record({
            id: "concurrent-test-deposit",
            type: "deposit",
            targetWalletId: "main-usd",
            provider: "demo_bank",
            amountMinor: 100n,
          });
          scope.record({
            id: "concurrent-test-transfer-existing",
            type: "transfer",
            sourceWalletId: "main-usd",
            targetWalletId: "recipient-usd",
            amountMinor: 80n,
          });
          scope.record({
            id: "concurrent-test-transfer-new",
            type: "transfer",
            sourceWalletId: "main-usd",
            targetWalletId: "arrived-usd",
            amountMinor: 20n,
          });
        });
      }
      return originalPrepare(sql);
    });
    try {
      const before = readOverviewSnapshot(fixture.database);
      expect(committed).toBe(true);
      expect(before.accounts).toHaveLength(2);
      expect(before.accounts[0]).toMatchObject({ defaultCurrency: "USD" });
      expect(before.wallets).toHaveLength(4);
      expect(
        before.wallets.every((wallet) => wallet.balanceMinor === "0"),
      ).toBe(true);
      expect(
        before.wallets
          .filter((wallet) => wallet.currency === "USD")
          .map((wallet) => wallet.name),
      ).toEqual(["US Dollar", "US Dollar"]);

      const after = readOverviewSnapshot(fixture.database);
      expect(after.accounts).toHaveLength(3);
      expect(after.accounts[0]).toMatchObject({ defaultCurrency: "GBP" });
      expect(after.wallets).toHaveLength(5);
      expect(after.wallets).toContainEqual(
        expect.objectContaining({ id: "recipient-usd", balanceMinor: "80" }),
      );
      expect(after.wallets).toContainEqual(
        expect.objectContaining({ id: "arrived-usd", balanceMinor: "20" }),
      );
      expect(
        after.wallets
          .filter((wallet) => wallet.currency === "USD")
          .every((wallet) => wallet.name === "Committed new USD name"),
      ).toBe(true);
    } finally {
      second.close();
    }
  });
});
