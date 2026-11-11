import { QuoteError } from "@/features/quotes/contracts";
import { asQuoteError } from "@/features/quotes/errors";

export const quoteProblemDetails: Record<QuoteError["code"], string> = {
  INVALID_QUOTE_REQUEST:
    "Supply only the required quote fields as JSON. Do not send a trusted rate, expiry or receive amount.",
  INVALID_QUOTE_ID: "Supply a valid UUID quote ID.",
  QUOTE_NOT_FOUND: "The requested quote does not exist.",
  SOURCE_WALLET_NOT_FOUND: "The source wallet does not exist.",
  INSPECT_ONLY: "Only the main account can originate a quoted operation.",
  INVALID_AMOUNT: "Enter a positive plain decimal amount.",
  INVALID_PRECISION:
    "The amount exceeds the source currency’s accounting precision.",
  AMOUNT_OUT_OF_RANGE: "The amount exceeds the supported monetary range.",
  ROUNDED_TO_ZERO:
    "The converted amount rounds to zero; choose a different amount.",
  INSUFFICIENT_FUNDS:
    "The source wallet has insufficient funds. Nothing was reserved or moved.",
  BALANCE_OUT_OF_RANGE:
    "The quoted credit would exceed the supported target balance.",
  INVALID_TARGET_CURRENCY:
    "Choose an eligible, different fiat target currency and valid recipient default.",
  INVALID_RECIPIENT:
    "Choose a different simulated destination account, not the main account.",
  RECIPIENT_DEFAULT_REQUIRED:
    "Choose a default currency for the new simulated recipient.",
  RECIPIENT_CONTEXT_CHANGED:
    "The recipient’s default does not match this request. Refresh and review its current context.",
  FX_QUOTE_NOT_REQUIRED: "Same-currency transfers do not require an FX quote.",
  QUOTE_CONTEXT_CHANGED:
    "The quoted account, wallet or transaction context no longer matches. Request and review a new quote.",
  QUOTE_INPUT_MISMATCH:
    "This quote belongs to different operation input. Request and review a new quote.",
  QUOTE_EXPIRED:
    "This quote expired. Obtain a fresh preview and confirm again.",
  QUOTE_ALREADY_USED:
    "This quote has already completed an operation. Recover the original idempotent request instead of submitting a new attempt.",
  QUOTE_DATA_UNAVAILABLE:
    "Stored quote or currency data could not be validated. No new monetary operation was performed.",
  QUOTE_STORAGE_UNAVAILABLE:
    "Quote storage is unavailable. Creating or retrying a preview does not move funds.",
  QUOTE_RATE_UNAVAILABLE:
    "No eligible reference data was available when the quote could be issued. Request a new preview later.",
};
export function quoteJson(body: unknown) {
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}
export function quoteProblem(error: unknown) {
  const problem = asQuoteError(error);
  return Response.json(
    {
      type: "about:blank",
      title: {
        400: "Bad Request",
        404: "Not Found",
        409: "Conflict",
        503: "Service Unavailable",
      }[problem.status],
      status: problem.status,
      code: problem.code,
      detail: quoteProblemDetails[problem.code],
    },
    {
      status: problem.status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/problem+json",
      },
    },
  );
}
