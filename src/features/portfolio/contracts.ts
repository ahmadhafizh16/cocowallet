import type { WalletRecord } from "../accounts/types";
import type { ReferenceRate } from "../rates/contracts";
import type { BalanceHistorySeries } from "../wallet/types";

export type PortfolioView = {
  accountId: string;
  balances: WalletRecord[];
  observedAt: string;
  total:
    | {
        status: "available";
        balanceMinor: string;
        source: "balances" | "fresh" | "cached";
        rates: ReferenceRate[];
      }
    | { status: "unavailable" };
  history: BalanceHistorySeries;
};

/** Stable exact context binding: never trust a total for a different wallet snapshot. */
export function portfolioFingerprint(
  wallets: Pick<
    WalletRecord,
    "id" | "currency" | "exponent" | "balanceMinor"
  >[],
): string {
  return JSON.stringify(
    wallets
      .map((w) => [w.id, w.currency, w.exponent, w.balanceMinor])
      .sort((a, b) =>
        String(a[0]) < String(b[0]) ? -1 : String(a[0]) > String(b[0]) ? 1 : 0,
      ),
  );
}
