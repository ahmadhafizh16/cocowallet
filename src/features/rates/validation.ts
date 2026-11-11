import { getCurrencyExponent } from "../money/currency-precision";
import { parseRate } from "../money/money";
import { FX_CACHE_LIFETIME_MS, type FiatCurrency } from "./contracts";

// Accounting precision alone does not make a fund/indexed/accounting unit fiat.
const NON_FIAT_UNITS = new Set([
  "BOV",
  "CHE",
  "CHW",
  "CLF",
  "MXV",
  "USN",
  "UYI",
  "UYW",
  "XDR",
  "XSU",
  "XUA",
]);
export function fiatExponent(code: unknown): number {
  if (
    typeof code !== "string" ||
    !/^[A-Z]{3}(?![\s\S])/u.test(code) ||
    NON_FIAT_UNITS.has(code)
  )
    throw new Error("Ineligible fiat code.");
  return getCurrencyExponent(code);
}

export function timestamp(milliseconds: number): string {
  if (!Number.isSafeInteger(milliseconds) || milliseconds < 0)
    throw new Error("Invalid clock.");
  const result = new Date(milliseconds).toISOString();
  if (result.length !== 24) throw new Error("Unsupported clock range.");
  return result;
}

export function cacheEligible(fetchedAt: unknown, now: number): boolean {
  if (
    typeof fetchedAt !== "string" ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z(?![\s\S])/u.test(fetchedAt)
  )
    return false;
  const instant = Date.parse(fetchedAt);
  return (
    Number.isSafeInteger(now) &&
    now >= 0 &&
    Number.isFinite(instant) &&
    instant >= 0 &&
    timestamp(instant) === fetchedAt &&
    instant <= now &&
    now - instant < FX_CACHE_LIFETIME_MS
  );
}

export function sourceDate(value: unknown, fetchedAt: string): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d\d-\d\d(?![\s\S])/u.test(value) ||
    !Number.isFinite(Date.parse(`${value}T00:00:00.000Z`)) ||
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) !== value ||
    value > fetchedAt.slice(0, 10)
  )
    throw new Error("Invalid source date.");
  return value;
}

export function parseCatalog(value: unknown): FiatCurrency[] {
  if (!Array.isArray(value) || !value.length || value.length > 1024)
    throw new Error("Invalid catalog.");
  const seen = new Set<string>();
  const currencies: FiatCurrency[] = [];
  for (const row of value) {
    if (
      !row ||
      typeof row !== "object" ||
      Array.isArray(row) ||
      typeof row.iso_code !== "string" ||
      !row.iso_code ||
      row.iso_code.length > 16 ||
      !/^[A-Z0-9]{2,16}(?![\s\S])/u.test(row.iso_code) ||
      (row.type === "currency" && !/^[A-Z]{3}(?![\s\S])/u.test(row.iso_code)) ||
      typeof row.name !== "string" ||
      !row.name.trim() ||
      row.name.length > 256 ||
      row.name.includes("\0") ||
      !["currency", "metal", "crypto"].includes(row.type) ||
      seen.has(row.iso_code)
    )
      throw new Error("Invalid catalog row.");
    seen.add(row.iso_code);
    if (row.type !== "currency") continue;
    let exponent: number;
    try {
      exponent = fiatExponent(row.iso_code);
    } catch {
      continue;
    }
    currencies.push({ code: row.iso_code, name: row.name, exponent });
  }
  if (!currencies.length) throw new Error("No eligible fiat currencies.");
  return currencies.sort((a, b) => a.code.localeCompare(b.code, "en"));
}

export function validateStoredCatalog(value: unknown): FiatCurrency[] {
  if (!Array.isArray(value) || !value.length || value.length > 1024)
    throw new Error("Invalid cached catalog.");
  const codes = new Set<string>();
  for (const row of value) {
    if (
      !row ||
      typeof row !== "object" ||
      typeof row.name !== "string" ||
      !row.name.trim() ||
      row.name.length > 256 ||
      row.name.includes("\0") ||
      fiatExponent(row.code) !== row.exponent ||
      codes.has(row.code)
    )
      throw new Error("Invalid cached currency.");
    codes.add(row.code);
  }
  return value
    .map((row) => ({ code: row.code, name: row.name, exponent: row.exponent }))
    .sort((a, b) => a.code.localeCompare(b.code, "en"));
}

export function parseRateCsv(
  text: string,
  base: string,
  quote: string,
  fetchedAt: string,
): { rate: string; date: string } {
  // The documented single-pair CSV format preserves original decimal lexemes.
  // Reject unsupported quoting, extra rows and wrong pairs rather than guessing.
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  if (lines.at(-1) === "") lines.pop();
  if (lines.length !== 2 || lines[0] !== "date,base,quote,rate")
    throw new Error("Invalid rate CSV.");
  const columns = lines[1]!.split(",");
  if (columns.length !== 4 || columns[1] !== base || columns[2] !== quote)
    throw new Error("Wrong rate pair.");
  const rate = columns[3]!;
  parseRate(rate);
  return { rate, date: sourceDate(columns[0], fetchedAt) };
}
