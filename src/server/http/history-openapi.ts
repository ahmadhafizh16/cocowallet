import {
  amountContract,
  currencyContract,
  dateTimeSchema,
  exponentSchema,
  identifierContract,
  minorUnitsSchema,
  objectSchema,
} from "@/lib/contracts";
import { fundingProviderContract } from "@/features/funding/contracts";
import {
  historyDateContract,
  historyFailures,
  historyPageContract,
  historyPageSizeContract,
  transactionTypeContract,
} from "@/features/history/contracts";
import { referenceSchemas } from "./rates-openapi";
import {
  noStoreHeaders as headers,
  problemSchema,
  schemaRef as ref,
} from "./schema-parts";

const nil = { type: "null" };
const common = {
  transactionId: identifierContract.schema,
  type: transactionTypeContract.schema,
  status: { type: "string", const: "completed" },
  createdAt: dateTimeSchema,
};
const amount = ref("HistoryAmount"),
  rate = ref("HistoryRate");
export const historySchemas = {
  HistoryAmount: objectSchema({
    accountId: identifierContract.schema,
    walletId: identifierContract.schema,
    currency: currencyContract.schema,
    name: { type: "string", minLength: 1, maxLength: 256 },
    exponent: exponentSchema,
    amount: {
      ...amountContract.schema,
      not: { pattern: "^0(\\.0+)?$" },
      description:
        "Canonical positive fixed-precision decimal text from the recorded entry; source amounts are debit magnitudes, not signed deltas.",
    },
    amountMinor: {
      ...minorUnitsSchema,
      pattern: "^[1-9][0-9]{0,18}(?![\\s\\S])",
      description:
        "Exact positive minor-unit magnitude, maximum 9223372036854775807; never a JSON number.",
    },
  }),
  HistoryRate: objectSchema({
    value: {
      ...referenceSchemas.ReferenceRate.properties.rate,
      description:
        "Exact original applied rate from the transaction, not a current observation or an invented reciprocal.",
    },
    date: { type: "string", format: "date" },
    fetchedAt: {
      ...dateTimeSchema,
      description:
        "Original applied observation time. History does not recheck cache age or quote expiry.",
    },
    source: { type: "string", enum: ["fresh", "cached"] },
  }),
  HistoryTransaction: {
    oneOf: [
      objectSchema({
        ...common,
        type: { type: "string", const: "deposit" },
        direction: { type: "string", const: "incoming" },
        source: nil,
        target: amount,
        provider: fundingProviderContract.schema,
        rate: nil,
      }),
      objectSchema({
        ...common,
        type: { type: "string", const: "withdrawal" },
        direction: { type: "string", const: "outgoing" },
        source: amount,
        target: nil,
        provider: fundingProviderContract.schema,
        rate: nil,
      }),
      objectSchema({
        ...common,
        type: { type: "string", const: "conversion" },
        direction: { type: "string", const: "internal" },
        source: amount,
        target: amount,
        provider: nil,
        rate,
      }),
      objectSchema({
        ...common,
        type: { type: "string", const: "transfer" },
        direction: { type: "string", enum: ["incoming", "outgoing"] },
        source: amount,
        target: amount,
        provider: nil,
        rate: { oneOf: [nil, rate] },
      }),
    ],
  },
  HistoryPage: objectSchema({
    account: ref("Account"),
    transactions: {
      type: "array",
      maxItems: 100,
      items: ref("HistoryTransaction"),
    },
    pagination: objectSchema({
      page: historyPageContract.schema,
      pageSize: historyPageSizeContract.schema,
      totalItems: {
        type: "integer",
        minimum: 0,
        maximum: Number.MAX_SAFE_INTEGER,
      },
      totalPages: {
        type: "integer",
        minimum: 0,
        maximum: Number.MAX_SAFE_INTEGER,
      },
    }),
  }),
  HistoryDetail: objectSchema({
    account: ref("Account"),
    transaction: ref("HistoryTransaction"),
  }),
  HistoryProblem: problemSchema([400, 404, 503], Object.keys(historyFailures)),
};
const problem = {
  description:
    "Safe history Problem Details. Missing account/transaction or an unrelated account's transaction is 404; unavailable/corrupt stored data is 503. GET never seeds, fetches reference data or changes money/history.",
  headers,
  content: { "application/problem+json": { schema: ref("HistoryProblem") } },
};
const accountParameter = {
  name: "accountId",
  in: "query",
  required: true,
  description:
    "Exact selected account ID. No fallback to main account; destinations remain inspect-only.",
  schema: identifierContract.schema,
};
export const historyPaths = {
  "/api/transactions": {
    get: {
      operationId: "listCompletedTransactions",
      summary: "Read selected-account completed history with numbered pages",
      description:
        "Exactly one accountId; optional single transactionId/type/currency/from/to/page/pageSize only. transactionId is an exact account-scoped match combined with other filters, including records outside the current page; missing/foreign IDs return an empty list. Currency matches either affected side using known pinned precision, without today's provider eligibility/network. Inclusive UTC calendar days. Defaults page=1/pageSize=50, maximum pageSize=100. Newest first by createdAt DESC then transaction ID DESC. Count/account/page rows share one read snapshot, but new activity between requests can shift page boundaries: numbered pages are not cursor/snapshot pagination. Page beyond the end is empty, not 404; totalPages is 0 for no matches. Exact recorded amounts/rate provenance only, no current balances, retry keys, valuation, invented provider or FX recomputation.",
      parameters: [
        accountParameter,
        {
          name: "transactionId",
          in: "query",
          description:
            "Exact selected-account transaction ID; combines with all other filters. Missing or foreign IDs yield no matching rows.",
          schema: identifierContract.schema,
        },
        { name: "type", in: "query", schema: transactionTypeContract.schema },
        {
          name: "currency",
          in: "query",
          description:
            "Either affected currency; pinned accounting metadata, including stored historical units, not a fresh catalog lookup.",
          schema: currencyContract.schema,
        },
        { name: "from", in: "query", schema: historyDateContract.schema },
        { name: "to", in: "query", schema: historyDateContract.schema },
        {
          name: "page",
          in: "query",
          description: "Positive safe integer, default 1.",
          schema: historyPageContract.schema,
        },
        {
          name: "pageSize",
          in: "query",
          description: "1–100, default 50.",
          schema: historyPageSizeContract.schema,
        },
      ],
      responses: {
        "200": {
          description:
            "Completed records and exact matching count for this account/filter snapshot. Failed attempts are not transactions.",
          headers,
          content: { "application/json": { schema: ref("HistoryPage") } },
        },
        "400": problem,
        "404": problem,
        "503": problem,
      },
    },
  },
  "/api/transactions/{transactionId}": {
    get: {
      operationId: "readCompletedTransaction",
      summary: "Read a completed transaction only in the selected account",
      description:
        "Required accountId is the only query parameter; unknown/duplicate fields are rejected. No unscoped lookup or main-account fallback. Same transfer is outgoing for the main source and incoming for its destination; source/target amounts and original rate direction remain unchanged. No retry keys, original post-operation balances or unrelated account activity is exposed. This read does not enable transfer submission or the full history interface.",
      parameters: [
        {
          name: "transactionId",
          in: "path",
          required: true,
          schema: identifierContract.schema,
        },
        accountParameter,
      ],
      responses: {
        "200": {
          description:
            "Account metadata and validated stored operation facts; absent source/target/provider/rate fields are explicitly null where inapplicable.",
          headers,
          content: { "application/json": { schema: ref("HistoryDetail") } },
        },
        "400": problem,
        "404": problem,
        "503": problem,
      },
    },
  },
};
