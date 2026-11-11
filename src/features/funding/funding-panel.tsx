"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { displayAmount } from "../wallet/presentation";
import { PROVIDERS } from "../wallet/operation-model";
import type { useFunding } from "./use-funding";

export function FundingPanel({
  funding,
  hidden,
  onClose,
  onAnother,
}: {
  funding: ReturnType<typeof useFunding>;
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
              {intent.request.walletId}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Amount</dt>
            <dd className="min-w-0 text-right wrap-anywhere">
              {hidden
                ? "Amount hidden"
                : receipt
                  ? `${displayAmount(BigInt(receipt.amountMinor), receipt.exponent)} ${receipt.currency}`
                  : intent.request.amount}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Fictional provider</dt>
            <dd>
              {PROVIDERS.find((p) => p.code === intent.request.provider)?.label}
            </dd>
          </div>
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
                <dt>Balance after this operation</dt>
                <dd className="min-w-0 text-right wrap-anywhere">
                  {hidden
                    ? "Amount hidden"
                    : `${displayAmount(BigInt(receipt.balanceMinor), receipt.exponent)} ${receipt.currency}`}
                </dd>
              </div>
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
