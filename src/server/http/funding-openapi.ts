const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const headers = {
  "Cache-Control": { schema: { type: "string", const: "no-store" } },
  "Idempotency-Replayed": {
    description: "True only when the original stored body/status is replayed.",
    schema: { type: "string", enum: ["true", "false"] },
  },
};
const minor = {
  type: "string",
  pattern: "^(0|[1-9][0-9]{0,18})$",
  description:
    "Exact minor units, maximum 9223372036854775807; never a JSON number.",
};
const uuid = {
  type: "string",
  pattern:
    "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
  minLength: 36,
  maxLength: 36,
};
const provider = {
  type: "string",
  enum: ["demo_bank", "community_bank", "crypto_gateway"],
};

export const fundingSchemas = {
  FundingRequest: {
    type: "object",
    additionalProperties: false,
    required: ["walletId", "amount", "provider"],
    properties: {
      walletId: {
        type: "string",
        minLength: 1,
        maxLength: 8192,
        description: "Nonblank existing wallet ID without NUL characters.",
      },
      amount: {
        type: "string",
        maxLength: 24,
        pattern: "^(0|[1-9][0-9]*)(\\.[0-9]+)?$",
        description:
          "Positive plain decimal text; server validates precision and signed-int64 monetary bounds without rounding.",
      },
      provider,
    },
  },
  FundingReceipt: {
    type: "object",
    additionalProperties: false,
    required: [
      "requestKey",
      "transactionId",
      "type",
      "status",
      "accountId",
      "walletId",
      "currency",
      "exponent",
      "amountMinor",
      "balanceMinor",
      "provider",
      "createdAt",
    ],
    properties: {
      requestKey: uuid,
      transactionId: uuid,
      type: { type: "string", enum: ["deposit", "withdrawal"] },
      status: { type: "string", const: "completed" },
      accountId: { type: "string", minLength: 1 },
      walletId: { type: "string", minLength: 1 },
      currency: { type: "string", pattern: "^[A-Z]{3}$" },
      exponent: { type: "integer", minimum: 0, maximum: 4 },
      amountMinor: minor,
      balanceMinor: {
        ...minor,
        description:
          "Original post-operation snapshot. Replays do not refresh this balance.",
      },
      provider,
      createdAt: { type: "string", format: "date-time" },
    },
  },
  FundingProblem: {
    type: "object",
    additionalProperties: false,
    required: ["type", "title", "status", "code", "detail", "definitive"],
    properties: {
      type: { type: "string", const: "about:blank" },
      title: { type: "string" },
      status: { type: "integer", enum: [400, 404, 409, 503] },
      code: {
        type: "string",
        enum: [
          "INVALID_FUNDING_REQUEST",
          "CROSS_ORIGIN_WRITE",
          "WALLET_NOT_FOUND",
          "INSPECT_ONLY",
          "INVALID_AMOUNT",
          "INVALID_PRECISION",
          "AMOUNT_OUT_OF_RANGE",
          "INSUFFICIENT_FUNDS",
          "BALANCE_OUT_OF_RANGE",
          "IDEMPOTENCY_KEY_REUSED",
          "FUNDING_OUTCOME_UNKNOWN",
        ],
      },
      detail: { type: "string" },
      definitive: {
        type: "boolean",
        description:
          "False means the original request remains unresolved: retry identical input/key. True includes known pre-acceptance rejection, not only retained outcomes.",
      },
      requestKey: uuid,
    },
  },
};

export function fundingPath(kind: "deposit" | "withdrawal") {
  const problem = {
    description:
      "Safe Problem Details. 400 malformed requests are pre-acceptance; business failures are retained. 503/key mismatch is nondefinitive about the original intent.",
    headers,
    content: { "application/problem+json": { schema: ref("FundingProblem") } },
  };
  return {
    post: {
      operationId:
        kind === "deposit" ? "simulateDeposit" : "simulateWithdrawal",
      summary: `Confirm a simulated ${kind}; no real provider or funds`,
      description:
        "JSON body maximum 16 KiB. Key binds kind and exact wallet/amount/provider strings; property order is ignored, decimal spelling is not. Definitive outcomes are retained indefinitely. Same input/key replays original success/error, changed input is rejected. Concurrent writers serialize; timeout/storage failures require identical-key retry. Browser cross-origin writes are rejected; no authentication/public deployment support.",
      parameters: [
        { name: "Idempotency-Key", in: "header", required: true, schema: uuid },
      ],
      requestBody: {
        required: true,
        content: { "application/json": { schema: ref("FundingRequest") } },
      },
      responses: {
        "200": {
          description:
            "Confirmed completed simulation, original receipt on replay.",
          headers,
          content: { "application/json": { schema: ref("FundingReceipt") } },
        },
        "400": problem,
        "404": problem,
        "409": problem,
        "503": problem,
      },
    },
  };
}
