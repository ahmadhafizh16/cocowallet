import {
  currencyContract,
  enumContract,
  identifierContract,
  integerContract,
  objectContract,
  textContract,
} from "../../lib/contracts";
import type { AccountRecord } from "../accounts/types";
import type { FundingProvider } from "../funding/contracts";
import type { AppliedRate } from "../journal/write";
import { getCurrencyExponent } from "../money/currency-precision";

export const transactionTypeContract = enumContract([
  "deposit",
  "withdrawal",
  "conversion",
  "transfer",
]);
export type TransactionType =
  "deposit" | "withdrawal" | "conversion" | "transfer";
export const historyPageContract = integerContract({
  minimum: 1,
  maximum: Number.MAX_SAFE_INTEGER,
});
export const historyPageSizeContract = integerContract({
  minimum: 1,
  maximum: 100,
});
const dateText = textContract({
  minLength: 10,
  maxLength: 10,
  pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}(?![\\s\\S])",
});
export const historyDateContract = {
  schema: {
    ...dateText.schema,
    format: "date",
    description:
      "Inclusive UTC calendar day (YYYY-MM-DD), independent of browser timezone.",
  },
  is(value: unknown): value is string {
    return (
      dateText.is(value) &&
      Number.isFinite(Date.parse(`${value}T00:00:00.000Z`)) &&
      new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value
    );
  },
};
export const historyQueryContract = objectContract(
  {
    accountId: identifierContract,
    transactionId: identifierContract,
    type: transactionTypeContract,
    currency: currencyContract,
    from: historyDateContract,
    to: historyDateContract,
    page: historyPageContract,
    pageSize: historyPageSizeContract,
  },
  ["transactionId", "type", "currency", "from", "to", "page", "pageSize"],
);
export type HistoryQuery = {
  accountId: string;
  transactionId?: string;
  type?: TransactionType;
  currency?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
};
export type HistorySide = {
  accountId: string;
  walletId: string;
  currency: string;
  name: string;
  exponent: number;
  amount: string;
  amountMinor: string;
};
export type HistoryTransaction = {
  transactionId: string;
  type: TransactionType;
  status: "completed";
  direction: "incoming" | "outgoing" | "internal";
  createdAt: string;
  source: HistorySide | null;
  target: HistorySide | null;
  provider: FundingProvider | null;
  rate: AppliedRate | null;
};
export type HistoryPage = {
  account: AccountRecord;
  transactions: HistoryTransaction[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};
export type HistoryDetail = {
  account: AccountRecord;
  transaction: HistoryTransaction;
};
export const historyFailures = {
  INVALID_HISTORY_QUERY: {
    status: 400,
    detail:
      "Supply accountId and only single transactionId/type/currency/from/to/page/pageSize filters. Dates are inclusive UTC days; page is a positive safe integer and pageSize is 1–100.",
  },
  INVALID_TRANSACTION_ID: {
    status: 400,
    detail:
      "Supply a nonblank transaction ID without NUL characters, within the supported identifier length.",
  },
  TRANSACTION_NOT_FOUND: {
    status: 404,
    detail:
      "The requested transaction does not exist in this account's completed history.",
  },
  ACCOUNT_NOT_FOUND: {
    status: 404,
    detail: "The requested account does not exist.",
  },
  ACCOUNT_NOT_INITIALIZED: {
    status: 503,
    detail:
      "Initialize the database with the documented migration and seed commands.",
  },
  HISTORY_DATA_UNAVAILABLE: {
    status: 503,
    detail:
      "Stored transaction history could not be read or validated. No history or monetary record was changed.",
  },
} as const;
export class HistoryError extends Error {
  constructor(public readonly code: keyof typeof historyFailures) {
    super(code);
    this.name = "HistoryError";
  }
}

export function normalizeHistoryQuery(value: unknown): HistoryQuery {
  if (!historyQueryContract.is(value))
    throw new HistoryError("INVALID_HISTORY_QUERY");
  if (value.from && value.to && value.from > value.to)
    throw new HistoryError("INVALID_HISTORY_QUERY");
  if (value.currency) {
    try {
      getCurrencyExponent(value.currency);
    } catch {
      throw new HistoryError("INVALID_HISTORY_QUERY");
    }
  }
  return { ...value, page: value.page ?? 1, pageSize: value.pageSize ?? 50 };
}
function queryObject(params: URLSearchParams, keys: readonly string[]) {
  if (
    [...params.keys()].some(
      (key) => !keys.includes(key) || params.getAll(key).length !== 1,
    )
  )
    throw new HistoryError("INVALID_HISTORY_QUERY");
  return Object.fromEntries(params.entries());
}
export function parseHistoryQuery(params: URLSearchParams): HistoryQuery {
  const values = queryObject(
    params,
    Object.keys(historyQueryContract.schema.properties),
  );
  const input: Record<string, unknown> = { ...values };
  for (const key of ["page", "pageSize"]) {
    if (!Object.hasOwn(values, key)) continue;
    const text = values[key]!;
    if (
      !/^[1-9][0-9]{0,15}(?![\s\S])/u.test(text) ||
      BigInt(text) > BigInt(Number.MAX_SAFE_INTEGER)
    )
      throw new HistoryError("INVALID_HISTORY_QUERY");
    input[key] = Number(text);
  }
  return normalizeHistoryQuery(input);
}
export function parseHistoryAccount(params: URLSearchParams): string {
  const values = queryObject(params, ["accountId"]);
  if (!identifierContract.is(values.accountId))
    throw new HistoryError("INVALID_HISTORY_QUERY");
  return values.accountId;
}
