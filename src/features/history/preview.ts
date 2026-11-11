import { identifierContract } from "../../lib/contracts";
import { getCurrencyExponent } from "../money/currency-precision";
import { convertMinorUnits, formatAmount, parseAmount } from "../money/money";
import { isFundingProvider } from "../funding/contracts";
import { sourceDate, timestamp } from "../rates/validation";
import {
  transactionTypeContract,
  type HistoryPage,
  type HistorySide,
  type TransactionType,
} from "./contracts";

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
/** Untrusted GETs cannot display another account's facts or round monetary text. */
export function confirmedRecentHistory(
  value: unknown,
  accountId: string,
  type?: TransactionType,
): HistoryPage {
  if (!value || typeof value !== "object") throw new Error("Invalid history.");
  const page = value as HistoryPage,
    a = page.account,
    p = page.pagination;
  if (
    !a ||
    a.id !== accountId ||
    !["main", "destination"].includes(a.role) ||
    a.inspectOnly !== (a.role === "destination") ||
    timestamp(Date.parse(a.createdAt)) !== a.createdAt ||
    !p ||
    p.page !== 1 ||
    p.pageSize !== 50 ||
    !Number.isSafeInteger(p.totalItems) ||
    p.totalItems < 0 ||
    p.totalPages !== Number((BigInt(p.totalItems) + 49n) / 50n) ||
    !Array.isArray(page.transactions) ||
    page.transactions.length !== Math.min(50, p.totalItems)
  )
    throw new Error("Mismatched history context.");
  getCurrencyExponent(a.defaultCurrency);
  const seen = new Set<string>();
  for (const t of page.transactions) {
    if (
      !t ||
      !identifierContract.is(t.transactionId) ||
      seen.has(t.transactionId) ||
      !transactionTypeContract.is(t.type) ||
      (type && t.type !== type) ||
      t.status !== "completed" ||
      timestamp(Date.parse(t.createdAt)) !== t.createdAt
    )
      throw new Error("Invalid history record.");
    seen.add(t.transactionId);
    side(t.source);
    side(t.target);
    const outgoing = t.source?.accountId === accountId,
      incoming = t.target?.accountId === accountId;
    if (
      (!outgoing && !incoming) ||
      t.direction !==
        (outgoing && incoming ? "internal" : outgoing ? "outgoing" : "incoming")
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
      } else {
        if (
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
  }
  return page;
}
