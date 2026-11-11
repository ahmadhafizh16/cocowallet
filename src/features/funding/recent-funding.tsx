import { displayAmount } from "../wallet/presentation";
import { PROVIDERS } from "../wallet/operation-model";
import type { FundingReceipt } from "./contracts";

export function RecentFunding({
  receipts,
  hidden,
}: {
  receipts: FundingReceipt[];
  hidden: boolean;
}) {
  if (hidden)
    return (
      <p className="text-sm text-muted-foreground">
        Transaction amounts hidden.
      </p>
    );
  return (
    <ul className="space-y-4" aria-label="Completed simulated funding">
      {receipts.map((receipt) => (
        <li
          key={receipt.transactionId}
          className="min-w-0 border-b border-border pb-4 last:border-0"
        >
          <details>
            <summary className="cursor-pointer min-h-11 py-2 text-sm wrap-anywhere">
              {receipt.type === "deposit" ? "Deposit" : "Withdrawal"} ·{" "}
              {displayAmount(BigInt(receipt.amountMinor), receipt.exponent)}{" "}
              {receipt.currency}
            </summary>
            <dl className="space-y-2 text-sm wrap-anywhere">
              <div>
                <dt className="text-muted-foreground">Transaction ID</dt>
                <dd>{receipt.transactionId}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Recorded at (UTC)</dt>
                <dd>
                  <time dateTime={receipt.createdAt}>{receipt.createdAt}</time>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>Completed simulation</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Fictional provider</dt>
                <dd>
                  {PROVIDERS.find((p) => p.code === receipt.provider)?.label}
                </dd>
              </div>
            </dl>
          </details>
        </li>
      ))}
    </ul>
  );
}
