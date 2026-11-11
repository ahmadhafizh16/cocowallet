import { objectSchema, uuidContract } from "@/lib/contracts";
import type { ProblemStatus } from "@/lib/problem-details";

export const schemaRef = (name: string) => ({
  $ref: `#/components/schemas/${name}`,
});
export const jsonContent = (schema: object) => ({
  "application/json": { schema },
});
export const noStoreHeaders = {
  "Cache-Control": {
    description: "Wallet responses are never cached.",
    schema: { type: "string", const: "no-store" },
  },
};
export const monetaryHeaders = {
  ...noStoreHeaders,
  "Idempotency-Replayed": {
    description: "True only when the original stored body/status is replayed.",
    schema: { type: "string", enum: ["true", "false"] },
  },
};
export function problemSchema(
  statuses: readonly ProblemStatus[],
  codes: readonly string[],
) {
  return objectSchema({
    type: { type: "string", const: "about:blank" },
    title: { type: "string" },
    status: { type: "integer", enum: statuses },
    code: { type: "string", enum: codes },
    detail: { type: "string" },
  });
}
export function monetaryProblemSchema(
  statuses: readonly ProblemStatus[],
  codes: readonly string[],
) {
  return objectSchema(
    {
      ...problemSchema(statuses, codes).properties,
      definitive: {
        type: "boolean",
        description:
          "False leaves original intent unresolved: retry identical input/key/quote. True includes pre-acceptance rejection, not only retained outcomes.",
      },
      requestKey: uuidContract.schema,
    },
    ["requestKey"],
  );
}
