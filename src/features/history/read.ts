import "server-only";
import type { WalletDatabase } from "../../server/db/connection";
import { identifierContract } from "../../lib/contracts";
import { readAccountMetadata } from "../accounts/read";
import { isFundingProvider } from "../funding/contracts";
import { getCurrencyExponent } from "../money/currency-precision";
import {
  assertAmountMinor,
  convertMinorUnits,
  formatAmount,
  parseRate,
} from "../money/money";
import { sourceDate } from "../rates/validation";
import {
  HistoryError,
  normalizeHistoryQuery,
  transactionTypeContract,
  type HistoryDetail,
  type HistoryPage,
  type HistoryQuery,
  type HistorySide,
  type HistoryTransaction,
} from "./contracts";

type StoredTransaction = Record<string, unknown>;
type Entry = { wallet_id: unknown; amount_minor: unknown };
const joined = `FROM transactions t
 LEFT JOIN wallets sw ON sw.id=t.source_wallet_id
 LEFT JOIN accounts sa ON sa.id=sw.account_id
 LEFT JOIN currencies sc ON sc.code=sw.currency_code
 LEFT JOIN wallets tw ON tw.id=t.target_wallet_id
 LEFT JOIN accounts ta ON ta.id=tw.account_id
 LEFT JOIN currencies tc ON tc.code=tw.currency_code`;
const columns = `t.*,sw.id AS source_id,sw.account_id AS source_account_id,sa.id AS source_account_ref,sa.role AS source_role,sw.currency_code AS source_currency,sc.code AS source_currency_ref,sc.name AS source_name,sc.minor_unit AS source_exponent,
 tw.id AS target_id,tw.account_id AS target_account_id,ta.id AS target_account_ref,ta.role AS target_role,tw.currency_code AS target_currency,tc.code AS target_currency_ref,tc.name AS target_name,tc.minor_unit AS target_exponent`;
function invalid(): never {
  throw new HistoryError("HISTORY_DATA_UNAVAILABLE");
}
function canonicalTime(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z(?![\s\S])/u.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}
function side(
  row: StoredTransaction,
  prefix: "source" | "target",
  entries: Entry[],
): HistorySide | null {
  if (row[`${prefix}_wallet_id`] === null) return null;
  const walletId = row[`${prefix}_id`],
    accountId = row[`${prefix}_account_id`],
    currency = row[`${prefix}_currency`],
    name = row[`${prefix}_name`];
  if (
    !identifierContract.is(walletId) ||
    row[`${prefix}_wallet_id`] !== walletId ||
    !identifierContract.is(accountId) ||
    row[`${prefix}_account_ref`] !== accountId ||
    typeof currency !== "string" ||
    row[`${prefix}_currency_ref`] !== currency ||
    typeof name !== "string" ||
    !name.trim() ||
    name.length > 256 ||
    name.includes("\0")
  )
    return invalid();
  const exponent = getCurrencyExponent(currency);
  if (row[`${prefix}_exponent`] !== BigInt(exponent)) return invalid();
  const entry = entries.find((value) => value.wallet_id === walletId);
  if (!entry || typeof entry.amount_minor !== "bigint") return invalid();
  const minor = prefix === "source" ? -entry.amount_minor : entry.amount_minor;
  assertAmountMinor(minor);
  return {
    accountId,
    walletId,
    currency,
    name,
    exponent,
    amount: formatAmount(minor, exponent),
    amountMinor: minor.toString(),
  };
}
/** Validate stored facts, never substitute today's balances, rate or quote state. */
function transaction(
  row: StoredTransaction,
  entries: Entry[],
  accountId: string,
): HistoryTransaction {
  if (
    !identifierContract.is(row.id) ||
    !transactionTypeContract.is(row.type) ||
    row.status !== "completed" ||
    !canonicalTime(row.created_at)
  )
    return invalid();
  const source = side(row, "source", entries),
    target = side(row, "target", entries);
  if (
    entries.length !== (source ? 1 : 0) + (target ? 1 : 0) ||
    (!source && !target) ||
    (source && target && source.walletId === target.walletId)
  )
    return invalid();
  let provider: HistoryTransaction["provider"] = null;
  if (row.type === "deposit" || row.type === "withdrawal") {
    if (typeof row.provider !== "string" || !isFundingProvider(row.provider))
      return invalid();
    provider = row.provider;
    if (
      row.type === "deposit"
        ? source !== null || target === null || row.target_role !== "main"
        : source === null || target !== null || row.source_role !== "main"
    )
      return invalid();
  } else {
    if (
      !source ||
      !target ||
      row.provider !== null ||
      row.source_role !== "main"
    )
      return invalid();
    if (
      row.type === "conversion"
        ? row.target_role !== "main" ||
          source.accountId !== target.accountId ||
          source.currency === target.currency
        : row.target_role !== "destination" ||
          source.accountId === target.accountId
    )
      return invalid();
  }
  const terms = [row.rate, row.rate_date, row.rate_fetched_at, row.rate_source];
  let rate: HistoryTransaction["rate"] = null;
  if (terms.some((value) => value !== null)) {
    if (
      !source ||
      !target ||
      source.currency === target.currency ||
      typeof row.rate !== "string" ||
      !canonicalTime(row.rate_fetched_at) ||
      (row.rate_source !== "fresh" && row.rate_source !== "cached")
    )
      return invalid();
    parseRate(row.rate);
    rate = {
      value: row.rate,
      date: sourceDate(row.rate_date, row.rate_fetched_at),
      fetchedAt: row.rate_fetched_at,
      source: row.rate_source,
    };
    if (
      convertMinorUnits({
        sourceMinor: BigInt(source.amountMinor),
        sourceExponent: source.exponent,
        targetExponent: target.exponent,
        rate: rate.value,
      }) !== BigInt(target.amountMinor)
    )
      return invalid();
  } else if (
    source &&
    target &&
    (source.currency !== target.currency ||
      source.amountMinor !== target.amountMinor)
  )
    return invalid();
  const outgoing = source?.accountId === accountId,
    incoming = target?.accountId === accountId;
  if (!outgoing && !incoming) return invalid();
  return {
    transactionId: row.id,
    type: row.type,
    status: "completed",
    direction:
      outgoing && incoming ? "internal" : outgoing ? "outgoing" : "incoming",
    createdAt: row.created_at,
    source,
    target,
    provider,
    rate,
  };
}
function filters(input: HistoryQuery) {
  const clauses = [
      "t.status='completed'",
      "(sw.account_id=? OR tw.account_id=?)",
    ],
    bindings: (string | bigint)[] = [input.accountId, input.accountId];
  if (input.type) {
    clauses.push("t.type=?");
    bindings.push(input.type);
  }
  if (input.currency) {
    clauses.push("(sw.currency_code=? OR tw.currency_code=?)");
    bindings.push(input.currency, input.currency);
  }
  if (input.from) {
    clauses.push("t.created_at>=?");
    bindings.push(`${input.from}T00:00:00.000Z`);
  }
  if (input.to) {
    clauses.push("t.created_at<=?");
    bindings.push(`${input.to}T23:59:59.999Z`);
  }
  return { where: `WHERE ${clauses.join(" AND ")}`, bindings };
}

export function listTransactionHistory(
  database: WalletDatabase,
  rawInput: unknown,
): HistoryPage {
  const input = normalizeHistoryQuery(rawInput),
    query = filters(input);
  return database.sqlite.transaction(() => {
    const account = readAccountMetadata(database, input.accountId);
    const count = database.sqlite
      .prepare<(string | bigint)[], { total: bigint }>(
        `SELECT COUNT(*) AS total ${joined} ${query.where}`,
      )
      .get(...query.bindings)!.total;
    if (
      typeof count !== "bigint" ||
      count < 0n ||
      count > BigInt(Number.MAX_SAFE_INTEGER)
    )
      return invalid();
    const offset = (BigInt(input.page) - 1n) * BigInt(input.pageSize);
    const rows =
      offset >= count
        ? []
        : database.sqlite
            .prepare<(string | bigint)[], StoredTransaction>(
              `SELECT ${columns} ${joined} ${query.where} ORDER BY t.created_at DESC,t.id DESC LIMIT ? OFFSET ?`,
            )
            .all(...query.bindings, BigInt(input.pageSize), offset);
    const entries = database.sqlite.prepare<[string], Entry>(
      "SELECT wallet_id,amount_minor FROM journal_entries WHERE transaction_id=?",
    );
    return {
      account,
      transactions: rows.map((row) => {
        if (!identifierContract.is(row.id)) return invalid();
        return transaction(row, entries.all(row.id), input.accountId);
      }),
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        totalItems: Number(count),
        totalPages: Number(
          (count + BigInt(input.pageSize) - 1n) / BigInt(input.pageSize),
        ),
      },
    };
  })();
}
export function readTransactionHistory(
  database: WalletDatabase,
  accountId: unknown,
  transactionId: unknown,
): HistoryDetail {
  if (!identifierContract.is(accountId))
    throw new HistoryError("INVALID_HISTORY_QUERY");
  if (!identifierContract.is(transactionId))
    throw new HistoryError("INVALID_TRANSACTION_ID");
  return database.sqlite.transaction(() => {
    const account = readAccountMetadata(database, accountId);
    const row = database.sqlite
      .prepare<[string, string, string], StoredTransaction>(
        `SELECT ${columns} ${joined} WHERE t.status='completed' AND t.id=? AND (sw.account_id=? OR tw.account_id=?)`,
      )
      .get(transactionId, accountId, accountId);
    if (!row) throw new HistoryError("TRANSACTION_NOT_FOUND");
    const entries = database.sqlite
      .prepare<[string], Entry>(
        "SELECT wallet_id,amount_minor FROM journal_entries WHERE transaction_id=?",
      )
      .all(transactionId);
    return { account, transaction: transaction(row, entries, accountId) };
  })();
}
