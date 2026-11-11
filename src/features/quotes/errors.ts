import { MoneyError } from "../money/money";
import { RateDataError } from "../rates/contracts";
import { QuoteError } from "./contracts";

export function asQuoteError(error: unknown): QuoteError {
  if (error instanceof QuoteError) return error;
  if (error instanceof RateDataError)
    return new QuoteError(
      error.status === 400
        ? "INVALID_TARGET_CURRENCY"
        : "QUOTE_RATE_UNAVAILABLE",
      error.status,
    );
  if (error instanceof MoneyError) {
    const codes = {
      invalid_amount: "INVALID_AMOUNT",
      invalid_precision: "INVALID_PRECISION",
      amount_out_of_range: "AMOUNT_OUT_OF_RANGE",
      balance_out_of_range: "BALANCE_OUT_OF_RANGE",
      rounded_to_zero: "ROUNDED_TO_ZERO",
      invalid_rate: "QUOTE_DATA_UNAVAILABLE",
    } as const;
    return new QuoteError(
      codes[error.code],
      error.code === "invalid_rate"
        ? 503
        : error.code === "balance_out_of_range"
          ? 409
          : 400,
    );
  }
  return new QuoteError("QUOTE_STORAGE_UNAVAILABLE", 503);
}
