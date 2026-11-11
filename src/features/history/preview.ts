import { identifierContract } from "../../lib/contracts";
import type { AccountRecord } from "../accounts/types";
import { getCurrencyExponent } from "../money/currency-precision";
import { convertMinorUnits, formatAmount, parseAmount } from "../money/money";
import { isFundingProvider } from "../funding/contracts";
import { sourceDate, timestamp } from "../rates/validation";
import {
  normalizeHistoryQuery,
  transactionTypeContract,
  type HistoryDetail,
  type HistoryPage,
  type HistoryQuery,
  type HistorySide,
  type HistoryTransaction,
  type TransactionType,
} from "./contracts";

function account(a: AccountRecord, accountId: string) {
  if (
    !a ||
    a.id !== accountId ||
    !identifierContract.is(a.id) ||
    !["main", "destination"].includes(a.role) ||
    a.inspectOnly !== (a.role === "destination") ||
    timestamp(Date.parse(a.createdAt)) !== a.createdAt
  )
    throw new Error("Mismatched history account.");
  getCurrencyExponent(a.defaultCurrency);
}
function side(value: HistorySide | null) {
  if (value === null) return;
  if (
    !value ||
    !identifierContract.is(value.accountId) ||
    !identifierContract.is(value.walletId) ||
    getCurrencyExponent(value.currency) !== value.exponent ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    value.name.length > 256 ||
    value.name.includes("\0") ||
    typeof value.amountMinor !== "string"
  )
    throw new Error("Invalid history side.");
  const minor = parseAmount(value.amount, value.exponent);
  if (
    minor.toString() !== value.amountMinor ||
    formatAmount(minor, value.exponent) !== value.amount
  )
    throw new Error("Invalid history amount.");
}
function record(t: HistoryTransaction, a: AccountRecord) {
  if (
    !t ||
    !identifierContract.is(t.transactionId) ||
    !transactionTypeContract.is(t.type) ||
    t.status !== "completed" ||
    timestamp(Date.parse(t.createdAt)) !== t.createdAt
  )
    throw new Error("Invalid history record.");
  side(t.source);
  side(t.target);
  const outgoing = t.source?.accountId === a.id,
    incoming = t.target?.accountId === a.id;
  if (
    (!outgoing && !incoming) ||
    t.direction !==
      (outgoing && incoming
        ? "internal"
        : outgoing
          ? "outgoing"
          : "incoming") ||
    (a.role === "main" && t.type === "transfer" && (!outgoing || incoming)) ||
    (a.role === "destination" &&
      (t.type !== "transfer" || !incoming || outgoing))
  )
    throw new Error("Foreign history.");
  if (t.type === "deposit" || t.type === "withdrawal") {
    if (
      !t.provider ||
      !isFundingProvider(t.provider) ||
      t.rate !== null ||
      (t.type === "deposit"
        ? t.source !== null || !incoming
        : t.target !== null || !outgoing)
    )
      throw new Error("Invalid funding history.");
  } else {
    if (
      !t.source ||
      !t.target ||
      t.source.walletId === t.target.walletId ||
      t.provider !== null ||
      (t.type === "conversion"
        ? t.source.accountId !== t.target.accountId ||
          !outgoing ||
          !incoming ||
          t.source.currency === t.target.currency
        : t.source.accountId === t.target.accountId)
    )
      throw new Error("Invalid movement history.");
    if (t.source.currency === t.target.currency) {
      if (t.rate !== null || t.source.amountMinor !== t.target.amountMinor)
        throw new Error("Invalid same-currency facts.");
    } else if (
      !t.rate ||
      !["fresh", "cached"].includes(t.rate.source) ||
      timestamp(Date.parse(t.rate.fetchedAt)) !== t.rate.fetchedAt ||
      sourceDate(t.rate.date, t.rate.fetchedAt) !== t.rate.date ||
      convertMinorUnits({
        sourceMinor: BigInt(t.source.amountMinor),
        sourceExponent: t.source.exponent,
        targetExponent: t.target.exponent,
        rate: t.rate.value,
      }).toString() !== t.target.amountMinor
    )
      throw new Error("Invalid FX history.");
  }
}
// UTF-8 SQLite BINARY order follows Unicode code points, not UTF-16 surrogate
// ordering. UUIDs are ASCII, but older internal transaction IDs need not be.
function after(a: string, b: string): boolean {
  const left = Array.from(a),
    right = Array.from(b);
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    const x = left[i]!.codePointAt(0)!,
      y = right[i]!.codePointAt(0)!;
    if (x !== y) return x > y;
  }
  return left.length > right.length;
}
/** Validate context, filters, exact amounts and numbered-page metadata before
 * rendering untrusted GETs. No current FX, quote state or balances are consulted. */
export function confirmedHistoryPage(
  value: unknown,
  rawQuery: HistoryQuery,
): HistoryPage {
  const query = normalizeHistoryQuery(rawQuery);
  if (!value || typeof value !== "object") throw new Error("Invalid history.");
  const page = value as HistoryPage,
    p = page.pagination;
  account(page.account, query.accountId);
  if (
    !p ||
    p.page !== query.page ||
    p.pageSize !== query.pageSize ||
    !Number.isSafeInteger(p.totalItems) ||
    p.totalItems < 0 ||
    p.totalPages !==
      Number(
        (BigInt(p.totalItems) + BigInt(p.pageSize) - 1n) / BigInt(p.pageSize),
      ) ||
    !Array.isArray(page.transactions)
  )
    throw new Error("Mismatched history pagination.");
  const remaining =
    BigInt(p.totalItems) - (BigInt(p.page) - 1n) * BigInt(p.pageSize);
  if (
    page.transactions.length !==
    (remaining <= 0n
      ? 0
      : Number(remaining < BigInt(p.pageSize) ? remaining : BigInt(p.pageSize)))
  )
    throw new Error("Mismatched history count.");
  const seen = new Set<string>();
  let previous: HistoryTransaction | undefined;
  for (const t of page.transactions) {
    record(t, page.account);
    if (
      seen.has(t.transactionId) ||
      (query.type && t.type !== query.type) ||
      (query.currency &&
        t.source?.currency !== query.currency &&
        t.target?.currency !== query.currency) ||
      (query.from && t.createdAt.slice(0, 10) < query.from) ||
      (query.to && t.createdAt.slice(0, 10) > query.to) ||
      (previous &&
        (t.createdAt > previous.createdAt ||
          (t.createdAt === previous.createdAt &&
            after(t.transactionId, previous.transactionId))))
    )
      throw new Error("Mismatched history filter/order.");
    seen.add(t.transactionId);
    previous = t;
  }
  return page;
}
export function confirmedHistoryDetail(
  value: unknown,
  accountId: string,
  transactionId: string,
): HistoryDetail {
  if (
    !identifierContract.is(transactionId) ||
    !value ||
    typeof value !== "object"
  )
    throw new Error("Invalid history detail.");
  const detail = value as HistoryDetail;
  account(detail.account, accountId);
  record(detail.transaction, detail.account);
  if (detail.transaction.transactionId !== transactionId)
    throw new Error("Mismatched history detail.");
  return detail;
}
export function confirmedRecentHistory(
  value: unknown,
  accountId: string,
  type?: TransactionType,
): HistoryPage {
  return confirmedHistoryPage(value, {
    accountId,
    page: 1,
    pageSize: 50,
    ...(type ? { type } : {}),
  });
}
