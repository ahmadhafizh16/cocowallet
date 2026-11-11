import { assertBalanceMinor, formatAmount } from "../money/money";
import type { WalletCurrency, WalletView } from "./types";

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
export function walletBalance(wallet: WalletView): bigint | null {
  try {
    if (typeof wallet.balanceMinor !== "string") return null;
    if (!/^(?:0|[1-9][0-9]{0,18})(?![\s\S])/u.test(wallet.balanceMinor))
      return null;
    const balance = BigInt(wallet.balanceMinor);
    assertBalanceMinor(balance);
    formatAmount(balance, wallet.exponent);
    return balance;
  } catch {
    return null;
  }
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
