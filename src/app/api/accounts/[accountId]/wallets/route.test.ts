import { seedMainAccount } from "@/features/accounts/seed";
import { withJournalWrite } from "@/features/journal/write";
import { MAX_MINOR } from "@/features/money/money";
import { openDatabase, type WalletDatabase } from "@/server/db/connection";
import { migrateDatabase } from "@/server/db/migrate";
import { getRuntimeDatabase } from "@/server/db/runtime";
import { GET } from "./route";

jest.mock("@/server/db/runtime", () => ({ getRuntimeDatabase: jest.fn() }));

describe("GET /api/accounts/{accountId}/wallets", () => {
  let database: WalletDatabase;
  let mainId: string;
  beforeEach(() => {
    database = openDatabase(":memory:");
    migrateDatabase(database);
    mainId = seedMainAccount(database);
    jest.mocked(getRuntimeDatabase).mockReturnValue(database);
  });
  afterEach(() => database.close());
  const read = (id: string) =>
    GET(new Request("http://localhost/api/accounts/example/wallets"), {
      params: Promise.resolve({ accountId: id }),
    });

  it("serializes exact journal-derived balances as decimal integer strings", async () => {
    const wallet = database.sqlite
      .prepare<[string], { id: string }>(
        "SELECT id FROM wallets WHERE account_id = ? AND currency_code = 'USD'",
      )
      .get(mainId)!;
    withJournalWrite(database, (scope) =>
      scope.record({
        id: "test-large-deposit",
        type: "deposit",
        targetWalletId: wallet.id,
        amountMinor: MAX_MINOR,
        provider: "demo_bank",
      }),
    );
    const response = await read(mainId);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const data = await response.json();
    expect(data.account.id).toBe(mainId);
    expect(data.wallets).toHaveLength(3);
    expect(
      data.wallets.find(
        (item: { currency: string }) => item.currency === "USD",
      ),
    ).toMatchObject({
      id: wallet.id,
      accountId: mainId,
      currency: "USD",
      exponent: 2,
      balanceMinor: MAX_MINOR.toString(),
    });
    expect(
      data.wallets.every(
        (item: { balanceMinor: unknown }) =>
          typeof item.balanceMinor === "string",
      ),
    ).toBe(true);
  });

  it("scopes destination inspection and never supplies main-account balances", async () => {
    withJournalWrite(database, (scope) =>
      scope.createDestination({ id: "destination", defaultCurrency: "EUR" }),
    );
    const data = await (await read("destination")).json();
    expect(data.account).toMatchObject({
      id: "destination",
      role: "destination",
      inspectOnly: true,
    });
    expect(data.wallets).toEqual([]);
  });

  it.each(["unknown", "' OR 1=1 --"])(
    "returns a safe 404 for %s",
    async (id) => {
      const response = await read(id);
      expect(response.status).toBe(404);
      expect(response.headers.get("content-type")).toBe(
        "application/problem+json",
      );
      await expect(response.json()).resolves.toMatchObject({
        status: 404,
        code: "ACCOUNT_NOT_FOUND",
      });
    },
  );

  it.each(["", "bad\0id"])(
    "rejects invalid path IDs before database access",
    async (id) => {
      const response = await read(id);
      expect(response.status).toBe(400);
      expect(getRuntimeDatabase).not.toHaveBeenCalled();
      await expect(response.json()).resolves.toMatchObject({
        code: "INVALID_ACCOUNT_ID",
      });
    },
  );

  it("does not convert unavailable storage into zero balances", async () => {
    jest.mocked(getRuntimeDatabase).mockImplementation(() => {
      throw new Error("private SQLite details");
    });
    const response = await read(mainId);
    expect(response.status).toBe(503);
    expect(await response.text()).not.toMatch(/private|SQLite|balanceMinor/);
  });
});
