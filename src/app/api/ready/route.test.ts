import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase, type WalletDatabase } from "@/server/db/connection";
import { migrateDatabase } from "@/server/db/migrate";
import { getRuntimeDatabase } from "@/server/db/runtime";
import { GET } from "./route";

jest.mock("@/server/db/runtime", () => ({ getRuntimeDatabase: jest.fn() }));

describe("GET /api/ready", () => {
  let directory: string;
  let database: WalletDatabase;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "wallet-readiness-test-"));
    database = openDatabase(join(directory, "isolated.sqlite"));
    jest.mocked(getRuntimeDatabase).mockReturnValue(database);
  });

  afterEach(() => {
    database.close();
    rmSync(directory, { recursive: true, force: true });
  });

  it("verifies the migrated schema using an isolated database", async () => {
    migrateDatabase(database);
    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      database: "ready",
    });
  });

  it("returns a safe Problem Details response when migrations are missing", async () => {
    const response = GET();

    expect(response.status).toBe(503);
    expect(response.headers.get("content-type")).toBe(
      "application/problem+json",
    );
    await expect(response.json()).resolves.toEqual({
      type: "about:blank",
      title: "Service Unavailable",
      status: 503,
      detail: "Database readiness check failed. Verify migrations and storage.",
      code: "DATABASE_NOT_READY",
    });
  });
});
