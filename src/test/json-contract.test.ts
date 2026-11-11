import { assertContract, matchesContract } from "./json-contract";

describe("test-only contract assertion limits", () => {
  it("enforces maximum length, item bounds and prohibited values", () => {
    expect(matchesContract("long", { type: "string", maxLength: 3 })).toBe(
      false,
    );
    expect(
      matchesContract([], {
        type: "array",
        minItems: 1,
        items: { type: "string" },
      }),
    ).toBe(false);
    expect(
      matchesContract(["a", "b"], {
        type: "array",
        maxItems: 1,
        items: { type: "string" },
      }),
    ).toBe(false);
    expect(
      matchesContract("0.00", {
        type: "string",
        not: { pattern: "^0(\\.0+)?$" },
      }),
    ).toBe(false);
    expect(
      matchesContract("0.01", {
        type: "string",
        not: { pattern: "^0(\\.0+)?$" },
      }),
    ).toBe(true);
  });
  it("requires exactly one discriminator branch and own properties", () => {
    expect(
      matchesContract("a", { oneOf: [{ type: "string" }, { const: "a" }] }),
    ).toBe(false);
    expect(
      matchesContract(Object.create({ id: "a" }), {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" } },
      }),
    ).toBe(false);
  });
  it("does not silently accept unsupported assertions or unknown component references", () => {
    expect(() =>
      assertContract(
        "a",
        JSON.parse('{"type":"string","futureAssertion":true}'),
      ),
    ).toThrow("Unsupported schema keyword");
    expect(() =>
      assertContract("a", {
        oneOf: [{ type: "string" }, JSON.parse('{"futureAssertion":true}')],
      }),
    ).toThrow("Unsupported schema keyword");
    expect(() =>
      assertContract("a", { $ref: "#/components/schemas/Missing" }),
    ).toThrow("Missing schema");
  });
});
