"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { confirmedRecentHistory } from "./preview";
import type { HistoryPage, TransactionType } from "./contracts";
import { PROVIDERS } from "../wallet/operation-model";
import { ArrowDownLeft } from "lucide-react";

export function RecentTransactions({
  accountId,
  type,
  hidden,
  revision,
  onClear,
}: {
  accountId: string;
  type?: TransactionType;
  hidden: boolean;
  revision: object;
  onClear: () => void;
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
          <p>
            Completed simulations for this account will appear here. Rejected
            attempts are not transactions.
          </p>
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
    <ul className="space-y-4" aria-label="Completed simulated activity">
      {records.map((t) => (
        <li
          key={t.transactionId}
          className="min-w-0 border-b border-border pb-4 last:border-0"
        >
          <details>
            <summary className="cursor-pointer min-h-11 py-2 text-sm wrap-anywhere">
              {t.type === "transfer"
                ? `${t.direction === "incoming" ? "Incoming" : "Outgoing"} transfer`
                : t.type === "conversion"
                  ? "Conversion"
                  : t.type === "deposit"
                    ? "Deposit"
                    : "Withdrawal"}{" "}
              ·{" "}
              {t.source
                ? `${t.source.amount} ${t.source.currency}`
                : `${t.target!.amount} ${t.target!.currency}`}
              {t.source &&
                t.target &&
                ` → ${t.target.amount} ${t.target.currency}`}
            </summary>
            <dl className="space-y-2 text-sm wrap-anywhere">
              <div>
                <dt className="text-muted-foreground">Transaction ID</dt>
                <dd>{t.transactionId}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Recorded at (UTC)</dt>
                <dd>
                  <time dateTime={t.createdAt}>{t.createdAt}</time>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>Completed simulation</dd>
              </div>
              {t.type === "transfer" && (
                <>
                  <div>
                    <dt className="text-muted-foreground">From account</dt>
                    <dd>
                      <bdi>{t.source!.accountId}</bdi>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">
                      To inspect-only destination
                    </dt>
                    <dd>
                      <bdi>{t.target!.accountId}</bdi>
                    </dd>
                  </div>
                </>
              )}
              {t.provider && (
                <div>
                  <dt className="text-muted-foreground">Fictional provider</dt>
                  <dd>{PROVIDERS.find((p) => p.code === t.provider)?.label}</dd>
                </div>
              )}
              {t.rate ? (
                <>
                  <div>
                    <dt className="text-muted-foreground">Reference rate</dt>
                    <dd>
                      1 {t.source!.currency} = {t.rate.value}{" "}
                      {t.target!.currency}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Rate source date</dt>
                    <dd>
                      {t.rate.date} ·{" "}
                      {t.rate.source === "cached" ? "Cached" : "Fresh"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">
                      Rate fetched at (UTC)
                    </dt>
                    <dd>{t.rate.fetchedAt}</dd>
                  </div>
                </>
              ) : (
                t.type === "transfer" && (
                  <div>
                    <dt className="text-muted-foreground">FX</dt>
                    <dd>Same currency · no FX rate</dd>
                  </div>
                )
              )}
            </dl>
          </details>
        </li>
      ))}
    </ul>
  );
}
