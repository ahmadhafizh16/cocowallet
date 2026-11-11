import type { WalletDatabase } from "../../server/db/connection";
import {
  accounts,
  journalEntries,
  transactions,
  wallets,
} from "../../server/db/schema";
import {
  assertAmountMinor,
  assertBalanceMinor,
  convertMinorUnits,
} from "../money/money";
import { readWalletBalance } from "./balances";
import { JournalError } from "./errors";

type Provider = "demo_bank" | "community_bank" | "crypto_gateway";
export type AppliedRate = {
  value: string;
  date: string;
  fetchedAt: string;
  source: "fresh" | "cached";
};

/** Internal input only. A future feature service must validate quote ownership/expiry. */
export type JournalOperation = { id: string; amountMinor: bigint } & (
  | { type: "deposit"; targetWalletId: string; provider: Provider }
  | { type: "withdrawal"; sourceWalletId: string; provider: Provider }
  | {
      type: "conversion" | "transfer";
      sourceWalletId: string;
      targetWalletId: string;
      rate?: AppliedRate;
    }
);

type StoredWallet = {
  id: string;
  account_id: string;
  role: "main" | "destination";
  currency_code: string;
  minor_unit: bigint;
};

export type JournalWriteScope = {
  createDestination(input: { id: string; defaultCurrency: string }): void;
  createWallet(input: {
    id: string;
    accountId: string;
    currencyCode: string;
  }): void;
  record(operation: JournalOperation): { transactionId: string };
};

function wallet(database: WalletDatabase, id: string): StoredWallet {
  const row = database.sqlite
    .prepare<[string], StoredWallet>(
      `SELECT w.id, w.account_id, w.currency_code, a.role, c.minor_unit
       FROM wallets AS w
       JOIN accounts AS a ON a.id = w.account_id
       JOIN currencies AS c ON c.code = w.currency_code WHERE w.id = ?`,
    )
    .get(id);
  if (!row)
    throw new JournalError("wallet_not_found", "Wallet does not exist.");
  if (
    typeof row.minor_unit !== "bigint" ||
    row.minor_unit < 0n ||
    row.minor_unit > 4n
  ) {
    throw new JournalError("invalid_journal", "Invalid stored precision.");
  }
  return row;
}

function record(database: WalletDatabase, operation: JournalOperation) {
  assertAmountMinor(operation.amountMinor);
  const source =
    "sourceWalletId" in operation
      ? wallet(database, operation.sourceWalletId)
      : undefined;
  const target =
    "targetWalletId" in operation
      ? wallet(database, operation.targetWalletId)
      : undefined;
  if (
    (source && source.role !== "main") ||
    (operation.type === "deposit" && target?.role !== "main")
  ) {
    throw new JournalError(
      "inspect_only",
      "Only the main account can initiate operations.",
    );
  }
  if (
    operation.type === "conversion" &&
    (source?.account_id !== target?.account_id ||
      source?.currency_code === target?.currency_code)
  ) {
    throw new JournalError(
      "invalid_operation",
      "Conversions require two main-account currencies.",
    );
  }
  if (
    operation.type === "transfer" &&
    (target?.role !== "destination" ||
      source?.account_id === target?.account_id)
  ) {
    throw new JournalError(
      "invalid_operation",
      "Transfers require a different destination account.",
    );
  }

  let credit = operation.amountMinor;
  const rate = "rate" in operation ? operation.rate : undefined;
  if (source && target && source.currency_code !== target.currency_code) {
    if (!rate)
      throw new JournalError(
        "invalid_operation",
        "Cross-currency operations require an applied rate.",
      );
    credit = convertMinorUnits({
      sourceMinor: operation.amountMinor,
      sourceExponent: Number(source.minor_unit),
      targetExponent: Number(target.minor_unit),
      rate: rate.value,
    });
  } else if (rate) {
    throw new JournalError(
      "invalid_operation",
      "Same-currency operations cannot apply an FX rate.",
    );
  }
  if (
    source &&
    readWalletBalance(database, source.id) < operation.amountMinor
  ) {
    throw new JournalError(
      "insufficient_funds",
      "The source wallet has insufficient funds.",
    );
  }
  if (target)
    assertBalanceMinor(readWalletBalance(database, target.id) + credit);

  database.db
    .insert(transactions)
    .values({
      id: operation.id,
      type: operation.type,
      sourceWalletId: source?.id ?? null,
      targetWalletId: target?.id ?? null,
      provider: "provider" in operation ? operation.provider : null,
      rate: rate?.value ?? null,
      rateDate: rate?.date ?? null,
      rateFetchedAt: rate?.fetchedAt ?? null,
      rateSource: rate?.source ?? null,
    })
    .run();
  if (source) {
    database.db
      .insert(journalEntries)
      .values({
        transactionId: operation.id,
        walletId: source.id,
        amountMinor: -operation.amountMinor,
      })
      .run();
  }
  if (target) {
    database.db
      .insert(journalEntries)
      .values({
        transactionId: operation.id,
        walletId: target.id,
        amountMinor: credit,
      })
      .run();
  }
  return { transactionId: operation.id };
}

/**
 * Acquire SQLite's writer reservation BEFORE reading funds. Work must be synchronous:
 * prepare network rates outside this boundary, revalidate quotes inside it later.
 * No automatic retries: an unknown commit outcome belongs to the idempotency layer.
 */
export function withJournalWrite<T>(
  database: WalletDatabase,
  work: (
    scope: JournalWriteScope,
  ) => T & (T extends PromiseLike<unknown> ? never : unknown),
): T {
  if (database.sqlite.inTransaction) {
    throw new JournalError(
      "invalid_operation",
      "Journal writes require a top-level immediate transaction.",
    );
  }
  return database.sqlite
    .transaction(() => {
      let active = true;
      let failed = false;
      let failure: unknown;
      const assertActive = () => {
        if (!active || !database.sqlite.inTransaction) {
          throw new JournalError(
            "write_scope_closed",
            "The synchronous journal write scope is closed.",
          );
        }
      };
      const step = <Result>(action: () => Result): Result => {
        assertActive();
        if (failed) throw failure;
        try {
          return action();
        } catch (error) {
          failed = true;
          failure = error;
          throw error;
        }
      };
      const scope: JournalWriteScope = {
        createDestination(input) {
          step(() =>
            database.db
              .insert(accounts)
              .values({ ...input, role: "destination" })
              .run(),
          );
        },
        createWallet(input) {
          step(() => database.db.insert(wallets).values(input).run());
        },
        record(operation) {
          return step(() => record(database, operation));
        },
      };
      try {
        const result = work(scope);
        if (failed) throw failure;
        if (
          result != null &&
          (typeof result === "object" || typeof result === "function") &&
          "then" in result &&
          typeof result.then === "function"
        ) {
          throw new JournalError(
            "invalid_operation",
            "Journal write callbacks must not return promises.",
          );
        }
        return result;
      } finally {
        active = false;
      }
    })
    .immediate();
}
