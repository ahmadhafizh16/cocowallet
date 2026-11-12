import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { openDatabase } from "../src/server/db/connection";
import { migrateDatabase } from "../src/server/db/migrate";
import { seedMainAccount } from "../src/features/accounts/seed";
import { readAccountWallets } from "../src/features/accounts/read";
import { submitFunding } from "../src/features/funding/service";
import { getPortfolioView } from "../src/features/portfolio/service";

const filename = process.env.DATABASE_PATH;
if (
  process.env.WALLET_PORTFOLIO_SMOKE !== "1" ||
  !filename ||
  !/^\/tmp\/opencode\/portfolio-smoke-[0-9]+\.sqlite$/u.test(filename) ||
  existsSync(filename)
)
  throw new Error(
    "Live portfolio checks require a new guarded isolated database, never the ordinary wallet.",
  );
async function run() {
  const database = openDatabase(filename!);
  try {
    migrateDatabase(database);
    const accountId = seedMainAccount(database);
    const euro = readAccountWallets(database, accountId).wallets.find(
      (w) => w.currency === "EUR",
    )!;
    assert.equal(
      submitFunding(database, "deposit", randomUUID(), {
        walletId: euro.id,
        amount: "1.00",
        provider: "demo_bank",
      }).status,
      200,
    );
    const fresh = await getPortfolioView(database, accountId);
    assert.equal(fresh.total.status, "available");
    if (fresh.total.status !== "available")
      throw new Error("Live valuation unavailable.");
    assert.equal(fresh.total.source, "fresh");
    assert.equal(fresh.total.rates[0]!.base, "EUR");
    assert.equal(fresh.total.rates[0]!.quote, "USD");
    const offline = {
      catalog: async () => {
        throw new Error("intentionally offline");
      },
      rate: async () => {
        throw new Error("intentionally offline");
      },
    };
    const cached = await getPortfolioView(database, accountId, {
      client: offline,
    });
    assert.equal(cached.total.status, "available");
    if (cached.total.status !== "available")
      throw new Error("Eligible fallback unavailable.");
    assert.equal(cached.total.source, "cached");
    assert.equal(cached.total.balanceMinor, fresh.total.balanceMinor);
    assert.equal(cached.total.rates[0]!.rate, fresh.total.rates[0]!.rate);
    assert.equal(
      cached.total.rates[0]!.fetchedAt,
      fresh.total.rates[0]!.fetchedAt,
    );
    assert.equal(cached.total.rates[0]!.date, fresh.total.rates[0]!.date);
    assert.deepEqual(cached.history, fresh.history);
    console.log(
      JSON.stringify(
        {
          database: filename,
          isolated: true,
          totalUsdMinor: fresh.total.balanceMinor,
          rates: fresh.total.rates,
          offlineFallback: cached.total.source,
          snapshots: fresh.history.points.length,
          normalWalletTouched: false,
        },
        null,
        2,
      ),
    );
  } finally {
    database.close();
  }
}
void run().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Live portfolio check failed.",
  );
  process.exitCode = 1;
});
