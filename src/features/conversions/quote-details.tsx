"use client";
import { Button } from "@/components/ui/button";
import { readableDate, readableTime } from "@/lib/date-presentation";
import type { useConversionQuote } from "./use-quote";

export function QuoteDetails({
  preview,
  accountId,
  hidden,
}: {
  preview: ReturnType<typeof useConversionQuote>;
  accountId: string;
  hidden: boolean;
}) {
  if (hidden) return null;
  const quote = preview.quote;
  return (
    <div className="wallet-quote-details">
      <p className="text-sm text-muted-foreground" role="status">
        {preview.pending
          ? "Getting your exchange rate…"
          : (preview.message ??
            (preview.expired
              ? "This quote expired or your device time changed. Get a new quote and review it before confirming."
              : "Your rate is fixed until the time below. Funds are checked when you confirm."))}
      </p>
      {quote && (
        <dl className="wallet-dialog-facts text-sm">
          {[
            [
              "Reference rate",
              `1 ${quote.source.currency} = ${quote.rate.value} ${quote.target.currency}`,
            ],
            ["Rate date", readableDate(quote.rate.date)],
            ["Updated", readableTime(quote.rate.fetchedAt)],
            [
              "Rate source",
              quote.rate.source === "cached"
                ? "Cached reference rate"
                : "Latest reference rate",
            ],
            ["Valid until", readableTime(quote.expiresAt)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {(!quote || preview.expired || preview.pending) && (
        <Button
          variant="outline"
          loading={preview.pending}
          disabled={!preview.request}
          onClick={() => {
            if (preview.request) void preview.load(preview.request, accountId);
          }}
        >
          Get a new quote
        </Button>
      )}
    </div>
  );
}
