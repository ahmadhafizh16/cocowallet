import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { Worker } from "node:worker_threads";
import Database from "better-sqlite3";
import { createJournalFixture } from "../../server/db/test-fixture";
import { readWalletBalance } from "../journal/balances";
import type { FundingKind, FundingResult } from "./contracts";
import { submitFunding } from "./service";

describe("independent funding writers", () => {
  let fixture: ReturnType<typeof createJournalFixture>;
  beforeEach(() => {
    fixture = createJournalFixture();
  });
  afterEach(() => fixture.cleanup());

  async function race(kind: FundingKind, keys: string[]) {
    const barrier = new SharedArrayBuffer(4);
    const workers: Worker[] = [];
    const ready: Promise<void>[] = [];
    const results: Promise<FundingResult>[] = [];
    for (const key of keys) {
      const worker = new Worker(
        `
        const {parentPort,workerData:d}=require('node:worker_threads');
        require('tsx/cjs');
        const {openDatabase}=require(d.connection);
        const {submitFunding}=require(d.service);
        const db=openDatabase(d.filename);
        parentPort.postMessage({ready:true});
        Atomics.wait(new Int32Array(d.barrier),0,0);
        try { parentPort.postMessage({result:submitFunding(db,d.kind,d.key,{walletId:'main-usd',amount:'75.00',provider:'demo_bank'})}); }
        finally { db.close(); }
      `,
        {
          eval: true,
          workerData: {
            barrier,
            filename: fixture.filename,
            key,
            kind,
            connection: resolve("src/server/db/connection.ts"),
            service: resolve("src/features/funding/service.ts"),
          },
        },
      );
      workers.push(worker);
      ready.push(
        new Promise((accept, reject) => {
          worker.on("message", (m) => {
            if (m.ready) accept();
          });
          worker.once("error", reject);
        }),
      );
      results.push(
        new Promise((accept, reject) => {
          worker.on("message", (m) => {
            if (m.result) accept(m.result);
          });
          worker.once("error", reject);
          worker.once("exit", (code) => {
            if (code) reject(new Error(`Worker exited ${code}`));
          });
        }),
      );
    }
    try {
      await Promise.all(ready);
      Atomics.store(new Int32Array(barrier), 0, 1);
      Atomics.notify(new Int32Array(barrier), 0);
      return await Promise.all(results);
    } finally {
      await Promise.all(workers.map((w) => w.terminate()));
    }
  }

  it("concurrent identical keys commit only one credit", async () => {
    const key = randomUUID();
    const results = await race("deposit", [key, key]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    expect(results[0]!.body).toEqual(results[1]!.body);
    expect(results.filter((r) => r.replayed)).toHaveLength(1);
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(7500n);
  }, 15000);

  it("different withdrawal keys cannot overdraw and preserve the losing definitive failure", async () => {
    submitFunding(fixture.database, "deposit", randomUUID(), {
      walletId: "main-usd",
      amount: "100",
      provider: "demo_bank",
    });
    const results = await race("withdrawal", [randomUUID(), randomUUID()]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(2500n);
    expect(
      fixture.database.sqlite
        .prepare("SELECT COUNT(*) AS n FROM transactions")
        .get(),
    ).toEqual({ n: 2n });
    expect(
      fixture.database.sqlite
        .prepare("SELECT COUNT(*) AS n FROM funding_attempts")
        .get(),
    ).toEqual({ n: 3n });
  }, 15000);

  it("busy storage is nondefinitive and same-key retry remains safe", () => {
    const lock = new Database(fixture.filename);
    const key = randomUUID();
    fixture.database.sqlite.pragma("busy_timeout = 10");
    lock.exec("BEGIN IMMEDIATE");
    try {
      expect(
        submitFunding(fixture.database, "deposit", key, {
          walletId: "main-usd",
          amount: "1",
          provider: "demo_bank",
        }),
      ).toMatchObject({ status: 503, body: { definitive: false } });
    } finally {
      lock.exec("ROLLBACK");
      lock.close();
    }
    expect(
      submitFunding(fixture.database, "deposit", key, {
        walletId: "main-usd",
        amount: "1",
        provider: "demo_bank",
      }).status,
    ).toBe(200);
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(100n);
  });
});
