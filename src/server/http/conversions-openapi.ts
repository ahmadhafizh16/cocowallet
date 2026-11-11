import {
  conversionFailures,
  conversionRequestContract,
} from "@/features/conversions/contracts";
import {
  dateTimeSchema,
  objectSchema as object,
  uuidContract,
} from "@/lib/contracts";
import {
  monetaryHeaders as headers,
  monetaryProblemSchema,
  schemaRef as ref,
} from "./schema-parts";
import { fundingSchemas } from "./funding-openapi";
import { quoteSchemas } from "./quotes-openapi";

const uuid = uuidContract.schema;
const quote = quoteSchemas.ConversionQuoteTerms.properties;
const wallet = object({
  ...quote.source.properties,
  balanceMinor: fundingSchemas.FundingReceipt.properties.balanceMinor,
});
export const conversionSchemas = {
  ConversionRequest: conversionRequestContract.schema,
  ConversionReceipt: object({
    requestKey: uuid,
    transactionId: uuid,
    type: { type: "string", const: "conversion" },
    status: { type: "string", const: "completed" },
    quoteId: uuid,
    source: wallet,
    target: wallet,
    rate: quote.rate,
    issuedAt: quote.issuedAt,
    expiresAt: quote.expiresAt,
    createdAt: dateTimeSchema,
  }),
  ConversionProblem: monetaryProblemSchema(
    [400, 404, 409, 503],
    [
      "INVALID_CONVERSION_REQUEST",
      ...Object.keys(conversionFailures),
      "IDEMPOTENCY_KEY_REUSED",
      "CONVERSION_OUTCOME_UNKNOWN",
    ],
  ),
};
const problem = {
  description:
    "Safe Problem Details. Structural errors are pre-acceptance; quote/resource/funds rejections are retained. 503 and key-reuse conflicts do not resolve the original intent: retain its key/input/quote.",
  headers,
  content: { "application/problem+json": { schema: ref("ConversionProblem") } },
};
export const conversionPaths = {
  "/api/conversions": {
    post: {
      operationId: "confirmSimulatedConversion",
      summary:
        "Confirm reviewed server-owned conversion terms; no real funds move",
      description:
        "Same-origin JSON, maximum 16 KiB. Required UUID key is global across funding/conversion/internal transfers. Exact source-wallet/amount/target strings and normalized quote UUID bind the request. Replay original definitive outcomes before quote expiry/use/current-funds checks. Fresh confirmation uses the quote's fixed full-minute terms, creates missing target metadata/wallet and commits journal/use/receipt together. No trusted client rate/receive overrides, provider call, fee or automatic retry. A replacement quote requires renewed review and a new intentional key; unknown outcomes must recover the original key and quote. Retention is indefinite.",
      parameters: [
        { name: "Idempotency-Key", in: "header", required: true, schema: uuid },
      ],
      requestBody: {
        required: true,
        content: { "application/json": { schema: ref("ConversionRequest") } },
      },
      responses: {
        "200": {
          description:
            "Original completed receipt with exact amounts/provenance and original balance snapshots; replay never refreshes them.",
          headers,
          content: { "application/json": { schema: ref("ConversionReceipt") } },
        },
        "400": problem,
        "404": problem,
        "409": problem,
        "503": problem,
      },
    },
  },
};
