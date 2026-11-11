import { randomUUID } from "node:crypto";
import { confirmedResult } from "./recovery";
import type { WalletDatabase } from "../../server/db/connection";
import { fundingAttempts } from "../../server/db/schema";
import { readWalletBalance } from "../journal/balances";
import { withJournalWrite, type JournalWriteScope } from "../journal/write";
import { getCurrencyExponent } from "../money/currency-precision";
import { MAX_MINOR, MoneyError, parseAmount } from "../money/money";
import {
  fundingProblem,
  isFundingProvider,
  normalizeRequestKey,
  validFundingInput,
  type FundingKind,
  type FundingProblem,
  type FundingReceipt,
  type FundingRequest,
  type FundingResult,
} from "./contracts";

function executeFunding(
  database: WalletDatabase,
  scope: JournalWriteScope,
  kind: FundingKind,
  key: string,
  request: FundingRequest,
): FundingReceipt | FundingProblem {
  const fail = (
    status: FundingProblem["status"],
    code: string,
    detail: string,
  ) => fundingProblem(status, code, detail, true, key);
  const wallet = database.sqlite
    .prepare<
      [string],
      {
        account_id: string;
        role: string;
        currency_code: string;
        minor_unit: bigint;
      }
    >(
      `SELECT w.account_id, a.role, w.currency_code, c.minor_unit FROM wallets w
     LEFT JOIN accounts a ON a.id = w.account_id LEFT JOIN currencies c ON c.code = w.currency_code WHERE w.id = ?`,
    )
    .get(request.walletId);
  if (!wallet)
    return fail(
      404,
      "WALLET_NOT_FOUND",
      "The requested wallet does not exist.",
    );
  if (wallet.role !== "main" && wallet.role !== "destination")
    throw new Error("Invalid stored account.");
  if (wallet.role === "destination")
    return fail(
      409,
      "INSPECT_ONLY",
      "Only the main account can initiate money operations.",
    );
  const exponent = getCurrencyExponent(wallet.currency_code);
  if (wallet.minor_unit !== BigInt(exponent))
    throw new Error("Invalid stored precision.");
  let amount: bigint;
  try {
    amount = parseAmount(request.amount, exponent);
  } catch (error) {
    if (!(error instanceof MoneyError)) throw error;
    return fail(
      400,
      error.code.toUpperCase(),
      "Enter a positive amount within the wallet’s precision and supported monetary range.",
    );
  }
  const before = readWalletBalance(database, request.walletId);
  if (kind === "withdrawal" && before < amount)
    return fail(
      409,
      "INSUFFICIENT_FUNDS",
      "The wallet has insufficient funds. No withdrawal was completed.",
    );
  if (kind === "deposit" && before + amount > MAX_MINOR)
    return fail(
      409,
      "BALANCE_OUT_OF_RANGE",
      "This deposit would exceed the supported wallet balance.",
    );
  if (!isFundingProvider(request.provider))
    throw new Error("Unvalidated provider.");
  const id = randomUUID();
  // All known business failures are resolved before using the fail-closed scope.
  // Any scope/storage failure must escape and roll back, never become a receipt.
  scope.record({
    id,
    amountMinor: amount,
    provider: request.provider,
    ...(kind === "deposit"
      ? { type: "deposit", targetWalletId: request.walletId }
      : { type: "withdrawal", sourceWalletId: request.walletId }),
  });
  const stored = database.sqlite
    .prepare<[string], { created_at: string }>(
      "SELECT created_at FROM transactions WHERE id = ?",
    )
    .get(id);
  if (!stored) throw new Error("Missing completed transaction.");
  return {
    requestKey: key,
    transactionId: id,
    type: kind,
    status: "completed",
    accountId: wallet.account_id,
    walletId: request.walletId,
    currency: wallet.currency_code,
    exponent,
    amountMinor: amount.toString(),
    balanceMinor: (kind === "deposit"
      ? before + amount
      : before - amount
    ).toString(),
    provider: request.provider,
    createdAt: stored.created_at,
  };
}

/** One reservation covers replay lookup, funds validation, journal and result. */
export function submitFunding(
  database: WalletDatabase,
  kind: FundingKind,
  requestKey: unknown,
  input: unknown,
): FundingResult {
  const key = normalizeRequestKey(requestKey);
  if (
    !key ||
    !validFundingInput(input) ||
    !["deposit", "withdrawal"].includes(kind)
  ) {
    return {
      status: 400,
      body: fundingProblem(
        400,
        "INVALID_FUNDING_REQUEST",
        "Supply a UUID Idempotency-Key and exactly walletId, plain-decimal amount and supported provider strings.",
        true,
        key ?? undefined,
      ),
      replayed: false,
    };
  }
  const canonical = JSON.stringify([
    kind,
    input.walletId,
    input.amount,
    input.provider,
  ]);
  try {
    return withJournalWrite(database, (scope): FundingResult => {
      const existing = database.sqlite
        .prepare<
          [string],
          { request: string; status: string; response: string }
        >(
          "SELECT request, status, response FROM funding_attempts WHERE key = ?",
        )
        .get(key);
      const conflict = (): FundingResult => ({
        status: 409,
        body: fundingProblem(
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
        const body = confirmedResult(
          JSON.parse(existing.response),
          Number(existing.status),
          { version: 1, key, kind, request: input },
        );
        const status = Number(existing.status) as FundingResult["status"];
        if (
          ![200, 400, 404, 409].includes(status) ||
          !body ||
          body.requestKey !== key ||
          (status === 200
            ? !("transactionId" in body)
            : !("definitive" in body) || !body.definitive)
        )
          throw new Error("Invalid stored outcome.");
        return { status, body, replayed: true };
      }
      if (
        database.sqlite
          .prepare("SELECT key FROM conversion_attempts WHERE key=?")
          .get(key)
      )
        return conflict();
      const body = executeFunding(database, scope, kind, key, input);
      const status = "transactionId" in body ? 200 : body.status;
      database.db
        .insert(fundingAttempts)
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
      body: fundingProblem(
        503,
        "FUNDING_OUTCOME_UNKNOWN",
        "The outcome could not be confirmed. Retry the identical request with the same Idempotency-Key.",
        false,
        key,
      ),
      replayed: false,
    };
  }
}
