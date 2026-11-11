import type {
  ConversionRequest,
  ConversionReceipt,
} from "../conversions/contracts";
import { isConversionRequest } from "../conversions/contracts";
import { confirmedConversionResult } from "../conversions/receipt";
import {
  normalizeRequestKey,
  type FundingIntent,
  type FundingReceipt,
  type FundingProblem,
} from "../funding/contracts";
import {
  parseRecovery,
  confirmedResult,
  FUNDING_RECOVERY_KEY,
} from "../funding/recovery";

export type ConversionIntent = {
  version: 1;
  kind: "conversion";
  key: string;
  request: ConversionRequest;
};
export type SubmissionIntent = FundingIntent | ConversionIntent;
export type SubmissionReceipt = FundingReceipt | ConversionReceipt;
export type SubmissionResult = SubmissionReceipt | FundingProblem;
// Retain the historical storage name so unresolved funding survives this upgrade.
// One slot prevents new cross-feature submissions while any money result is unknown.
export const SUBMISSION_RECOVERY_KEY = FUNDING_RECOVERY_KEY;
export function parseSubmissionRecovery(raw: string): SubmissionIntent {
  if (raw.length > 16384) throw new Error("Invalid recovery record.");
  const value = JSON.parse(raw);
  if (value?.kind !== "conversion") return parseRecovery(raw);
  if (
    value.version !== 1 ||
    normalizeRequestKey(value.key) !== value.key ||
    !isConversionRequest(value.request) ||
    normalizeRequestKey(value.request.quoteId) !== value.request.quoteId
  )
    throw new Error("Invalid conversion recovery.");
  return {
    version: 1,
    kind: "conversion",
    key: value.key,
    request: { ...value.request },
  };
}
export function confirmedSubmissionResult(
  value: unknown,
  status: number,
  intent: SubmissionIntent,
): SubmissionResult | null {
  if (intent.kind !== "conversion")
    return confirmedResult(value, status, intent);
  try {
    if (!value || typeof value !== "object") return null;
    const row = value as Record<string, unknown>;
    if (
      status === 400 &&
      row.type === "about:blank" &&
      row.status === 400 &&
      row.requestKey === intent.key &&
      row.definitive === true &&
      row.code === "INVALID_CONVERSION_REQUEST" &&
      typeof row.detail === "string" &&
      row.detail.length < 1024 &&
      row.title === "Bad Request"
    )
      return value as FundingProblem;
    return confirmedConversionResult(
      value,
      String(status),
      status === 200 && typeof row.transactionId === "string"
        ? row.transactionId
        : null,
      intent.key,
      intent.request,
    );
  } catch {
    return null;
  }
}
