export type AccountRecord = {
  id: string;
  role: "main" | "destination";
  defaultCurrency: string;
  createdAt: string;
  inspectOnly: boolean;
};

export type WalletRecord = {
  id: string;
  accountId: string;
  currency: string;
  name: string;
  exponent: number;
  balanceMinor: string;
};

export type AccountWallets = {
  account: AccountRecord;
  wallets: WalletRecord[];
};

export type OverviewSnapshot = {
  activeAccountId: string;
  accounts: AccountRecord[];
  wallets: WalletRecord[];
};
