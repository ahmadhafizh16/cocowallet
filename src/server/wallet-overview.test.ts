import { seedMainAccount } from "@/features/accounts/seed";
import { withJournalWrite } from "@/features/journal/write";
import { MAX_MINOR } from "@/features/money/money";
import { openDatabase, type WalletDatabase } from "./db/connection";
import { migrateDatabase } from "./db/migrate";
import { getStoredWalletOverview } from "./wallet-overview";

jest.mock("server-only", () => ({}));

describe("database-backed wallet overview", () => {
  let database: WalletDatabase;
  let id: string;
  beforeEach(() => {
    database = openDatabase(":memory:");
    migrateDatabase(database);
    id = seedMainAccount(database);
  });
  afterEach(() => database.close());

  function fund(currency: string, amountMinor: bigint) {
    const wallet = database.sqlite
      .prepare<[string, string], { id: string }>(
        "SELECT id FROM wallets WHERE account_id = ? AND currency_code = ?",
      )
      .get(id, currency)!;
    withJournalWrite(database, (scope) =>
      scope.record({
        id: `test-${currency}`,
        type: "deposit",
        targetWalletId: wallet.id,
        amountMinor,
        provider: "demo_bank",
      }),
    );
  }

  it("uses stored IDs and true zero journal balances, never preview identities or history", () => {
    const model = getStoredWalletOverview(database);
    expect(model.mode).toBe("connected-funding");
    expect(model.activeAccountId).toBe(id);
    expect(model.wallets).toHaveLength(3);
    expect(
      model.wallets.every(
        (wallet) =>
          wallet.accountId === id &&
          wallet.balanceMinor === "0" &&
          !wallet.id.startsWith("preview-"),
      ),
    ).toBe(true);
    expect(model.usdTotals?.[id]).toEqual({
      status: "available",
      balanceMinor: "0",
    });
    expect(model.balanceHistory).toBeUndefined();
    expect(() => JSON.stringify(model)).not.toThrow();
  });

  it("shows an exact USD-only total without demanding unnecessary FX rates", () => {
    fund("USD", MAX_MINOR);
    expect(getStoredWalletOverview(database).usdTotals?.[id]).toEqual({
      status: "available",
      balanceMinor: MAX_MINOR.toString(),
    });
  });

  it("does not omit nonzero foreign balances from an apparent USD total", () => {
    fund("EUR", 125n);
    const model = getStoredWalletOverview(database);
    expect(model.usdTotals?.[id]).toEqual({ status: "unavailable" });
    expect(
      model.wallets.find((wallet) => wallet.currency === "EUR")?.balanceMinor,
    ).toBe("125");
  });

  it("leaves destination valuation policy unresolved without reusing the main total", () => {
    withJournalWrite(database, (scope) =>
      scope.createDestination({ id: "destination", defaultCurrency: "GBP" }),
    );
    const model = getStoredWalletOverview(database);
    expect(
      model.accounts.find((account) => account.id === "destination")?.role,
    ).toBe("destination");
    expect(model.usdTotals?.destination).toEqual({ status: "unavailable" });
  });

  it.each(["__proto__", "constructor", "toString"])(
    "keeps account ID %s as an own data key in a serializable plain object",
    (accountId) => {
      withJournalWrite(database, (scope) =>
        scope.createDestination({ id: accountId, defaultCurrency: "USD" }),
      );
      const model = getStoredWalletOverview(database);
      expect(Object.getPrototypeOf(model.usdTotals)).toBe(Object.prototype);
      expect(Object.hasOwn(model.usdTotals!, accountId)).toBe(true);
      expect(model.usdTotals?.[accountId]).toEqual({ status: "unavailable" });
      const serialized = JSON.parse(JSON.stringify(model));
      expect(Object.hasOwn(serialized.usdTotals, accountId)).toBe(true);
      expect(serialized.usdTotals[accountId]).toEqual({
        status: "unavailable",
      });
    },
  );

  it("fails closed instead of dropping currencies unsupported by the current UI", () => {
    database.sqlite
      .prepare(
        "INSERT INTO currencies (code,name,minor_unit) VALUES ('JPY','Yen',0)",
      )
      .run();
    withJournalWrite(database, (scope) =>
      scope.createWallet({
        id: "test-jpy",
        accountId: id,
        currencyCode: "JPY",
      }),
    );
    expect(() => getStoredWalletOverview(database)).toThrow("current overview");
  });
});
