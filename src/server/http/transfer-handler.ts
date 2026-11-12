import {
  isTransferRequest,
  transferProblem,
} from "@/features/transfers/contracts";
import { submitTransfer } from "@/features/transfers/service";
import { normalizeRequestKey } from "@/features/funding/contracts";
import { getRuntimeDatabase } from "../db/runtime";
import { localJsonRequest, readValidatedJson } from "./request-input";
import { monetaryResponse as respond } from "./responses";
import { observeCompletedSubmission } from "../portfolio-observation";

export async function handleTransfer(request: Request) {
  const key = normalizeRequestKey(request.headers.get("Idempotency-Key"));
  const invalid = () =>
    respond({
      status: 400,
      body: transferProblem(
        400,
        "INVALID_TRANSFER_REQUEST",
        "Supply same-origin JSON, a UUID Idempotency-Key and only sourceWalletId, recipientAccountId, amount and optional targetCurrency, recipientDefaultCurrency, quoteId, within 16 KiB.",
        true,
        key ?? undefined,
      ),
      replayed: false,
    });
  if (!key || !localJsonRequest(request)) return invalid();
  let input;
  try {
    input = await readValidatedJson(request, isTransferRequest);
  } catch {
    return invalid();
  }
  try {
    const database = getRuntimeDatabase();
    const result = await submitTransfer(database, key, input);
    observeCompletedSubmission(database, result);
    return respond(result);
  } catch {
    return respond({
      status: 503,
      body: transferProblem(
        503,
        "TRANSFER_OUTCOME_UNKNOWN",
        "The outcome could not be confirmed. Retry the identical request with the same key and original quote if present; do not start a replacement attempt.",
        false,
        key,
      ),
      replayed: false,
    });
  }
}
