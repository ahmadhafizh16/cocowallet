export const FX_CACHE_LIFETIME_MS = 24 * 60 * 60 * 1000;
export type FiatCurrency = { code: string; name: string; exponent: number };
export type CurrencyCatalog = {
  provider: "frankfurter";
  source: "fresh" | "cached";
  fetchedAt: string;
  currencies: FiatCurrency[];
};
export type ReferenceRate = {
  provider: "frankfurter";
  source: "fresh" | "cached";
  base: string;
  quote: string;
  rate: string;
  date: string;
  fetchedAt: string;
};
export class RateDataError extends Error {
  constructor(
    public readonly code:
      | "INVALID_CURRENCY_PAIR"
      | "UNSUPPORTED_CURRENCY"
      | "CURRENCY_CATALOG_UNAVAILABLE"
      | "FX_RATE_UNAVAILABLE"
      | "FX_STORAGE_UNAVAILABLE",
    public readonly status: 400 | 503,
  ) {
    super(code);
    this.name = "RateDataError";
  }
}
