import type { WalletDatabase } from "../../server/db/connection";
import { assertBalanceMinor, MAX_MINOR } from "../money/money";
import { JournalError } from "./errors";

export type WalletBalance = {
  walletId: string;
  currencyCode: string;
  minorUnit: number;
  balanceMinor: bigint;
};

/** No SQL SUM/TOTAL: even an intermediate int64 subtotal may overflow. */
function aggregateWallet(database: WalletDatabase, walletId: string): bigint {
  const rows = database.sqlite
    .prepare<[string], { amount_minor: bigint }>(
      "SELECT amount_minor FROM journal_entries WHERE wallet_id = ?",
    )
    .iterate(walletId);
  let balance = 0n;
  for (const { amount_minor: amount } of rows) {
    if (
      typeof amount !== "bigint" ||
      amount === 0n ||
      amount < -MAX_MINOR ||
      amount > MAX_MINOR
    ) {
      throw new JournalError(
        "invalid_journal",
        "Invalid stored journal amount.",
      );
    }
    balance += amount;
  }
  assertBalanceMinor(balance);
  return balance;
}

export function readWalletBalance(
  database: WalletDatabase,
  walletId: string,
): bigint {
  return database.sqlite.transaction(() => {
    if (
      !database.sqlite
        .prepare("SELECT id FROM wallets WHERE id = ?")
        .get(walletId)
    ) {
      throw new JournalError("wallet_not_found", "Wallet does not exist.");
    }
    return aggregateWallet(database, walletId);
  })();
}

/** Wallet metadata and every balance share a single SQLite read snapshot. */
export function readAccountBalances(
  database: WalletDatabase,
  accountId: string,
): WalletBalance[] {
  return database.sqlite.transaction(() => {
    if (
      !database.sqlite
        .prepare("SELECT id FROM accounts WHERE id = ?")
        .get(accountId)
    ) {
      throw new JournalError("account_not_found", "Account does not exist.");
    }
    const wallets = database.sqlite
      .prepare<
        [string],
        { id: string; currency_code: string; minor_unit: bigint }
      >(
        `SELECT w.id, w.currency_code, c.minor_unit
         FROM wallets AS w JOIN currencies AS c ON c.code = w.currency_code
         WHERE w.account_id = ? ORDER BY w.currency_code, w.id`,
      )
      .all(accountId);

    return wallets.map((wallet) => {
      if (
        typeof wallet.minor_unit !== "bigint" ||
        wallet.minor_unit < 0n ||
        wallet.minor_unit > 4n
      ) {
        throw new JournalError("invalid_journal", "Invalid stored precision.");
      }
      return {
        walletId: wallet.id,
        currencyCode: wallet.currency_code,
        minorUnit: Number(wallet.minor_unit),
        balanceMinor: aggregateWallet(database, wallet.id),
      };
    });
  })();
}
