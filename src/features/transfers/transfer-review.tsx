"use client";
import { useEffect, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import type { useConversionQuote } from "../conversions/use-quote";
import type { OperationReview } from "../wallet/operation-model";
import { formatAmount } from "../money/money";

export function TransferReview({
  review,
  preview,
  hidden,
  ready,
  heading,
  onConfirm,
  onEdit,
  onClose,
}: {
  review: OperationReview;
  preview: ReturnType<typeof useConversionQuote>;
  hidden: boolean;
  ready: boolean;
  heading: RefObject<HTMLHeadingElement | null>;
  onConfirm: () => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  const fx = review.wallet.currency !== review.targetCurrency;
  const quote = fx ? preview.quote : undefined;
  useEffect(() => {
    heading.current?.focus();
  }, [heading, preview.pending, quote, preview.message]);
  const facts = [
    ["From account", review.accountId],
    ["Simulated recipient", review.recipient],
    [
      "Recipient context",
      (quote?.recipient?.existed ?? review.recipientExisted)
        ? "Stored destination · inspect only"
        : "New destination · created only on success",
    ],
    [
      "Destination default",
      quote?.recipient?.defaultCurrency ?? review.recipientDefaultCurrency,
    ],
    [
      "You send",
      `${formatAmount(review.minor, review.wallet.exponent)} ${review.wallet.currency}`,
    ],
    [
      "Recipient receives",
      fx
        ? quote
          ? `${quote.target.amount} ${quote.target.currency}`
          : "Awaiting validated quote"
        : `${formatAmount(review.minor, review.wallet.exponent)} ${review.targetCurrency}`,
    ],
    ...(quote
      ? [
          [
            "Reference rate",
            `1 ${quote.source.currency} = ${quote.rate.value} ${quote.target.currency}`,
          ],
          ["Rate source date", quote.rate.date],
          ["Rate fetched at (UTC)", quote.rate.fetchedAt],
          [
            "Reference data",
            quote.rate.source === "cached"
              ? "Cached · original retrieval time"
              : "Fresh · latest available reference",
          ],
          ["Quote expires at (UTC)", quote.expiresAt],
        ]
      : []),
  ];
  return (
    <div
      className="wallet-dialog-review space-y-5"
      aria-busy={fx && preview.pending}
    >
      <h3 ref={heading} tabIndex={-1} className="text-lg font-semibold">
        Review transfer
      </h3>
      <p role="status" className="text-sm text-muted-foreground">
        {!fx
          ? "Same currency: identical minor units, no FX rate or quote. Nothing is reserved. The server rechecks funds and destination context on confirmation."
          : preview.pending
            ? "Requesting fixed server terms. No funds are moved or reserved; no destination is created."
            : (preview.message ??
              (preview.expired
                ? "This quote expired or the device clock changed. Request fresh terms and review them before confirming."
                : "No funds are reserved. Confirm these fixed terms before expiry; the server rechecks funds and destination context."))}
      </p>
      {!hidden ? (
        <dl className="wallet-dialog-facts space-y-3 text-sm">
          {facts.map(([label, value]) => (
            <div className="flex justify-between gap-4" key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="min-w-0 text-right wrap-anywhere">
                <bdi>{value}</bdi>
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">
          Amounts and quote details hidden. Show amounts before confirming.
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Local simulation only, not identity verification or a real payment.
        Existing destination defaults are never changed.
      </p>
      <Button
        className="w-full"
        disabled={
          !ready ||
          hidden ||
          (fx && (!quote || preview.pending || preview.expired))
        }
        onClick={onConfirm}
      >
        Confirm simulated transfer
      </Button>
      {fx && !preview.pending && (!quote || preview.expired) && (
        <Button
          className="w-full"
          variant="outline"
          onClick={() => {
            if (preview.request)
              void preview.load(preview.request, review.accountId);
          }}
        >
          Request fresh quote
        </Button>
      )}
      <DialogFooter>
        <Button variant="ghost" onClick={onEdit}>
          Edit details
        </Button>
        <Button variant="outline" onClick={onClose}>
          Back to overview
        </Button>
      </DialogFooter>
    </div>
  );
}
