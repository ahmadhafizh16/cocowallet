import { openDatabase } from "../src/server/db/connection";
import { migrateDatabase } from "../src/server/db/migrate";
import {
  getCurrencyCatalog,
  getReferenceRate,
} from "../src/features/rates/service";

// Optional live-provider diagnostic, never part of deterministic checks and
// never allowed to use the configured persistent wallet database.
if (
  process.env.WALLET_RATES_SMOKE !== "1" ||
  process.env.DATABASE_PATH !== "/tmp/opencode/rates-smoke.sqlite"
)
  throw new Error(
    "An explicitly isolated live-rate smoke database is required.",
  );
async function run() {
  const database = openDatabase("/tmp/opencode/rates-smoke.sqlite");
  try {
    migrateDatabase(database);
    const catalog = await getCurrencyCatalog(database);
    const fresh = await getReferenceRate(database, "USD", "EUR");
    const offline = {
      catalog: async () => {
        throw new Error("Intentional offline simulation");
      },
      rate: async () => {
        throw new Error("Intentional offline simulation");
      },
    };
    const fallback = await getReferenceRate(database, "USD", "EUR", {
      client: offline,
    });
    if (
      fresh.source !== "fresh" ||
      fallback.source !== "cached" ||
      fallback.rate !== fresh.rate ||
      fallback.fetchedAt !== fresh.fetchedAt
    )
      throw new Error("Live-rate fallback verification failed.");
    const transactions = database.sqlite
      .prepare("SELECT COUNT(*) AS n FROM transactions")
      .get();
    console.log(
      JSON.stringify(
        {
          catalogSource: catalog.source,
          fiatCurrencies: catalog.currencies.length,
          fresh,
          fallback,
          transactions,
        },
        (_key, value: unknown) =>
          typeof value === "bigint" ? value.toString() : value,
      ),
    );
  } finally {
    database.close();
  }
}
void run().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Live reference check failed.",
  );
  process.exitCode = 1;
});
