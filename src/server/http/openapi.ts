import { fundingPath, fundingSchemas } from "./funding-openapi";
import { referencePaths, referenceSchemas } from "./rates-openapi";
import { quotePaths, quoteSchemas } from "./quotes-openapi";
import { conversionPaths, conversionSchemas } from "./conversions-openapi";

const json = (schema: object) => ({ "application/json": { schema } });
const reference = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const problem = {
  description: "Safe Problem Details error; never includes storage internals.",
  content: { "application/problem+json": { schema: reference("Problem") } },
};
const noStore = {
  "Cache-Control": {
    description: "Wallet data is never cached.",
    schema: { type: "string", const: "no-store" },
  },
};

/** Implemented reads and simulated funding only; no speculative FX/write routes. */
export const readApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "CocoWallet simulated wallet API",
    version: "0.1.0",
    description:
      "Local-only simulated wallet with exact reads, durable simulated funding/conversion, fresh-first reference metadata and immutable one-minute server quotes. Transfers and full history APIs remain unimplemented. No authentication: do not expose the Docker port publicly.",
  },
  servers: [{ url: "/" }],
  paths: {
    ...conversionPaths,
    ...quotePaths,
    ...referencePaths,
    "/api/deposits": fundingPath("deposit"),
    "/api/withdrawals": fundingPath("withdrawal"),
    "/api/accounts": {
      get: {
        operationId: "listAccounts",
        summary:
          "List the persistent main account and inspect-only destinations",
        responses: {
          "200": {
            description:
              "Main first, then destinations in stable creation/ID order.",
            headers: noStore,
            content: json({
              type: "object",
              required: ["accounts"],
              additionalProperties: false,
              properties: {
                accounts: { type: "array", items: reference("Account") },
              },
            }),
          },
          "503": problem,
        },
      },
    },
    "/api/accounts/{accountId}/wallets": {
      get: {
        operationId: "readAccountWallets",
        summary: "Read one account's exact journal balances",
        parameters: [
          {
            name: "accountId",
            in: "path",
            required: true,
            schema: { type: "string", minLength: 1, pattern: "^[^\\u0000]+$" },
          },
        ],
        responses: {
          "200": {
            description:
              "Account metadata and all its wallets in a single read snapshot. No FX total or historical valuations are inferred.",
            headers: noStore,
            content: json({
              type: "object",
              required: ["account", "wallets"],
              additionalProperties: false,
              properties: {
                account: reference("Account"),
                wallets: { type: "array", items: reference("Wallet") },
              },
            }),
          },
          "400": problem,
          "404": problem,
          "503": problem,
        },
      },
    },
    "/api/health": {
      get: {
        operationId: "health",
        responses: {
          "200": {
            description: "Process liveness, not wallet/account readiness.",
          },
        },
      },
    },
    "/api/ready": {
      get: {
        operationId: "databaseReadiness",
        responses: {
          "200": {
            description:
              "Migrated metadata-table readiness; does not imply seeded accounts or full schema-version checks.",
          },
          "503": problem,
        },
      },
    },
    "/api/openapi": {
      get: {
        operationId: "readApiSpecification",
        responses: {
          "200": {
            description:
              "This OpenAPI document. Swagger UI and financial-route generation remain future work.",
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ...conversionSchemas,
      ...quoteSchemas,
      ...referenceSchemas,
      ...fundingSchemas,
      Account: {
        type: "object",
        additionalProperties: false,
        required: ["id", "role", "defaultCurrency", "createdAt", "inspectOnly"],
        properties: {
          id: { type: "string", minLength: 1 },
          role: { type: "string", enum: ["main", "destination"] },
          defaultCurrency: { type: "string", pattern: "^[A-Z]{3}$" },
          createdAt: { type: "string", format: "date-time" },
          inspectOnly: {
            type: "boolean",
            description:
              "True for destinations. This is not authentication and does not grant write permission.",
          },
        },
      },
      Wallet: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "accountId",
          "currency",
          "name",
          "exponent",
          "balanceMinor",
        ],
        properties: {
          id: { type: "string", minLength: 1 },
          accountId: { type: "string", minLength: 1 },
          currency: { type: "string", pattern: "^[A-Z]{3}$" },
          name: { type: "string" },
          exponent: { type: "integer", minimum: 0, maximum: 4 },
          balanceMinor: {
            type: "string",
            pattern: "^(0|[1-9][0-9]{0,18})$",
            description:
              "Exact nonnegative minor-unit integer text. Server-enforced maximum 9223372036854775807; never a JSON number.",
            "x-minor-unit-maximum": "9223372036854775807",
          },
        },
      },
      Problem: {
        type: "object",
        additionalProperties: false,
        required: ["type", "title", "status", "code", "detail"],
        properties: {
          type: { type: "string", const: "about:blank" },
          title: { type: "string" },
          status: { type: "integer", enum: [400, 404, 503] },
          code: {
            type: "string",
            enum: [
              "INVALID_ACCOUNT_ID",
              "ACCOUNT_NOT_FOUND",
              "ACCOUNT_NOT_INITIALIZED",
              "WALLET_DATA_UNAVAILABLE",
              "DATABASE_NOT_READY",
            ],
          },
          detail: { type: "string" },
        },
      },
    },
  },
} as const;
