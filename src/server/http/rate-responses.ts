import { RateDataError } from "@/features/rates/contracts";

export function rateJson(body: unknown) {
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
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
  return Response.json(
    {
      type: "about:blank",
      title: status === 400 ? "Bad Request" : "Service Unavailable",
      status,
      code,
      detail: details[code],
    },
    {
      status,
      headers: {
        "Content-Type": "application/problem+json",
        "Cache-Control": "no-store",
      },
    },
  );
}
