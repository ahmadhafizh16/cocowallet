import { openDatabase, type WalletDatabase } from "@/server/db/connection";
import { migrateDatabase } from "@/server/db/migrate";
import { getRuntimeDatabase } from "@/server/db/runtime";
import { seedMainAccount } from "@/features/accounts/seed";
import { GET } from "./route";

jest.mock("@/server/db/runtime", () => ({ getRuntimeDatabase: jest.fn() }));

describe("GET /api/accounts", () => {
  let database: WalletDatabase;
  beforeEach(() => {
    database = openDatabase(":memory:");
    migrateDatabase(database);
    jest.mocked(getRuntimeDatabase).mockReturnValue(database);
  });
  afterEach(() => database.close());

  it("reads the persistent main account without caching or mutating data", async () => {
    const id = seedMainAccount(database);
    const before = database.sqlite
      .prepare("SELECT total_changes() AS changes")
      .get();
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const data = await response.json();
    expect(data.accounts).toEqual([
      {
        id,
        role: "main",
        defaultCurrency: "USD",
        createdAt: expect.any(String),
        inspectOnly: false,
      },
    ]);
    expect(
      database.sqlite.prepare("SELECT total_changes() AS changes").get(),
    ).toEqual(before);
  });

  it("does not seed during a GET when no main account exists", async () => {
    const response = GET();
    expect(response.status).toBe(503);
    expect(response.headers.get("content-type")).toBe(
      "application/problem+json",
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      status: 503,
      code: "ACCOUNT_NOT_INITIALIZED",
    });
    expect(database.sqlite.prepare("SELECT id FROM accounts").all()).toEqual(
      [],
    );
  });

  it("redacts unexpected database failures", async () => {
    jest.mocked(getRuntimeDatabase).mockImplementation(() => {
      throw new Error("private database path /secret/wallet.sqlite");
    });
    const response = GET();
    expect(response.status).toBe(503);
    const data = await response.text();
    expect(data).toContain("WALLET_DATA_UNAVAILABLE");
    expect(data).not.toMatch(/private|secret|sqlite|stack/i);
  });
});
