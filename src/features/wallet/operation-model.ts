import { MAX_MINOR, MoneyError, parseAmount } from "../money/money";
import { walletBalance } from "./presentation";
import type { AccountView, WalletCurrency, WalletView } from "./types";

export type Operation = "deposit" | "withdraw" | "convert" | "transfer";
export type OperationDraft = {
  amount: string;
  currency: WalletCurrency;
  targetCurrency: WalletCurrency | "";
  recipient: string;
  provider: string;
};
export type OperationErrors = Partial<
  Record<
    | "amount"
    | "currency"
    | "targetCurrency"
    | "recipient"
    | "provider"
    | "form",
    string
  >
>;
export type OperationReview = {
  operation: Operation;
  accountId: string;
  minor: bigint;
  wallet: WalletView;
  targetCurrency: WalletCurrency;
  recipient: string;
  provider: string;
};

export const PROVIDERS = [
  { code: "demo_bank", label: "Demo Bank" },
  { code: "community_bank", label: "Community Bank" },
  { code: "crypto_gateway", label: "Crypto Gateway" },
] as const;

export const OPERATION_LABELS: Record<Operation, string> = {
  deposit: "Deposit",
  withdraw: "Withdraw",
  convert: "Convert",
  transfer: "Transfer",
};

export const OPERATION_NOUNS: Record<Operation, string> = {
  deposit: "deposit",
  withdraw: "withdrawal",
  convert: "conversion",
  transfer: "transfer",
};

export function createDraft(
  wallets: WalletView[],
  currency: WalletCurrency,
): OperationDraft {
  const source =
    wallets.find((wallet) => wallet.currency === currency)?.currency ??
    wallets[0]?.currency ??
    currency;
  return {
    amount: "",
    currency: source,
    targetCurrency:
      wallets.find((wallet) => wallet.currency !== source)?.currency ?? "",
    recipient: "",
    provider: "demo_bank",
  };
}

export function validateOperation({
  operation,
  draft,
  account,
  wallets,
}: {
  operation: Operation;
  draft: OperationDraft;
  account: AccountView | undefined;
  wallets: WalletView[];
}): { errors: OperationErrors; review: OperationReview | null } {
  const errors: OperationErrors = {};
  if (account?.role !== "main") {
    return {
      errors: {
        form: "This account is inspect-only. Choose the main account to explore money actions.",
      },
      review: null,
    };
  }

  const wallet = wallets.find(
    (item) => item.accountId === account.id && item.currency === draft.currency,
  );
  if (!wallet) errors.currency = "Choose an available currency wallet.";

  let minor: bigint | null = null;
  if (wallet) {
    try {
      minor = parseAmount(draft.amount, wallet.exponent);
    } catch (error) {
      errors.amount =
        draft.amount === ""
          ? "Enter an amount."
          : /^(?:0|0\.0+)(?![\s\S])/u.test(draft.amount)
            ? "Enter an amount greater than 0."
            : error instanceof MoneyError && error.code === "invalid_precision"
              ? `Use no more than ${wallet.exponent} decimal places for ${wallet.currency}.`
              : error instanceof MoneyError &&
                  error.code === "amount_out_of_range"
                ? "Enter a positive amount within the supported range."
                : "Use a decimal amount, for example 12.50.";
    }

    const balance = walletBalance(wallet);
    if (balance === null) {
      errors.amount =
        "The source balance is unavailable. A connected balance service is needed to continue.";
    } else if (minor !== null && operation !== "deposit" && minor > balance) {
      errors.amount =
        balance === 0n
          ? "Insufficient preview balance. This wallet has no funds, and deposit submission is not connected."
          : "This amount exceeds the available preview balance. Enter a smaller amount.";
    } else if (
      minor !== null &&
      operation === "deposit" &&
      balance + minor > MAX_MINOR
    ) {
      errors.amount =
        "This amount would exceed the wallet’s supported balance. Enter a smaller amount.";
    }
  }

  if (
    (operation === "deposit" || operation === "withdraw") &&
    !PROVIDERS.some((provider) => provider.code === draft.provider)
  ) {
    errors.provider = "Choose one of the fictional providers.";
  }
  if (operation === "transfer") {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,127}(?![\s\S])/u.test(draft.recipient)) {
      errors.recipient =
        "Enter an account ID of 2–128 letters, digits, hyphens, or underscores.";
    } else if (draft.recipient === account.id) {
      errors.recipient =
        "Enter a different simulated account ID, not this account’s own ID.";
    }
  }
  if (
    operation === "convert" &&
    (!wallets.some(
      (item) =>
        item.accountId === account.id && item.currency === draft.targetCurrency,
    ) ||
      draft.targetCurrency === draft.currency)
  ) {
    errors.targetCurrency =
      draft.targetCurrency === ""
        ? "Choose a receiving currency."
        : "Choose a different available target currency.";
  }

  if (Object.keys(errors).length || !wallet || minor === null)
    return { errors, review: null };
  return {
    errors,
    review: {
      operation,
      accountId: account.id,
      minor,
      wallet,
      targetCurrency: draft.targetCurrency || wallet.currency,
      recipient: draft.recipient,
      provider: draft.provider,
    },
  };
}
