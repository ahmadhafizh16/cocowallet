import "server-only";
import type { WalletDatabase } from "../../server/db/connection";
import { parseRate } from "../money/money";
import { createFrankfurterClient, type FrankfurterClient } from "./frankfurter";
import {
  RateDataError,
  type CurrencyCatalog,
  type ReferenceRate,
} from "./contracts";
import {
  cacheEligible,
  fiatExponent,
  sourceDate,
  timestamp,
  validateStoredCatalog,
} from "./validation";

type Dependencies = {
  client?: FrankfurterClient;
  now?: () => number;
  catalog?: CurrencyCatalog | null;
};
function dependencies(database: WalletDatabase, input: Dependencies) {
  if (database.sqlite.inTransaction)
    throw new RateDataError("FX_STORAGE_UNAVAILABLE", 503);
  const now = input.now ?? Date.now;
  timestamp(now());
  return { now, client: input.client ?? createFrankfurterClient({ now }) };
}

export async function getCurrencyCatalog(
  database: WalletDatabase,
  input: Dependencies = {},
): Promise<CurrencyCatalog> {
  const { now, client } = dependencies(database, input);
  let fresh;
  try {
    const response = await client.catalog();
    fresh = {
      currencies: validateStoredCatalog(response.currencies),
      fetchedAt: response.fetchedAt,
    };
    if (!cacheEligible(fresh.fetchedAt, now()))
      throw new Error("Invalid fetched timestamp.");
  } catch {
    try {
      const row = database.sqlite
        .prepare<[], { currencies: string; fetched_at: string }>(
          "SELECT currencies, fetched_at FROM fx_catalog_cache WHERE id = 'frankfurter-v2'",
        )
        .get();
      if (!row || !cacheEligible(row.fetched_at, now()))
        throw new Error("No eligible catalog.");
      return {
        provider: "frankfurter",
        source: "cached",
        fetchedAt: row.fetched_at,
        currencies: validateStoredCatalog(JSON.parse(row.currencies)),
      };
    } catch {
      throw new RateDataError("CURRENCY_CATALOG_UNAVAILABLE", 503);
    }
  }
  if (database.sqlite.inTransaction)
    throw new RateDataError("FX_STORAGE_UNAVAILABLE", 503);
  try {
    database.sqlite
      .prepare(
        `INSERT INTO fx_catalog_cache (id,currencies,fetched_at) VALUES ('frankfurter-v2',?,?)
      ON CONFLICT(id) DO UPDATE SET currencies=excluded.currencies,fetched_at=excluded.fetched_at
      WHERE excluded.fetched_at >= fx_catalog_cache.fetched_at`,
      )
      .run(JSON.stringify(fresh.currencies), fresh.fetchedAt);
  } catch {
    throw new RateDataError("FX_STORAGE_UNAVAILABLE", 503);
  }
  return { provider: "frankfurter", source: "fresh", ...fresh };
}

function cachedRate(
  database: WalletDatabase,
  base: string,
  quote: string,
  now: () => number,
): ReferenceRate {
  try {
    const row = database.sqlite
      .prepare<
        [string, string],
        { rate: string; source_date: string; fetched_at: string }
      >(
        "SELECT rate,source_date,fetched_at FROM fx_rate_cache WHERE base = ? AND quote = ?",
      )
      .get(base, quote);
    if (!row || !cacheEligible(row.fetched_at, now()))
      throw new Error("No eligible pair.");
    parseRate(row.rate);
    sourceDate(row.source_date, row.fetched_at);
    return {
      provider: "frankfurter",
      source: "cached",
      base,
      quote,
      rate: row.rate,
      date: row.source_date,
      fetchedAt: row.fetched_at,
    };
  } catch {
    throw new RateDataError("FX_RATE_UNAVAILABLE", 503);
  }
}

/** Always fetch first. Cache is a fallback, never a synthesized cross/reciprocal. */
export async function getReferenceRate(
  database: WalletDatabase,
  base: string,
  quote: string,
  input: Dependencies = {},
): Promise<ReferenceRate> {
  const { now, client } = dependencies(database, input);
  try {
    fiatExponent(base);
    fiatExponent(quote);
    if (base === quote) throw new Error("Same pair.");
  } catch {
    throw new RateDataError("INVALID_CURRENCY_PAIR", 400);
  }
  let catalog: CurrencyCatalog;
  try {
    if (input.catalog === null)
      throw new RateDataError("CURRENCY_CATALOG_UNAVAILABLE", 503);
    catalog =
      input.catalog ?? (await getCurrencyCatalog(database, { client, now }));
    if (!cacheEligible(catalog.fetchedAt, now()))
      throw new RateDataError("CURRENCY_CATALOG_UNAVAILABLE", 503);
  } catch (error) {
    if (
      !(error instanceof RateDataError) ||
      error.code !== "CURRENCY_CATALOG_UNAVAILABLE"
    )
      throw error;
    // This row is prior proof of a validated fiat pair, independent of today's
    // catalog availability. It cannot authorize adding an unlisted new wallet.
    return cachedRate(database, base, quote, now);
  }
  if (
    ![base, quote].every((code) =>
      catalog.currencies.some((c) => c.code === code),
    )
  )
    throw new RateDataError("UNSUPPORTED_CURRENCY", 400);
  if (database.sqlite.inTransaction)
    throw new RateDataError("FX_STORAGE_UNAVAILABLE", 503);
  let fresh;
  try {
    fresh = await client.rate(base, quote);
    parseRate(fresh.rate);
    sourceDate(fresh.date, fresh.fetchedAt);
    if (!cacheEligible(fresh.fetchedAt, now()))
      throw new Error("Invalid fetched timestamp.");
  } catch {
    return cachedRate(database, base, quote, now);
  }
  if (database.sqlite.inTransaction)
    throw new RateDataError("FX_STORAGE_UNAVAILABLE", 503);
  try {
    database.sqlite
      .prepare(
        `INSERT INTO fx_rate_cache (base,quote,rate,source_date,fetched_at) VALUES (?,?,?,?,?)
      ON CONFLICT(base,quote) DO UPDATE SET rate=excluded.rate,source_date=excluded.source_date,fetched_at=excluded.fetched_at
      WHERE excluded.fetched_at > fx_rate_cache.fetched_at OR (excluded.fetched_at = fx_rate_cache.fetched_at AND excluded.source_date >= fx_rate_cache.source_date)`,
      )
      .run(base, quote, fresh.rate, fresh.date, fresh.fetchedAt);
  } catch {
    throw new RateDataError("FX_STORAGE_UNAVAILABLE", 503);
  }
  return { provider: "frankfurter", source: "fresh", base, quote, ...fresh };
}
