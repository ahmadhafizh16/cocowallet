import "server-only";
import { randomUUID } from "node:crypto";
import type { WalletDatabase } from "../../server/db/connection";
import { currencies, transferAttempts } from "../../server/db/schema";
import { normalizeRequestKey } from "../funding/contracts";
import { MoneyError, formatAmount } from "../money/money";
import { withJournalWrite, type JournalWriteScope } from "../journal/write";
import { QuoteError, type StoredQuote } from "../quotes/contracts";
import { currencyMetadata, type CurrencyMetadata } from "../quotes/context";
import { validateQuoteForConfirmation, consumeQuote } from "../quotes/service";
import { getCurrencyCatalog } from "../rates/service";
import type { CurrencyCatalog } from "../rates/contracts";
import type { FrankfurterClient } from "../rates/frankfurter";
import { cacheEligible, timestamp } from "../rates/validation";
import {
  canonicalTransferRequest,
  isTransferRequest,
  transferFailures,
  TransferError,
  transferProblem,
  type TransferRequest,
  type TransferResult,
} from "./contracts";
import { transferContext, assertTransferTargetBounds } from "./context";
import { confirmedTransferResult } from "./receipt";

function knownProblem(error: unknown, key: string) {
  const code =
    error instanceof MoneyError
      ? error.code.toUpperCase()
      : error instanceof TransferError || error instanceof QuoteError
        ? error.code
        : undefined;
  if (!code || !Object.hasOwn(transferFailures, code)) return undefined;
  const failure = transferFailures[code as keyof typeof transferFailures];
  if (error instanceof QuoteError && error.status !== failure.status)
    return undefined;
  return transferProblem(failure.status, code, failure.detail, true, key);
}
function replay(
  database: WalletDatabase,
  key: string,
  input: TransferRequest,
  canonical: string,
): TransferResult | undefined {
  const existing = database.sqlite
    .prepare<
      [string],
      {
        request: string;
        status: string;
        response: string;
        transaction_id: string | null;
      }
    >(
      "SELECT request,status,response,transaction_id FROM transfer_attempts WHERE key=?",
    )
    .get(key);
  const conflict = (): TransferResult => ({
    status: 409,
    body: transferProblem(
      409,
      "IDEMPOTENCY_KEY_REUSED",
      "This key belongs to different input. Recover the original request; do not replace its key.",
      false,
      key,
    ),
    replayed: false,
  });
  if (existing) {
    if (existing.request !== canonical) return conflict();
    if (existing.response.length > 131072)
      throw new Error("Oversized stored transfer result.");
    const body = confirmedTransferResult(
      JSON.parse(existing.response),
      existing.status,
      existing.transaction_id,
      key,
      input,
    );
    return {
      status: "transactionId" in body ? 200 : body.status,
      body,
      replayed: true,
    };
  }
  if (
    database.sqlite
      .prepare(
        "SELECT key FROM funding_attempts WHERE key=? UNION ALL SELECT key FROM conversion_attempts WHERE key=? LIMIT 1",
      )
      .get(key, key)
  )
    return conflict();
}
type Prepared = { catalog?: CurrencyCatalog; error?: unknown };
function execute(
  database: WalletDatabase,
  scope: JournalWriteScope,
  key: string,
  input: TransferRequest,
  prepared: Prepared,
  now: () => number,
): TransferResult["body"] {
  let context: ReturnType<typeof transferContext>,
    quote: StoredQuote | undefined,
    source: StoredQuote["source"],
    target: StoredQuote["target"],
    defaultMetadata: CurrencyMetadata,
    credit: bigint;
  try {
    context = transferContext(database, input, false);
    if (context.crossCurrency) {
      const checked = validateQuoteForConfirmation(
        database,
        input.quoteId!,
        {
          operation: "transfer",
          sourceWalletId: input.sourceWalletId,
          amount: input.amount,
          targetCurrency: context.targetCurrency,
          recipientAccountId: input.recipientAccountId,
          ...(input.recipientDefaultCurrency
            ? { recipientDefaultCurrency: input.recipientDefaultCurrency }
            : {}),
        },
        now(),
      );
      quote = checked.quote;
      if (
        !quote.recipient ||
        quote.recipient.defaultCurrency !== context.defaultCurrency ||
        quote.source.accountId !== context.source.accountId
      )
        throw new Error("Invalid quoted recipient context.");
      source = quote.source;
      target = quote.target;
      credit = BigInt(target.amountMinor);
      defaultMetadata = {
        currency: quote.recipient.defaultCurrency,
        name: quote.recipient.defaultName,
        exponent: quote.recipient.defaultExponent,
      };
    } else {
      if (context.sourceBefore < context.amountMinor)
        throw new TransferError("INSUFFICIENT_FUNDS");
      defaultMetadata = context.defaultMetadata!;
      if (!defaultMetadata) {
        if (prepared.error) throw prepared.error;
        if (
          !prepared.catalog ||
          !cacheEligible(prepared.catalog.fetchedAt, now())
        )
          throw new Error("No eligible recipient metadata.");
        const metadata = prepared.catalog.currencies.find(
          (c) => c.code === context.defaultCurrency,
        );
        if (!metadata) throw new TransferError("INVALID_TARGET_CURRENCY");
        defaultMetadata = {
          currency: metadata.code,
          name: metadata.name,
          exponent: metadata.exponent,
        };
      }
      timestamp(now());
      source = {
        ...context.source,
        amount: formatAmount(context.amountMinor, context.source.exponent),
        amountMinor: context.amountMinor.toString(),
      };
      target = {
        currency: source.currency,
        name: source.name,
        exponent: source.exponent,
        accountId: input.recipientAccountId,
        amount: source.amount,
        amountMinor: source.amountMinor,
      };
      credit = context.amountMinor;
    }
    assertTransferTargetBounds(context.targetBefore, credit);
  } catch (error) {
    const problem = knownProblem(error, key);
    if (problem) return problem;
    throw error;
  }

  // After this point every exception must escape and roll back creation, money,
  // quote consumption and the eventual retained success. No business-error catch.
  for (const metadata of [defaultMetadata, target]) {
    if (!currencyMetadata(database, metadata.currency))
      database.db
        .insert(currencies)
        .values({
          code: metadata.currency,
          name: metadata.name,
          minorUnit: metadata.exponent,
        })
        .run();
  }
  if (!context.recipientExisted)
    scope.createDestination({
      id: input.recipientAccountId,
      defaultCurrency: context.defaultCurrency,
    });
  const targetWalletId = context.targetWalletId ?? randomUUID();
  if (!context.targetWalletId)
    scope.createWallet({
      id: targetWalletId,
      accountId: input.recipientAccountId,
      currencyCode: context.targetCurrency,
    });
  const transactionId = randomUUID();
  scope.record(
    {
      id: transactionId,
      type: "transfer",
      sourceWalletId: input.sourceWalletId,
      targetWalletId,
      amountMinor: context.amountMinor,
      ...(quote
        ? {
            rate: {
              value: quote.rate.value,
              date: quote.rate.date,
              fetchedAt: quote.rate.fetchedAt,
              source: quote.rate.source,
            },
          }
        : {}),
    },
    quote
      ? () => {
          consumeQuote(database, quote.quoteId, transactionId, now());
        }
      : undefined,
  );
  const stored = database.sqlite
    .prepare<[string], { created_at: string }>(
      "SELECT created_at FROM transactions WHERE id=?",
    )
    .get(transactionId);
  if (!stored) throw new Error("Missing completed transfer.");
  return {
    requestKey: key,
    transactionId,
    type: "transfer",
    status: "completed",
    source: {
      ...source,
      balanceMinor: (context.sourceBefore - context.amountMinor).toString(),
    },
    target: {
      ...target,
      walletId: targetWalletId,
      balanceMinor: (context.targetBefore + credit).toString(),
    },
    recipient: {
      accountId: input.recipientAccountId,
      defaultCurrency: context.defaultCurrency,
      defaultName: defaultMetadata.name,
      defaultExponent: defaultMetadata.exponent,
      created: !context.recipientExisted,
    },
    createdAt: stored.created_at,
    ...(quote
      ? {
          quoteId: quote.quoteId,
          rate: { ...quote.rate },
          issuedAt: quote.issuedAt,
          expiresAt: quote.expiresAt,
        }
      : { quoteId: null, rate: null, issuedAt: null, expiresAt: null }),
  };
}

/** Atomic transfer service, shared by the HTTP adapter and isolated tests. Rates must
 * already be reviewed via a server quote; same-currency transfers never fetch one.
 * Only a genuinely missing recipient-default currency may need catalog metadata. */
export async function submitTransfer(
  database: WalletDatabase,
  requestKey: unknown,
  rawInput: unknown,
  dependencies: { now?: () => number; client?: FrankfurterClient } = {},
): Promise<TransferResult> {
  const key = normalizeRequestKey(requestKey);
  if (
    !key ||
    !isTransferRequest(rawInput) ||
    Buffer.byteLength(JSON.stringify(rawInput)) > 16384
  )
    return {
      status: 400,
      body: transferProblem(
        400,
        "INVALID_TRANSFER_REQUEST",
        "Supply a UUID key, exact source/recipient/amount and only optional target/default currency and quote ID. No rate/receive overrides.",
        true,
        key ?? undefined,
      ),
      replayed: false,
    };
  const input = Object.freeze({
    ...rawInput,
    ...(rawInput.quoteId
      ? { quoteId: normalizeRequestKey(rawInput.quoteId)! }
      : {}),
  });
  const canonical = canonicalTransferRequest(input),
    now = dependencies.now ?? Date.now;
  try {
    if (database.sqlite.inTransaction)
      throw new Error("Transfer requires a top-level writer.");
    const existing = database.sqlite.transaction(() =>
      replay(database, key, input, canonical),
    )();
    if (existing) return existing;
    const prepared: Prepared = {};
    let before;
    try {
      before = database.sqlite.transaction(() =>
        transferContext(database, input),
      )();
    } catch (error) {
      if (!knownProblem(error, key)) throw error;
    }
    if (before && !before.crossCurrency && !before.defaultMetadata) {
      try {
        prepared.catalog = await getCurrencyCatalog(database, dependencies);
      } catch (error) {
        prepared.error = error;
      } // Recheck durable replay before using this failure.
    }
    return withJournalWrite(database, (scope) => {
      const existing = replay(database, key, input, canonical);
      if (existing) return existing;
      const body = execute(database, scope, key, input, prepared, now);
      const status = "transactionId" in body ? 200 : body.status;
      confirmedTransferResult(
        body,
        String(status),
        "transactionId" in body ? body.transactionId : null,
        key,
        input,
      );
      database.db
        .insert(transferAttempts)
        .values({
          key,
          request: canonical,
          status: String(status),
          response: JSON.stringify(body),
          transactionId: "transactionId" in body ? body.transactionId : null,
        })
        .run();
      return { status, body, replayed: false };
    });
  } catch {
    return {
      status: 503,
      body: transferProblem(
        503,
        "TRANSFER_OUTCOME_UNKNOWN",
        "The outcome could not be confirmed. Retry the identical request with its original key and quote. Do not create a replacement attempt.",
        false,
        key,
      ),
      replayed: false,
    };
  }
}
