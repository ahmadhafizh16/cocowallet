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
  return identifierContract.is(value);
}
const quoteInput = {
  sourceWalletId: identifierContract,
  amount: amountContract,
  targetCurrency: currencyContract,
};
export const conversionQuoteRequestContract = objectContract({
  ...quoteInput,
  operation: literalContract("conversion"),
});
export const transferQuoteRequestContract = objectContract(
  {
    ...quoteInput,
    operation: literalContract("transfer"),
    recipientAccountId: identifierContract,
    recipientDefaultCurrency: {
      ...currencyContract,
      schema: {
        ...currencyContract.schema,
        description:
          "Required for an unknown destination; if supplied for an existing destination, must match its immutable default.",
      },
    },
  },
  ["recipientDefaultCurrency"],
);
export function isQuoteRequest(value: unknown): value is QuoteRequest {
  return (
    conversionQuoteRequestContract.is(value) ||
    transferQuoteRequestContract.is(value)
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
import {
  amountContract,
  currencyContract,
  identifierContract,
  literalContract,
  objectContract,
} from "../../lib/contracts";
