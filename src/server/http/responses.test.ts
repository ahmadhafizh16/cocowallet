import { fundingProblem } from "@/features/funding/contracts";
import { problemDetails, problemTitles } from "@/lib/problem-details";
import { jsonResponse, monetaryResponse, problemResponse } from "./responses";
import { runInNewContext } from "node:vm";

describe("shared lossless HTTP responses", () => {
  it("preserves exact large amount/rate strings without inventing replay headers", async () => {
    const body = {
      amountMinor: "9223372036854775807",
      rate: "0.893930000000000000000000000000000001",
      exponent: 2,
    };
    const response = jsonResponse(body);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.has("Idempotency-Replayed")).toBe(false);
    expect(await response.json()).toEqual(body);
  });
  it.each([400, 404, 409, 503] as const)(
    "uses public Problem Details for %s",
    async (status) => {
      const problem = problemDetails(
          status,
          "PUBLIC_CODE",
          "Safe public detail.",
        ),
        response = problemResponse(problem);
      expect(response.status).toBe(status);
      expect(response.headers.get("content-type")).toBe(
        "application/problem+json",
      );
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.json()).toEqual({
        type: "about:blank",
        title: problemTitles[status],
        status,
        code: "PUBLIC_CODE",
        detail: "Safe public detail.",
      });
    },
  );
  it.each([true, false])(
    "retains the original monetary body/status and replay flag %s",
    async (replayed) => {
      const body = fundingProblem(
          409,
          "INSUFFICIENT_FUNDS",
          "original detail",
          true,
          "12345678-1234-4123-8123-123456789012",
        ),
        response = monetaryResponse({ status: 409, body, replayed });
      expect(response.status).toBe(409);
      expect(response.headers.get("Idempotency-Replayed")).toBe(
        String(replayed),
      );
      expect(await response.text()).toBe(JSON.stringify(body));
      expect(JSON.stringify(body)).toBe(
        '{"type":"about:blank","title":"Conflict","status":409,"code":"INSUFFICIENT_FUNDS","detail":"original detail","definitive":true,"requestKey":"12345678-1234-4123-8123-123456789012"}',
      );
    },
  );
  it.each([
    1n,
    NaN,
    Infinity,
    -Infinity,
    -0,
    Number.MAX_SAFE_INTEGER + 1,
    undefined,
    () => 0,
    Symbol("private"),
  ])("refuses lossy JSON values without coercion: %s", (value) => {
    expect(() => jsonResponse({ value })).toThrow();
    expect(() =>
      monetaryResponse({ status: 200, body: { value }, replayed: false }),
    ).toThrow();
  });
  it("refuses cyclic responses", () => {
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    expect(() => jsonResponse(cyclic)).toThrow();
  });
  it("does not invoke custom serialization/getters or drop non-JSON objects and properties", () => {
    const toJSON = jest.fn(() => "coerced"),
      getter = jest.fn(() => "coerced"),
      accessor = {};
    Object.defineProperty(accessor, "value", { enumerable: true, get: getter });
    for (const value of [
      { toJSON },
      accessor,
      new Date(),
      new Map(),
      new Set(),
      [undefined],
      new Array(1),
      Object.assign(["a"], { extra: "hidden" }),
      { [Symbol("private")]: "hidden" },
    ])
      expect(() => jsonResponse(value)).toThrow();
    expect(toJSON).not.toHaveBeenCalled();
    expect(getter).not.toHaveBeenCalled();
  });
  it("allows shared plain schema objects without confusing aliases with cycles", async () => {
    const shared = { type: "string" },
      body = { first: shared, second: shared };
    expect(await jsonResponse(body).json()).toEqual(body);
  });
  it("accepts genuine cross-realm plain objects/arrays such as native SQLite results", async () => {
    const body = runInNewContext(
      '({accounts:[{id:"main",balanceMinor:"9223372036854775807"}]})',
    );
    expect(await jsonResponse(body).json()).toEqual({
      accounts: [{ id: "main", balanceMinor: "9223372036854775807" }],
    });
  });
  it("still rejects custom prototypes and array subclasses across realms", () => {
    for (const body of [
      runInNewContext('new (class Result {constructor(){this.value="a"}})()'),
      runInNewContext('new (class Values extends Array {})("a")'),
      Object.create({ constructor: Object }),
    ])
      expect(() => jsonResponse(body)).toThrow();
  });
});
