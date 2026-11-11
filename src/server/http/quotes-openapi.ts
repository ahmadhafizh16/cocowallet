import { quoteProblemDetails } from "./quote-responses";
import {
  conversionQuoteRequestContract,
  transferQuoteRequestContract,
} from "@/features/quotes/contracts";
import {
  currencyContract,
  dateTimeSchema as dateTime,
  exponentSchema,
  identifierContract,
  objectSchema as object,
  uuidContract,
} from "@/lib/contracts";
import {
  noStoreHeaders as headers,
  problemSchema,
  schemaRef as ref,
} from "./schema-parts";
const id = identifierContract.schema;
const currency = currencyContract.schema;
const uuid = uuidContract.schema;
const amount = {
  accountId: id,
  currency,
  name: { type: "string", minLength: 1, maxLength: 256 },
  exponent: exponentSchema,
  amount: {
    type: "string",
    description: "Canonical fixed accounting-precision decimal text.",
  },
  amountMinor: {
    type: "string",
    pattern: "^[1-9][0-9]{0,18}(?![\\s\\S])",
    description: "Exact positive minor units, at most 9223372036854775807.",
  },
};
const common = {
  version: { type: "integer", const: 1 },
  quoteId: uuid,
  source: object({ ...amount, walletId: id }),
  target: object(amount),
  rate: object({
    provider: { type: "string", const: "frankfurter" },
    value: {
      type: "string",
      description: "Exact original positive decimal text, no client override.",
    },
    date: { type: "string", format: "date" },
    fetchedAt: dateTime,
    source: { type: "string", enum: ["fresh", "cached"] },
  }),
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
  ConversionQuoteRequest: conversionQuoteRequestContract.schema,
  TransferQuoteRequest: transferQuoteRequestContract.schema,
  QuoteTerms: {
    oneOf: [ref("ConversionQuoteTerms"), ref("TransferQuoteTerms")],
  },
  ConversionQuoteTerms: object({
    ...common,
    operation: { type: "string", const: "conversion" },
  }),
  TransferQuoteTerms: object({
    ...common,
    operation: { type: "string", const: "transfer" },
    recipient: object({
      accountId: id,
      defaultCurrency: currency,
      defaultName: { type: "string", minLength: 1, maxLength: 256 },
      defaultExponent: exponentSchema,
      existed: { type: "boolean" },
    }),
  }),
  QuoteView: {
    oneOf: [
      object({
        quote: ref("QuoteTerms"),
        state: { type: "string", enum: ["active", "expired"] },
      }),
      object({
        quote: ref("QuoteTerms"),
        state: { type: "string", const: "consumed" },
        transactionId: id,
      }),
    ],
  },
  QuoteProblem: problemSchema(
    [400, 404, 409, 503],
    Object.keys(quoteProblemDetails),
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
