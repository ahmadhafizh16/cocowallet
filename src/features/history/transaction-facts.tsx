"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Check,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CurrencyFlag } from "../wallet/currency-flag";
import type { HistoryTransaction } from "./contracts";
import { PROVIDERS } from "../wallet/operation-model";
import { readableDate, readableTime } from "@/lib/date-presentation";

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
  const [copyError, setCopyError] = useState<string>(),
    [copied, setCopied] = useState<{ label: string }>(),
    [copying, setCopying] = useState<string>();
  const values = useRef<Record<string, HTMLElement | null>>({});
  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(undefined), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);
  async function copy(label: string, value: string) {
    setCopying(label);
    setCopied(undefined);
    setCopyError(undefined);
    try {
      await navigator.clipboard.writeText(value);
      setCopied({ label });
    } catch {
      const element = values.current[label];
      if (element) {
        element.focus();
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      setCopyError(
        "Copy unavailable. The ID is selected; use your device’s Copy command.",
      );
    } finally {
      setCopying(undefined);
    }
  }
  const facts: Array<[string, ReactNode, string?]> = [
    ["Transaction ID", t.transactionId, t.transactionId],
    [
      "Type",
      <span key="type" className="wallet-detail-type">
        <TransactionDirection transaction={t} />
        {historyTypeLabel(t)}
      </span>,
    ],
    ["Status", <CompletedStatus key="status" />],
    ...(["source", "target"] as const).flatMap((key) => {
      const side = t[key];
      if (!side) return [];
      const label = key === "source" ? "Source" : "Target";
      return [
        [`${label} amount`, `${side.amount} ${side.currency}`],
        [
          `${label} currency`,
          <span key={`${key}-currency`} className="wallet-detail-currency">
            <span className="wallet-detail-flag">
              <CurrencyFlag currency={side.currency} />
            </span>
            <span>
              {side.currency} · {side.name}
            </span>
          </span>,
        ],
        [`${label} account`, side.accountId, side.accountId],
        [`${label} wallet`, side.walletId, side.walletId],
      ] as Array<[string, ReactNode, string?]>;
    }),
    ...(t.provider
      ? [
          ["Provider", PROVIDERS.find((p) => p.code === t.provider)!.label] as [
            string,
            ReactNode,
          ],
        ]
      : []),
    ...(t.rate
      ? ([
          [
            "Applied reference rate",
            `1 ${t.source!.currency} = ${t.rate.value} ${t.target!.currency}`,
          ],
          ["Rate date", readableDate(t.rate.date)],
          ["Updated", readableTime(t.rate.fetchedAt)],
          [
            "Reference data",
            t.rate.source === "cached"
              ? "Cached · original retrieval time"
              : "Fresh · original retrieval time",
          ],
        ] as Array<[string, ReactNode]>)
      : t.type === "transfer"
        ? [["FX", "Same currency · no FX rate"] as [string, ReactNode]]
        : []),
    [
      "Recorded at (UTC)",
      <time key="recorded" dateTime={t.createdAt}>
        {readableTime(t.createdAt)}
      </time>,
    ],
  ];
  return (
    <TooltipProvider delayDuration={0}>
      <dl className="wallet-detail-facts">
        {facts.map(([label, value, copyValue]) => (
          <div
            key={label}
            className={`wallet-detail-fact${label.endsWith(" amount") ? " is-amount" : ""}`}
          >
            <dt>{label}</dt>
            <dd>
              <bdi
                ref={(node) => {
                  values.current[label] = node;
                }}
                tabIndex={copyValue ? -1 : undefined}
              >
                {value}
              </bdi>
              {copyValue && (
                <Tooltip
                  open={copied?.label === label}
                  onOpenChange={(open) => {
                    if (!open)
                      setCopied((current) =>
                        current?.label === label ? undefined : current,
                      );
                  }}
                >
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="wallet-detail-copy"
                      aria-label={`Copy ${label.toLowerCase()}`}
                      loading={copying === label}
                      onClick={() => void copy(label, copyValue)}
                    >
                      <Copy aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Copied!</TooltipContent>
                </Tooltip>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p
        className={copyError ? "wallet-detail-copy-feedback" : "sr-only"}
        role="status"
      >
        {copyError ?? (copied ? "Copied!" : "")}
      </p>
    </TooltipProvider>
  );
}

export function CompletedStatus() {
  return (
    <span className="wallet-detail-completed">
      <Check aria-hidden="true" />
      Completed
    </span>
  );
}
export function TransactionDirection({
  transaction: t,
}: {
  transaction: HistoryTransaction;
}) {
  const Icon =
    t.type === "conversion"
      ? ArrowRightLeft
      : t.direction === "incoming"
        ? ArrowDownLeft
        : ArrowUpRight;
  return (
    <span
      className={`wallet-detail-direction ${t.direction === "incoming" ? "is-credit" : t.type === "conversion" ? "is-conversion" : "is-debit"}`}
      aria-hidden="true"
    >
      <Icon />
    </span>
  );
}
export function TransactionSummary({
  transaction: t,
}: {
  transaction: HistoryTransaction;
}) {
  const credit = t.direction === "incoming",
    side = credit ? t.target! : t.source!;
  return (
    <div
      className="wallet-detail-summary"
      aria-label="Recorded transaction amount"
    >
      <strong className={credit ? "wallet-credit" : "wallet-debit"}>
        <bdi>
          {credit ? "+" : "−"}
          {side.amount} {side.currency}
        </bdi>
      </strong>
      {t.type === "conversion" && (
        <strong className="wallet-credit wallet-detail-receiving">
          <bdi>
            +{t.target!.amount} {t.target!.currency}
          </bdi>
        </strong>
      )}
      <span>{historyTypeLabel(t)}</span>
    </div>
  );
}
