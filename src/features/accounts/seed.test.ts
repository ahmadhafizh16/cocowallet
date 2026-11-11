import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Worker } from "node:worker_threads";
import { eq } from "drizzle-orm";
import { openDatabase } from "../../server/db/connection";
import { migrateDatabase } from "../../server/db/migrate";
import {
  accounts,
  currencies,
  journalEntries,
  transactions,
  wallets,
} from "../../server/db/schema";
import { readAccountBalances } from "../journal/balances";
import { withJournalWrite } from "../journal/write";
import { getCurrencyExponent } from "../money/currency-precision";
import { AccountDataError } from "./errors";
import { seedMainAccount } from "./seed";

describe("explicit main-account initialization", () => {
  let directory: string;
  let filename: string;
  let database: ReturnType<typeof openDatabase>;

  beforeEach(() => {
    const base = join(tmpdir(), "opencode");
    mkdirSync(base, { recursive: true });
    directory = mkdtempSync(join(base, "wallet-accounts-seed-"));
    filename = join(directory, "isolated.sqlite");
    database = openDatabase(filename);
    migrateDatabase(database);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    database.close();
    rmSync(directory, { recursive: true, force: true });
  });

  const storedState = () => ({
    currencies: database.db.select().from(currencies).all(),
    accounts: database.db.select().from(accounts).all(),
    wallets: database.db.select().from(wallets).all(),
    transactions: database.db.select().from(transactions).all(),
    journalEntries: database.db.select().from(journalEntries).all(),
  });

  it("creates one persistent USD main account with three empty wallets and no history", () => {
    const id = seedMainAccount(database);
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    const state = storedState();
    expect(state.accounts).toEqual([
      {
        id,
        role: "main",
        defaultCurrency: "USD",
        createdAt: expect.any(String),
      },
    ]);
    expect(state.currencies).toEqual([
      { code: "USD", name: "US dollar", minorUnit: getCurrencyExponent("USD") },
      { code: "EUR", name: "Euro", minorUnit: getCurrencyExponent("EUR") },
      {
        code: "GBP",
        name: "British pound",
        minorUnit: getCurrencyExponent("GBP"),
      },
    ]);
    expect(state.wallets).toHaveLength(3);
    expect(new Set(state.wallets.map((wallet) => wallet.id)).size).toBe(3);
    expect(readAccountBalances(database, id)).toEqual(
      ["EUR", "GBP", "USD"].map((currencyCode) => ({
        walletId: expect.any(String),
        currencyCode,
        minorUnit: getCurrencyExponent(currencyCode),
        balanceMinor: 0n,
      })),
    );
    expect(state.transactions).toEqual([]);
    expect(state.journalEntries).toEqual([]);
    expect(database.sqlite.inTransaction).toBe(false);
  });

  it("is repeatable without resetting identities, timestamps, names, or defaults", () => {
    const id = seedMainAccount(database);
    database.db
      .update(accounts)
      .set({ defaultCurrency: "GBP" })
      .where(eq(accounts.id, id))
      .run();
    database.db
      .update(currencies)
      .set({ name: "Existing dollar name" })
      .where(eq(currencies.code, "USD"))
      .run();
    const before = storedState();
    expect(seedMainAccount(database)).toBe(id);
    expect(seedMainAccount(database)).toBe(id);
    expect(storedState()).toEqual(before);
  });

  it("retains initialized state after closing and reopening the database", () => {
    const id = seedMainAccount(database);
    const before = storedState();
    database.close();
    database = openDatabase(filename);
    expect(storedState()).toEqual(before);
    expect(seedMainAccount(database)).toBe(id);
    expect(storedState()).toEqual(before);
  });

  it("adds only missing metadata and wallets without changing existing funded data", () => {
    database.db
      .insert(currencies)
      .values([
        { code: "USD", name: "Original dollar", minorUnit: 2 },
        { code: "GBP", name: "Original pound", minorUnit: 2 },
      ])
      .run();
    database.db
      .insert(accounts)
      .values({
        id: "existing-main",
        role: "main",
        defaultCurrency: "GBP",
        createdAt: "2026-01-02T03:04:05.000Z",
      })
      .run();
    database.db
      .insert(wallets)
      .values({
        id: "existing-usd",
        accountId: "existing-main",
        currencyCode: "USD",
        createdAt: "2026-01-02T03:04:06.000Z",
      })
      .run();
    withJournalWrite(database, (scope) =>
      scope.record({
        id: "test-only-deposit",
        type: "deposit",
        provider: "demo_bank",
        targetWalletId: "existing-usd",
        amountMinor: 9_007_199_254_740_993n,
      }),
    );
    const before = storedState();
    expect(seedMainAccount(database)).toBe("existing-main");
    const after = storedState();
    expect(after.accounts).toEqual(before.accounts);
    expect(after.wallets).toEqual(expect.arrayContaining(before.wallets));
    expect(after.wallets).toHaveLength(3);
    expect(after.currencies).toEqual(expect.arrayContaining(before.currencies));
    expect(after.transactions).toEqual(before.transactions);
    expect(after.journalEntries).toEqual(before.journalEntries);
    expect(readAccountBalances(database, "existing-main")).toContainEqual({
      walletId: "existing-usd",
      currencyCode: "USD",
      minorUnit: 2,
      balanceMinor: 9_007_199_254_740_993n,
    });
    expect(seedMainAccount(database)).toBe("existing-main");
    expect(storedState()).toEqual(after);
  });

  it.each(["USD", "EUR", "GBP"])(
    "fails closed on conflicting %s precision and rolls back missing metadata",
    (code) => {
      database.db
        .insert(currencies)
        .values({ code, name: "Preserve this name", minorUnit: 0 })
        .run();
      const before = storedState();
      expect(() => seedMainAccount(database)).toThrow(AccountDataError);
      expect(() => seedMainAccount(database)).toThrow(
        expect.objectContaining({ code: "invalid_account_data" }),
      );
      expect(storedState()).toEqual(before);
      expect(database.sqlite.inTransaction).toBe(false);
    },
  );

  it("rolls back currencies, account, and earlier wallets after a late insert fails", () => {
    database.sqlite.exec(
      `CREATE TEMP TRIGGER reject_last_seed_wallet AFTER INSERT ON wallets
       WHEN NEW.currency_code = 'GBP'
       BEGIN SELECT RAISE(ABORT, 'injected late wallet failure'); END;`,
    );
    const before = storedState();
    expect(() => seedMainAccount(database)).toThrow();
    expect(storedState()).toEqual(before);
    expect(database.sqlite.inTransaction).toBe(false);
    database.sqlite.exec("DROP TRIGGER reject_last_seed_wallet");
    expect(seedMainAccount(database)).toEqual(expect.any(String));
  });

  it("rejects nesting rather than upgrading an existing deferred transaction", () => {
    const before = storedState();
    expect(() =>
      database.sqlite.transaction(() => seedMainAccount(database))(),
    ).toThrow("top-level immediate transaction");
    expect(storedState()).toEqual(before);
    expect(database.sqlite.inTransaction).toBe(false);
  });

  it("holds a writer reservation before its first insert on a second connection", () => {
    const second = openDatabase(filename);
    second.sqlite.pragma("busy_timeout = 10");
    const originalPrepare = database.sqlite.prepare.bind(database.sqlite);
    let checked = false;
    jest.spyOn(database.sqlite, "prepare").mockImplementation((sql) => {
      if (sql.startsWith('insert into "currencies"') && !checked) {
        checked = true;
        expect(() => seedMainAccount(second)).toThrow(
          expect.objectContaining({ code: "SQLITE_BUSY" }),
        );
      }
      return originalPrepare(sql);
    });
    try {
      const id = seedMainAccount(database);
      expect(checked).toBe(true);
      expect(seedMainAccount(second)).toBe(id);
      expect(storedState().wallets).toHaveLength(3);
    } finally {
      second.close();
    }
  });

  it("serializes concurrent startup seeds from independent connections", async () => {
    const barrier = new SharedArrayBuffer(4);
    const workers: Worker[] = [];
    const ready: Promise<void>[] = [];
    const results: Promise<{ id?: string; error?: string }>[] = [];
    for (let index = 0; index < 2; index++) {
      const worker = new Worker(
        `
        const { parentPort, workerData } = require('node:worker_threads');
        require('tsx/cjs');
        const { openDatabase } = require(workerData.connection);
        const { seedMainAccount } = require(workerData.seed);
        const database = openDatabase(workerData.filename);
        parentPort.postMessage({ type: 'ready' });
        Atomics.wait(new Int32Array(workerData.barrier), 0, 0);
        try {
          parentPort.postMessage({ type: 'result', id: seedMainAccount(database) });
        } catch (error) {
          parentPort.postMessage({ type: 'result', error: error.code || error.message });
        } finally { database.close(); }
        `,
        {
          eval: true,
          workerData: {
            barrier,
            filename,
            connection: resolve("src/server/db/connection.ts"),
            seed: resolve("src/features/accounts/seed.ts"),
          },
        },
      );
      workers.push(worker);
      ready.push(
        new Promise<void>((accept, reject) => {
          worker.on("message", (message) => {
            if (message.type === "ready") accept();
          });
          worker.once("error", reject);
          worker.once("exit", (code) => {
            if (code !== 0) reject(new Error(`Seed worker exited ${code}`));
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
            if (code !== 0) reject(new Error(`Seed worker exited ${code}`));
          });
        }),
      );
    }
    try {
      await Promise.all(ready);
      const state = new Int32Array(barrier);
      Atomics.store(state, 0, 1);
      Atomics.notify(state, 0);
      const outcomes = await Promise.all(results);
      const id = outcomes[0]?.id;
      expect(id).toEqual(expect.any(String));
      expect(outcomes).toEqual([
        expect.objectContaining({ id }),
        expect.objectContaining({ id }),
      ]);
      expect(outcomes.every((outcome) => !outcome.error)).toBe(true);
      expect(storedState().accounts).toHaveLength(1);
      expect(storedState().wallets).toHaveLength(3);
      expect(seedMainAccount(database)).toBe(id);
    } finally {
      await Promise.all(workers.map((worker) => worker.terminate()));
    }
  }, 15_000);
});
