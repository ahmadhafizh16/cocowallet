import assert from "node:assert/strict";

/** Test-only assertion for this project's explicit JSON Schema subset, not an
 * OpenAPI generator or a production validator. Unknown assertion keywords fail. */
export type Schema = {
  $ref?: string;
  oneOf?: readonly Schema[];
  not?: Schema;
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
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  minimum?: number;
  maximum?: number;
};
const keywords = new Set([
  "$ref",
  "oneOf",
  "not",
  "type",
  "required",
  "properties",
  "additionalProperties",
  "items",
  "pattern",
  "format",
  "enum",
  "const",
  "minLength",
  "maxLength",
  "minItems",
  "maxItems",
  "minimum",
  "maximum",
  "description",
]);
function assertSupported(
  source: Schema,
  schemas: Record<string, Schema>,
  seen = new Set<Schema>(),
) {
  if (seen.has(source)) return;
  seen.add(source);
  for (const keyword of Object.keys(source))
    assert(
      keywords.has(keyword) || keyword.startsWith("x-"),
      `Unsupported schema keyword: ${keyword}`,
    );
  if (source.$ref) {
    assert(
      source.$ref.startsWith("#/components/schemas/"),
      "Only local component references are supported.",
    );
    const name = source.$ref.split("/").at(-1)!;
    assert(Object.hasOwn(schemas, name), `Missing schema ${name}`);
    assertSupported(schemas[name]!, schemas, seen);
  }
  for (const child of source.oneOf ?? []) assertSupported(child, schemas, seen);
  if (source.not) assertSupported(source.not, schemas, seen);
  if (source.items) assertSupported(source.items, schemas, seen);
  for (const child of Object.values(source.properties ?? {}))
    assertSupported(child, schemas, seen);
}
export function assertContract(
  value: unknown,
  source: Schema,
  schemas: Record<string, Schema> = {},
): void {
  assertSupported(source, schemas);
  if (source.$ref) {
    assert(
      source.$ref.startsWith("#/components/schemas/"),
      "Only local component references are supported.",
    );
    const name = source.$ref.split("/").at(-1)!;
    assert(Object.hasOwn(schemas, name), `Missing schema ${name}`);
    return assertContract(value, schemas[name]!, schemas);
  }
  if (source.oneOf) {
    assert.equal(
      source.oneOf.filter((candidate) =>
        matchesContract(value, candidate, schemas),
      ).length,
      1,
      "Expected exactly one matching branch.",
    );
  }
  if (source.not)
    assert(
      !matchesContract(value, source.not, schemas),
      "Value matches a prohibited schema.",
    );
  if (source.enum)
    assert(source.enum.includes(value), "Value is not in the enum.");
  if (Object.hasOwn(source, "const")) assert.deepEqual(value, source.const);
  if (source.type === "object") {
    assert(
      value && typeof value === "object" && !Array.isArray(value),
      "Expected an object.",
    );
    const row = value as Record<string, unknown>;
    for (const key of source.required ?? [])
      assert(Object.hasOwn(row, key), `Missing ${key}`);
    if (source.additionalProperties === false)
      for (const key of Object.keys(row))
        assert(
          Object.hasOwn(source.properties ?? {}, key),
          `Unexpected ${key}`,
        );
    for (const [key, field] of Object.entries(source.properties ?? {}))
      if (Object.hasOwn(row, key)) assertContract(row[key], field, schemas);
  } else if (source.type === "array") {
    assert(Array.isArray(value), "Expected an array.");
    if (source.minItems !== undefined) assert(value.length >= source.minItems);
    if (source.maxItems !== undefined) assert(value.length <= source.maxItems);
    assert(source.items, "Array item schema required.");
    for (const item of value) assertContract(item, source.items, schemas);
  } else if (source.type === "string") {
    assert.equal(typeof value, "string");
    const length = [...(value as string)].length;
    if (source.minLength !== undefined) assert(length >= source.minLength);
    if (source.maxLength !== undefined) assert(length <= source.maxLength);
  } else if (source.type === "integer") {
    assert(
      typeof value === "number" && Number.isSafeInteger(value),
      "Expected an exact integer.",
    );
    if (source.minimum !== undefined) assert(value >= source.minimum);
    if (source.maximum !== undefined) assert(value <= source.maximum);
  } else if (source.type === "null") assert.equal(value, null);
  else if (source.type === "boolean") assert.equal(typeof value, "boolean");
  else
    assert(
      source.type === undefined,
      `Unsupported schema type: ${source.type}`,
    );
  if (source.pattern && typeof value === "string")
    assert(new RegExp(source.pattern, "u").test(value), "Pattern mismatch.");
  if (source.format === "date-time") {
    assert(
      typeof value === "string" &&
        /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/u.test(value),
    );
    assert.equal(new Date(value).toISOString(), value);
  } else if (source.format === "date") {
    assert(typeof value === "string" && /^\d{4}-\d\d-\d\d$/u.test(value));
    assert.equal(
      new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10),
      value,
    );
  } else
    assert(
      source.format === undefined,
      `Unsupported schema format: ${source.format}`,
    );
}
export function matchesContract(
  value: unknown,
  schema: Schema,
  schemas: Record<string, Schema> = {},
): boolean {
  try {
    assertContract(value, schema, schemas);
    return true;
  } catch {
    return false;
  }
}
