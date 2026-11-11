import "server-only";
import { randomUUID } from "node:crypto";
import type { WalletDatabase } from "../../server/db/connection";
import { conversionAttempts, currencies } from "../../server/db/schema";
import { normalizeRequestKey } from "../funding/contracts";
import { readWalletBalance } from "../journal/balances";
import { withJournalWrite, type JournalWriteScope } from "../journal/write";
import { QuoteError } from "../quotes/contracts";
import { consumeQuote, validateQuoteForConfirmation } from "../quotes/service";
import {
  canonicalConversionRequest,
  conversionFailures,
  conversionProblem,
  isConversionRequest,
  type ConversionRequest,
  type ConversionResult,
} from "./contracts";
import { confirmedConversionResult } from "./receipt";

function executeConversion(
  database: WalletDatabase,
  scope: JournalWriteScope,
  key: string,
  input: ConversionRequest,
  now: () => number,
): ConversionResult["body"] {
  let checked;
  try {
    checked = validateQuoteForConfirmation(
      database,
      input.quoteId,
      {
        operation: "conversion",
        sourceWalletId: input.sourceWalletId,
        amount: input.amount,
        targetCurrency: input.targetCurrency,
      },
      now(),
    );
  } catch (error) {
    if (
      !(error instanceof QuoteError) ||
      !Object.hasOwn(conversionFailures, error.code)
    )
      throw error;
    const known =
      conversionFailures[error.code as keyof typeof conversionFailures];
    if (known.status !== error.status) throw error;
    return conversionProblem(known.status, error.code, known.detail, true, key);
  }
  // No business-error catch is permitted below this point: any creation, journal,
  // consumption, receipt or persistence error must roll the entire boundary back.
  const { quote, context } = checked;
  const sourceBefore = readWalletBalance(database, quote.source.walletId);
  if (!context.targetCurrency)
    database.db
      .insert(currencies)
      .values({
        code: quote.target.currency,
        name: quote.target.name,
        minorUnit: quote.target.exponent,
      })
      .run();
  const targetWalletId = context.targetWalletId ?? randomUUID();
  if (!context.targetWalletId)
    scope.createWallet({
      id: targetWalletId,
      accountId: quote.target.accountId,
      currencyCode: quote.target.currency,
    });
  const targetBefore = readWalletBalance(database, targetWalletId);
  const transactionId = randomUUID();
  scope.record(
    {
      id: transactionId,
      type: "conversion",
      sourceWalletId: quote.source.walletId,
      targetWalletId,
      amountMinor: BigInt(quote.source.amountMinor),
      rate: {
        value: quote.rate.value,
        date: quote.rate.date,
        fetchedAt: quote.rate.fetchedAt,
        source: quote.rate.source,
      },
    },
    () => {
      consumeQuote(database, quote.quoteId, transactionId, now());
    },
  );
  const stored = database.sqlite
    .prepare<[string], { created_at: string }>(
      "SELECT created_at FROM transactions WHERE id=?",
    )
    .get(transactionId);
  if (!stored) throw new Error("Missing completed conversion.");
  return {
    requestKey: key,
    transactionId,
    type: "conversion",
    status: "completed",
    quoteId: quote.quoteId,
    source: {
      ...quote.source,
      balanceMinor: (
        sourceBefore - BigInt(quote.source.amountMinor)
      ).toString(),
    },
    target: {
      ...quote.target,
      walletId: targetWalletId,
      balanceMinor: (
        targetBefore + BigInt(quote.target.amountMinor)
      ).toString(),
    },
    rate: { ...quote.rate },
    issuedAt: quote.issuedAt,
    expiresAt: quote.expiresAt,
    createdAt: stored.created_at,
  };
}

/** Internal backend service only. No provider calls or automatic retries. A
 * definitive result always precedes quote expiry/use/current-funds validation. */
export function submitConversion(
  database: WalletDatabase,
  requestKey: unknown,
  rawInput: unknown,
  dependencies: { now?: () => number } = {},
): ConversionResult {
  const key = normalizeRequestKey(requestKey);
  if (
    !key ||
    !isConversionRequest(rawInput) ||
    Buffer.byteLength(JSON.stringify(rawInput)) > 16384
  )
    return {
      status: 400,
      body: conversionProblem(
        400,
        "INVALID_CONVERSION_REQUEST",
        "Supply a UUID key and exactly quoteId, sourceWalletId, plain-decimal amount and targetCurrency. Do not supply rate or receive terms.",
        true,
        key ?? undefined,
      ),
      replayed: false,
    };
  const input = Object.freeze({
    ...rawInput,
    quoteId: normalizeRequestKey(rawInput.quoteId)!,
  });
  const canonical = canonicalConversionRequest(input);
  try {
    return withJournalWrite(database, (scope): ConversionResult => {
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
          "SELECT request,status,response,transaction_id FROM conversion_attempts WHERE key=?",
        )
        .get(key);
      const conflict = (): ConversionResult => ({
        status: 409,
        body: conversionProblem(
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
          throw new Error("Oversized stored conversion result.");
        const body = confirmedConversionResult(
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
            "SELECT key FROM funding_attempts WHERE key=? UNION ALL SELECT key FROM transfer_attempts WHERE key=? LIMIT 1",
          )
          .get(key, key)
      )
        return conflict();
      const body = executeConversion(
        database,
        scope,
        key,
        input,
        dependencies.now ?? Date.now,
      );
      const status = "transactionId" in body ? 200 : body.status;
      confirmedConversionResult(
        body,
        String(status),
        "transactionId" in body ? body.transactionId : null,
        key,
        input,
      );
      database.db
        .insert(conversionAttempts)
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
      body: conversionProblem(
        503,
        "CONVERSION_OUTCOME_UNKNOWN",
        "The outcome could not be confirmed. Retry the identical request with the same key and quote. Do not create a replacement attempt.",
        false,
        key,
      ),
      replayed: false,
    };
  }
}
