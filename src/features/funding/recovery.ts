import {
  normalizeRequestKey,
  validFundingInput,
  type FundingIntent,
  type FundingProblem,
  type FundingReceipt,
} from "./contracts";
import { assertBalanceMinor, parseAmount } from "../money/money";
import { getCurrencyExponent } from "../money/currency-precision";

export const FUNDING_RECOVERY_KEY = "cocowallet.pending-funding.v1";

export function parseRecovery(raw: string): FundingIntent {
  if (raw.length > 16384) throw new Error("Invalid recovery record.");
  const value = JSON.parse(raw) as FundingIntent;
  if (
    !value ||
    value.version !== 1 ||
    !["deposit", "withdrawal"].includes(value.kind) ||
    normalizeRequestKey(value.key) !== value.key ||
    !validFundingInput(value.request)
  )
    throw new Error("Invalid recovery record.");
  return {
    version: 1,
    key: value.key,
    kind: value.kind,
    request: { ...value.request },
  };
}

/** Treat malformed/proxy responses as unknown, never as proof of completion. */
export function confirmedResult(
  value: unknown,
  status: number,
  intent: FundingIntent,
): FundingReceipt | FundingProblem | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  if (body.requestKey !== intent.key) return null;
  if (status === 200) {
    try {
      if (
        body.status !== "completed" ||
        body.type !== intent.kind ||
        body.walletId !== intent.request.walletId ||
        body.provider !== intent.request.provider ||
        typeof body.accountId !== "string" ||
        !body.accountId ||
        normalizeRequestKey(body.transactionId) === null ||
        typeof body.currency !== "string" ||
        !/^[A-Z]{3}(?![\s\S])/u.test(body.currency) ||
        typeof body.exponent !== "number" ||
        typeof body.amountMinor !== "string" ||
        typeof body.balanceMinor !== "string" ||
        !/^(0|[1-9][0-9]{0,18})(?![\s\S])/u.test(body.balanceMinor) ||
        getCurrencyExponent(body.currency) !== body.exponent ||
        parseAmount(intent.request.amount, body.exponent).toString() !==
          body.amountMinor ||
        typeof body.createdAt !== "string" ||
        new Date(body.createdAt).toISOString() !== body.createdAt
      )
        return null;
      assertBalanceMinor(BigInt(body.balanceMinor));
      return value as FundingReceipt;
    } catch {
      return null;
    }
  }
  const codes = [
    "INVALID_FUNDING_REQUEST",
    "CROSS_ORIGIN_WRITE",
    "WALLET_NOT_FOUND",
    "INSPECT_ONLY",
    "INVALID_AMOUNT",
    "INVALID_PRECISION",
    "AMOUNT_OUT_OF_RANGE",
    "INSUFFICIENT_FUNDS",
    "BALANCE_OUT_OF_RANGE",
  ];
  if (
    [400, 404, 409].includes(status) &&
    body.status === status &&
    body.type === "about:blank" &&
    body.definitive === true &&
    typeof body.code === "string" &&
    codes.includes(body.code) &&
    typeof body.detail === "string" &&
    body.detail.length < 1024
  )
    return value as FundingProblem;
  return null;
}
