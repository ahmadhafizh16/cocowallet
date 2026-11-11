import { normalizeRequestKey } from "../funding/contracts";
import {
  assertBalanceMinor,
  convertMinorUnits,
  formatAmount,
  parseAmount,
} from "../money/money";
import { QUOTE_LIFETIME_MS, validIdentifier } from "../quotes/contracts";
import {
  cacheEligible,
  fiatExponent,
  sourceDate,
  timestamp,
} from "../rates/validation";
import {
  transferFailures,
  transferProblem,
  type TransferRequest,
  type TransferReceipt,
  type TransferResult,
} from "./contracts";

function side(value: TransferReceipt["source"]): bigint {
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
    throw new Error("Invalid stored transfer amount.");
  const minor = parseAmount(value.amount, value.exponent);
  if (
    minor.toString() !== value.amountMinor ||
    formatAmount(minor, value.exponent) !== value.amount
  )
    throw new Error("Inconsistent transfer amount.");
  assertBalanceMinor(BigInt(value.balanceMinor));
  return minor;
}
/** Replay validates retained bindings/arithmetic, not current balances, provider
 * metadata, quote state or the clock. Never invent a receipt on storage damage. */
export function confirmedTransferResult(
  value: unknown,
  status: string,
  transactionId: string | null,
  key: string,
  input: TransferRequest,
): TransferResult["body"] {
  if (!value || typeof value !== "object")
    throw new Error("Invalid stored transfer result.");
  if (status !== "200") {
    const problem = value as { code: string };
    const known = Object.hasOwn(transferFailures, problem.code)
      ? transferFailures[problem.code as keyof typeof transferFailures]
      : undefined;
    if (
      !known ||
      transactionId !== null ||
      status !== String(known.status) ||
      JSON.stringify(value) !==
        JSON.stringify(
          transferProblem(known.status, problem.code, known.detail, true, key),
        )
    )
      throw new Error("Invalid stored transfer rejection.");
    return value as TransferResult["body"];
  }
  const r = value as TransferReceipt;
  if (
    r.requestKey !== key ||
    normalizeRequestKey(r.transactionId) !== r.transactionId ||
    r.transactionId !== transactionId ||
    r.type !== "transfer" ||
    r.status !== "completed" ||
    r.source.walletId !== input.sourceWalletId ||
    r.target.accountId !== input.recipientAccountId ||
    r.source.accountId === r.target.accountId ||
    r.source.walletId === r.target.walletId ||
    r.recipient.accountId !== input.recipientAccountId ||
    r.target.currency !==
      (input.targetCurrency ?? r.recipient.defaultCurrency) ||
    (input.recipientDefaultCurrency &&
      r.recipient.defaultCurrency !== input.recipientDefaultCurrency) ||
    typeof r.recipient.created !== "boolean" ||
    (r.recipient.created && !input.recipientDefaultCurrency) ||
    fiatExponent(r.recipient.defaultCurrency) !== r.recipient.defaultExponent ||
    typeof r.recipient.defaultName !== "string" ||
    !r.recipient.defaultName.trim() ||
    r.recipient.defaultName.length > 256 ||
    r.recipient.defaultName.includes("\0") ||
    timestamp(Date.parse(r.createdAt)) !== r.createdAt
  )
    throw new Error("Invalid stored transfer binding.");
  const source = side(r.source),
    target = side(r.target);
  if (
    source !== parseAmount(input.amount, r.source.exponent) ||
    BigInt(r.target.balanceMinor) < target
  )
    throw new Error("Inconsistent transfer arithmetic.");
  assertBalanceMinor(BigInt(r.source.balanceMinor) + source);
  if (r.source.currency === r.target.currency) {
    if (
      input.quoteId ||
      r.quoteId !== null ||
      r.rate !== null ||
      r.issuedAt !== null ||
      r.expiresAt !== null ||
      source !== target ||
      r.source.exponent !== r.target.exponent
    )
      throw new Error("Invalid same-currency transfer terms.");
  } else {
    if (
      !input.quoteId ||
      r.quoteId !== input.quoteId ||
      !r.rate ||
      r.rate.provider !== "frankfurter" ||
      !["fresh", "cached"].includes(r.rate.source) ||
      !r.issuedAt ||
      !r.expiresAt ||
      convertMinorUnits({
        sourceMinor: source,
        sourceExponent: r.source.exponent,
        targetExponent: r.target.exponent,
        rate: r.rate.value,
      }) !== target
    )
      throw new Error("Invalid FX transfer terms.");
    const issued = Date.parse(r.issuedAt),
      expiry = Date.parse(r.expiresAt);
    if (
      timestamp(issued) !== r.issuedAt ||
      timestamp(expiry) !== r.expiresAt ||
      expiry - issued !== QUOTE_LIFETIME_MS ||
      !cacheEligible(r.rate.fetchedAt, issued)
    )
      throw new Error("Invalid FX transfer times.");
    sourceDate(r.rate.date, r.rate.fetchedAt);
  }
  return r;
}
