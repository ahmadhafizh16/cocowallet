import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { Worker } from "node:worker_threads";
import { createJournalFixture } from "../../server/db/test-fixture";
import { submitFunding } from "../funding/service";
import { readWalletBalance } from "../journal/balances";
import { createQuote } from "../quotes/service";
import type { ConversionRequest, ConversionResult } from "./contracts";

jest.mock("server-only", () => ({}));
const NOW = Date.parse("2026-11-12T12:00:00.000Z");
type Attempt = { key: string; input: ConversionRequest; funding?: boolean };
describe("independent serialized conversion writers", () => {
  let fixture: ReturnType<typeof createJournalFixture>;
  beforeEach(() => {
    fixture = createJournalFixture();
    submitFunding(fixture.database, "deposit", randomUUID(), {
      walletId: "main-usd",
      amount: "100.00",
      provider: "demo_bank",
    });
  });
  afterEach(() => fixture.cleanup());
  async function preview(targetCurrency = "GBP"): Promise<ConversionRequest> {
    const request = {
      operation: "conversion" as const,
      sourceWalletId: "main-usd",
      amount: "75.00",
      targetCurrency,
    };
    const client = {
      catalog: async () => ({
        currencies: [
          { code: "USD", name: "Dollar", exponent: 2 },
          { code: "GBP", name: "Pound", exponent: 2 },
          { code: "EUR", name: "Euro", exponent: 2 },
        ],
        fetchedAt: new Date(NOW).toISOString(),
      }),
      rate: async () => ({
        rate: "0.8",
        date: "2026-11-11",
        fetchedAt: new Date(NOW).toISOString(),
      }),
    };
    const { quote } = await createQuote(fixture.database, request, {
      client,
      now: () => NOW,
    });
    return {
      quoteId: quote.quoteId,
      sourceWalletId: request.sourceWalletId,
      amount: request.amount,
      targetCurrency,
    };
  }
  async function race(attempts: Attempt[]) {
    const barrier = new SharedArrayBuffer(4),
      workers: Worker[] = [],
      ready: Promise<void>[] = [],
      results: Promise<ConversionResult>[] = [];
    try {
      for (const attempt of attempts) {
        const worker = new Worker(
          `
          const {parentPort,workerData:d}=require('node:worker_threads');
          require('tsx/cjs');
          const {openDatabase}=require(d.connection);
          const {submitConversion}=require(d.service);
          const {submitFunding}=require(d.fundingService);
          const db=openDatabase(d.filename);
          parentPort.postMessage({ready:true}); Atomics.wait(new Int32Array(d.barrier),0,0);
          try {
            const result=d.funding ? submitFunding(db,'withdrawal',d.key,{walletId:'main-usd',amount:'75.00',provider:'demo_bank'}) : submitConversion(db,d.key,d.input,{now:()=>d.now});
            parentPort.postMessage({result});
          } finally {db.close();}
        `,
          {
            eval: true,
            execArgv: ["--conditions=react-server"],
            workerData: {
              ...attempt,
              barrier,
              filename: fixture.filename,
              now: NOW + 1,
              connection: resolve("src/server/db/connection.ts"),
              service: resolve("src/features/conversions/service.ts"),
              fundingService: resolve("src/features/funding/service.ts"),
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
              if (code) reject(new Error(`Conversion worker exited ${code}`));
            });
          }),
        );
      }
      await Promise.all(ready);
      Atomics.store(new Int32Array(barrier), 0, 1);
      Atomics.notify(new Int32Array(barrier), 0);
      return await Promise.all(results);
    } finally {
      await Promise.all(workers.map((w) => w.terminate()));
    }
  }

  it("same key and quote create only one target wallet/debit and replay the original receipt", async () => {
    const input = await preview("EUR"),
      key = randomUUID();
    const results = await race([
      { input, key },
      { input, key },
    ]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    expect(results[0]!.body).toEqual(results[1]!.body);
    expect(results.filter((r) => r.replayed)).toHaveLength(1);
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(2500n);
    expect(
      fixture.database.sqlite
        .prepare(
          "SELECT COUNT(*) AS n FROM wallets WHERE account_id='main' AND currency_code='EUR'",
        )
        .get(),
    ).toEqual({ n: 1n });
    expect(
      fixture.database.sqlite
        .prepare("SELECT COUNT(*) AS n FROM fx_quote_uses")
        .get(),
    ).toEqual({ n: 1n });
  }, 15000);

  it("different keys cannot successfully consume the same quote twice", async () => {
    const input = await preview();
    const results = await race([
      { input, key: randomUUID() },
      { input, key: randomUUID() },
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(results.find((r) => r.status === 409)).toMatchObject({
      body: { code: "QUOTE_ALREADY_USED", definitive: true },
    });
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(2500n);
  }, 15000);

  it("separate valid quotes cannot overspend one source wallet", async () => {
    const first = await preview(),
      second = await preview("EUR");
    const results = await race([
      { input: first, key: randomUUID() },
      { input: second, key: randomUUID() },
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(results.find((r) => r.status === 409)).toMatchObject({
      body: { code: "INSUFFICIENT_FUNDS", definitive: true },
    });
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(2500n);
    expect(
      fixture.database.sqlite
        .prepare("SELECT COUNT(*) AS n FROM fx_quote_uses")
        .get(),
    ).toEqual({ n: 1n });
  }, 15000);

  it.each([false, true])(
    "funding and conversion serialize funds/global key ownership (same key: %s)",
    async (sameKey) => {
      const input = await preview(),
        key = randomUUID();
      const results = await race([
        { input, key },
        { input, key: sameKey ? key : randomUUID(), funding: true },
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
      expect(results.find((r) => r.status === 409)).toMatchObject({
        body: {
          code: sameKey ? "IDEMPOTENCY_KEY_REUSED" : "INSUFFICIENT_FUNDS",
        },
      });
      expect(readWalletBalance(fixture.database, "main-usd")).toBe(2500n);
      expect(
        fixture.database.sqlite
          .prepare("SELECT COUNT(*) AS n FROM transactions")
          .get(),
      ).toEqual({ n: 2n });
    },
    15000,
  );
});
