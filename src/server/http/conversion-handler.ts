import {
  conversionProblem,
  isConversionRequest,
} from "@/features/conversions/contracts";
import { submitConversion } from "@/features/conversions/service";
import { normalizeRequestKey } from "@/features/funding/contracts";
import { getRuntimeDatabase } from "../db/runtime";
import { localJsonRequest, readValidatedJson } from "./request-input";
import { monetaryResponse as respond } from "./responses";

export async function handleConversion(request: Request) {
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
  let input;
  try {
    input = await readValidatedJson(request, isConversionRequest);
  } catch {
    return invalid();
  }
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
