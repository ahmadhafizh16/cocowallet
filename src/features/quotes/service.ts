import "server-only";
import { randomUUID } from "node:crypto";
import { withJournalAfterRecord } from "../journal/write";
import type { WalletDatabase } from "../../server/db/connection";
import { fxQuotes, fxQuoteUses } from "../../server/db/schema";
import { getCurrencyCatalog, getReferenceRate } from "../rates/service";
import type { FrankfurterClient } from "../rates/frankfurter";
import { cacheEligible, fiatExponent, timestamp } from "../rates/validation";
import { convertMinorUnits, formatAmount } from "../money/money";
import {
  canonicalQuoteRequest,
  isQuoteRequest,
  QuoteError,
  QUOTE_LIFETIME_MS,
  type QuoteView,
  type StoredQuote,
} from "./contracts";
import {
  currencyMetadata,
  quoteContext,
  sameQuoteContext,
  type CurrencyMetadata,
} from "./context";
import { asQuoteError } from "./errors";
import { loadQuote, assertQuoteActive } from "./storage";

type Dependencies = { now?: () => number; client?: FrankfurterClient };
export async function createQuote(
  database: WalletDatabase,
  rawInput: unknown,
  dependencies: Dependencies = {},
): Promise<QuoteView> {
  try {
    if (
      !isQuoteRequest(rawInput) ||
      Buffer.byteLength(JSON.stringify(rawInput)) > 16384
    )
      throw new QuoteError("INVALID_QUOTE_REQUEST", 400);
    const input = Object.freeze({ ...rawInput });
    try {
      fiatExponent(input.targetCurrency);
      if (input.recipientDefaultCurrency)
        fiatExponent(input.recipientDefaultCurrency);
    } catch {
      throw new QuoteError("INVALID_TARGET_CURRENCY", 400);
    }
    if (database.sqlite.inTransaction)
      throw new QuoteError("QUOTE_STORAGE_UNAVAILABLE", 503);
    const now = dependencies.now ?? Date.now;
    const before = database.sqlite.transaction(() =>
      quoteContext(database, input),
    )();
    let targetMetadata: CurrencyMetadata | undefined = before.targetCurrency;
    let defaultMetadata = before.recipient
      ? currencyMetadata(database, before.recipient.defaultCurrency)
      : undefined;
    let catalogFetchedAt: string | undefined;
    if (
      !targetMetadata ||
      !before.targetWalletId ||
      (before.recipient && !before.recipient.existed)
    ) {
      const catalog = await getCurrencyCatalog(database, dependencies);
      catalogFetchedAt = catalog.fetchedAt;
      const target = catalog.currencies.find(
        (c) => c.code === input.targetCurrency,
      );
      if (
        !target ||
        (before.recipient &&
          !catalog.currencies.some(
            (c) => c.code === before.recipient!.defaultCurrency,
          ))
      )
        throw new QuoteError("INVALID_TARGET_CURRENCY", 400);
      targetMetadata ??= {
        currency: target.code,
        name: target.name,
        exponent: target.exponent,
      };
      const recipientDefault =
        before.recipient &&
        catalog.currencies.find(
          (c) => c.code === before.recipient!.defaultCurrency,
        );
      if (recipientDefault)
        defaultMetadata ??= {
          currency: recipientDefault.code,
          name: recipientDefault.name,
          exponent: recipientDefault.exponent,
        };
    }
    const rate = await getReferenceRate(
      database,
      before.source.currency,
      input.targetCurrency,
      dependencies,
    );
    if (!targetMetadata || (before.recipient && !defaultMetadata))
      throw new QuoteError("QUOTE_DATA_UNAVAILABLE", 503);
    const target = targetMetadata;
    const recipientDefault = defaultMetadata;
    if (database.sqlite.inTransaction)
      throw new QuoteError("QUOTE_STORAGE_UNAVAILABLE", 503);
    return database.sqlite
      .transaction((): QuoteView => {
        const amountMinor = convertMinorUnits({
          sourceMinor: before.amountMinor,
          sourceExponent: before.source.exponent,
          targetExponent: target.exponent,
          rate: rate.rate,
        });
        const after = quoteContext(database, input, amountMinor);
        if (!sameQuoteContext(before, after))
          throw new QuoteError("QUOTE_CONTEXT_CHANGED", 409);
        if (
          after.targetCurrency &&
          after.targetCurrency.exponent !== target.exponent
        )
          throw new QuoteError("QUOTE_CONTEXT_CHANGED", 409);
        const issued = now();
        const issuedAt = timestamp(issued);
        if (
          !cacheEligible(rate.fetchedAt, issued) ||
          (catalogFetchedAt && !cacheEligible(catalogFetchedAt, issued))
        )
          throw new QuoteError("QUOTE_RATE_UNAVAILABLE", 503);
        const quote: StoredQuote = {
          version: 1,
          quoteId: randomUUID(),
          operation: input.operation,
          source: {
            ...after.source,
            amount: formatAmount(after.amountMinor, after.source.exponent),
            amountMinor: after.amountMinor.toString(),
          },
          target: {
            ...target,
            accountId: after.targetAccountId,
            amount: formatAmount(amountMinor, target.exponent),
            amountMinor: amountMinor.toString(),
          },
          ...(after.recipient
            ? {
                recipient: {
                  ...after.recipient,
                  defaultName: recipientDefault!.name,
                  defaultExponent: recipientDefault!.exponent,
                },
              }
            : {}),
          rate: {
            provider: "frankfurter",
            value: rate.rate,
            date: rate.date,
            fetchedAt: rate.fetchedAt,
            source: rate.source,
          },
          issuedAt,
          expiresAt: timestamp(issued + QUOTE_LIFETIME_MS),
        };
        database.db
          .insert(fxQuotes)
          .values({
            id: quote.quoteId,
            operation: quote.operation,
            sourceAccountId: quote.source.accountId,
            sourceWalletId: quote.source.walletId,
            request: JSON.stringify(input),
            terms: JSON.stringify(quote),
            issuedAt: quote.issuedAt,
            expiresAt: quote.expiresAt,
          })
          .run();
        loadQuote(database, quote.quoteId);
        return { quote, state: "active" };
      })
      .immediate();
  } catch (error) {
    throw asQuoteError(error);
  }
}

export function readQuote(
  database: WalletDatabase,
  quoteId: string,
  now = Date.now(),
): QuoteView {
  try {
    return database.sqlite.transaction((): QuoteView => {
      const { quote } = loadQuote(database, quoteId);
      timestamp(now);
      const used = database.sqlite
        .prepare<[string], { transaction_id: string }>(
          "SELECT transaction_id FROM fx_quote_uses WHERE quote_id=?",
        )
        .get(quote.quoteId);
      if (used)
        return { quote, state: "consumed", transactionId: used.transaction_id };
      if (now < Date.parse(quote.issuedAt))
        throw new QuoteError("QUOTE_DATA_UNAVAILABLE", 503);
      return {
        quote,
        state: now >= Date.parse(quote.expiresAt) ? "expired" : "active",
      };
    })();
  } catch (error) {
    throw asQuoteError(error);
  }
}

/** Internal synchronous seam: call after idempotent replay lookup, inside the
 * top-level immediate journal boundary. Never fetch or trust caller rate terms. */
export function validateQuoteForConfirmation(
  database: WalletDatabase,
  quoteId: string,
  expected: unknown,
  now = Date.now(),
) {
  try {
    if (!database.sqlite.inTransaction)
      throw new QuoteError("QUOTE_STORAGE_UNAVAILABLE", 503);
    const { quote, request } = loadQuote(database, quoteId);
    if (
      !isQuoteRequest(expected) ||
      canonicalQuoteRequest(expected) !== canonicalQuoteRequest(request)
    )
      throw new QuoteError("QUOTE_INPUT_MISMATCH", 409);
    assertQuoteActive(database, quote, now);
    const context = quoteContext(
      database,
      request,
      BigInt(quote.target.amountMinor),
    );
    if (
      context.source.accountId !== quote.source.accountId ||
      context.source.currency !== quote.source.currency ||
      context.source.exponent !== quote.source.exponent ||
      context.targetAccountId !== quote.target.accountId ||
      (quote.recipient &&
        (context.recipient?.defaultCurrency !==
          quote.recipient.defaultCurrency ||
          (quote.recipient.existed && !context.recipient?.existed)))
    )
      throw new QuoteError("QUOTE_CONTEXT_CHANGED", 409);
    return { quote, request, context };
  } catch (error) {
    throw asQuoteError(error);
  }
}

/** Call only in JournalWriteScope.record's synchronous after-record hook, so
 * any registration failure is latched and rolls the entire operation back. */
export function consumeQuote(
  database: WalletDatabase,
  quoteId: string,
  transactionId: string,
  now = Date.now(),
) {
  try {
    return withJournalAfterRecord(database, transactionId, () => {
      try {
        const { quote } = loadQuote(database, quoteId);
        assertQuoteActive(database, quote, now);
        const transaction = database.sqlite
          .prepare<
            [string],
            {
              type: string;
              status: string;
              source_wallet_id: string;
              target_wallet_id: string;
              rate: string;
              rate_date: string;
              rate_fetched_at: string;
              rate_source: string;
              account_id: string;
              currency_code: string;
              role: string;
              default_currency: string;
              minor_unit: bigint;
            }
          >(
            `SELECT t.*,w.account_id,w.currency_code,a.role,a.default_currency,c.minor_unit FROM transactions t JOIN wallets w ON w.id=t.target_wallet_id JOIN accounts a ON a.id=w.account_id JOIN currencies c ON c.code=w.currency_code WHERE t.id=?`,
          )
          .get(transactionId);
        const entries = database.sqlite
          .prepare<[string], { wallet_id: string; amount_minor: bigint }>(
            "SELECT wallet_id,amount_minor FROM journal_entries WHERE transaction_id=?",
          )
          .all(transactionId);
        if (
          !transaction ||
          transaction.type !== quote.operation ||
          transaction.status !== "completed" ||
          transaction.source_wallet_id !== quote.source.walletId ||
          transaction.account_id !== quote.target.accountId ||
          transaction.currency_code !== quote.target.currency ||
          transaction.minor_unit !== BigInt(quote.target.exponent) ||
          transaction.role !==
            (quote.operation === "conversion" ? "main" : "destination") ||
          (quote.recipient &&
            transaction.default_currency !== quote.recipient.defaultCurrency) ||
          transaction.rate !== quote.rate.value ||
          transaction.rate_date !== quote.rate.date ||
          transaction.rate_fetched_at !== quote.rate.fetchedAt ||
          transaction.rate_source !== quote.rate.source ||
          entries.length !== 2 ||
          !entries.some(
            (e) =>
              e.wallet_id === quote.source.walletId &&
              e.amount_minor === -BigInt(quote.source.amountMinor),
          ) ||
          !entries.some(
            (e) =>
              e.wallet_id === transaction.target_wallet_id &&
              e.amount_minor === BigInt(quote.target.amountMinor),
          )
        )
          throw new QuoteError("QUOTE_CONTEXT_CHANGED", 409);
        database.db
          .insert(fxQuoteUses)
          .values({
            quoteId: quote.quoteId,
            transactionId,
            usedAt: timestamp(now),
          })
          .run();
      } catch (error) {
        throw asQuoteError(error);
      }
    });
  } catch (error) {
    throw asQuoteError(error);
  }
}
