import {
  fundingProblem,
  normalizeRequestKey,
  type FundingProblem,
} from "../funding/contracts";
import { isQuoteRequest, type StoredQuote } from "../quotes/contracts";

export type ConversionRequest = {
  quoteId: string;
  sourceWalletId: string;
  amount: string;
  targetCurrency: string;
};
export type ConversionReceipt = {
  requestKey: string;
  transactionId: string;
  type: "conversion";
  status: "completed";
  quoteId: string;
  source: StoredQuote["source"] & { balanceMinor: string };
  target: StoredQuote["target"] & { walletId: string; balanceMinor: string };
  rate: StoredQuote["rate"];
  issuedAt: string;
  expiresAt: string;
  createdAt: string;
};
export type ConversionProblem = FundingProblem;
export type ConversionResult = {
  status: 200 | ConversionProblem["status"];
  body: ConversionReceipt | ConversionProblem;
  replayed: boolean;
};
export const conversionProblem = fundingProblem;

/** Exact fields only; resource, quote binding and funds checks occur only after
 * the durable replay lookup. Rates/receive amounts are never caller inputs. */
export function isConversionRequest(
  value: unknown,
): value is ConversionRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  if (
    Object.keys(row).length !== 4 ||
    !Object.hasOwn(row, "quoteId") ||
    !normalizeRequestKey(row.quoteId)
  )
    return false;
  return (
    Object.keys(row).every((k) =>
      ["quoteId", "sourceWalletId", "amount", "targetCurrency"].includes(k),
    ) &&
    isQuoteRequest({
      operation: "conversion",
      sourceWalletId: row.sourceWalletId,
      amount: row.amount,
      targetCurrency: row.targetCurrency,
    })
  );
}
export function canonicalConversionRequest(input: ConversionRequest): string {
  return JSON.stringify([
    "conversion",
    input.quoteId,
    input.sourceWalletId,
    input.amount,
    input.targetCurrency,
  ]);
}

/** Only pre-write validation failures may become retained definitive outcomes. */
export const conversionFailures = {
  QUOTE_NOT_FOUND: {
    status: 404,
    detail: "The requested quote does not exist. No conversion was completed.",
  },
  SOURCE_WALLET_NOT_FOUND: {
    status: 404,
    detail: "The source wallet does not exist. No conversion was completed.",
  },
  INSPECT_ONLY: {
    status: 409,
    detail: "Only the main account can initiate a conversion.",
  },
  QUOTE_INPUT_MISMATCH: {
    status: 409,
    detail:
      "This quote belongs to different operation input. Obtain and review a new quote with a new key.",
  },
  QUOTE_CONTEXT_CHANGED: {
    status: 409,
    detail:
      "The quoted account or wallet context changed. Obtain and review a new quote with a new key.",
  },
  QUOTE_EXPIRED: {
    status: 409,
    detail: "The quote expired. Obtain and review a new quote with a new key.",
  },
  QUOTE_ALREADY_USED: {
    status: 409,
    detail:
      "This quote already completed an operation. Recover the original request using its original key.",
  },
  INSUFFICIENT_FUNDS: {
    status: 409,
    detail:
      "The source wallet has insufficient funds. No conversion was completed.",
  },
  BALANCE_OUT_OF_RANGE: {
    status: 409,
    detail:
      "The target credit would exceed the supported wallet balance. No conversion was completed.",
  },
} as const;
