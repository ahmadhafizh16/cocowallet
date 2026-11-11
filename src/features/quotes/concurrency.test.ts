import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { Worker } from "node:worker_threads";
import { createJournalFixture } from "../../server/db/test-fixture";
import { withJournalWrite } from "../journal/write";
import { readWalletBalance } from "../journal/balances";
import { createQuote } from "./service";

jest.mock("server-only", () => ({}));
const NOW = Date.parse("2026-11-12T12:00:00.000Z");
describe("serialized successful quote use", () => {
  it("allows only one independent writer to use a quote; money and consumption commit together", async () => {
    const fixture = createJournalFixture();
    const workers: Worker[] = [];
    try {
      withJournalWrite(fixture.database, (scope) =>
        scope.record({
          id: randomUUID(),
          type: "deposit",
          targetWalletId: "main-usd",
          amountMinor: 10000n,
          provider: "demo_bank",
        }),
      );
      const request = {
        operation: "conversion" as const,
        sourceWalletId: "main-usd",
        amount: "10.00",
        targetCurrency: "GBP",
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
          rate: "0.5",
          date: "2026-11-11",
          fetchedAt: new Date(NOW).toISOString(),
        }),
      };
      const { quote } = await createQuote(fixture.database, request, {
        client,
        now: () => NOW,
      });
      const barrier = new SharedArrayBuffer(4);
      const ready: Promise<void>[] = [];
      const results: Promise<{ success?: boolean; code?: string }>[] = [];
      for (let i = 0; i < 2; i++) {
        const worker = new Worker(
          `
          const {parentPort,workerData:d}=require('node:worker_threads');
          require('tsx/cjs');
          const {randomUUID}=require('node:crypto');
          const {openDatabase}=require(d.connection);
          const {withJournalWrite}=require(d.write);
          const {validateQuoteForConfirmation,consumeQuote}=require(d.quotes);
          const db=openDatabase(d.filename);
          parentPort.postMessage({ready:true}); Atomics.wait(new Int32Array(d.barrier),0,0);
          try {
            withJournalWrite(db,scope=>{
              const {quote:q,context}=validateQuoteForConfirmation(db,d.quoteId,d.request,d.now);
              scope.record({id:randomUUID(),type:'conversion',sourceWalletId:q.source.walletId,targetWalletId:context.targetWalletId,amountMinor:BigInt(q.source.amountMinor),rate:{value:q.rate.value,date:q.rate.date,fetchedAt:q.rate.fetchedAt,source:q.rate.source}},r=>{consumeQuote(db,q.quoteId,r.transactionId,d.now);});
            });
            parentPort.postMessage({result:{success:true}});
          } catch(e) { parentPort.postMessage({result:{code:e.code||e.message}}); }
          finally {db.close();}
        `,
          {
            eval: true,
            execArgv: ["--conditions=react-server"],
            workerData: {
              filename: fixture.filename,
              request,
              quoteId: quote.quoteId,
              now: NOW + 1,
              barrier,
              connection: resolve("src/server/db/connection.ts"),
              write: resolve("src/features/journal/write.ts"),
              quotes: resolve("src/features/quotes/service.ts"),
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
              if (code) reject(new Error(`Quote worker exited ${code}`));
            });
          }),
        );
      }
      await Promise.all(ready);
      Atomics.store(new Int32Array(barrier), 0, 1);
      Atomics.notify(new Int32Array(barrier), 0);
      const outcomes = await Promise.all(results);
      expect(outcomes.filter((r) => r.success)).toHaveLength(1);
      expect(
        outcomes.filter((r) => r.code === "QUOTE_ALREADY_USED"),
      ).toHaveLength(1);
      expect(readWalletBalance(fixture.database, "main-usd")).toBe(9000n);
      expect(readWalletBalance(fixture.database, "main-gbp")).toBe(500n);
      expect(
        fixture.database.sqlite
          .prepare("SELECT COUNT(*) AS n FROM fx_quote_uses")
          .get(),
      ).toEqual({ n: 1n });
      expect(
        fixture.database.sqlite
          .prepare("SELECT COUNT(*) AS n FROM transactions")
          .get(),
      ).toEqual({ n: 2n });
    } finally {
      await Promise.all(workers.map((w) => w.terminate()));
      fixture.cleanup();
    }
  }, 15000);
});
