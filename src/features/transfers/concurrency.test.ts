import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { Worker } from "node:worker_threads";
import { createJournalFixture } from "../../server/db/test-fixture";
import { submitFunding } from "../funding/service";
import { readWalletBalance } from "../journal/balances";
import { createQuote } from "../quotes/service";
import type { TransferReceipt, TransferRequest } from "./contracts";

jest.mock("server-only", () => ({}));
const NOW = Date.parse("2026-11-12T12:00:00.000Z");
type Attempt = { kind?: "funding" | "conversion"; key: string; input: unknown };
type Result = { status: number; body: unknown; replayed: boolean };
const same: TransferRequest = {
  sourceWalletId: "main-usd",
  recipientAccountId: "new-destination",
  recipientDefaultCurrency: "USD",
  amount: "75.00",
};
describe("independent transfer writers and global money keys", () => {
  let fixture: ReturnType<typeof createJournalFixture>;
  beforeEach(() => {
    fixture = createJournalFixture();
    expect(
      submitFunding(fixture.database, "deposit", randomUUID(), {
        walletId: "main-usd",
        amount: "100.00",
        provider: "demo_bank",
      }).status,
    ).toBe(200);
  });
  afterEach(() => fixture.cleanup());
  async function quote(operation: "transfer" | "conversion" = "transfer") {
    const input = {
      operation,
      sourceWalletId: "main-usd",
      amount: "75.00",
      targetCurrency: "GBP",
      ...(operation === "transfer" ? { recipientAccountId: "recipient" } : {}),
    };
    const client = {
      catalog: async () => ({
        currencies: [
          { code: "USD", name: "Dollar", exponent: 2 },
          { code: "GBP", name: "Pound", exponent: 2 },
        ],
        fetchedAt: new Date(NOW).toISOString(),
      }),
      rate: async () => ({
        rate: "0.8",
        date: "2026-11-11",
        fetchedAt: new Date(NOW).toISOString(),
      }),
    };
    return (
      await createQuote(fixture.database, input, { client, now: () => NOW })
    ).quote;
  }
  async function race(attempts: Attempt[]): Promise<Result[]> {
    const barrier = new SharedArrayBuffer(4),
      workers: Worker[] = [],
      ready: Promise<void>[] = [],
      results: Promise<Result>[] = [];
    try {
      for (const attempt of attempts) {
        const worker = new Worker(
          `
          const {parentPort,workerData:d}=require('node:worker_threads');require('tsx/cjs');
          const {openDatabase}=require(d.connection),{submitTransfer}=require(d.transfers),{submitFunding}=require(d.funding),{submitConversion}=require(d.conversions);
          const db=openDatabase(d.filename);parentPort.postMessage({ready:true});Atomics.wait(new Int32Array(d.barrier),0,0);
          (async()=>{try{let result;if(d.kind==='funding')result=submitFunding(db,'withdrawal',d.key,{walletId:'main-usd',amount:'75.00',provider:'demo_bank'});else if(d.kind==='conversion')result=submitConversion(db,d.key,d.input,{now:()=>d.now});else result=await submitTransfer(db,d.key,d.input,{now:()=>d.now});parentPort.postMessage({result});}finally{db.close();}})().catch(e=>{throw e;});
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
              transfers: resolve("src/features/transfers/service.ts"),
              funding: resolve("src/features/funding/service.ts"),
              conversions: resolve("src/features/conversions/service.ts"),
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
              if (code) reject(new Error(`Transfer worker exited ${code}`));
            });
          }),
        );
      }
      await Promise.all(ready);
      Atomics.store(new Int32Array(barrier), 0, 1);
      Atomics.notify(new Int32Array(barrier), 0);
      return await Promise.all(results);
    } finally {
      await Promise.all(workers.map((worker) => worker.terminate()));
    }
  }
  it("identical keys create one recipient/wallet/transfer and replay its original receipt", async () => {
    const key = randomUUID(),
      results = await race([
        { key, input: same },
        { key, input: same },
      ]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    expect(results[0]!.body).toEqual(results[1]!.body);
    expect(results.filter((r) => r.replayed)).toHaveLength(1);
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(2500n);
    expect(
      fixture.database.sqlite
        .prepare(
          "SELECT COUNT(*) AS n FROM wallets WHERE account_id='new-destination'",
        )
        .get(),
    ).toEqual({ n: 1n });
    expect(
      fixture.database.sqlite
        .prepare("SELECT COUNT(*) AS n FROM transfer_attempts")
        .get(),
    ).toEqual({ n: 1n });
  }, 15000);
  it("different keys cannot consume one transfer quote twice", async () => {
    const q = await quote(),
      input = {
        sourceWalletId: "main-usd",
        recipientAccountId: "recipient",
        amount: "75.00",
        targetCurrency: "GBP",
        quoteId: q.quoteId,
      };
    const results = await race([
      { key: randomUUID(), input },
      { key: randomUUID(), input },
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(results.find((r) => r.status === 409)).toMatchObject({
      body: { code: "QUOTE_ALREADY_USED", definitive: true },
    });
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(2500n);
    expect(
      fixture.database.sqlite
        .prepare("SELECT COUNT(*) AS n FROM fx_quote_uses")
        .get(),
    ).toEqual({ n: 1n });
  }, 15000);
  it("different quotes/keys cannot overspend one source", async () => {
    const a = await quote(),
      b = await quote();
    const input = {
      sourceWalletId: "main-usd",
      recipientAccountId: "recipient",
      amount: "75.00",
      targetCurrency: "GBP",
    };
    const results = await race([
      { key: randomUUID(), input: { ...input, quoteId: a.quoteId } },
      { key: randomUUID(), input: { ...input, quoteId: b.quoteId } },
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(results.find((r) => r.status === 409)).toMatchObject({
      body: { code: "INSUFFICIENT_FUNDS", definitive: true },
    });
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(2500n);
  }, 15000);
  it("compatible creation races reuse the same exact destination and wallet", async () => {
    const results = await race([
      { key: randomUUID(), input: { ...same, amount: "10.00" } },
      { key: randomUUID(), input: { ...same, amount: "20.00" } },
    ]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    expect(
      results.filter((r) => (r.body as TransferReceipt).recipient.created),
    ).toHaveLength(1);
    const wallet = fixture.database.sqlite
      .prepare<[], { id: string }>(
        "SELECT id FROM wallets WHERE account_id='new-destination'",
      )
      .all();
    expect(wallet).toHaveLength(1);
    expect(readWalletBalance(fixture.database, wallet[0]!.id)).toBe(3000n);
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(7000n);
  }, 15000);
  it("a conflicting new-recipient default loses without overwriting the winner or creating partial money", async () => {
    const input = { ...same, amount: "10.00", targetCurrency: "USD" },
      results = await race([
        { key: randomUUID(), input },
        {
          key: randomUUID(),
          input: { ...input, recipientDefaultCurrency: "GBP" },
        },
      ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(results.find((r) => r.status === 409)).toMatchObject({
      body: { code: "RECIPIENT_CONTEXT_CHANGED", definitive: true },
    });
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(9000n);
    expect(
      fixture.database.sqlite
        .prepare(
          "SELECT COUNT(*) AS n FROM wallets WHERE account_id='new-destination'",
        )
        .get(),
    ).toEqual({ n: 1n });
  }, 15000);
  it("same-key changed input cannot both commit", async () => {
    const key = randomUUID(),
      results = await race([
        { key, input: same },
        { key, input: { ...same, amount: "74.00" } },
      ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(results.find((r) => r.status === 409)).toMatchObject({
      body: { code: "IDEMPOTENCY_KEY_REUSED", definitive: false },
    });
    expect([2500n, 2600n]).toContain(
      readWalletBalance(fixture.database, "main-usd"),
    );
  }, 15000);
  for (const kind of ["funding", "conversion"] as const)
    for (const sameKey of [true, false])
      it(`serializes transfer versus ${kind} (same key: ${sameKey})`, async () => {
        const key = randomUUID(),
          q = kind === "conversion" ? await quote("conversion") : undefined;
        const results = await race([
          { key, input: same },
          {
            kind,
            key: sameKey ? key : randomUUID(),
            input: q
              ? {
                  quoteId: q.quoteId,
                  sourceWalletId: "main-usd",
                  amount: "75.00",
                  targetCurrency: "GBP",
                }
              : {},
          },
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
        if (results[0]!.status !== 200)
          expect(
            fixture.database.sqlite
              .prepare("SELECT id FROM accounts WHERE id='new-destination'")
              .get(),
          ).toBeUndefined();
      }, 15000);
});
