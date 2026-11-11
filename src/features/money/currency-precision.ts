import precision from "./currency-precision.json";

// Accounting minor units, not display rounding or a fiat-currency allowlist.
// Provenance and update rules: artifact/CURRENCY_METADATA.md.
const currencyPrecision: Readonly<Record<string, number | null>> =
  Object.freeze(precision);

export class CurrencyPrecisionError extends Error {
  readonly code = "unsupported_currency" as const;

  constructor(readonly currencyCode: unknown) {
    super("Currency has no known accounting precision.");
    this.name = "CurrencyPrecisionError";
  }
}

/** Return the pinned ISO accounting exponent without normalization or fallback. */
export function getCurrencyExponent(code: string): number {
  if (typeof code !== "string" || !Object.hasOwn(currencyPrecision, code)) {
    throw new CurrencyPrecisionError(code);
  }

  const exponent = currencyPrecision[code];
  if (typeof exponent !== "number") {
    throw new CurrencyPrecisionError(code);
  }

  return exponent;
}
