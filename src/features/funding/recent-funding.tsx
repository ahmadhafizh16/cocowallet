import { displayAmount } from "../wallet/presentation";
import { PROVIDERS } from "../wallet/operation-model";
import type { FundingReceipt } from "./contracts";
import type { ConversionReceipt } from "../conversions/contracts";
import { readableDate, readableTime } from "@/lib/date-presentation";

export function RecentFunding({
  receipts,
  hidden,
}: {
  receipts: (FundingReceipt | ConversionReceipt)[];
  hidden: boolean;
}) {
  if (hidden)
    return (
      <p className="text-sm text-muted-foreground">
        Transaction amounts hidden.
      </p>
    );
  return (
    <ul className="space-y-4" aria-label="Completed activity">
      {receipts.map((receipt) => (
        <li
          key={receipt.transactionId}
          className="min-w-0 border-b border-border pb-4 last:border-0"
        >
          <details>
            <summary className="cursor-pointer min-h-11 py-2 text-sm wrap-anywhere">
              {receipt.type === "conversion" ? (
                `Conversion · ${receipt.source.amount} ${receipt.source.currency} → ${receipt.target.amount} ${receipt.target.currency}`
              ) : (
                <>
                  {receipt.type === "deposit" ? "Deposit" : "Withdrawal"} ·{" "}
                  {displayAmount(BigInt(receipt.amountMinor), receipt.exponent)}{" "}
                  {receipt.currency}
                </>
              )}
            </summary>
            <dl className="space-y-2 text-sm wrap-anywhere">
              <div>
                <dt className="text-muted-foreground">Transaction ID</dt>
                <dd>{receipt.transactionId}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Recorded at (UTC)</dt>
                <dd>
                  <time dateTime={receipt.createdAt}>
                    {readableTime(receipt.createdAt)}
                  </time>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>Completed</dd>
              </div>
              {receipt.type !== "conversion" ? (
                <div>
                  <dt className="text-muted-foreground">Provider</dt>
                  <dd>
                    {PROVIDERS.find((p) => p.code === receipt.provider)?.label}
                  </dd>
                </div>
              ) : (
                <>
                  <div>
                    <dt className="text-muted-foreground">Reference rate</dt>
                    <dd>
                      1 {receipt.source.currency} = {receipt.rate.value}{" "}
                      {receipt.target.currency}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Rate source date</dt>
                    <dd>
                      {readableDate(receipt.rate.date)} ·{" "}
                      {receipt.rate.source === "cached" ? "Cached" : "Fresh"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">
                      Rate fetched at (UTC)
                    </dt>
                    <dd>{readableTime(receipt.rate.fetchedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Quote ID</dt>
                    <dd>{receipt.quoteId}</dd>
                  </div>
                </>
              )}
            </dl>
          </details>
        </li>
      ))}
    </ul>
  );
}
