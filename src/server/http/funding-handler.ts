import {
  fundingProblem,
  normalizeRequestKey,
  type FundingKind,
  type FundingResult,
} from "@/features/funding/contracts";
import { submitFunding } from "@/features/funding/service";
import { getRuntimeDatabase } from "../db/runtime";

function respond(result: FundingResult) {
  return Response.json(result.body, {
    status: result.status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type":
        result.status === 200 ? "application/json" : "application/problem+json",
      "Idempotency-Replayed": String(result.replayed),
    },
  });
}

async function readBoundedJson(request: Request): Promise<unknown> {
  if (!request.body) throw new Error("Missing body.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) {
        await reader.cancel();
        throw new Error("Oversized body.");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } finally {
    reader.releaseLock();
  }
}

export async function handleFunding(request: Request, kind: FundingKind) {
  const key = normalizeRequestKey(request.headers.get("Idempotency-Key"));
  const reject = (code: string, detail: string) =>
    respond({
      status: 400,
      body: fundingProblem(400, code, detail, true, key ?? undefined),
      replayed: false,
    });
  // Next's internal URL can use its bind address (0.0.0.0), not the browser's
  // authority. Host is the direct request authority; this app supports local
  // direct access only, not arbitrary forwarded-host/proxy configuration.
  const url = new URL(request.url);
  let expectedOrigin = url.origin;
  try {
    if (request.headers.get("host"))
      expectedOrigin = new URL(
        `${url.protocol}//${request.headers.get("host")}`,
      ).origin;
  } catch {
    return reject("INVALID_FUNDING_REQUEST", "Invalid request authority.");
  }
  // JSON plus a custom header prevents simple form CSRF; also reject explicit
  // cross-origin browser requests. CLI callers may omit Origin, not validation.
  if (
    (request.headers.get("origin") &&
      request.headers.get("origin") !== expectedOrigin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return reject(
      "CROSS_ORIGIN_WRITE",
      "Money submissions must originate from this wallet.",
    );
  if (
    !key ||
    request.headers
      .get("content-type")
      ?.split(";", 1)[0]
      ?.trim()
      .toLowerCase() !== "application/json"
  )
    return reject(
      "INVALID_FUNDING_REQUEST",
      "Supply JSON and a UUID Idempotency-Key.",
    );
  let input: unknown;
  try {
    input = await readBoundedJson(request);
  } catch {
    return reject(
      "INVALID_FUNDING_REQUEST",
      "Supply a valid JSON body of at most 16 KiB.",
    );
  }
  try {
    return respond(submitFunding(getRuntimeDatabase(), kind, key, input));
  } catch {
    return respond({
      status: 503,
      body: fundingProblem(
        503,
        "FUNDING_OUTCOME_UNKNOWN",
        "The outcome could not be confirmed. Retry the identical request with the same Idempotency-Key.",
        false,
        key,
      ),
      replayed: false,
    });
  }
}
