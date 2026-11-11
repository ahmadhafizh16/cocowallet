import type { WalletDatabase } from "../../server/db/connection";
import { normalizeRequestKey } from "../funding/contracts";
import { convertMinorUnits, formatAmount, parseAmount } from "../money/money";
import {
  cacheEligible,
  fiatExponent,
  sourceDate,
  timestamp,
} from "../rates/validation";
import {
  isQuoteRequest,
  QuoteError,
  QUOTE_LIFETIME_MS,
  validIdentifier,
  type QuoteRequest,
  type StoredQuote,
} from "./contracts";

type Row = {
  id: string;
  operation: string;
  source_account_id: string;
  source_wallet_id: string;
  request: string;
  terms: string;
  issued_at: string;
  expires_at: string;
};
function amount(value: StoredQuote["target"]): bigint {
  if (
    !value ||
    !validIdentifier(value.accountId) ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    value.name.length > 256 ||
    value.name.includes("\0") ||
    fiatExponent(value.currency) !== value.exponent ||
    typeof value.amountMinor !== "string" ||
    !/^[1-9][0-9]{0,18}(?![\s\S])/u.test(value.amountMinor)
  )
    throw new Error("Invalid quote amount.");
  const minor = parseAmount(value.amount, value.exponent);
  if (
    minor.toString() !== value.amountMinor ||
    formatAmount(minor, value.exponent) !== value.amount
  )
    throw new Error("Inconsistent quote amount.");
  return minor;
}

export function loadQuote(
  database: WalletDatabase,
  quoteId: string,
): { quote: StoredQuote; request: QuoteRequest } {
  const id = normalizeRequestKey(quoteId);
  if (!id) throw new QuoteError("INVALID_QUOTE_ID", 400);
  const row = database.sqlite
    .prepare<[string], Row>("SELECT * FROM fx_quotes WHERE id=?")
    .get(id);
  if (!row) throw new QuoteError("QUOTE_NOT_FOUND", 404);
  try {
    if (row.terms.length > 131072 || row.request.length > 32768)
      throw new Error("Oversized stored quote.");
    const quote = JSON.parse(row.terms) as StoredQuote;
    const request = JSON.parse(row.request) as unknown;
    if (
      !isQuoteRequest(request) ||
      !quote ||
      quote.version !== 1 ||
      quote.quoteId !== row.id ||
      quote.operation !== row.operation ||
      request.operation !== quote.operation ||
      quote.source.walletId !== row.source_wallet_id ||
      quote.source.accountId !== row.source_account_id ||
      request.sourceWalletId !== quote.source.walletId ||
      request.targetCurrency !== quote.target.currency ||
      quote.source.currency === quote.target.currency ||
      quote.rate.provider !== "frankfurter" ||
      !["fresh", "cached"].includes(quote.rate.source) ||
      quote.issuedAt !== row.issued_at ||
      quote.expiresAt !== row.expires_at
    )
      throw new Error("Inconsistent stored quote.");
    const source = amount(quote.source);
    const target = amount(quote.target);
    if (
      parseAmount(request.amount, quote.source.exponent) !== source ||
      convertMinorUnits({
        sourceMinor: source,
        sourceExponent: quote.source.exponent,
        targetExponent: quote.target.exponent,
        rate: quote.rate.value,
      }) !== target
    )
      throw new Error("Inconsistent quote arithmetic.");
    const issued = Date.parse(quote.issuedAt);
    const expiry = Date.parse(quote.expiresAt);
    if (
      timestamp(issued) !== quote.issuedAt ||
      timestamp(expiry) !== quote.expiresAt ||
      expiry - issued !== QUOTE_LIFETIME_MS ||
      !cacheEligible(quote.rate.fetchedAt, issued)
    )
      throw new Error("Invalid quote times.");
    sourceDate(quote.rate.date, quote.rate.fetchedAt);
    if (quote.operation === "conversion") {
      if (quote.recipient || quote.target.accountId !== quote.source.accountId)
        throw new Error("Invalid conversion binding.");
    } else {
      if (
        !quote.recipient ||
        quote.recipient.accountId !== request.recipientAccountId ||
        quote.target.accountId !== request.recipientAccountId ||
        quote.target.accountId === quote.source.accountId ||
        typeof quote.recipient.existed !== "boolean" ||
        (!quote.recipient.existed && !request.recipientDefaultCurrency) ||
        (request.recipientDefaultCurrency &&
          request.recipientDefaultCurrency !== quote.recipient.defaultCurrency)
      )
        throw new Error("Invalid recipient binding.");
      if (
        fiatExponent(quote.recipient.defaultCurrency) !==
          quote.recipient.defaultExponent ||
        typeof quote.recipient.defaultName !== "string" ||
        !quote.recipient.defaultName.trim() ||
        quote.recipient.defaultName.length > 256 ||
        quote.recipient.defaultName.includes("\0")
      )
        throw new Error("Invalid recipient currency metadata.");
    }
    return { quote, request };
  } catch {
    throw new QuoteError("QUOTE_DATA_UNAVAILABLE", 503);
  }
}

export function assertQuoteActive(
  database: WalletDatabase,
  quote: StoredQuote,
  now: number,
) {
  timestamp(now);
  if (
    database.sqlite
      .prepare("SELECT quote_id FROM fx_quote_uses WHERE quote_id=?")
      .get(quote.quoteId)
  )
    throw new QuoteError("QUOTE_ALREADY_USED", 409);
  if (now < Date.parse(quote.issuedAt))
    throw new QuoteError("QUOTE_DATA_UNAVAILABLE", 503);
  if (now >= Date.parse(quote.expiresAt))
    throw new QuoteError("QUOTE_EXPIRED", 409);
}
