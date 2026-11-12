import { seedMainAccount } from "@/features/accounts/seed";
import { openDatabase, type WalletDatabase } from "@/server/db/connection";
import { migrateDatabase } from "@/server/db/migrate";
import { getRuntimeDatabase } from "@/server/db/runtime";
import { readApiDocument } from "@/server/http/openapi";
import { GET as accounts } from "../accounts/route";
import { GET as wallets } from "../accounts/[accountId]/wallets/route";
import { GET } from "./route";
import { POST as deposit } from "../deposits/route";
import { POST as withdrawal } from "../withdrawals/route";
import { randomUUID } from "node:crypto";
import { GET as currencyCatalog } from "../currencies/route";
import { GET as referenceRate } from "../rates/route";
import { POST as createServerQuote } from "../quotes/route";
import { GET as readServerQuote } from "../quotes/[quoteId]/route";
import { withJournalWrite } from "@/features/journal/write";
import { POST as conversion } from "../conversions/route";
import { GET as health } from "../health/route";
import { GET as ready } from "../ready/route";
import { assertContract, type Schema } from "@/test/json-contract";
import { GET as historyList } from "../transactions/route";
import { GET as historyDetail } from "../transactions/[transactionId]/route";
import { POST as transfer } from "../transfers/route";

jest.mock("server-only", () => ({}));

jest.mock("@/server/db/runtime", () => ({ getRuntimeDatabase: jest.fn() }));

const schemas: Record<string, Schema> = readApiDocument.components.schemas;
const expectContract = (value: unknown, source: Schema) =>
  assertContract(value, source, schemas);

describe("read-only OpenAPI contract", () => {
  let database: WalletDatabase;
  beforeEach(() => {
    database = openDatabase(":memory:");
    migrateDatabase(database);
    jest.mocked(getRuntimeDatabase).mockReturnValue(database);
  });
  afterEach(() => database.close());

  it("serves the implemented read specification without advertising future money APIs", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const spec = await response.json();
    expect(spec.openapi).toBe("3.1.0");
    expect(Object.keys(spec.paths)).toEqual([
      "/api/portfolio",
      "/api/transfers",
      "/api/transactions",
      "/api/transactions/{transactionId}",
      "/api/conversions",
      "/api/quotes",
      "/api/quotes/{quoteId}",
      "/api/currencies",
      "/api/rates",
      "/api/deposits",
      "/api/withdrawals",
      "/api/accounts",
      "/api/accounts/{accountId}/wallets",
      "/api/health",
      "/api/ready",
      "/api/openapi",
    ]);
    for (const [route, path] of Object.entries(spec.paths))
      expect(Object.keys(path as object)).toEqual([
        route === "/api/deposits" ||
        route === "/api/transfers" ||
        route === "/api/conversions" ||
        route === "/api/withdrawals" ||
        route === "/api/quotes"
          ? "post"
          : "get",
      ]);
    expect(spec.components.schemas.Wallet.properties.balanceMinor.type).toBe(
      "string",
    );
  });

  it("documents operational response bodies and no-store headers for every implemented response", async () => {
    expectContract(
      await GET().json(),
      readApiDocument.paths["/api/openapi"].get.responses["200"].content[
        "application/json"
      ].schema,
    );
    expectContract(
      await health().json(),
      readApiDocument.paths["/api/health"].get.responses["200"].content[
        "application/json"
      ].schema,
    );
    expectContract(
      await ready().json(),
      readApiDocument.paths["/api/ready"].get.responses["200"].content[
        "application/json"
      ].schema,
    );
    for (const path of Object.values(readApiDocument.paths)) {
      const operation = Object.values(path)[0] as {
        responses: Record<
          string,
          { headers: Record<string, { schema: { const: string } }> }
        >;
      };
      for (const result of Object.values(operation.responses))
        expect(result.headers["Cache-Control"]?.schema.const).toBe("no-store");
    }
  });

  it("validates safe unexpected failures across every storage-backed route", async () => {
    const send = (body: unknown) =>
      new Request("http://localhost/api/operation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": randomUUID(),
        },
        body: JSON.stringify(body),
      });
    const cases: [() => Response | Promise<Response>, string][] = [
      [
        () =>
          transfer(
            send({
              sourceWalletId: "source",
              recipientAccountId: "recipient",
              amount: "1.00",
              recipientDefaultCurrency: "USD",
            }),
          ),
        "TransferProblem",
      ],
      [accounts, "Problem"],
      [
        () =>
          wallets(new Request("http://localhost"), {
            params: Promise.resolve({ accountId: "main" }),
          }),
        "Problem",
      ],
      [ready, "Problem"],
      [
        () =>
          historyList(
            new Request("http://localhost/api/transactions?accountId=main"),
          ),
        "HistoryProblem",
      ],
      [
        () =>
          historyDetail(
            new Request(
              "http://localhost/api/transactions/missing?accountId=main",
            ),
            { params: Promise.resolve({ transactionId: "missing" }) },
          ),
        "HistoryProblem",
      ],
      [currencyCatalog, "ReferenceProblem"],
      [
        () =>
          referenceRate(
            new Request("http://localhost/api/rates?base=USD&quote=GBP"),
          ),
        "ReferenceProblem",
      ],
      [
        () =>
          createServerQuote(
            send({
              operation: "conversion",
              sourceWalletId: "main-usd",
              amount: "1.00",
              targetCurrency: "GBP",
            }),
          ),
        "QuoteProblem",
      ],
      [
        () =>
          readServerQuote(new Request("http://localhost"), {
            params: Promise.resolve({ quoteId: randomUUID() }),
          }),
        "QuoteProblem",
      ],
      [
        () =>
          deposit(
            send({
              walletId: "main-usd",
              amount: "1.00",
              provider: "demo_bank",
            }),
          ),
        "FundingProblem",
      ],
      [
        () =>
          withdrawal(
            send({
              walletId: "main-usd",
              amount: "1.00",
              provider: "demo_bank",
            }),
          ),
        "FundingProblem",
      ],
      [
        () =>
          conversion(
            send({
              quoteId: randomUUID(),
              sourceWalletId: "main-usd",
              amount: "1.00",
              targetCurrency: "GBP",
            }),
          ),
        "ConversionProblem",
      ],
    ];
    for (const [call, schema] of cases) {
      jest.mocked(getRuntimeDatabase).mockImplementationOnce(() => {
        throw new Error("private path /app/data/wallet.sqlite stack trace");
      });
      const response = await call(),
        body = await response.json();
      expect(response.status).toBe(503);
      expect(response.headers.get("content-type")).toBe(
        "application/problem+json",
      );
      expect(response.headers.get("cache-control")).toBe("no-store");
      expectContract(body, schemas[schema]!);
      expect(JSON.stringify(body)).not.toMatch(
        /private|\/app|sqlite|stack trace/u,
      );
      if ("definitive" in body) expect(body.definitive).toBe(false);
    }
    expect(
      database.sqlite.prepare("SELECT COUNT(*) AS n FROM transactions").get(),
    ).toEqual({ n: 0n });
  });

  it("returns documented inspect-only conflicts without completed history or provider calls", async () => {
    seedMainAccount(database);
    withJournalWrite(database, (scope) => {
      scope.createDestination({ id: "destination", defaultCurrency: "USD" });
      scope.createWallet({
        id: "destination-usd",
        accountId: "destination",
        currencyCode: "USD",
      });
    });
    const fetch = jest
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("Network forbidden"));
    const send = (body: unknown) =>
      new Request("http://localhost/api/operation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": randomUUID(),
        },
        body: JSON.stringify(body),
      });
    for (const handler of [deposit, withdrawal]) {
      const response = await handler(
          send({
            walletId: "destination-usd",
            amount: "1.00",
            provider: "demo_bank",
          }),
        ),
        body = await response.json();
      expect(response.status).toBe(409);
      expect(body.code).toBe("INSPECT_ONLY");
      expectContract(body, schemas.FundingProblem!);
    }
    const quote = await createServerQuote(
        send({
          operation: "conversion",
          sourceWalletId: "destination-usd",
          amount: "1.00",
          targetCurrency: "GBP",
        }),
      ),
      body = await quote.json();
    expect(quote.status).toBe(409);
    expect(body.code).toBe("INSPECT_ONLY");
    expectContract(body, schemas.QuoteProblem!);
    expect(fetch).not.toHaveBeenCalled();
    expect(
      database.sqlite.prepare("SELECT COUNT(*) AS n FROM transactions").get(),
    ).toEqual({ n: 0n });
    expect(
      database.sqlite
        .prepare("SELECT COUNT(*) AS n FROM journal_entries")
        .get(),
    ).toEqual({ n: 0n });
  });

  it("validates actual account and balance responses against their published schemas", async () => {
    const id = seedMainAccount(database);
    const accountData = await accounts().json();
    expectContract(
      accountData,
      readApiDocument.paths["/api/accounts"].get.responses["200"].content[
        "application/json"
      ].schema,
    );
    const response = await wallets(new Request("http://localhost"), {
      params: Promise.resolve({ accountId: id }),
    });
    expectContract(
      await response.json(),
      readApiDocument.paths["/api/accounts/{accountId}/wallets"].get.responses[
        "200"
      ].content["application/json"].schema,
    );
    expectContract(
      await (
        await wallets(new Request("http://localhost"), {
          params: Promise.resolve({ accountId: "missing" }),
        })
      ).json(),
      schemas.Problem!,
    );
  });

  it("validates actual funding receipt and definitive error against the published schemas", async () => {
    const id = seedMainAccount(database);
    const wallet = database.sqlite
      .prepare<[string], { id: string }>(
        "SELECT id FROM wallets WHERE account_id = ? AND currency_code = 'USD'",
      )
      .get(id)!;
    const send = (amount: string) =>
      deposit(
        new Request("http://localhost/api/deposits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": randomUUID(),
          },
          body: JSON.stringify({
            walletId: wallet.id,
            amount,
            provider: "demo_bank",
          }),
        }),
      );
    expectContract(await (await send("1.00")).json(), schemas.FundingReceipt!);
    expectContract(await (await send("1.001")).json(), schemas.FundingProblem!);
  });

  it("validates actual reference metadata responses against the published schemas", async () => {
    jest.spyOn(globalThis, "fetch").mockImplementation(async (url) =>
      String(url).endsWith("/currencies")
        ? new Response(
            JSON.stringify([
              { iso_code: "USD", name: "US Dollar", type: "currency" },
              { iso_code: "EUR", name: "Euro", type: "currency" },
            ]),
            { headers: { "Content-Type": "application/json" } },
          )
        : new Response(
            "date,base,quote,rate\n2026-01-01,USD,EUR,0.893930000000000000000000000000000001\n",
            { headers: { "Content-Type": "text/csv" } },
          ),
    );
    expectContract(
      await (await currencyCatalog()).json(),
      schemas.CurrencyCatalog!,
    );
    expectContract(
      await (
        await referenceRate(
          new Request("http://localhost/api/rates?base=USD&quote=EUR"),
        )
      ).json(),
      schemas.ReferenceRate!,
    );
    expectContract(
      await (
        await referenceRate(
          new Request("http://localhost/api/rates?base=BTC&quote=EUR"),
        )
      ).json(),
      schemas.ReferenceProblem!,
    );
  });

  it("validates actual server quote preview/readback against the discriminated schemas", async () => {
    const accountId = seedMainAccount(database);
    const wallet = database.sqlite
      .prepare<[string], { id: string }>(
        "SELECT id FROM wallets WHERE account_id=? AND currency_code='USD'",
      )
      .get(accountId)!;
    withJournalWrite(database, (scope) =>
      scope.record({
        id: randomUUID(),
        type: "deposit",
        targetWalletId: wallet.id,
        amountMinor: 10000n,
        provider: "demo_bank",
      }),
    );
    jest.spyOn(globalThis, "fetch").mockImplementation(async (url) =>
      String(url).endsWith("/currencies")
        ? new Response(
            JSON.stringify([
              { iso_code: "USD", name: "Dollar", type: "currency" },
              { iso_code: "GBP", name: "Pound", type: "currency" },
            ]),
            { headers: { "Content-Type": "application/json" } },
          )
        : new Response("date,base,quote,rate\n2026-01-01,USD,GBP,1.005\n", {
            headers: { "Content-Type": "text/csv" },
          }),
    );
    const input = {
      operation: "conversion",
      sourceWalletId: wallet.id,
      amount: "1.00",
      targetCurrency: "GBP",
    };
    expectContract(input, schemas.QuoteRequest!);
    const response = await createServerQuote(
      new Request("http://localhost/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
    expect(response.status).toBe(200);
    const view = await response.json();
    expectContract(view, schemas.QuoteView!);
    expectContract(
      await (
        await readServerQuote(
          new Request("http://localhost/api/quotes/example"),
          { params: Promise.resolve({ quoteId: view.quote.quoteId }) },
        )
      ).json(),
      schemas.QuoteView!,
    );
    expectContract(
      await (
        await readServerQuote(
          new Request("http://localhost/api/quotes/example"),
          { params: Promise.resolve({ quoteId: randomUUID() }) },
        )
      ).json(),
      schemas.QuoteProblem!,
    );
    const terms = input;
    const conversionInput = {
      quoteId: view.quote.quoteId,
      sourceWalletId: terms.sourceWalletId,
      amount: terms.amount,
      targetCurrency: terms.targetCurrency,
    };
    expectContract(conversionInput, schemas.ConversionRequest!);
    const responseForConversion = await conversion(
      new Request("http://localhost/api/conversions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": randomUUID(),
        },
        body: JSON.stringify(conversionInput),
      }),
    );
    expect(responseForConversion.status).toBe(200);
    expectContract(
      await responseForConversion.json(),
      schemas.ConversionReceipt!,
    );
    const conflict = await conversion(
      new Request("http://localhost/api/conversions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": randomUUID(),
        },
        body: JSON.stringify(conversionInput),
      }),
    );
    expect(conflict.status).toBe(409);
    expectContract(await conflict.json(), schemas.ConversionProblem!);
  });
});
