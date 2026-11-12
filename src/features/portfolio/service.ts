import "server-only";
import type { WalletDatabase } from "../../server/db/connection";
import { readAccountWallets } from "../accounts/read";
import type { WalletRecord } from "../accounts/types";
import { assertBalanceMinor } from "../money/money";
import { portfolioUsdMinor } from "./usd-value";
import { getCurrencyCatalog, getReferenceRate } from "../rates/service";
import {
  createFrankfurterClient,
  type FrankfurterClient,
} from "../rates/frankfurter";
import type { CurrencyCatalog, ReferenceRate } from "../rates/contracts";
import { cacheEligible, timestamp } from "../rates/validation";
import { portfolioFingerprint, type PortfolioView } from "./contracts";

type Dependencies = { client?: FrankfurterClient; now?: () => number };
export type PortfolioObservation = {
  accountId: string;
  revision: string;
  observedAt: string;
  wallets: WalletRecord[];
};

/** Capture all wallet amounts and the committed ledger revision in one snapshot.
 * No network, SQL monetary aggregation, current-rate backfill or money write. */
export function capturePortfolio(
  database: WalletDatabase,
  accountId: string,
  now = Date.now,
): PortfolioObservation {
  return database.sqlite.transaction(() => {
    const { wallets } = readAccountWallets(database, accountId);
    const row = database.sqlite
      .prepare<[string], { revision: bigint }>(
        `SELECT COALESCE(MAX(j.rowid),0) AS revision FROM journal_entries j JOIN wallets w ON w.id=j.wallet_id WHERE w.account_id=?`,
      )
      .get(accountId)!;
    return {
      accountId,
      revision: row.revision.toString(),
      observedAt: timestamp(now()),
      wallets,
    };
  })();
}

export function readPortfolioSeries(
  database: WalletDatabase,
  accountId: string,
): PortfolioView["history"] {
  const rows = database.sqlite
    .prepare<
      [string],
      { recorded_at: string; total_usd_minor: bigint; balance_revision: string }
    >(
      `SELECT recorded_at,total_usd_minor,balance_revision FROM (SELECT recorded_at,total_usd_minor,balance_revision FROM portfolio_snapshots WHERE account_id=? ORDER BY recorded_at DESC, CAST(balance_revision AS INTEGER) DESC LIMIT 240) ORDER BY recorded_at ASC, CAST(balance_revision AS INTEGER) ASC`,
    )
    .all(accountId);
  const byTime = new Map<string, string>();
  for (const row of rows) {
    if (!/^(0|[1-9][0-9]*)$/u.test(row.balance_revision))
      throw new Error("Invalid portfolio revision.");
    assertBalanceMinor(BigInt(row.balance_revision));
    if (timestamp(Date.parse(row.recorded_at)) !== row.recorded_at)
      throw new Error("Invalid portfolio history time.");
    assertBalanceMinor(row.total_usd_minor);
    // Multiple observations in one millisecond occupy the same x coordinate.
    byTime.set(row.recorded_at, row.total_usd_minor.toString());
  }
  return {
    accountId,
    currency: "USD",
    exponent: 2,
    points: Array.from(byTime, ([recordedAt, balanceMinor]) => ({
      recordedAt,
      balanceMinor,
    })),
  };
}

export async function valuePortfolio(
  database: WalletDatabase,
  observation: PortfolioObservation,
  input: Dependencies = {},
): Promise<PortfolioView["total"]> {
  const now = input.now ?? Date.now;
  const started = performance.now();
  const bounded = {
    ...input,
    client: input.client ?? createFrankfurterClient({ now, timeoutMs: 2500 }),
  };
  const foreign = observation.wallets.filter(
    (w) => w.currency !== "USD" && BigInt(w.balanceMinor) !== 0n,
  );
  const rates: ReferenceRate[] = [];
  if (foreign.length) {
    let catalog: CurrencyCatalog | null;
    try {
      catalog = await getCurrencyCatalog(database, bounded);
    } catch {
      catalog = null;
    }
    // Bound concurrent upstream work; one shared fresh-first catalog per valuation.
    for (let i = 0; i < foreign.length; i += 4) {
      if (performance.now() - started >= 8000)
        throw new Error("Portfolio valuation timed out.");
      rates.push(
        ...(await Promise.all(
          foreign.slice(i, i + 4).map((w) =>
            getReferenceRate(database, w.currency, "USD", {
              ...bounded,
              catalog,
            }),
          ),
        )),
      );
    }
    if (rates.some((rate) => !cacheEligible(rate.fetchedAt, now())))
      throw new Error("Expired portfolio rate.");
  }
  let total = 0n;
  for (const wallet of observation.wallets) {
    const minor = BigInt(wallet.balanceMinor);
    assertBalanceMinor(minor);
    if (wallet.currency === "USD") total += minor;
    else if (minor !== 0n) {
      const rate = rates.find(
        (r) => r.base === wallet.currency && r.quote === "USD",
      );
      if (!rate) throw new Error("Missing portfolio rate.");
      total += portfolioUsdMinor({
        sourceMinor: minor,
        sourceExponent: wallet.exponent,
        rate: rate.rate,
      });
    }
    assertBalanceMinor(total);
  }
  const valuedAt = timestamp(now());
  if (valuedAt < observation.observedAt)
    throw new Error("Portfolio clock moved backwards.");
  database.sqlite
    .prepare(
      `INSERT INTO portfolio_snapshots(account_id,balance_revision,recorded_at,valued_at,total_usd_minor,balances,rates) VALUES (?,?,?,?,?,?,?) ON CONFLICT(account_id,balance_revision) DO NOTHING`,
    )
    .run(
      observation.accountId,
      observation.revision,
      observation.observedAt,
      valuedAt,
      total,
      JSON.stringify(observation.wallets),
      JSON.stringify(rates),
    );
  return {
    status: "available",
    balanceMinor: total.toString(),
    source: rates.length
      ? rates.some((r) => r.source === "cached")
        ? "cached"
        : "fresh"
      : "balances",
    rates,
  };
}

export async function getPortfolioView(
  database: WalletDatabase,
  accountId: string,
  input: Dependencies = {},
): Promise<PortfolioView> {
  const observation = capturePortfolio(database, accountId, input.now);
  let total: PortfolioView["total"];
  try {
    total = await valuePortfolio(database, observation, input);
    const current = capturePortfolio(database, accountId, input.now);
    if (
      current.revision !== observation.revision ||
      portfolioFingerprint(current.wallets) !==
        portfolioFingerprint(observation.wallets)
    )
      total = { status: "unavailable" };
  } catch {
    total = { status: "unavailable" };
  }
  return {
    accountId,
    balances: observation.wallets,
    observedAt: observation.observedAt,
    total,
    history: readPortfolioSeries(database, accountId),
  };
}
