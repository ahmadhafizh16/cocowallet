import { quoteProblemDetails } from "./quote-responses";

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const id = {
  type: "string",
  minLength: 1,
  maxLength: 8192,
  description:
    "Exact nonblank identifier without NUL characters; no client-side normalization.",
};
const currency = { type: "string", pattern: "^[A-Z]{3}$" };
const uuid = {
  type: "string",
  minLength: 36,
  maxLength: 36,
  pattern:
    "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
};
const dateTime = { type: "string", format: "date-time" };
const headers = {
  "Cache-Control": { schema: { type: "string", const: "no-store" } },
};
const object = <T extends Record<string, object>>(
  properties: T,
  required: string[],
) => ({
  type: "object",
  additionalProperties: false,
  properties,
  required,
});
const input = {
  sourceWalletId: id,
  amount: {
    type: "string",
    maxLength: 24,
    pattern: "^(0|[1-9][0-9]*)(\\.[0-9]+)?(?![\\s\\S])",
    description:
      "Positive exact decimal text within source precision/range. Same original text is bound to the quote.",
  },
  targetCurrency: currency,
};
const amount = {
  accountId: id,
  currency,
  name: { type: "string", minLength: 1, maxLength: 256 },
  exponent: { type: "integer", minimum: 0, maximum: 4 },
  amount: {
    type: "string",
    description: "Canonical fixed accounting-precision decimal text.",
  },
  amountMinor: {
    type: "string",
    pattern: "^[1-9][0-9]{0,18}$",
    description: "Exact positive minor units, at most 9223372036854775807.",
  },
};
const common = {
  version: { type: "integer", const: 1 },
  quoteId: uuid,
  source: object({ ...amount, walletId: id }, [
    ...Object.keys(amount),
    "walletId",
  ]),
  target: object(amount, Object.keys(amount)),
  rate: object(
    {
      provider: { type: "string", const: "frankfurter" },
      value: {
        type: "string",
        description:
          "Exact original positive decimal text, no client override.",
      },
      date: { type: "string", format: "date" },
      fetchedAt: dateTime,
      source: { type: "string", enum: ["fresh", "cached"] },
    },
    ["provider", "value", "date", "fetchedAt", "source"],
  ),
  issuedAt: dateTime,
  expiresAt: {
    ...dateTime,
    description:
      "Exactly 60 seconds after final validated issuance. Cached-rate eligibility is checked then; the issued hold is not shortened at the cache boundary.",
  },
};
export const quoteSchemas = {
  QuoteRequest: {
    oneOf: [ref("ConversionQuoteRequest"), ref("TransferQuoteRequest")],
  },
  ConversionQuoteRequest: object(
    { ...input, operation: { type: "string", const: "conversion" } },
    ["operation", ...Object.keys(input)],
  ),
  TransferQuoteRequest: object(
    {
      ...input,
      operation: { type: "string", const: "transfer" },
      recipientAccountId: id,
      recipientDefaultCurrency: {
        ...currency,
        description:
          "Required for an unknown destination; if supplied for an existing destination, must match its immutable default.",
      },
    },
    ["operation", ...Object.keys(input), "recipientAccountId"],
  ),
  QuoteTerms: {
    oneOf: [ref("ConversionQuoteTerms"), ref("TransferQuoteTerms")],
  },
  ConversionQuoteTerms: object(
    { ...common, operation: { type: "string", const: "conversion" } },
    [...Object.keys(common), "operation"],
  ),
  TransferQuoteTerms: object(
    {
      ...common,
      operation: { type: "string", const: "transfer" },
      recipient: object(
        {
          accountId: id,
          defaultCurrency: currency,
          defaultName: { type: "string", minLength: 1, maxLength: 256 },
          defaultExponent: { type: "integer", minimum: 0, maximum: 4 },
          existed: { type: "boolean" },
        },
        [
          "accountId",
          "defaultCurrency",
          "defaultName",
          "defaultExponent",
          "existed",
        ],
      ),
    },
    [...Object.keys(common), "operation", "recipient"],
  ),
  QuoteView: {
    oneOf: [
      object(
        {
          quote: ref("QuoteTerms"),
          state: { type: "string", enum: ["active", "expired"] },
        },
        ["quote", "state"],
      ),
      object(
        {
          quote: ref("QuoteTerms"),
          state: { type: "string", const: "consumed" },
          transactionId: id,
        },
        ["quote", "state", "transactionId"],
      ),
    ],
  },
  QuoteProblem: object(
    {
      type: { type: "string", const: "about:blank" },
      title: { type: "string" },
      status: { type: "integer", enum: [400, 404, 409, 503] },
      code: { type: "string", enum: Object.keys(quoteProblemDetails) },
      detail: { type: "string" },
    },
    ["type", "title", "status", "code", "detail"],
  ),
};
const problem = {
  description:
    "Safe quote Problem Details. Preview/retry does not move or reserve funds. Expired/used/input/role/funds conflicts are 409, invalid request 400, missing data 404, unavailable metadata/storage 503.",
  headers,
  content: { "application/problem+json": { schema: ref("QuoteProblem") } },
};
const success = {
  description:
    "Immutable server-owned terms with observed lifecycle state. Active means time-valid/unused, not reserved or guaranteed funds.",
  headers,
  content: { "application/json": { schema: ref("QuoteView") } },
};
export const quotePaths = {
  "/api/quotes": {
    post: {
      operationId: "createServerQuote",
      summary: "Preview a one-minute cross-currency conversion or transfer",
      description:
        "Local same-origin JSON, maximum 16 KiB; no money idempotency key required because preview does not move funds. Extra fields are rejected. Terms are immutable and kept separately from completed history. Missing wallet/recipient creation is deferred to a later successful money operation. Same-currency transfers require no FX quote and are rejected here. Creation retry may create another independent quote, never extend the old one. Actual conversion/transfer submission is not enabled by this endpoint.",
      requestBody: {
        required: true,
        content: { "application/json": { schema: ref("QuoteRequest") } },
      },
      responses: {
        "200": success,
        "400": problem,
        "404": problem,
        "409": problem,
        "503": problem,
      },
    },
  },
  "/api/quotes/{quoteId}": {
    get: {
      operationId: "readServerQuote",
      summary: "Read immutable terms without refreshing the rate or expiry",
      parameters: [
        { name: "quoteId", in: "path", required: true, schema: uuid },
      ],
      responses: {
        "200": success,
        "400": problem,
        "404": problem,
        "503": problem,
      },
    },
  },
};
