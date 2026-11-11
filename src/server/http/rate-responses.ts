import { RateDataError } from "@/features/rates/contracts";
import { problemDetails } from "@/lib/problem-details";
import { jsonResponse, problemResponse } from "./responses";

export function rateJson(body: unknown) {
  return jsonResponse(body);
}
export function rateProblem(error: unknown) {
  const status = error instanceof RateDataError ? error.status : 503;
  const code =
    error instanceof RateDataError ? error.code : "FX_STORAGE_UNAVAILABLE";
  const details = {
    INVALID_CURRENCY_PAIR:
      "Supply distinct uppercase fiat base and quote currency codes with known accounting precision.",
    UNSUPPORTED_CURRENCY:
      "The requested currency is not in the eligible fiat catalog.",
    CURRENCY_CATALOG_UNAVAILABLE:
      "A fresh or eligible cached fiat currency list is unavailable. Existing wallet reads and funding remain available.",
    FX_RATE_UNAVAILABLE:
      "No valid fresh or eligible exact-pair cached reference rate is available.",
    FX_STORAGE_UNAVAILABLE:
      "Reference metadata storage is unavailable. No monetary operation was performed.",
  };
  return problemResponse(problemDetails(status, code, details[code]));
}
