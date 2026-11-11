import { assertBalanceMinor, formatAmount } from "../money/money";
import type { UsdTotalView, WalletCurrency, WalletView } from "./types";

export const CURRENCY_SYMBOLS: Record<WalletCurrency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export function walletsForAccount(
  wallets: WalletView[],
  accountId: string | undefined,
): WalletView[] {
  return accountId
    ? wallets.filter((wallet) => wallet.accountId === accountId)
    : [];
}

/** Invalid integration data is unavailable, never silently a zero balance. */
function balanceMinor(value: unknown, exponent: number): bigint | null {
  try {
    if (typeof value !== "string") return null;
    if (!/^(?:0|[1-9][0-9]{0,18})(?![\s\S])/u.test(value)) return null;
    const balance = BigInt(value);
    assertBalanceMinor(balance);
    formatAmount(balance, exponent);
    return balance;
  } catch {
    return null;
  }
}

export function walletBalance(wallet: WalletView): bigint | null {
  return balanceMinor(wallet.balanceMinor, wallet.exponent);
}

export function displayUsdTotal(
  total: UsdTotalView | undefined,
): string | null {
  if (total?.status !== "available") return null;
  const minor = balanceMinor(total.balanceMinor, 2);
  return minor === null ? null : `$${displayAmount(minor, 2)}`;
}

export function displayAmount(minor: bigint, exponent: number): string {
  const [integer = "", fraction] = formatAmount(minor, exponent).split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/gu, ",");
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

export function displayBalance(wallet: WalletView): string {
  const balance = walletBalance(wallet);
  return balance === null
    ? "Unavailable"
    : displayAmount(balance, wallet.exponent);
}

/** Zero needs no FX rate; all nonzero cross-currency valuations need a service. */
export function hasZeroTotal(wallets: WalletView[]): boolean {
  return (
    wallets.length > 0 &&
    wallets.every((wallet) => walletBalance(wallet) === 0n)
  );
}
