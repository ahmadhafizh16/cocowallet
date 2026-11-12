"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { confirmedRecentHistory } from "./preview";
import type { HistoryPage, TransactionType } from "./contracts";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Check,
} from "lucide-react";
import { historyTypeLabel } from "./transaction-facts";

export function RecentTransactions({
  accountId,
  type,
  hidden,
  revision,
  onClear,
  onOpenTransaction,
}: {
  accountId: string;
  type?: TransactionType;
  hidden: boolean;
  revision: object;
  onClear: () => void;
  onOpenTransaction?: (id: string) => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    accountId: string;
    type?: TransactionType;
    revision: object;
    attempt: number;
    page?: HistoryPage;
    error?: boolean;
  }>();
  useEffect(() => {
    const abort = new AbortController();
    let current = true;
    const timeout = window.setTimeout(() => abort.abort(), 15000);
    void (async () => {
      try {
        const query = new URLSearchParams({
          accountId,
          page: "1",
          pageSize: "50",
          ...(type ? { type } : {}),
        });
        const response = await fetch(`/api/transactions?${query}`, {
          cache: "no-store",
          signal: abort.signal,
        });
        if (!response.ok) throw new Error("Unavailable history");
        const page = confirmedRecentHistory(
          await response.json(),
          accountId,
          type,
        );
        if (current) setState({ accountId, type, revision, attempt, page });
      } catch {
        if (current)
          setState({ accountId, type, revision, attempt, error: true });
      } finally {
        clearTimeout(timeout);
      }
    })();
    return () => {
      current = false;
      clearTimeout(timeout);
      abort.abort();
    };
  }, [accountId, type, revision, attempt]);
  const visible =
    state?.accountId === accountId &&
    state.type === type &&
    state.revision === revision &&
    state.attempt === attempt
      ? state
      : undefined;
  if (hidden)
    return (
      <p className="text-sm text-muted-foreground">
        Transaction amounts hidden.
      </p>
    );
  if (!visible)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Loading this account’s completed activity…
      </p>
    );
  if (visible.error)
    return (
      <div className="space-y-3">
        <p role="status" className="text-sm text-muted-foreground">
          This account’s recent activity could not be loaded. No other account’s
          history is shown.
        </p>
        <Button
          variant="outline"
          onClick={() => setAttempt((value) => value + 1)}
        >
          Retry recent activity
        </Button>
      </div>
    );
  const records = visible.page!.transactions;
  if (!records.length)
    return (
      <div className="wallet-history-empty">
        <span className="wallet-empty-symbol">
          <ArrowDownLeft aria-hidden="true" />
        </span>
        <div>
          <h3>No matching completed activity</h3>
          <p>Your completed transactions will appear here.</p>
          {type && (
            <Button
              variant="ghost"
              size="sm"
              className="wallet-reset-filter"
              onClick={onClear}
            >
              Clear filter
            </Button>
          )}
        </div>
      </div>
    );
  return (
    <ul className="wallet-recent-list" aria-label="Recent completed activity">
      {records.slice(0, 5).map((t) => {
        const incoming = t.direction === "incoming";
        const Icon =
          t.type === "conversion"
            ? ArrowRightLeft
            : incoming
              ? ArrowDownLeft
              : ArrowUpRight;
        const side = incoming ? t.target! : t.source!;
        const time = new Intl.DateTimeFormat("en", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "UTC",
        }).format(new Date(t.createdAt));
        return (
          <li key={t.transactionId} className="wallet-recent-row">
            <Button
              type="button"
              variant="ghost"
              className="wallet-recent-button"
              onClick={() => onOpenTransaction?.(t.transactionId)}
              aria-label={`View ${historyTypeLabel(t).toLowerCase()} · ${side.amount} ${side.currency}${t.type === "conversion" ? ` to ${t.target!.amount} ${t.target!.currency}` : ""} · ${t.createdAt} · Completed · ${t.transactionId}`}
            >
              <span
                className={`wallet-transaction-icon ${incoming ? "is-credit" : t.type === "conversion" ? "is-conversion" : "is-debit"}`}
                aria-hidden="true"
              >
                <Icon />
              </span>
              <span className="wallet-transaction-identity">
                <span className="wallet-transaction-title">
                  {historyTypeLabel(t)}
                </span>
                <time dateTime={t.createdAt}>{time} UTC</time>
              </span>
              <span className="wallet-transaction-amounts">
                <span className={incoming ? "wallet-credit" : "wallet-debit"}>
                  {incoming ? "+" : "−"}
                  {side.amount} <span>{side.currency}</span>
                </span>
                {t.type === "conversion" && (
                  <span className="wallet-credit">
                    +{t.target!.amount} {t.target!.currency}
                  </span>
                )}
              </span>
              <span className="wallet-transaction-status" title="Completed">
                <Check aria-hidden="true" />
                <span className="wallet-status-label">Completed</span>
              </span>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
