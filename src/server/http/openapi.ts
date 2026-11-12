import { fundingPath, fundingSchemas } from "./funding-openapi";
import { referencePaths, referenceSchemas } from "./rates-openapi";
import { quotePaths, quoteSchemas } from "./quotes-openapi";
import { conversionPaths, conversionSchemas } from "./conversions-openapi";
import { historyPaths, historySchemas } from "./history-openapi";
import { transferPaths, transferSchemas } from "./transfers-openapi";
import { portfolioPaths, portfolioSchemas } from "./portfolio-openapi";
import {
  currencyContract,
  dateTimeSchema,
  exponentSchema,
  minorUnitsSchema,
  objectSchema,
} from "@/lib/contracts";
import {
  jsonContent as json,
  noStoreHeaders as noStore,
  problemSchema,
  schemaRef as reference,
} from "./schema-parts";
const problem = {
  description: "Safe Problem Details error; never includes storage internals.",
  headers: noStore,
  content: { "application/problem+json": { schema: reference("Problem") } },
};
/** Explicit registration of implemented endpoints. */
export const readApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "CocoWallet simulated wallet API",
    version: "0.1.0",
    description:
      "Local-only wallet prototype with exact account/history reads, durable funding/conversion/transfers, fresh-first Frankfurter reference metadata, USD portfolio observations and immutable one-minute quotes. No real funds move. Swagger remains separate work. No authentication: do not expose the Docker port publicly.",
  },
  servers: [{ url: "/" }],
  paths: {
    ...portfolioPaths,
    ...transferPaths,
    ...historyPaths,
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
            headers: noStore,
            content: json(
              objectSchema({
                status: { type: "string", const: "ok" },
                service: { type: "string", const: "simulated-wallet" },
                milestone: { type: "string", const: "foundation" },
              }),
            ),
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
            headers: noStore,
            content: json(
              objectSchema({
                status: { type: "string", const: "ok" },
                database: { type: "string", const: "ready" },
              }),
            ),
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
            headers: noStore,
            content: json(
              objectSchema({
                openapi: { type: "string", const: "3.1.0" },
                info: objectSchema({
                  title: { type: "string" },
                  version: { type: "string" },
                  description: { type: "string" },
                }),
                servers: {
                  type: "array",
                  minItems: 1,
                  items: objectSchema({ url: { type: "string", const: "/" } }),
                },
                paths: {
                  type: "object",
                  description:
                    "Explicitly registered implemented paths, not speculative feature routes.",
                },
                components: objectSchema({ schemas: { type: "object" } }),
              }),
            ),
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ...portfolioSchemas,
      ...transferSchemas,
      ...historySchemas,
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
          defaultCurrency: currencyContract.schema,
          createdAt: dateTimeSchema,
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
          currency: currencyContract.schema,
          name: { type: "string" },
          exponent: exponentSchema,
          balanceMinor: minorUnitsSchema,
        },
      },
      Problem: problemSchema(
        [400, 404, 503],
        [
          "INVALID_ACCOUNT_ID",
          "ACCOUNT_NOT_FOUND",
          "ACCOUNT_NOT_INITIALIZED",
          "WALLET_DATA_UNAVAILABLE",
          "DATABASE_NOT_READY",
        ],
      ),
    },
  },
} as const;
