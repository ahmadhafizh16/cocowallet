import {
  dateTimeSchema,
  identifierContract,
  minorUnitsSchema,
  objectSchema,
} from "@/lib/contracts";
import {
  jsonContent,
  noStoreHeaders,
  problemSchema,
  schemaRef,
} from "./schema-parts";

const problem = {
  description:
    "Safe portfolio error. Missing FX makes the total unavailable, never a partial total.",
  headers: noStoreHeaders,
  content: {
    "application/problem+json": { schema: schemaRef("PortfolioProblem") },
  },
};
export const portfolioSchemas = {
  Portfolio: objectSchema({
    accountId: identifierContract.schema,
    balances: { type: "array", items: schemaRef("Wallet") },
    observedAt: dateTimeSchema,
    total: {
      oneOf: [
        objectSchema({ status: { const: "unavailable" } }),
        objectSchema({
          status: { const: "available" },
          balanceMinor: minorUnitsSchema,
          source: { type: "string", enum: ["balances", "fresh", "cached"] },
          rates: { type: "array", items: schemaRef("ReferenceRate") },
        }),
      ],
    },
    history: objectSchema({
      accountId: identifierContract.schema,
      currency: { const: "USD" },
      exponent: { const: 2 },
      points: {
        type: "array",
        maxItems: 240,
        items: objectSchema({
          recordedAt: dateTimeSchema,
          balanceMinor: minorUnitsSchema,
        }),
      },
    }),
  }),
  PortfolioProblem: problemSchema(
    [400, 404, 503],
    ["INVALID_PORTFOLIO_QUERY", "PORTFOLIO_UNAVAILABLE"],
  ),
};
export const portfolioPaths = {
  "/api/portfolio": {
    get: {
      operationId: "readPortfolio",
      summary: "Value one account in USD and read its recorded observations",
      description:
        "Exact journal balances with direct foreign→USD Frankfurter reference rates, fresh first and eligible original-time fallback. Rounds each wallet half-up to cents, then sums exactly. May append one immutable technical snapshot per account/committed balance revision; never changes money, transaction receipts, accounts or wallets. Old observations are never revalued or backfilled. Zero foreign balances require no FX. Receivers remain inspect-only. A current-state race or incomplete valuation yields unavailable, not a partial total.",
      parameters: [
        {
          name: "accountId",
          in: "query",
          required: true,
          schema: identifierContract.schema,
        },
      ],
      responses: {
        "200": {
          description:
            "Current valuation plus up to 240 actual recorded USD totals; failure does not hide individual balances.",
          headers: noStoreHeaders,
          content: jsonContent(schemaRef("Portfolio")),
        },
        "400": problem,
        "404": problem,
        "503": problem,
      },
    },
  },
};
