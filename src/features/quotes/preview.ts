import { normalizeRequestKey } from "../funding/contracts";
import { convertMinorUnits, formatAmount, parseAmount } from "../money/money";
import {
  cacheEligible,
  fiatExponent,
  sourceDate,
  timestamp,
} from "../rates/validation";
import {
  QUOTE_LIFETIME_MS,
  type QuoteRequest,
  type StoredQuote,
} from "./contracts";

/** Validate an untrusted preview against the reviewed account and exact original
 * input before exposing a confirm action. No database or current funds are trusted
 * here; the server revalidates both at confirmation. */
export function confirmedConversionPreview(
  value: unknown,
  request: QuoteRequest,
  accountId: string,
): StoredQuote {
  if (!value || typeof value !== "object") throw new Error("Invalid preview.");
  const view = value as { state?: unknown; quote?: StoredQuote };
  const q = view.quote;
  if (
    view.state !== "active" ||
    !q ||
    q.version !== 1 ||
    normalizeRequestKey(q.quoteId) !== q.quoteId ||
    q.operation !== "conversion" ||
    request.operation !== "conversion" ||
    q.recipient ||
    q.source.accountId !== accountId ||
    q.target.accountId !== accountId ||
    q.source.walletId !== request.sourceWalletId ||
    q.target.currency !== request.targetCurrency ||
    q.source.currency === q.target.currency ||
    q.rate.provider !== "frankfurter" ||
    !["fresh", "cached"].includes(q.rate.source)
  )
    throw new Error("Mismatched preview.");
  for (const a of [q.source, q.target]) {
    if (
      fiatExponent(a.currency) !== a.exponent ||
      typeof a.name !== "string" ||
      !a.name.trim() ||
      a.name.length > 256 ||
      a.name.includes("\0") ||
      typeof a.amountMinor !== "string" ||
      !/^[1-9][0-9]{0,18}(?![\s\S])/u.test(a.amountMinor)
    )
      throw new Error("Invalid preview amount.");
    const minor = parseAmount(a.amount, a.exponent);
    if (
      minor.toString() !== a.amountMinor ||
      formatAmount(minor, a.exponent) !== a.amount
    )
      throw new Error("Inconsistent preview.");
  }
  const source = parseAmount(request.amount, q.source.exponent);
  if (
    source.toString() !== q.source.amountMinor ||
    convertMinorUnits({
      sourceMinor: source,
      sourceExponent: q.source.exponent,
      targetExponent: q.target.exponent,
      rate: q.rate.value,
    }).toString() !== q.target.amountMinor
  )
    throw new Error("Inconsistent preview calculation.");
  const issued = Date.parse(q.issuedAt),
    expiry = Date.parse(q.expiresAt);
  if (
    timestamp(issued) !== q.issuedAt ||
    timestamp(expiry) !== q.expiresAt ||
    expiry - issued !== QUOTE_LIFETIME_MS ||
    !cacheEligible(q.rate.fetchedAt, issued)
  )
    throw new Error("Invalid preview times.");
  sourceDate(q.rate.date, q.rate.fetchedAt);
  return q;
}
