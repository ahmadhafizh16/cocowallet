import type { WalletDatabase } from "../../server/db/connection";
import { readAccountBalances } from "../journal/balances";
import {
  CurrencyPrecisionError,
  getCurrencyExponent,
} from "../money/currency-precision";
import { AccountDataError } from "./errors";
import type {
  AccountRecord,
  AccountWallets,
  OverviewSnapshot,
  WalletRecord,
} from "./types";

type StoredCurrency = {
  metadata_code: unknown;
  name: unknown;
  minor_unit: unknown;
};

type StoredAccount = StoredCurrency & {
  id: unknown;
  role: unknown;
  default_currency: unknown;
  created_at: unknown;
};

type StoredWallet = StoredCurrency & {
  id: unknown;
  account_id: unknown;
  currency_code: unknown;
};

function invalidData(message: string): never {
  throw new AccountDataError("invalid_account_data", message);
}

function isNonemptyText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    !value.includes("\0")
  );
}

function currencyMetadata(
  currency: unknown,
  stored: StoredCurrency,
): { name: string; exponent: number } {
  if (
    !isNonemptyText(currency) ||
    stored.metadata_code !== currency ||
    !isNonemptyText(stored.name)
  ) {
    return invalidData("Stored currency metadata is missing or invalid.");
  }

  let exponent: number;
  try {
    exponent = getCurrencyExponent(currency);
  } catch (error) {
    if (!(error instanceof CurrencyPrecisionError)) throw error;
    return invalidData("Stored currency has no pinned accounting precision.");
  }
  if (stored.minor_unit !== BigInt(exponent)) {
    return invalidData(
      "Stored currency precision does not match pinned metadata.",
    );
  }
  return { name: stored.name, exponent };
}

function loadAccounts(database: WalletDatabase): {
  main: AccountRecord;
  accounts: AccountRecord[];
} {
  // LEFT JOIN makes broken references visible instead of silently dropping rows.
  const rows = database.sqlite
    .prepare<[], StoredAccount>(
      `SELECT a.id, a.role, a.default_currency, a.created_at,
              c.code AS metadata_code, c.name, c.minor_unit
       FROM accounts AS a LEFT JOIN currencies AS c ON c.code = a.default_currency
       ORDER BY CASE WHEN a.role = 'main' THEN 0 ELSE 1 END, a.created_at, a.id`,
    )
    .all();
  const mainCount = rows.filter((row) => row.role === "main").length;
  if (mainCount === 0) {
    throw new AccountDataError(
      "account_not_initialized",
      "The main account has not been initialized.",
    );
  }
  if (mainCount !== 1) invalidData("Exactly one main account is required.");

  const accounts = rows.map((row): AccountRecord => {
    if (
      !isNonemptyText(row.id) ||
      (row.role !== "main" && row.role !== "destination") ||
      !isNonemptyText(row.default_currency) ||
      !isNonemptyText(row.created_at) ||
      !Number.isFinite(Date.parse(row.created_at)) ||
      new Date(row.created_at).toISOString() !== row.created_at
    ) {
      return invalidData("Stored account metadata is invalid.");
    }
    currencyMetadata(row.default_currency, row);
    return {
      id: row.id,
      role: row.role,
      defaultCurrency: row.default_currency,
      createdAt: row.created_at,
      inspectOnly: row.role === "destination",
    };
  });
  const main = accounts[0];
  if (!main || main.role !== "main") {
    return invalidData("Stored main account is invalid.");
  }
  return { main, accounts };
}

function loadWallets(
  database: WalletDatabase,
  account: AccountRecord,
): WalletRecord[] {
  const rows = database.sqlite
    .prepare<[string], StoredWallet>(
      `SELECT w.id, w.account_id, w.currency_code,
              c.code AS metadata_code, c.name, c.minor_unit
       FROM wallets AS w LEFT JOIN currencies AS c ON c.code = w.currency_code
       WHERE w.account_id = ? ORDER BY w.currency_code, w.id`,
    )
    .all(account.id);
  const metadata = rows.map((row) => {
    if (
      !isNonemptyText(row.id) ||
      row.account_id !== account.id ||
      !isNonemptyText(row.currency_code)
    ) {
      return invalidData("Stored wallet metadata is invalid.");
    }
    return {
      id: row.id,
      accountId: account.id,
      currency: row.currency_code,
      ...currencyMetadata(row.currency_code, row),
    };
  });

  // Its nested transaction is a savepoint within our outer read snapshot.
  const balances = readAccountBalances(database, account.id);
  if (balances.length !== metadata.length) {
    return invalidData("Stored wallet balances do not match wallet metadata.");
  }
  const byId = new Map(balances.map((balance) => [balance.walletId, balance]));
  return metadata.map((wallet) => {
    const balance = byId.get(wallet.id);
    if (
      !balance ||
      balance.currencyCode !== wallet.currency ||
      balance.minorUnit !== wallet.exponent
    ) {
      return invalidData("Stored wallet balance metadata is inconsistent.");
    }
    return { ...wallet, balanceMinor: balance.balanceMinor.toString() };
  });
}

export function listAccounts(database: WalletDatabase): AccountRecord[] {
  return database.sqlite.transaction(() => loadAccounts(database).accounts)();
}

export function readAccountWallets(
  database: WalletDatabase,
  accountId: string,
): AccountWallets {
  return database.sqlite.transaction(() => {
    const account = loadAccounts(database).accounts.find(
      (candidate) => candidate.id === accountId,
    );
    if (!account) {
      throw new AccountDataError(
        "account_not_found",
        "Account does not exist.",
      );
    }
    return { account, wallets: loadWallets(database, account) };
  })();
}

/** All accounts, wallet metadata, and journal balances share one read snapshot. */
export function readOverviewSnapshot(
  database: WalletDatabase,
): OverviewSnapshot {
  return database.sqlite.transaction(() => {
    const { main, accounts } = loadAccounts(database);
    if (
      database.sqlite
        .prepare(
          `SELECT w.id FROM wallets AS w
           LEFT JOIN accounts AS a ON a.id = w.account_id
           WHERE a.id IS NULL LIMIT 1`,
        )
        .get()
    ) {
      return invalidData("Stored wallet references a missing account.");
    }
    return {
      activeAccountId: main.id,
      accounts,
      wallets: accounts.flatMap((account) => loadWallets(database, account)),
    };
  })();
}
