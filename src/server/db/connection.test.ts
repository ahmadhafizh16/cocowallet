import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase, type WalletDatabase } from "./connection";
import { migrateDatabase } from "./migrate";
import { getRuntimeDatabase } from "./runtime";
import { applicationMetadata } from "./schema";

jest.mock("server-only", () => ({}));

describe("SQLite foundation", () => {
  let directory: string;
  const connections: WalletDatabase[] = [];
  const connect = () => {
    const database = openDatabase(join(directory, "isolated.sqlite"));
    connections.push(database);
    return database;
  };

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "simulated-wallet-test-"));
  });

  afterEach(() => {
    for (const database of connections.splice(0)) {
      if (database.sqlite.open) database.close();
    }
    rmSync(directory, { recursive: true, force: true });
  });

  it("enables foreign keys and WAL for file-backed connections", () => {
    const database = connect();

    expect(database.sqlite.pragma("foreign_keys", { simple: true })).toBe(1n);
    expect(database.sqlite.pragma("journal_mode", { simple: true })).toBe(
      "wal",
    );
    expect(database.sqlite.pragma("synchronous", { simple: true })).toBe(2n);
  });

  it("preserves distinct integers above JavaScript's safe-number limit", () => {
    const database = connect();
    const query = database.sqlite.prepare<[bigint], { value: bigint }>(
      "SELECT CAST(? AS INTEGER) AS value",
    );

    for (const value of [
      9_007_199_254_740_991n,
      9_007_199_254_740_992n,
      9_007_199_254_740_993n,
      9_223_372_036_854_775_807n,
    ]) {
      expect(query.get(value)?.value).toBe(value);
    }
  });

  it("applies versioned migrations repeatedly without duplicating schema", () => {
    const database = connect();
    migrateDatabase(database);
    migrateDatabase(database);

    database.db
      .insert(applicationMetadata)
      .values({ key: "example", value: "persisted" })
      .run();
    expect(database.db.select().from(applicationMetadata).all()).toEqual([
      { key: "example", value: "persisted" },
    ]);
  });

  it("persists data when a file is reopened by a new connection", () => {
    const first = connect();
    migrateDatabase(first);
    first.db
      .insert(applicationMetadata)
      .values({ key: "reopen", value: "retained" })
      .run();
    first.close();

    const second = connect();
    expect(second.db.select().from(applicationMetadata).all()).toEqual([
      { key: "reopen", value: "retained" },
    ]);
  });

  it("rolls back failed write transactions", () => {
    const database = connect();
    migrateDatabase(database);

    expect(() =>
      database.sqlite.transaction(() => {
        database.db
          .insert(applicationMetadata)
          .values({ key: "rollback", value: "must disappear" })
          .run();
        throw new Error("injected failure");
      })(),
    ).toThrow("injected failure");
    expect(database.db.select().from(applicationMetadata).all()).toEqual([]);
  });

  it("never opens the configured runtime database from Jest", () => {
    expect(() => getRuntimeDatabase()).toThrow("explicitly isolated");
  });
});
