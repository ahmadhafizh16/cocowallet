import { normalizeRequestKey } from "../funding/contracts";
import {
  assertBalanceMinor,
  convertMinorUnits,
  formatAmount,
  parseAmount,
} from "../money/money";
import { validIdentifier, QUOTE_LIFETIME_MS } from "../quotes/contracts";
import {
  cacheEligible,
  fiatExponent,
  sourceDate,
  timestamp,
} from "../rates/validation";
import {
  conversionFailures,
  conversionProblem,
  type ConversionReceipt,
  type ConversionRequest,
  type ConversionProblem,
} from "./contracts";

function amount(value: ConversionReceipt["source"]): bigint {
  if (
    !value ||
    !validIdentifier(value.accountId) ||
    !validIdentifier(value.walletId) ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    value.name.length > 256 ||
    value.name.includes("\0") ||
    fiatExponent(value.currency) !== value.exponent ||
    typeof value.amountMinor !== "string" ||
    !/^[1-9][0-9]{0,18}(?![\s\S])/u.test(value.amountMinor) ||
    typeof value.balanceMinor !== "string" ||
    !/^(0|[1-9][0-9]{0,18})(?![\s\S])/u.test(value.balanceMinor)
  )
    throw new Error("Invalid stored conversion amount.");
  const minor = parseAmount(value.amount, value.exponent);
  if (
    minor.toString() !== value.amountMinor ||
    formatAmount(minor, value.exponent) !== value.amount
  )
    throw new Error("Inconsistent stored conversion amount.");
  assertBalanceMinor(BigInt(value.balanceMinor));
  return minor;
}

/** Replay validates the retained receipt itself, never current balances, active
 * quote state, provider availability or the current clock. */
export function confirmedConversionResult(
  value: unknown,
  status: string,
  transactionId: string | null,
  key: string,
  input: ConversionRequest,
): ConversionReceipt | ConversionProblem {
  if (!value || typeof value !== "object")
    throw new Error("Invalid stored conversion result.");
  if (status !== "200") {
    const problem = value as ConversionProblem;
    const known = Object.hasOwn(conversionFailures, problem.code)
      ? conversionFailures[problem.code as keyof typeof conversionFailures]
      : undefined;
    if (
      !known ||
      status !== String(known.status) ||
      transactionId !== null ||
      JSON.stringify(problem) !==
        JSON.stringify(
          conversionProblem(
            known.status,
            problem.code,
            known.detail,
            true,
            key,
          ),
        )
    )
      throw new Error("Invalid stored conversion failure.");
    return problem;
  }
  const receipt = value as ConversionReceipt;
  if (
    receipt.requestKey !== key ||
    normalizeRequestKey(receipt.transactionId) !== receipt.transactionId ||
    receipt.transactionId !== transactionId ||
    receipt.type !== "conversion" ||
    receipt.status !== "completed" ||
    receipt.quoteId !== input.quoteId ||
    receipt.source.walletId !== input.sourceWalletId ||
    receipt.target.currency !== input.targetCurrency ||
    receipt.source.accountId !== receipt.target.accountId ||
    receipt.source.walletId === receipt.target.walletId ||
    receipt.source.currency === receipt.target.currency ||
    receipt.rate.provider !== "frankfurter" ||
    !["fresh", "cached"].includes(receipt.rate.source)
  )
    throw new Error("Invalid stored conversion receipt.");
  const source = amount(receipt.source),
    target = amount(receipt.target);
  if (
    source !== parseAmount(input.amount, receipt.source.exponent) ||
    convertMinorUnits({
      sourceMinor: source,
      sourceExponent: receipt.source.exponent,
      targetExponent: receipt.target.exponent,
      rate: receipt.rate.value,
    }) !== target ||
    BigInt(receipt.target.balanceMinor) < target
  )
    throw new Error("Inconsistent stored conversion arithmetic.");
  assertBalanceMinor(BigInt(receipt.source.balanceMinor) + source);
  const issued = Date.parse(receipt.issuedAt),
    expiry = Date.parse(receipt.expiresAt);
  if (
    timestamp(issued) !== receipt.issuedAt ||
    timestamp(expiry) !== receipt.expiresAt ||
    expiry - issued !== QUOTE_LIFETIME_MS ||
    !cacheEligible(receipt.rate.fetchedAt, issued) ||
    timestamp(Date.parse(receipt.createdAt)) !== receipt.createdAt
  )
    throw new Error("Invalid stored conversion time.");
  sourceDate(receipt.rate.date, receipt.rate.fetchedAt);
  return receipt;
}
