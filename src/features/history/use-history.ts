"use client";
import { useEffect, useState } from "react";
import type { HistoryDetail, HistoryPage, HistoryQuery } from "./contracts";
import { confirmedHistoryDetail, confirmedHistoryPage } from "./preview";

type Request =
  | { kind: "list"; query: HistoryQuery }
  | { kind: "detail"; accountId: string; transactionId: string };
type Result =
  | { kind: "list"; page: HistoryPage }
  | { kind: "detail"; detail: HistoryDetail };
type State = {
  key: string;
  revision: object;
  attempt: number;
  result?: Result;
  failure?: "missing" | "unavailable";
};
export function useHistoryRead(
  request: Request,
  revision: object,
  enabled: boolean,
) {
  // Only plain, locally built request context is encoded; no money draft or key.
  const key = JSON.stringify(request);
  const [attempt, retry] = useState(0),
    [state, setState] = useState<State>();
  useEffect(() => {
    if (!enabled) return;
    const original = JSON.parse(key) as Request;
    const abort = new AbortController();
    let current = true;
    const timeout = window.setTimeout(() => abort.abort(), 15000);
    void (async () => {
      try {
        const query =
          original.kind === "list"
            ? original.query
            : { accountId: original.accountId };
        const params = new URLSearchParams(
          Object.entries(query).map(([key, value]) => [key, String(value)]),
        );
        const path =
          original.kind === "list"
            ? "/api/transactions"
            : `/api/transactions/${encodeURIComponent(original.transactionId)}`;
        const response = await fetch(`${path}?${params}`, {
          cache: "no-store",
          signal: abort.signal,
        });
        if (response.status === 404 && original.kind === "detail") {
          if (current) setState({ key, revision, attempt, failure: "missing" });
          return;
        }
        if (!response.ok) throw new Error("History unavailable.");
        const value = await response.json();
        const result: Result =
          original.kind === "list"
            ? {
                kind: "list",
                page: confirmedHistoryPage(value, original.query),
              }
            : {
                kind: "detail",
                detail: confirmedHistoryDetail(
                  value,
                  original.accountId,
                  original.transactionId,
                ),
              };
        if (current) setState({ key, revision, attempt, result });
      } catch {
        if (current)
          setState({ key, revision, attempt, failure: "unavailable" });
      } finally {
        clearTimeout(timeout);
      }
    })();
    return () => {
      current = false;
      clearTimeout(timeout);
      abort.abort();
    };
  }, [key, revision, attempt, enabled]);
  const visible =
    enabled &&
    state?.key === key &&
    state.revision === revision &&
    state.attempt === attempt
      ? state
      : undefined;
  return {
    result: visible?.result,
    failure: visible?.failure,
    pending: enabled && !visible,
    retry: () => retry((value) => value + 1),
  };
}
