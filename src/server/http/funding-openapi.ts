import {
  fundingProviderContract,
  fundingRequestContract,
} from "@/features/funding/contracts";
import {
  currencyContract,
  dateTimeSchema,
  exponentSchema,
  minorUnitsSchema as minor,
  uuidContract,
} from "@/lib/contracts";
import {
  monetaryHeaders as headers,
  monetaryProblemSchema,
  schemaRef as ref,
} from "./schema-parts";
const uuid = uuidContract.schema;
const provider = fundingProviderContract.schema;

export const fundingSchemas = {
  FundingRequest: fundingRequestContract.schema,
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
      currency: currencyContract.schema,
      exponent: exponentSchema,
      amountMinor: minor,
      balanceMinor: {
        ...minor,
        description:
          "Original post-operation snapshot. Replays do not refresh this balance.",
      },
      provider,
      createdAt: dateTimeSchema,
    },
  },
  FundingProblem: monetaryProblemSchema(
    [400, 404, 409, 503],
    [
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
  ),
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
