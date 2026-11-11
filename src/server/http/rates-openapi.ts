const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const code = { type: "string", pattern: "^[A-Z]{3}$" };
const source = { type: "string", enum: ["fresh", "cached"] };
const fetchedAt = {
  type: "string",
  format: "date-time",
  description:
    "Original validated fetch time, never reset by a fallback. Future or >=24-hour-old cached observations are ineligible.",
};
const headers = {
  "Cache-Control": { schema: { type: "string", const: "no-store" } },
};
const problem = {
  description:
    "Safe reference-data Problem Details; no rate is invented and no monetary operation is performed.",
  headers,
  content: { "application/problem+json": { schema: ref("ReferenceProblem") } },
};
export const referenceSchemas = {
  CurrencyCatalog: {
    type: "object",
    additionalProperties: false,
    required: ["provider", "source", "fetchedAt", "currencies"],
    properties: {
      provider: { type: "string", const: "frankfurter" },
      source,
      fetchedAt,
      currencies: {
        type: "array",
        minItems: 1,
        maxItems: 1024,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["code", "name", "exponent"],
          properties: {
            code,
            name: { type: "string", minLength: 1, maxLength: 256 },
            exponent: { type: "integer", minimum: 0, maximum: 4 },
          },
        },
      },
    },
  },
  ReferenceRate: {
    type: "object",
    additionalProperties: false,
    required: [
      "provider",
      "source",
      "base",
      "quote",
      "rate",
      "date",
      "fetchedAt",
    ],
    properties: {
      provider: { type: "string", const: "frankfurter" },
      source,
      base: code,
      quote: code,
      rate: {
        type: "string",
        maxLength: 73,
        pattern: "^(0|[1-9][0-9]{0,35})(\\.[0-9]{1,36})?(?![\\s\\S])",
        not: { pattern: "^0(\\.0+)?$" },
        description:
          "Positive exact original decimal CSV text. No JSON-number conversion, reciprocal or synthetic cross rate.",
      },
      date: {
        type: "string",
        format: "date",
        description:
          "Provider publication date, not retrieval date; an older source date is not relabelled as today.",
      },
      fetchedAt,
    },
  },
  ReferenceProblem: {
    type: "object",
    additionalProperties: false,
    required: ["type", "title", "status", "code", "detail"],
    properties: {
      type: { type: "string", const: "about:blank" },
      title: { type: "string" },
      status: { type: "integer", enum: [400, 503] },
      code: {
        type: "string",
        enum: [
          "INVALID_CURRENCY_PAIR",
          "UNSUPPORTED_CURRENCY",
          "CURRENCY_CATALOG_UNAVAILABLE",
          "FX_RATE_UNAVAILABLE",
          "FX_STORAGE_UNAVAILABLE",
        ],
      },
      detail: { type: "string" },
    },
  },
};
export const referencePaths = {
  "/api/currencies": {
    get: {
      operationId: "getFiatCurrencyCatalog",
      summary:
        "Get eligible Frankfurter fiat currencies with pinned accounting precision",
      description:
        "Always try a fresh provider request, validate and persist success; fall back to a validated list fetched less than 24 hours ago only if that request fails. Excludes crypto, metals, non-fiat accounting units and unknown precision. The list does not guarantee pair coverage. Does not create wallets or enable new currency UI.",
      responses: {
        "200": {
          description:
            "Fresh or explicitly cached catalog; original fetchedAt retained.",
          headers,
          content: { "application/json": { schema: ref("CurrencyCatalog") } },
        },
        "503": problem,
      },
    },
  },
  "/api/rates": {
    get: {
      operationId: "getExactReferenceRate",
      summary: "Read an exact reference-rate observation, not a binding quote",
      description:
        "Exactly one base and quote parameter, uppercase distinct fiat codes; unknown or duplicate query parameters are rejected. Network requests never run inside a database transaction; short metadata updates follow validation. Eligible prior exact-pair data can recover an outage; neither reverse pairs nor inferred cross rates substitute. Storage unavailable is 503. Metadata caches may update; journal/accounts/wallets/funding outcomes never change. No quote, USD valuation or money submission is enabled by this endpoint.",
      parameters: [
        { name: "base", in: "query", required: true, schema: code },
        { name: "quote", in: "query", required: true, schema: code },
      ],
      responses: {
        "200": {
          description:
            "A fresh or eligible exact-pair cached observation with separate source/fetch dates.",
          headers,
          content: { "application/json": { schema: ref("ReferenceRate") } },
        },
        "400": problem,
        "503": problem,
      },
    },
  },
};
