/** Small, explicit contract vocabulary, not a general JSON Schema validator.
 * Runtime guards and the published structural schemas share these definitions.
 * Currency eligibility, precision, bigint bounds and business rules stay in the
 * feature services; no schema parser coerces or rounds monetary strings. */
type TextRules = {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  description?: string;
};
type Contract<T = unknown, S extends object = object> = {
  schema: S;
  is: (value: unknown) => value is T;
};
type Value<C> = C extends Contract<infer T> ? T : never;
type ObjectValue<F extends Record<string, Contract>, O extends keyof F> = {
  [K in Exclude<keyof F, O>]: Value<F[K]>;
} & { [K in O]?: Value<F[K]> };

export function textContract<const S extends TextRules>(rules: S) {
  const pattern = rules.pattern ? new RegExp(rules.pattern, "u") : undefined;
  return {
    schema: { type: "string" as const, ...rules },
    is(value: unknown): value is string {
      return (
        typeof value === "string" &&
        (rules.minLength === undefined || value.length >= rules.minLength) &&
        (rules.maxLength === undefined || value.length <= rules.maxLength) &&
        (!pattern || pattern.test(value))
      );
    },
  };
}

export function enumContract<const T extends readonly string[]>(values: T) {
  return {
    schema: { type: "string" as const, enum: values },
    is(value: unknown): value is T[number] {
      return typeof value === "string" && values.includes(value);
    },
  };
}
export function literalContract<const T extends string>(value: T) {
  return {
    schema: { type: "string" as const, const: value },
    is(candidate: unknown): candidate is T {
      return candidate === value;
    },
  };
}
export function integerContract<
  const S extends { minimum: number; maximum: number },
>(rules: S) {
  return {
    schema: { type: "integer" as const, ...rules },
    is(value: unknown): value is number {
      return (
        typeof value === "number" &&
        Number.isSafeInteger(value) &&
        value >= rules.minimum &&
        value <= rules.maximum
      );
    },
  };
}
export function objectSchema<const P extends Record<string, object>>(
  properties: P,
  optional: readonly (keyof P)[] = [],
) {
  return {
    type: "object" as const,
    additionalProperties: false as const,
    required: Object.keys(properties).filter((key) => !optional.includes(key)),
    properties,
  };
}
export function objectContract<
  const F extends Record<string, Contract>,
  const O extends readonly (keyof F)[] = readonly [],
>(fields: F, optional: O = [] as unknown as O) {
  const properties = Object.fromEntries(
    Object.entries(fields).map(([key, field]) => [key, field.schema]),
  ) as { [K in keyof F]: F[K]["schema"] };
  const schema = objectSchema<typeof properties>(properties, optional);
  return {
    schema,
    is(value: unknown): value is ObjectValue<F, O[number]> {
      if (!value || typeof value !== "object" || Array.isArray(value))
        return false;
      const row = value as Record<string, unknown>;
      return (
        schema.required.every((key) => Object.hasOwn(row, key)) &&
        Object.keys(row).every((key) => Object.hasOwn(fields, key)) &&
        Object.entries(fields).every(([key, field]) =>
          Object.hasOwn(row, key) ? field.is(row[key]) : optional.includes(key),
        )
      );
    },
  };
}

export const identifierContract = textContract({
  minLength: 1,
  maxLength: 8192,
  pattern: "^(?=[\\s\\S]*\\S)[^\\u0000]+(?![\\s\\S])",
  description:
    "Exact nonblank identifier without NUL characters. No normalization. Server length limit is 8192 UTF-16 code units.",
});
export const uuidContract = textContract({
  minLength: 36,
  maxLength: 36,
  pattern:
    "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}(?![\\s\\S])",
});
export const amountContract = textContract({
  maxLength: 24,
  pattern: "^(0|[1-9][0-9]*)(\\.[0-9]+)?(?![\\s\\S])",
  description:
    "Exact plain decimal text. Positive amount, currency precision and signed-int64 monetary bounds are checked by the service without rounding. Decimal spelling is part of accepted intent.",
});
export const currencyContract = textContract({
  pattern: "^[A-Z]{3}(?![\\s\\S])",
});
export const minorUnitsSchema = {
  type: "string",
  pattern: "^(0|[1-9][0-9]{0,18})(?![\\s\\S])",
  description:
    "Exact nonnegative minor-unit integer text; server-enforced maximum 9223372036854775807, never a JSON number.",
  "x-minor-unit-maximum": "9223372036854775807",
} as const;
export const exponentSchema = {
  type: "integer",
  minimum: 0,
  maximum: 4,
} as const;
export const dateTimeSchema = { type: "string", format: "date-time" } as const;
