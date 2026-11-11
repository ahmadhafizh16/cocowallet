export const QUOTE_LIFETIME_MS = 60_000;
export type QuoteRequest = {
  operation: "conversion" | "transfer";
  sourceWalletId: string;
  amount: string;
  targetCurrency: string;
  recipientAccountId?: string;
  recipientDefaultCurrency?: string;
};
export type QuoteAmount = {
  accountId: string;
  currency: string;
  name: string;
  exponent: number;
  amount: string;
  amountMinor: string;
};
export type StoredQuote = {
  version: 1;
  quoteId: string;
  operation: QuoteRequest["operation"];
  source: QuoteAmount & { walletId: string };
  target: QuoteAmount;
  recipient?: {
    accountId: string;
    defaultCurrency: string;
    defaultName: string;
    defaultExponent: number;
    existed: boolean;
  };
  rate: {
    provider: "frankfurter";
    value: string;
    date: string;
    fetchedAt: string;
    source: "fresh" | "cached";
  };
  issuedAt: string;
  expiresAt: string;
};
export type QuoteView = {
  quote: StoredQuote;
  state: "active" | "expired" | "consumed";
  transactionId?: string;
};
export type QuoteErrorCode =
  | "INVALID_QUOTE_REQUEST"
  | "INVALID_QUOTE_ID"
  | "QUOTE_NOT_FOUND"
  | "SOURCE_WALLET_NOT_FOUND"
  | "INSPECT_ONLY"
  | "INVALID_AMOUNT"
  | "INVALID_PRECISION"
  | "AMOUNT_OUT_OF_RANGE"
  | "ROUNDED_TO_ZERO"
  | "INSUFFICIENT_FUNDS"
  | "BALANCE_OUT_OF_RANGE"
  | "INVALID_TARGET_CURRENCY"
  | "INVALID_RECIPIENT"
  | "RECIPIENT_DEFAULT_REQUIRED"
  | "RECIPIENT_CONTEXT_CHANGED"
  | "FX_QUOTE_NOT_REQUIRED"
  | "QUOTE_CONTEXT_CHANGED"
  | "QUOTE_INPUT_MISMATCH"
  | "QUOTE_EXPIRED"
  | "QUOTE_ALREADY_USED"
  | "QUOTE_DATA_UNAVAILABLE"
  | "QUOTE_STORAGE_UNAVAILABLE"
  | "QUOTE_RATE_UNAVAILABLE";
export class QuoteError extends Error {
  constructor(
    public readonly code: QuoteErrorCode,
    public readonly status: 400 | 404 | 409 | 503,
  ) {
    super(code);
    this.name = "QuoteError";
  }
}

export function validIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    !!value.trim() &&
    value.length <= 8192 &&
    !value.includes("\0")
  );
}
export function isQuoteRequest(value: unknown): value is QuoteRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  const required = ["operation", "sourceWalletId", "amount", "targetCurrency"];
  const allowed =
    row.operation === "transfer"
      ? [...required, "recipientAccountId", "recipientDefaultCurrency"]
      : required;
  return (
    (row.operation === "conversion" || row.operation === "transfer") &&
    required.every((k) => Object.hasOwn(row, k)) &&
    Object.keys(row).every((k) => allowed.includes(k)) &&
    validIdentifier(row.sourceWalletId) &&
    typeof row.amount === "string" &&
    row.amount.length <= 24 &&
    /^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?![\s\S])/u.test(row.amount) &&
    typeof row.targetCurrency === "string" &&
    /^[A-Z]{3}(?![\s\S])/u.test(row.targetCurrency) &&
    (row.operation !== "transfer" ||
      (validIdentifier(row.recipientAccountId) &&
        (!Object.hasOwn(row, "recipientDefaultCurrency") ||
          (typeof row.recipientDefaultCurrency === "string" &&
            /^[A-Z]{3}(?![\s\S])/u.test(row.recipientDefaultCurrency)))))
  );
}
export function canonicalQuoteRequest(request: QuoteRequest): string {
  return JSON.stringify([
    request.operation,
    request.sourceWalletId,
    request.amount,
    request.targetCurrency,
    request.recipientAccountId ?? null,
    request.recipientDefaultCurrency ?? null,
  ]);
}
