"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { displayAmount } from "../wallet/presentation";
import { PROVIDERS } from "../wallet/operation-model";
import type { useSubmission } from "./use-submission";
import { Check } from "lucide-react";

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
  const fundingReceipt =
    receipt && (receipt.type === "deposit" || receipt.type === "withdrawal")
      ? receipt
      : undefined;
  if (receipt) {
    const title =
      receipt.type === "transfer"
        ? "Transfer complete"
        : receipt.type === "deposit"
          ? "Deposit complete"
          : receipt.type === "withdrawal"
            ? "Withdrawal complete"
            : "Conversion complete";
    return (
      <div className="wallet-submission-success">
        <span className="wallet-success-check" aria-hidden="true">
          <Check strokeWidth={2.5} />
        </span>
        <h3 ref={heading} tabIndex={-1}>
          {title}
        </h3>
        <p className="wallet-success-summary" role="status">
          {hidden ? (
            "Your transaction is complete. Show amounts to view the confirmation."
          ) : transfer ? (
            <>
              Sent{" "}
              <strong>
                {transfer.source.amount} {transfer.source.currency}
              </strong>{" "}
              to <bdi>{transfer.target.accountId}</bdi>.
              {transfer.source.currency !== transfer.target.currency && (
                <>
                  {" "}
                  They received{" "}
                  <strong>
                    {transfer.target.amount} {transfer.target.currency}
                  </strong>
                  .
                </>
              )}
            </>
          ) : conversion ? (
            <>
              Converted{" "}
              <strong>
                {conversion.source.amount} {conversion.source.currency}
              </strong>{" "}
              to{" "}
              <strong>
                {conversion.target.amount} {conversion.target.currency}
              </strong>
              .
            </>
          ) : fundingReceipt ? (
            <>
              {fundingReceipt.type === "deposit" ? "Added" : "Withdrew"}{" "}
              <strong>
                {displayAmount(
                  BigInt(fundingReceipt.amountMinor),
                  fundingReceipt.exponent,
                )}{" "}
                {fundingReceipt.currency}
              </strong>{" "}
              {fundingReceipt.type === "deposit" ? "to" : "from"} your{" "}
              {fundingReceipt.currency} wallet.
            </>
          ) : (
            "Your wallet has been updated."
          )}
        </p>
        {funding.message && (
          <p className="text-sm text-muted-foreground" role="status">
            {funding.message}
          </p>
        )}
        <Button className="w-full" onClick={onClose}>
          Done
        </Button>
        {!funding.storageBlocked && (
          <Button variant="ghost" onClick={onAnother}>
            Start another operation
          </Button>
        )}
      </div>
    );
  }
  return (
    <div className="wallet-dialog-review space-y-5" aria-busy={funding.pending}>
      <h3 ref={heading} tabIndex={-1} className="text-lg font-semibold">
        {problem
          ? "Submission not completed"
          : funding.pending
            ? "Confirming submission…"
            : "Submission needs recovery"}
      </h3>
      <p className="text-sm text-muted-foreground" role="status">
        {problem?.detail ??
          funding.message ??
          "Keep this request unchanged while the server confirms its result."}
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
              {hidden ? "Amount hidden" : intent.request.amount}
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
                  {intent.request.recipientDefaultCurrency ?? "Stored default"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Receive currency</dt>
                <dd>
                  {intent.request.targetCurrency ??
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
            Edit for a new attempt
          </Button>
        )}
        <Button variant="outline" onClick={onClose}>
          Back to overview
        </Button>
      </DialogFooter>
    </div>
  );
}
