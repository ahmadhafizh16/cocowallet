export const MAX_MINOR = 9223372036854775807n;

// Check text bounds before regex matching, BigInt parsing, or exponentiation.
// Every supported int64 amount fits in 24 characters, including its decimal dot.
export const MAX_AMOUNT_INPUT_LENGTH = 24;
export const MAX_RATE_INTEGER_DIGITS = 36;
export const MAX_RATE_FRACTION_DIGITS = 36;
export const MAX_RATE_INPUT_LENGTH =
  MAX_RATE_INTEGER_DIGITS + 1 + MAX_RATE_FRACTION_DIGITS;

export type MoneyErrorCode =
  | "invalid_amount"
  | "invalid_precision"
  | "amount_out_of_range"
  | "balance_out_of_range"
  | "invalid_rate"
  | "rounded_to_zero";

export class MoneyError extends Error {
  constructor(
    public readonly code: MoneyErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "MoneyError";
  }
}

// Unlike $, this absolute end assertion does not accept a trailing newline.
const PLAIN_DECIMAL = /^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?![\s\S])/u;

function assertExponent(exponent: number): void {
  if (!Number.isInteger(exponent) || exponent < 0 || exponent > 4) {
    throw new MoneyError(
      "invalid_precision",
      "Currency precision must be an integer from 0 to 4.",
    );
  }
}

export function assertAmountMinor(value: bigint): void {
  if (typeof value !== "bigint") {
    throw new MoneyError("invalid_amount", "Minor units must be a bigint.");
  }

  if (value < 1n || value > MAX_MINOR) {
    throw new MoneyError(
      "amount_out_of_range",
      "Amount minor units must be from 1 to MAX_MINOR.",
    );
  }
}

export function assertBalanceMinor(value: bigint): void {
  if (typeof value !== "bigint" || value < 0n || value > MAX_MINOR) {
    throw new MoneyError(
      "balance_out_of_range",
      "Balance minor units must be a bigint from 0 to MAX_MINOR.",
    );
  }
}

/** Parse a positive user amount exactly; excess fractional digits never round. */
export function parseAmount(input: string, exponent: number): bigint {
  assertExponent(exponent);

  if (
    typeof input !== "string" ||
    input.length > MAX_AMOUNT_INPUT_LENGTH ||
    !PLAIN_DECIMAL.test(input)
  ) {
    throw new MoneyError(
      "invalid_amount",
      "Amount must be a bounded plain decimal without signs or leading zeros.",
    );
  }

  const [integerPart = "", fractionalPart = ""] = input.split(".");
  if (fractionalPart.length > exponent) {
    throw new MoneyError(
      "invalid_precision",
      "Amount has more fractional digits than the currency allows.",
    );
  }

  const minor = BigInt(integerPart + fractionalPart.padEnd(exponent, "0"));
  assertAmountMinor(minor);
  return minor;
}

/** Fixed-precision decimal text for display or JSON, including signed deltas. */
export function formatAmount(minor: bigint, exponent: number): string {
  assertExponent(exponent);

  if (typeof minor !== "bigint") {
    throw new MoneyError("invalid_amount", "Minor units must be a bigint.");
  }
  if (minor < -MAX_MINOR || minor > MAX_MINOR) {
    throw new MoneyError(
      "amount_out_of_range",
      "Formatted minor units must be from -MAX_MINOR to MAX_MINOR.",
    );
  }

  const sign = minor < 0n ? "-" : "";
  const magnitude = minor < 0n ? -minor : minor;
  const digits = magnitude.toString().padStart(exponent + 1, "0");
  if (exponent === 0) {
    return sign + digits;
  }

  return `${sign}${digits.slice(0, -exponent)}.${digits.slice(-exponent)}`;
}

export function parseRate(rate: string): {
  coefficient: bigint;
  fractionDigits: number;
} {
  if (
    typeof rate !== "string" ||
    rate.length > MAX_RATE_INPUT_LENGTH ||
    !PLAIN_DECIMAL.test(rate)
  ) {
    throw new MoneyError(
      "invalid_rate",
      "Rate must be a bounded positive plain decimal without leading zeros.",
    );
  }

  const [integerPart = "", fractionalPart = ""] = rate.split(".");
  if (
    integerPart.length > MAX_RATE_INTEGER_DIGITS ||
    fractionalPart.length > MAX_RATE_FRACTION_DIGITS
  ) {
    throw new MoneyError(
      "invalid_rate",
      "Rate supports at most 36 integer and 36 fractional digits.",
    );
  }

  const coefficient = BigInt(integerPart + fractionalPart);
  if (coefficient === 0n) {
    throw new MoneyError("invalid_rate", "Rate must be greater than zero.");
  }

  return { coefficient, fractionDigits: fractionalPart.length };
}

/** Convert once using exact rational arithmetic and positive half-up rounding. */
export function convertMinorUnits({
  sourceMinor,
  sourceExponent,
  targetExponent,
  rate,
}: {
  sourceMinor: bigint;
  sourceExponent: number;
  targetExponent: number;
  rate: string;
}): bigint {
  assertAmountMinor(sourceMinor);
  assertExponent(sourceExponent);
  assertExponent(targetExponent);
  const { coefficient, fractionDigits } = parseRate(rate);

  // Intermediates are not int64-limited; only the final rounded amount is.
  const numerator = sourceMinor * coefficient * 10n ** BigInt(targetExponent);
  const denominator = 10n ** BigInt(sourceExponent + fractionDigits);
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  const result = quotient + (2n * remainder >= denominator ? 1n : 0n);

  if (result === 0n) {
    throw new MoneyError("rounded_to_zero", "Converted amount rounds to zero.");
  }
  assertAmountMinor(result);
  return result;
}
