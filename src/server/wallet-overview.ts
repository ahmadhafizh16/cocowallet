import "server-only";
import { AccountDataError } from "@/features/accounts/errors";
import { readOverviewSnapshot } from "@/features/accounts/read";
import type { OverviewSnapshot } from "@/features/accounts/types";
import { readRecentFunding } from "@/features/funding/read";
import { assertBalanceMinor } from "@/features/money/money";
import type {
  UsdTotalView,
  WalletCurrency,
  WalletOverview,
} from "@/features/wallet/types";
import type { WalletDatabase } from "./db/connection";

function overviewCurrency(value: string): WalletCurrency {
  if (value === "USD" || value === "EUR" || value === "GBP") return value;
  // Do not drop a stored wallet or mislabel its flag while catalog UI is pending.
  throw new AccountDataError(
    "invalid_account_data",
    "This stored currency is not supported by the current overview.",
  );
}

export function toWalletOverview(snapshot: OverviewSnapshot): WalletOverview {
  const model: WalletOverview = {
    mode: "connected-readonly",
    activeAccountId: snapshot.activeAccountId,
    accounts: snapshot.accounts.map((account) => ({
      id: account.id,
      label:
        account.role === "main"
          ? "Main account"
          : `Destination ${account.id.slice(0, 8)}`,
      role: account.role,
      defaultCurrency: overviewCurrency(account.defaultCurrency),
    })),
    wallets: snapshot.wallets
      .map((wallet) => ({
        ...wallet,
        currency: overviewCurrency(wallet.currency),
      }))
      .sort(
        (left, right) =>
          ["USD", "EUR", "GBP"].indexOf(left.currency) -
          ["USD", "EUR", "GBP"].indexOf(right.currency),
      ),
    transactions: [],
  };
  const totals: [string, UsdTotalView][] = [];
  for (const account of snapshot.accounts) {
    const wallets = snapshot.wallets.filter(
      (wallet) => wallet.accountId === account.id,
    );
    // No valuation policy for destinations or nonzero foreign balances is invented.
    if (
      account.role !== "main" ||
      !wallets.length ||
      wallets.some(
        (wallet) => wallet.currency !== "USD" && wallet.balanceMinor !== "0",
      )
    ) {
      totals.push([account.id, { status: "unavailable" }]);
      continue;
    }
    const balance = wallets
      .filter((wallet) => wallet.currency === "USD")
      .reduce((sum, wallet) => sum + BigInt(wallet.balanceMinor), 0n);
    assertBalanceMinor(balance);
    totals.push([
      account.id,
      {
        status: "available",
        balanceMinor: balance.toString(),
      },
    ]);
  }
  // Account IDs are data, including '__proto__': never invoke object setters.
  model.usdTotals = Object.fromEntries(totals);
  return model;
}

export function getStoredWalletOverview(
  database: WalletDatabase,
): WalletOverview {
  return database.sqlite.transaction(() => ({
    ...toWalletOverview(readOverviewSnapshot(database)),
    mode: "connected-funding" as const,
    transactions: readRecentFunding(database),
  }))();
}
