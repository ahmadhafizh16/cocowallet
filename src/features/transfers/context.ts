import type { WalletDatabase } from "../../server/db/connection";
import { readWalletBalance } from "../journal/balances";
import { MAX_MINOR, parseAmount } from "../money/money";
import { currencyMetadata } from "../quotes/context";
import { fiatExponent } from "../rates/validation";
import { TransferError, type TransferRequest } from "./contracts";

/** Read-only context resolution. Called again after acquiring the writer; this
 * creates no accounts/wallets and never fetches provider data. */
export function transferContext(
  database: WalletDatabase,
  input: TransferRequest,
  checkFunds = true,
) {
  const source = database.sqlite
    .prepare<
      [string],
      { account_id: string; currency_code: string; role: string }
    >(
      "SELECT w.account_id,w.currency_code,a.role FROM wallets w LEFT JOIN accounts a ON a.id=w.account_id WHERE w.id=?",
    )
    .get(input.sourceWalletId);
  if (!source) throw new TransferError("SOURCE_WALLET_NOT_FOUND");
  if (source.role === "destination") throw new TransferError("INSPECT_ONLY");
  if (source.role !== "main") throw new Error("Invalid source role.");
  if (source.account_id === input.recipientAccountId)
    throw new TransferError("INVALID_RECIPIENT");
  const sourceCurrency = currencyMetadata(database, source.currency_code);
  if (!sourceCurrency) throw new Error("Missing source metadata.");
  const amountMinor = parseAmount(input.amount, sourceCurrency.exponent);
  const sourceBefore = readWalletBalance(database, input.sourceWalletId);
  if (checkFunds && sourceBefore < amountMinor)
    throw new TransferError("INSUFFICIENT_FUNDS");
  const recipient = database.sqlite
    .prepare<[string], { role: string; default_currency: string }>(
      "SELECT role,default_currency FROM accounts WHERE id=?",
    )
    .get(input.recipientAccountId);
  if (recipient && recipient.role !== "destination")
    throw new TransferError("INVALID_RECIPIENT");
  if (!recipient && !input.recipientDefaultCurrency)
    throw new TransferError("RECIPIENT_DEFAULT_REQUIRED");
  if (
    recipient &&
    input.recipientDefaultCurrency &&
    recipient.default_currency !== input.recipientDefaultCurrency
  )
    throw new TransferError("RECIPIENT_CONTEXT_CHANGED");
  const defaultCurrency =
    recipient?.default_currency ?? input.recipientDefaultCurrency!;
  if (recipient) fiatExponent(defaultCurrency); // Invalid stored metadata is unavailable, not a client error.
  try {
    fiatExponent(defaultCurrency);
    if (input.targetCurrency) fiatExponent(input.targetCurrency);
  } catch {
    throw new TransferError("INVALID_TARGET_CURRENCY");
  }
  const defaultMetadata = currencyMetadata(database, defaultCurrency);
  if (recipient && !defaultMetadata)
    throw new Error("Missing recipient metadata.");
  const targetCurrency = input.targetCurrency ?? defaultCurrency;
  const crossCurrency = source.currency_code !== targetCurrency;
  if (crossCurrency && !input.quoteId)
    throw new TransferError("FX_QUOTE_REQUIRED");
  if (!crossCurrency && input.quoteId)
    throw new TransferError("FX_QUOTE_NOT_REQUIRED");
  const targetMetadata = currencyMetadata(database, targetCurrency);
  const targetWallet = database.sqlite
    .prepare<[string, string], { id: string }>(
      "SELECT id FROM wallets WHERE account_id=? AND currency_code=?",
    )
    .get(input.recipientAccountId, targetCurrency);
  const targetBefore = targetWallet
    ? readWalletBalance(database, targetWallet.id)
    : 0n;
  return {
    source: {
      ...sourceCurrency,
      accountId: source.account_id,
      walletId: input.sourceWalletId,
    },
    amountMinor,
    sourceBefore,
    recipientExisted: !!recipient,
    defaultCurrency,
    defaultMetadata,
    targetCurrency,
    targetMetadata,
    targetWalletId: targetWallet?.id,
    targetBefore,
    crossCurrency,
  };
}
export function assertTransferTargetBounds(before: bigint, credit: bigint) {
  if (before + credit > MAX_MINOR)
    throw new TransferError("BALANCE_OUT_OF_RANGE");
}
