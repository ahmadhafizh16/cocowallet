export type FundingKind = "deposit" | "withdrawal";
export type FundingProvider = "demo_bank" | "community_bank" | "crypto_gateway";
export type FundingRequest = {
  walletId: string;
  amount: string;
  provider: string;
};
export type FundingIntent = {
  version: 1;
  key: string;
  kind: FundingKind;
  request: FundingRequest;
};
export type FundingReceipt = {
  requestKey: string;
  transactionId: string;
  type: FundingKind;
  status: "completed";
  accountId: string;
  walletId: string;
  currency: string;
  exponent: number;
  amountMinor: string;
  balanceMinor: string;
  provider: FundingProvider;
  createdAt: string;
};
export type FundingProblem = ProblemDetails & {
  definitive: boolean;
  requestKey?: string;
};
export type FundingResult = {
  status: 200 | 400 | 404 | 409 | 503;
  body: FundingReceipt | FundingProblem;
  replayed: boolean;
};

export function normalizeRequestKey(value: unknown): string | null {
  return uuidContract.is(value) ? value.toLowerCase() : null;
}

export const fundingProviderContract = enumContract([
  "demo_bank",
  "community_bank",
  "crypto_gateway",
]);
export const fundingRequestContract = objectContract({
  walletId: identifierContract,
  amount: amountContract,
  provider: fundingProviderContract,
});
const fundingShapeContract = objectContract({
  walletId: textContract({}),
  amount: textContract({}),
  provider: textContract({}),
});
export function isFundingProvider(value: string): value is FundingProvider {
  return fundingProviderContract.is(value);
}

export function validFundingInput(value: unknown): value is FundingRequest {
  return fundingRequestContract.is(value);
}

/** Structural validation precedes key acceptance; business errors are recorded. */
export function isFundingRequest(value: unknown): value is FundingRequest {
  return fundingShapeContract.is(value);
}

export function fundingProblem(
  status: FundingProblem["status"],
  code: string,
  detail: string,
  definitive = false,
  requestKey?: string,
): FundingProblem {
  return {
    ...problemDetails(status, code, detail),
    definitive,
    ...(requestKey ? { requestKey } : {}),
  };
}
import {
  amountContract,
  enumContract,
  identifierContract,
  objectContract,
  textContract,
  uuidContract,
} from "../../lib/contracts";
import { problemDetails, type ProblemDetails } from "../../lib/problem-details";
