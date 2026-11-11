import type { WalletDatabase } from "../../server/db/connection";
import { readWalletBalance } from "../journal/balances";
import { parseAmount, MAX_MINOR } from "../money/money";
import { fiatExponent } from "../rates/validation";
import { QuoteError, type QuoteRequest } from "./contracts";

export type CurrencyMetadata = {
  currency: string;
  name: string;
  exponent: number;
};
export function currencyMetadata(
  database: WalletDatabase,
  currency: string,
): CurrencyMetadata | undefined {
  const exponent = fiatExponent(currency);
  const row = database.sqlite
    .prepare<[string], { name: string; minor_unit: bigint }>(
      "SELECT name,minor_unit FROM currencies WHERE code = ?",
    )
    .get(currency);
  if (!row) return undefined;
  if (
    row.minor_unit !== BigInt(exponent) ||
    typeof row.name !== "string" ||
    !row.name.trim() ||
    row.name.length > 256 ||
    row.name.includes("\0")
  )
    throw new QuoteError("QUOTE_DATA_UNAVAILABLE", 503);
  return { currency, name: row.name, exponent };
}

export function quoteContext(
  database: WalletDatabase,
  request: QuoteRequest,
  targetMinor?: bigint,
) {
  const source = database.sqlite
    .prepare<
      [string],
      { id: string; account_id: string; currency_code: string; role: string }
    >(
      `SELECT w.id,w.account_id,w.currency_code,a.role FROM wallets w LEFT JOIN accounts a ON a.id=w.account_id WHERE w.id=?`,
    )
    .get(request.sourceWalletId);
  if (!source) throw new QuoteError("SOURCE_WALLET_NOT_FOUND", 404);
  if (source.role === "destination") throw new QuoteError("INSPECT_ONLY", 409);
  if (source.role !== "main")
    throw new QuoteError("QUOTE_DATA_UNAVAILABLE", 503);
  const sourceCurrency = currencyMetadata(database, source.currency_code);
  if (!sourceCurrency) throw new QuoteError("QUOTE_DATA_UNAVAILABLE", 503);
  const amountMinor = parseAmount(request.amount, sourceCurrency.exponent);
  if (readWalletBalance(database, source.id) < amountMinor)
    throw new QuoteError("INSUFFICIENT_FUNDS", 409);
  fiatExponent(request.targetCurrency);
  if (source.currency_code === request.targetCurrency)
    throw new QuoteError(
      request.operation === "transfer"
        ? "FX_QUOTE_NOT_REQUIRED"
        : "INVALID_TARGET_CURRENCY",
      400,
    );
  let targetAccountId = source.account_id;
  let recipient:
    | { accountId: string; defaultCurrency: string; existed: boolean }
    | undefined;
  if (request.operation === "transfer") {
    if (request.recipientAccountId === source.account_id)
      throw new QuoteError("INVALID_RECIPIENT", 400);
    const stored = database.sqlite
      .prepare<[string], { role: string; default_currency: string }>(
        "SELECT role,default_currency FROM accounts WHERE id=?",
      )
      .get(request.recipientAccountId!);
    if (stored && stored.role !== "destination")
      throw new QuoteError("INVALID_RECIPIENT", 400);
    if (!stored && !request.recipientDefaultCurrency)
      throw new QuoteError("RECIPIENT_DEFAULT_REQUIRED", 400);
    if (
      stored &&
      request.recipientDefaultCurrency &&
      stored.default_currency !== request.recipientDefaultCurrency
    )
      throw new QuoteError("RECIPIENT_CONTEXT_CHANGED", 409);
    const defaultCurrency =
      stored?.default_currency ?? request.recipientDefaultCurrency!;
    fiatExponent(defaultCurrency);
    if (stored && !currencyMetadata(database, defaultCurrency))
      throw new QuoteError("QUOTE_DATA_UNAVAILABLE", 503);
    recipient = {
      accountId: request.recipientAccountId!,
      defaultCurrency,
      existed: !!stored,
    };
    targetAccountId = recipient.accountId;
  }
  const targetCurrency = currencyMetadata(database, request.targetCurrency);
  const targetWallet = database.sqlite
    .prepare<[string, string], { id: string }>(
      "SELECT id FROM wallets WHERE account_id=? AND currency_code=?",
    )
    .get(targetAccountId, request.targetCurrency);
  if (
    targetWallet &&
    targetMinor !== undefined &&
    readWalletBalance(database, targetWallet.id) + targetMinor > MAX_MINOR
  )
    throw new QuoteError("BALANCE_OUT_OF_RANGE", 409);
  return {
    source: {
      ...sourceCurrency,
      walletId: source.id,
      accountId: source.account_id,
    },
    amountMinor,
    targetAccountId,
    targetCurrency,
    targetWalletId: targetWallet?.id,
    recipient,
  };
}

export function sameQuoteContext(
  before: ReturnType<typeof quoteContext>,
  after: ReturnType<typeof quoteContext>,
): boolean {
  return (
    before.source.accountId === after.source.accountId &&
    before.source.currency === after.source.currency &&
    before.source.exponent === after.source.exponent &&
    before.targetAccountId === after.targetAccountId &&
    before.recipient?.defaultCurrency === after.recipient?.defaultCurrency &&
    (!before.recipient?.existed || after.recipient?.existed === true)
  );
}
