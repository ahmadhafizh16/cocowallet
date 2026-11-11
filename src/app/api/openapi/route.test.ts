import { seedMainAccount } from "@/features/accounts/seed";
import { openDatabase, type WalletDatabase } from "@/server/db/connection";
import { migrateDatabase } from "@/server/db/migrate";
import { getRuntimeDatabase } from "@/server/db/runtime";
import { readApiDocument } from "@/server/http/openapi";
import { GET as accounts } from "../accounts/route";
import { GET as wallets } from "../accounts/[accountId]/wallets/route";
import { GET } from "./route";
import { POST as deposit } from "../deposits/route";
import { randomUUID } from "node:crypto";
import { GET as currencyCatalog } from "../currencies/route";
import { GET as referenceRate } from "../rates/route";
import { POST as createServerQuote } from "../quotes/route";
import { GET as readServerQuote } from "../quotes/[quoteId]/route";
import { withJournalWrite } from "@/features/journal/write";

jest.mock("server-only", () => ({}));

jest.mock("@/server/db/runtime", () => ({ getRuntimeDatabase: jest.fn() }));

type Schema = {
  oneOf?: readonly Schema[];
  $ref?: string;
  type?: string;
  required?: readonly string[];
  properties?: Record<string, Schema>;
  additionalProperties?: boolean;
  items?: Schema;
  pattern?: string;
  format?: string;
  enum?: readonly unknown[];
  const?: unknown;
  minLength?: number;
  minimum?: number;
  maximum?: number;
};
const schemas: Record<string, Schema> = readApiDocument.components.schemas;

/** Assert precisely the JSON Schema subset used by this read contract. */
function expectContract(value: unknown, source: Schema) {
  const schema = source.$ref
    ? schemas[source.$ref.split("/").at(-1)!]!
    : source;
  expect(schema).toBeDefined();
  if (schema.oneOf) {
    const matches = schema.oneOf.filter((candidate) => {
      try {
        expectContract(value, candidate);
        return true;
      } catch {
        return false;
      }
    });
    expect(matches).toHaveLength(1);
    return;
  }
  if (schema.enum) expect(schema.enum).toContain(value);
  if ("const" in schema) expect(value).toEqual(schema.const);
  if (schema.type === "object") {
    expect(value).not.toBeNull();
    expect(typeof value).toBe("object");
    expect(Array.isArray(value)).toBe(false);
    const record = value as Record<string, unknown>;
    for (const key of schema.required ?? [])
      expect(Object.hasOwn(record, key)).toBe(true);
    if (schema.additionalProperties === false)
      expect(
        Object.keys(record).every((key) => key in schema.properties!),
      ).toBe(true);
    for (const [key, item] of Object.entries(schema.properties ?? {}))
      if (key in record) expectContract(record[key], item);
  } else if (schema.type === "array") {
    expect(Array.isArray(value)).toBe(true);
    for (const item of value as unknown[]) expectContract(item, schema.items!);
  } else if (schema.type === "string") {
    expect(typeof value).toBe("string");
    if (schema.pattern) expect(value).toMatch(new RegExp(schema.pattern));
    if (schema.format === "date-time") {
      expect(value).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
      expect(new Date(value as string).toISOString()).toBe(value);
    }
    if (schema.format === "date") {
      expect(value).toMatch(/^\d{4}-\d\d-\d\d$/);
      expect(
        new Date(`${value as string}T00:00:00.000Z`).toISOString().slice(0, 10),
      ).toBe(value);
    }
    if (schema.minLength)
      expect((value as string).length).toBeGreaterThanOrEqual(schema.minLength);
  } else if (schema.type === "integer") {
    expect(Number.isInteger(value)).toBe(true);
    if (schema.minimum !== undefined)
      expect(value).toBeGreaterThanOrEqual(schema.minimum);
    if (schema.maximum !== undefined)
      expect(value).toBeLessThanOrEqual(schema.maximum);
  } else if (schema.type === "boolean") expect(typeof value).toBe("boolean");
}

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
        route === "/api/withdrawals" ||
        route === "/api/quotes"
          ? "post"
          : "get",
      ]);
    expect(spec.components.schemas.Wallet.properties.balanceMinor.type).toBe(
      "string",
    );
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
  });
});
