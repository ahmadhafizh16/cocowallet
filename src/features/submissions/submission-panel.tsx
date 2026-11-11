"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { displayAmount } from "../wallet/presentation";
import { PROVIDERS } from "../wallet/operation-model";
import type { useSubmission } from "./use-submission";

export function SubmissionPanel({
  funding,
  hidden,
  onClose,
  onAnother,
}: {
  funding: ReturnType<typeof useSubmission>;
  hidden: boolean;
  onClose: () => void;
  onAnother: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [funding.pending, funding.result]);
  const receipt =
    funding.result && "transactionId" in funding.result
      ? funding.result
      : undefined;
  const problem =
    funding.result && "definitive" in funding.result
      ? funding.result
      : undefined;
  const intent = funding.intent;
  const conversion = receipt?.type === "conversion" ? receipt : undefined;
  const transfer = receipt?.type === "transfer" ? receipt : undefined;
  const movement = conversion ?? transfer;
  const fundingReceipt =
    receipt && (receipt.type === "deposit" || receipt.type === "withdrawal")
      ? receipt
      : undefined;
  return (
    <div className="wallet-dialog-review space-y-5" aria-busy={funding.pending}>
      <h3 ref={heading} tabIndex={-1} className="text-lg font-semibold">
        {receipt
          ? `Simulated ${receipt.type} completed`
          : problem
            ? "Submission not completed"
            : funding.pending
              ? "Confirming submission…"
              : "Submission needs recovery"}
      </h3>
      <p className="text-sm text-muted-foreground" role="status">
        {problem?.detail ??
          funding.message ??
          (receipt
            ? "Recorded in your simulated wallet. No real funds moved."
            : "Keep this request unchanged while the server confirms its result.")}
      </p>
      {problem && funding.message && (
        <p className="text-sm text-muted-foreground" role="status">
          {funding.message}
        </p>
      )}
      {intent && (
        <dl className="wallet-dialog-facts space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt>Wallet</dt>
            <dd className="min-w-0 text-right wrap-anywhere">
              {intent.kind === "conversion" || intent.kind === "transfer"
                ? intent.request.sourceWalletId
                : intent.request.walletId}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Amount</dt>
            <dd className="min-w-0 text-right wrap-anywhere">
              {hidden
                ? "Amount hidden"
                : movement
                  ? `${movement.source.amount} ${movement.source.currency} → ${movement.target.amount} ${movement.target.currency}`
                  : fundingReceipt
                    ? `${displayAmount(BigInt(fundingReceipt.amountMinor), fundingReceipt.exponent)} ${fundingReceipt.currency}`
                    : intent.request.amount}
            </dd>
          </div>
          {(intent.kind === "deposit" || intent.kind === "withdrawal") && (
            <div className="flex justify-between gap-4">
              <dt>Fictional provider</dt>
              <dd>
                {
                  PROVIDERS.find((p) => p.code === intent.request.provider)
                    ?.label
                }
              </dd>
            </div>
          )}
          {(intent.kind === "conversion" ||
            (intent.kind === "transfer" && intent.request.quoteId)) && (
            <div className="flex justify-between gap-4">
              <dt>Quote ID</dt>
              <dd className="min-w-0 text-right wrap-anywhere">
                {intent.request.quoteId}
              </dd>
            </div>
          )}
          {intent.kind === "transfer" && (
            <>
              <div className="flex justify-between gap-4">
                <dt>Simulated recipient</dt>
                <dd className="min-w-0 text-right wrap-anywhere">
                  <bdi>{intent.request.recipientAccountId}</bdi>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Destination default</dt>
                <dd>
                  {transfer?.recipient.defaultCurrency ??
                    intent.request.recipientDefaultCurrency ??
                    "Stored default"}
                </dd>
              </div>
              {transfer && (
                <div className="flex justify-between gap-4">
                  <dt>Destination context</dt>
                  <dd className="min-w-0 text-right wrap-anywhere">
                    {transfer.recipient.created
                      ? "New destination created · inspect only"
                      : "Stored destination · inspect only"}
                    {!transfer.rate && " · Same currency, no FX rate"}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt>Receive currency</dt>
                <dd>
                  {transfer?.target.currency ??
                    intent.request.targetCurrency ??
                    intent.request.recipientDefaultCurrency ??
                    "Stored default"}
                </dd>
              </div>
            </>
          )}
          <div className="flex justify-between gap-4">
            <dt>Retry key</dt>
            <dd className="min-w-0 text-right wrap-anywhere">{intent.key}</dd>
          </div>
          {receipt && (
            <>
              <div className="flex justify-between gap-4">
                <dt>Transaction ID</dt>
                <dd className="min-w-0 text-right wrap-anywhere">
                  {receipt.transactionId}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>
                  {movement
                    ? "Balances after this operation"
                    : "Balance after this operation"}
                </dt>
                <dd className="min-w-0 text-right wrap-anywhere">
                  {hidden ? (
                    "Amount hidden"
                  ) : movement ? (
                    <>
                      {displayAmount(
                        BigInt(movement.source.balanceMinor),
                        movement.source.exponent,
                      )}{" "}
                      {movement.source.currency}
                      <br />
                      {displayAmount(
                        BigInt(movement.target.balanceMinor),
                        movement.target.exponent,
                      )}{" "}
                      {movement.target.currency}
                    </>
                  ) : fundingReceipt ? (
                    `${displayAmount(BigInt(fundingReceipt.balanceMinor), fundingReceipt.exponent)} ${fundingReceipt.currency}`
                  ) : (
                    "Unavailable"
                  )}
                </dd>
              </div>
              {movement?.rate && !hidden && (
                <>
                  <div className="flex justify-between gap-4">
                    <dt>Reference rate</dt>
                    <dd className="min-w-0 text-right wrap-anywhere">
                      1 {movement.source.currency} = {movement.rate.value}{" "}
                      {movement.target.currency}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Rate source date</dt>
                    <dd>
                      {movement.rate.date} ·{" "}
                      {movement.rate.source === "cached" ? "Cached" : "Fresh"}
                    </dd>
                  </div>
                </>
              )}
              {!hidden && (
                <div className="flex justify-between gap-4">
                  <dt>Recorded at (UTC)</dt>
                  <dd className="min-w-0 text-right wrap-anywhere">
                    <time dateTime={receipt.createdAt}>
                      {receipt.createdAt}
                    </time>
                  </dd>
                </div>
              )}
            </>
          )}
        </dl>
      )}
      {!funding.result && intent && (
        <Button
          className="w-full"
          disabled={funding.pending || funding.storageBlocked}
          onClick={() => void funding.send()}
        >
          {funding.pending ? "Confirming…" : "Retry original submission"}
        </Button>
      )}
      <DialogFooter>
        {funding.result && (
          <Button
            variant="ghost"
            disabled={funding.storageBlocked}
            onClick={onAnother}
          >
            {receipt ? "Start another operation" : "Edit for a new attempt"}
          </Button>
        )}
        <Button variant="outline" onClick={onClose}>
          Back to overview
        </Button>
      </DialogFooter>
    </div>
  );
}
