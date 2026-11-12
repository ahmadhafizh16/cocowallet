import type { HistoryTransaction } from "./contracts";
import { PROVIDERS } from "../wallet/operation-model";

export function historyTypeLabel(t: HistoryTransaction): string {
  return t.type === "transfer"
    ? `${t.direction === "incoming" ? "Incoming" : "Outgoing"} transfer`
    : t.type === "conversion"
      ? "Conversion"
      : t.type === "withdrawal"
        ? "Withdrawal"
        : "Deposit";
}
export function historyAmountLabel(t: HistoryTransaction): string {
  return `${t.source ? `${t.source.amount} ${t.source.currency}` : `${t.target!.amount} ${t.target!.currency}`}${t.source && t.target ? ` → ${t.target.amount} ${t.target.currency}` : ""}`;
}
export function TransactionFacts({
  transaction: t,
}: {
  transaction: HistoryTransaction;
}) {
  const facts = [
    ["Transaction ID", t.transactionId],
    ["Type", historyTypeLabel(t)],
    ["Status", "Completed"],
    ...(["source", "target"] as const).flatMap((key) => {
      const side = t[key];
      if (!side) return [];
      const label = key === "source" ? "Source" : "Target";
      return [
        [`${label} amount`, `${side.amount} ${side.currency}`],
        [`${label} currency`, `${side.currency} · ${side.name}`],
        [`${label} account`, side.accountId],
        [`${label} wallet`, side.walletId],
      ];
    }),
    ...(t.provider
      ? [
          [
            "Fictional provider",
            PROVIDERS.find((p) => p.code === t.provider)!.label,
          ],
        ]
      : []),
    ...(t.rate
      ? [
          [
            "Applied reference rate",
            `1 ${t.source!.currency} = ${t.rate.value} ${t.target!.currency}`,
          ],
          ["Rate source date", t.rate.date],
          ["Rate fetched at (UTC)", t.rate.fetchedAt],
          [
            "Reference data",
            t.rate.source === "cached"
              ? "Cached · original retrieval time"
              : "Fresh · original retrieval time",
          ],
        ]
      : t.type === "transfer"
        ? [["FX", "Same currency · no FX rate"]]
        : []),
  ];
  return (
    <dl className="grid gap-x-10 gap-y-5 text-sm wrap-anywhere sm:grid-cols-2">
      {facts.map(([label, value]) => (
        <div key={label} className="grid gap-1">
          <dt className="text-muted-foreground">{label}</dt>
          <dd>
            <bdi>{value}</bdi>
          </dd>
        </div>
      ))}
      <div className="grid gap-1">
        <dt className="text-muted-foreground">Recorded at (UTC)</dt>
        <dd>
          <time dateTime={t.createdAt}>{t.createdAt}</time>
        </dd>
      </div>
    </dl>
  );
}
