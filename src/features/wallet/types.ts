/** Presentation contracts; never use browser state as an accounting authority. */
export type WalletCurrency = "USD" | "EUR" | "GBP";

export type WalletView = {
  id: string;
  accountId: string;
  currency: WalletCurrency;
  name: string;
  exponent: number;
  /** Decimal integer text keeps the server/client boundary JSON-safe. */
  balanceMinor: string;
};

export type AccountView = {
  id: string;
  label: string;
  role: "main" | "destination";
  defaultCurrency: WalletCurrency;
};

/** Recorded, fully valued USD totals supplied by a future history service.
 * Never infer these from today's wallets, local drafts, or missing FX rates. */
export type BalanceHistorySeries = {
  accountId: string;
  currency: "USD";
  exponent: 2;
  points: { recordedAt: string; balanceMinor: string }[];
};

export type WalletOverview = {
  mode: "interface-preview";
  accounts: AccountView[];
  activeAccountId: string;
  wallets: WalletView[];
  transactions: [];
  /** Absent means disconnected; an explicitly supplied empty series has no records. */
  balanceHistory?: BalanceHistorySeries[];
};

/** Honest first-run presentation, not database seeding or a balance response. */
export function createPreviewOverview(): WalletOverview {
  return {
    mode: "interface-preview",
    accounts: [
      {
        id: "main-account",
        label: "Main account",
        role: "main",
        defaultCurrency: "USD",
      },
    ],
    activeAccountId: "main-account",
    wallets: [
      {
        id: "preview-usd",
        accountId: "main-account",
        currency: "USD",
        name: "US dollar",
        exponent: 2,
        balanceMinor: "0",
      },
      {
        id: "preview-eur",
        accountId: "main-account",
        currency: "EUR",
        name: "Euro",
        exponent: 2,
        balanceMinor: "0",
      },
      {
        id: "preview-gbp",
        accountId: "main-account",
        currency: "GBP",
        name: "British pound",
        exponent: 2,
        balanceMinor: "0",
      },
    ],
    transactions: [],
  };
}
