"use client";
import { useEffect, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { useConversionQuote } from "./use-quote";

export function ConversionQuoteReview({
  preview,
  hidden,
  ready,
  heading,
  onConfirm,
  onEdit,
  onClose,
  accountId,
}: {
  preview: ReturnType<typeof useConversionQuote>;
  hidden: boolean;
  ready: boolean;
  heading: RefObject<HTMLHeadingElement | null>;
  onConfirm: () => void;
  onEdit: () => void;
  onClose: () => void;
  accountId: string;
}) {
  const quote = preview.quote;
  useEffect(() => {
    heading.current?.focus();
  }, [heading, preview.pending, quote, preview.message]);
  return (
    <div className="wallet-dialog-review space-y-5" aria-busy={preview.pending}>
      <h3 ref={heading} tabIndex={-1} className="text-lg font-semibold">
        Review conversion
      </h3>
      <p role="status" className="text-sm text-muted-foreground">
        {preview.pending
          ? "Requesting fixed server terms. No funds are moved or reserved."
          : (preview.message ??
            (preview.expired
              ? "This quote expired or the device clock changed. Request fresh terms and review them before confirming."
              : "No funds are reserved. Confirm these fixed terms before expiry; the server rechecks available funds."))}
      </p>
      {quote && !hidden && (
        <dl className="wallet-dialog-facts space-y-3 text-sm">
          {[
            ["You convert", `${quote.source.amount} ${quote.source.currency}`],
            ["You receive", `${quote.target.amount} ${quote.target.currency}`],
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
          ].map(([label, value]) => (
            <div className="flex justify-between gap-4" key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="min-w-0 text-right wrap-anywhere">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {hidden && (
        <p className="text-sm text-muted-foreground">
          Amounts and quote details hidden. Show amounts before confirming.
        </p>
      )}
      <Button
        className="w-full"
        disabled={
          !quote || preview.pending || preview.expired || hidden || !ready
        }
        onClick={onConfirm}
      >
        Confirm simulated conversion
      </Button>
      {!preview.pending && (!quote || preview.expired) && (
        <Button
          className="w-full"
          variant="outline"
          onClick={() => {
            if (preview.request) void preview.load(preview.request, accountId);
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
