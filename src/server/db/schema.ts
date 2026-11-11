import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import {
  check,
  index,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { currencyExponent, signedInteger } from "./columns";

export const applicationMetadata = sqliteTable("application_metadata", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

const identifier = (name: string) =>
  text(name).primaryKey().$defaultFn(randomUUID);
const createdAt = () =>
  text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString());

export const currencies = sqliteTable(
  "currencies",
  {
    code: text("code").primaryKey(),
    name: text("name").notNull(),
    minorUnit: currencyExponent("minor_unit").notNull(),
  },
  (table) => [
    check("currency_code_format", sql`${table.code} GLOB '[A-Z][A-Z][A-Z]'`),
    check(
      "currency_minor_unit_range",
      sql`typeof(${table.minorUnit}) = 'integer' AND ${table.minorUnit} BETWEEN 0 AND 4`,
    ),
  ],
);

export const accounts = sqliteTable(
  "accounts",
  {
    id: identifier("id"),
    role: text("role", { enum: ["main", "destination"] }).notNull(),
    defaultCurrency: text("default_currency")
      .notNull()
      .references(() => currencies.code, { onDelete: "restrict" }),
    createdAt: createdAt(),
  },
  (table) => [
    check("account_role", sql`${table.role} IN ('main', 'destination')`),
    uniqueIndex("one_main_account")
      .on(table.role)
      .where(sql`${table.role} = 'main'`),
  ],
);

export const wallets = sqliteTable(
  "wallets",
  {
    id: identifier("id"),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    currencyCode: text("currency_code")
      .notNull()
      .references(() => currencies.code, { onDelete: "restrict" }),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("wallet_account_currency").on(
      table.accountId,
      table.currencyCode,
    ),
  ],
);

export const transactions = sqliteTable(
  "transactions",
  {
    id: identifier("id"),
    type: text("type", {
      enum: ["deposit", "withdrawal", "conversion", "transfer"],
    }).notNull(),
    status: text("status", { enum: ["completed"] })
      .notNull()
      .default("completed"),
    sourceWalletId: text("source_wallet_id").references(() => wallets.id, {
      onDelete: "restrict",
    }),
    targetWalletId: text("target_wallet_id").references(() => wallets.id, {
      onDelete: "restrict",
    }),
    provider: text("provider", {
      enum: ["demo_bank", "community_bank", "crypto_gateway"],
    }),
    rate: text("rate"),
    rateDate: text("rate_date"),
    rateFetchedAt: text("rate_fetched_at"),
    rateSource: text("rate_source", { enum: ["fresh", "cached"] }),
    createdAt: createdAt(),
  },
  (table) => [
    check(
      "transaction_type",
      sql`${table.type} IN ('deposit', 'withdrawal', 'conversion', 'transfer')`,
    ),
    check("transaction_completed", sql`${table.status} = 'completed'`),
    check(
      "transaction_wallet_shape",
      sql`(${table.type} = 'deposit' AND ${table.sourceWalletId} IS NULL AND ${table.targetWalletId} IS NOT NULL)
        OR (${table.type} = 'withdrawal' AND ${table.sourceWalletId} IS NOT NULL AND ${table.targetWalletId} IS NULL)
        OR (${table.type} IN ('conversion', 'transfer') AND ${table.sourceWalletId} IS NOT NULL AND ${table.targetWalletId} IS NOT NULL AND ${table.sourceWalletId} != ${table.targetWalletId})`,
    ),
    check(
      "transaction_provider_shape",
      sql`(${table.type} IN ('deposit', 'withdrawal') AND ${table.provider} IS NOT NULL AND ${table.provider} IN ('demo_bank', 'community_bank', 'crypto_gateway'))
        OR (${table.type} IN ('conversion', 'transfer') AND ${table.provider} IS NULL)`,
    ),
    check(
      "transaction_rate_shape",
      sql`(${table.rate} IS NULL AND ${table.rateDate} IS NULL AND ${table.rateFetchedAt} IS NULL AND ${table.rateSource} IS NULL)
        OR (${table.rate} IS NOT NULL AND ${table.rateDate} IS NOT NULL AND ${table.rateFetchedAt} IS NOT NULL AND ${table.rateSource} IS NOT NULL AND ${table.rateSource} IN ('fresh', 'cached'))`,
    ),
    index("transactions_created_at").on(table.createdAt, table.id),
    index("transactions_source_wallet").on(table.sourceWalletId),
    index("transactions_target_wallet").on(table.targetWalletId),
  ],
);

export const journalEntries = sqliteTable(
  "journal_entries",
  {
    id: identifier("id"),
    transactionId: text("transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "restrict" }),
    walletId: text("wallet_id")
      .notNull()
      .references(() => wallets.id, { onDelete: "restrict" }),
    amountMinor: signedInteger("amount_minor").notNull(),
  },
  (table) => [
    check(
      "journal_integer_nonzero",
      sql`typeof(${table.amountMinor}) = 'integer' AND ${table.amountMinor} != 0 AND ${table.amountMinor} >= -9223372036854775807`,
    ),
    uniqueIndex("journal_transaction_wallet").on(
      table.transactionId,
      table.walletId,
    ),
    index("journal_wallet").on(table.walletId),
  ],
);

/** Immutable technical outcomes, separate from completed transaction history. */
export const fundingAttempts = sqliteTable(
  "funding_attempts",
  {
    key: text("key").primaryKey(),
    request: text("request").notNull(),
    status: text("status").notNull(),
    response: text("response").notNull(),
    transactionId: text("transaction_id")
      .unique()
      .references(() => transactions.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
  },
  (table) => [
    check(
      "funding_status",
      sql`${table.status} IN ('200', '400', '404', '409')`,
    ),
    check(
      "funding_result_shape",
      sql`(${table.status} = '200' AND ${table.transactionId} IS NOT NULL) OR (${table.status} != '200' AND ${table.transactionId} IS NULL)`,
    ),
  ],
);

export const fxCatalogCache = sqliteTable(
  "fx_catalog_cache",
  {
    id: text("id").primaryKey(),
    currencies: text("currencies").notNull(),
    fetchedAt: text("fetched_at").notNull(),
  },
  (table) => [
    check("fx_catalog_provider", sql`${table.id} = 'frankfurter-v2'`),
  ],
);

export const fxRateCache = sqliteTable(
  "fx_rate_cache",
  {
    base: text("base").notNull(),
    quote: text("quote").notNull(),
    rate: text("rate").notNull(),
    date: text("source_date").notNull(),
    fetchedAt: text("fetched_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.base, table.quote] }),
    check("fx_distinct_pair", sql`${table.base} != ${table.quote}`),
  ],
);

export const fxQuotes = sqliteTable(
  "fx_quotes",
  {
    id: text("id").primaryKey(),
    operation: text("operation").notNull(),
    sourceAccountId: text("source_account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    sourceWalletId: text("source_wallet_id")
      .notNull()
      .references(() => wallets.id, { onDelete: "restrict" }),
    request: text("request").notNull(),
    terms: text("terms").notNull(),
    issuedAt: text("issued_at").notNull(),
    expiresAt: text("expires_at").notNull(),
  },
  (table) => [
    check(
      "fx_quote_operation",
      sql`${table.operation} IN ('conversion','transfer')`,
    ),
  ],
);

export const fxQuoteUses = sqliteTable("fx_quote_uses", {
  quoteId: text("quote_id")
    .primaryKey()
    .references(() => fxQuotes.id, { onDelete: "restrict" }),
  transactionId: text("transaction_id")
    .notNull()
    .unique()
    .references(() => transactions.id, { onDelete: "restrict" }),
  usedAt: text("used_at").notNull(),
});

/** Retained conversion outcomes; global key exclusivity with funding is also
 * enforced by migration triggers, without rewriting existing funding records. */
export const conversionAttempts = sqliteTable(
  "conversion_attempts",
  {
    key: text("key").primaryKey(),
    request: text("request").notNull(),
    status: text("status").notNull(),
    response: text("response").notNull(),
    transactionId: text("transaction_id")
      .unique()
      .references(() => transactions.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
  },
  (table) => [
    check(
      "conversion_status",
      sql`${table.status} IN ('200', '400', '404', '409')`,
    ),
    check(
      "conversion_result_shape",
      sql`(${table.status} = '200' AND ${table.transactionId} IS NOT NULL) OR (${table.status} != '200' AND ${table.transactionId} IS NULL)`,
    ),
  ],
);

export const transferAttempts = sqliteTable(
  "transfer_attempts",
  {
    key: text("key").primaryKey(),
    request: text("request").notNull(),
    status: text("status").notNull(),
    response: text("response").notNull(),
    transactionId: text("transaction_id")
      .unique()
      .references(() => transactions.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
  },
  (table) => [
    check(
      "transfer_status",
      sql`${table.status} IN ('200', '400', '404', '409')`,
    ),
    check(
      "transfer_result_shape",
      sql`(${table.status} = '200' AND ${table.transactionId} IS NOT NULL) OR (${table.status} != '200' AND ${table.transactionId} IS NULL)`,
    ),
  ],
);
