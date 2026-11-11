import { seedMainAccount } from "@/features/accounts/seed";
import { openDatabase, type WalletDatabase } from "@/server/db/connection";
import { migrateDatabase } from "@/server/db/migrate";
import { getRuntimeDatabase } from "@/server/db/runtime";
import { readApiDocument } from "@/server/http/openapi";
import { GET as accounts } from "../accounts/route";
import { GET as wallets } from "../accounts/[accountId]/wallets/route";
import { GET } from "./route";

jest.mock("@/server/db/runtime", () => ({ getRuntimeDatabase: jest.fn() }));

type Schema = {
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
      "/api/accounts",
      "/api/accounts/{accountId}/wallets",
      "/api/health",
      "/api/ready",
      "/api/openapi",
    ]);
    for (const path of Object.values(spec.paths))
      expect(Object.keys(path as object)).toEqual(["get"]);
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
});
