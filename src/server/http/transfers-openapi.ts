import {
  transferFailures,
  transferRequestContract,
} from "@/features/transfers/contracts";
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
import { conversionSchemas } from "./conversions-openapi";
import { quoteSchemas } from "./quotes-openapi";

const uuid = uuidContract.schema;
const fx = conversionSchemas.ConversionReceipt.properties;
const recipientTerms =
  quoteSchemas.TransferQuoteTerms.properties.recipient.properties;
const { existed: _existed, ...recipient } = recipientTerms;
void _existed;
const shared = {
  requestKey: uuid,
  transactionId: uuid,
  type: { type: "string", const: "transfer" },
  status: { type: "string", const: "completed" },
  source: fx.source,
  target: fx.target,
  recipient: object({ ...recipient, created: { type: "boolean" } }),
  createdAt: dateTimeSchema,
};
export const transferSchemas = {
  TransferRequest: transferRequestContract.schema,
  TransferReceipt: {
    oneOf: [
      object({
        ...shared,
        quoteId: { type: "null" },
        rate: { type: "null" },
        issuedAt: { type: "null" },
        expiresAt: { type: "null" },
      }),
      object({
        ...shared,
        quoteId: uuid,
        rate: fx.rate,
        issuedAt: fx.issuedAt,
        expiresAt: fx.expiresAt,
      }),
    ],
  },
  TransferProblem: monetaryProblemSchema(
    [400, 404, 409, 503],
    [
      "INVALID_TRANSFER_REQUEST",
      ...Object.keys(transferFailures),
      "IDEMPOTENCY_KEY_REUSED",
      "TRANSFER_OUTCOME_UNKNOWN",
    ],
  ),
};
const problem = {
  description:
    "Safe Problem Details. Structural rejections precede acceptance; definitive resource/context/funds/quote failures are retained. Unknown outcomes and key-reuse conflicts never authorize replacing the original intent.",
  headers,
  content: { "application/problem+json": { schema: ref("TransferProblem") } },
};
export const transferPaths = {
  "/api/transfers": {
    post: {
      operationId: "confirmSimulatedTransfer",
      summary: "Confirm a reviewed simulated transfer; no real funds move",
      description:
        "Same-origin JSON, maximum 16 KiB, required globally owned UUID Idempotency-Key. Recipient IDs are exact arbitrary nonblank/NUL-free strings, not trimmed or UUID-only. Unknown recipients require recipientDefaultCurrency; existing defaults cannot be overwritten. Omitted targetCurrency uses the recipient default. Same-currency transfers move identical minor units with no rate/quote; FX requires reviewed immutable server terms. Accepted identical requests replay original definitive success/error indefinitely before provider/clock/current-funds/quote-state checks. New recipient/wallet, debit/credit, quote use and result commit atomically. No real payment, trusted client rate/receive override or automatic retry. Unknown results retain original key/input/quote. Destinations remain inspect-only; scoped incoming history uses the history GETs.",
      parameters: [
        { name: "Idempotency-Key", in: "header", required: true, schema: uuid },
      ],
      requestBody: {
        required: true,
        content: { "application/json": { schema: ref("TransferRequest") } },
      },
      responses: {
        "200": {
          description:
            "Original completed transfer receipt, recipient creation/default context and original post-operation balances. Same-currency quote/rate/times are null; replay never refreshes snapshots.",
          headers,
          content: { "application/json": { schema: ref("TransferReceipt") } },
        },
        "400": problem,
        "404": problem,
        "409": problem,
        "503": problem,
      },
    },
  },
};
