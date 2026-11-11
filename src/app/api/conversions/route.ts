import {
  conversionProblem,
  isConversionRequest,
  type ConversionResult,
} from "@/features/conversions/contracts";
import { submitConversion } from "@/features/conversions/service";
import { normalizeRequestKey } from "@/features/funding/contracts";
import { getRuntimeDatabase } from "@/server/db/runtime";
import { localJsonRequest, readBoundedJson } from "@/server/http/request-input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function respond(result: ConversionResult) {
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
export async function POST(request: Request) {
  const key = normalizeRequestKey(request.headers.get("Idempotency-Key"));
  const invalid = () =>
    respond({
      status: 400,
      body: conversionProblem(
        400,
        "INVALID_CONVERSION_REQUEST",
        "Supply same-origin JSON, a UUID Idempotency-Key and exactly quoteId, sourceWalletId, amount and targetCurrency, within 16 KiB.",
        true,
        key ?? undefined,
      ),
      replayed: false,
    });
  if (!key || !localJsonRequest(request)) return invalid();
  let input: unknown;
  try {
    input = await readBoundedJson(request);
  } catch {
    return invalid();
  }
  if (!isConversionRequest(input)) return invalid();
  try {
    return respond(submitConversion(getRuntimeDatabase(), key, input));
  } catch {
    return respond({
      status: 503,
      body: conversionProblem(
        503,
        "CONVERSION_OUTCOME_UNKNOWN",
        "The outcome could not be confirmed. Retry the identical request with the same key and quote; do not start a replacement attempt.",
        false,
        key,
      ),
      replayed: false,
    });
  }
}
