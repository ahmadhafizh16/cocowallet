"use client";
import { useEffect, useState } from "react";
import type { WalletRecord } from "../accounts/types";
import { portfolioFingerprint, type PortfolioView } from "./contracts";
import { confirmedPortfolio } from "./preview";

export function usePortfolio(
  accountId: string | undefined,
  wallets: WalletRecord[],
  revision: object,
  enabled: boolean,
) {
  const key = JSON.stringify({
    accountId,
    wallets: portfolioFingerprint(wallets),
  });
  const [attempt, retry] = useState(0),
    [state, setState] = useState<{
      key: string;
      revision: object;
      attempt: number;
      view?: PortfolioView;
      failed?: boolean;
    }>();
  useEffect(() => {
    if (!enabled) return;
    const context = JSON.parse(key) as { accountId?: string; wallets: string };
    if (!context.accountId) return;
    const abort = new AbortController();
    let current = true;
    const timeout = window.setTimeout(() => abort.abort(), 15000);
    void (async () => {
      try {
        const response = await fetch(
          `/api/portfolio?${new URLSearchParams({ accountId: context.accountId! })}`,
          { cache: "no-store", signal: abort.signal },
        );
        if (!response.ok) throw new Error("Unavailable portfolio.");
        // Wallet metadata originates in the same server overview; only exact context
        // fields are needed by the response validator, never local monetary drafts.
        const expected = (
          JSON.parse(context.wallets) as [string, string, number, string][]
        ).map(([id, currency, exponent, balanceMinor]) => ({
          id,
          currency,
          exponent,
          balanceMinor,
          accountId: context.accountId!,
          name: currency,
        }));
        const view = confirmedPortfolio(
          await response.json(),
          context.accountId!,
          expected,
        );
        if (current) setState({ key, revision, attempt, view });
      } catch {
        if (current) setState({ key, revision, attempt, failed: true });
      } finally {
        clearTimeout(timeout);
      }
    })();
    return () => {
      current = false;
      abort.abort();
      clearTimeout(timeout);
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
    view: visible?.view,
    pending: enabled && !visible,
    failed: visible?.failed,
    retry: () => retry((n) => n + 1),
  };
}
