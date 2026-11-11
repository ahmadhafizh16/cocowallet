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
export type FundingProblem = {
  type: "about:blank";
  title: string;
  status: 400 | 404 | 409 | 503;
  code: string;
  detail: string;
  definitive: boolean;
  requestKey?: string;
};
export type FundingResult = {
  status: 200 | 400 | 404 | 409 | 503;
  body: FundingReceipt | FundingProblem;
  replayed: boolean;
};

export function normalizeRequestKey(value: unknown): string | null {
  return typeof value === "string" &&
    value.length === 36 &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
    ? value.toLowerCase()
    : null;
}

export function isFundingProvider(value: string): value is FundingProvider {
  return ["demo_bank", "community_bank", "crypto_gateway"].includes(value);
}

export function validFundingInput(value: unknown): value is FundingRequest {
  return (
    isFundingRequest(value) &&
    value.walletId.trim().length > 0 &&
    !value.walletId.includes("\0") &&
    value.walletId.length <= 8192 &&
    isFundingProvider(value.provider) &&
    value.amount.length <= 24 &&
    /^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?![\s\S])/u.test(value.amount)
  );
}

/** Structural validation precedes key acceptance; business errors are recorded. */
export function isFundingRequest(value: unknown): value is FundingRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  return (
    keys.length === 3 &&
    keys.every((key) => ["walletId", "amount", "provider"].includes(key)) &&
    typeof record.walletId === "string" &&
    typeof record.amount === "string" &&
    typeof record.provider === "string"
  );
}

export function fundingProblem(
  status: FundingProblem["status"],
  code: string,
  detail: string,
  definitive = false,
  requestKey?: string,
): FundingProblem {
  return {
    type: "about:blank",
    title: {
      400: "Bad Request",
      404: "Not Found",
      409: "Conflict",
      503: "Service Unavailable",
    }[status],
    status,
    code,
    detail,
    definitive,
    ...(requestKey ? { requestKey } : {}),
  };
}
