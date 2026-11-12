import {
  fundingProblem,
  normalizeRequestKey,
  type FundingKind,
  validFundingInput,
} from "@/features/funding/contracts";
import { submitFunding } from "@/features/funding/service";
import { getRuntimeDatabase } from "../db/runtime";
import { jsonWriteIssue, readBoundedJson } from "./request-input";
import { monetaryResponse as respond } from "./responses";
import { observeCompletedSubmission } from "../portfolio-observation";
import { waitForConfirmation } from "./confirmation-delay";

export async function handleFunding(request: Request, kind: FundingKind) {
  const key = normalizeRequestKey(request.headers.get("Idempotency-Key"));
  const reject = (code: string, detail: string) =>
    respond({
      status: 400,
      body: fundingProblem(400, code, detail, true, key ?? undefined),
      replayed: false,
    });
  const issue = jsonWriteIssue(request);
  if (issue === "authority") {
    return reject("INVALID_FUNDING_REQUEST", "Invalid request authority.");
  }
  // JSON plus a custom header prevents simple form CSRF; also reject explicit
  // cross-origin browser requests. CLI callers may omit Origin, not validation.
  if (issue === "origin")
    return reject(
      "CROSS_ORIGIN_WRITE",
      "Money submissions must originate from this wallet.",
    );
  if (!key || issue === "content-type")
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
  if (!validFundingInput(input))
    return reject(
      "INVALID_FUNDING_REQUEST",
      "Supply a UUID Idempotency-Key and exactly walletId, plain-decimal amount and supported provider strings.",
    );
  try {
    await waitForConfirmation();
    const database = getRuntimeDatabase();
    const result = submitFunding(database, kind, key, input);
    observeCompletedSubmission(database, result);
    return respond(result);
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
