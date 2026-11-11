import "server-only";
import { AccountDataError } from "@/features/accounts/errors";
import { readOverviewSnapshot } from "@/features/accounts/read";
import type { OverviewSnapshot } from "@/features/accounts/types";
import { readRecentFunding } from "@/features/funding/read";
import { readRecentConversions } from "@/features/conversions/read";
import { fiatExponent } from "@/features/rates/validation";
import { assertBalanceMinor } from "@/features/money/money";
import type {
  UsdTotalView,
  WalletCurrency,
  WalletOverview,
} from "@/features/wallet/types";
import type { WalletDatabase } from "./db/connection";

function overviewCurrency(value: string): WalletCurrency {
  try {
    fiatExponent(value);
    return value;
  } catch {
    throw new AccountDataError(
      "invalid_account_data",
      "This stored currency is not supported by the current overview.",
    );
  }
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
          (["USD", "EUR", "GBP"].includes(left.currency)
            ? ["USD", "EUR", "GBP"].indexOf(left.currency)
            : 3) -
            (["USD", "EUR", "GBP"].includes(right.currency)
              ? ["USD", "EUR", "GBP"].indexOf(right.currency)
              : 3) || left.currency.localeCompare(right.currency),
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
    conversionEnabled: true,
    transactions: [
      ...readRecentFunding(database),
      ...readRecentConversions(database),
    ]
      .sort(
        (a, b) =>
          b.createdAt.localeCompare(a.createdAt) ||
          b.transactionId.localeCompare(a.transactionId),
      )
      .slice(0, 50),
  }))();
}
