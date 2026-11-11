"use client";
import { useEffect, useRef, useState } from "react";
import { confirmedFxPreview } from "../quotes/preview";
import type { QuoteRequest, StoredQuote } from "../quotes/contracts";

type State = {
  pending: boolean;
  quote?: StoredQuote;
  request?: QuoteRequest;
  message?: string;
};
export function useConversionQuote() {
  const [state, setState] = useState<State>({ pending: false });
  const [now, setNow] = useState(0);
  const current = useRef(state),
    generation = useRef(0),
    controller = useRef<AbortController | null>(null);
  const change = (next: State) => {
    current.current = next;
    setState(next);
  };
  useEffect(
    () => () => {
      generation.current++;
      controller.current?.abort();
    },
    [],
  );
  useEffect(() => {
    if (!state.quote) return;
    const issued = Date.parse(state.quote.issuedAt),
      expires = Date.parse(state.quote.expiresAt);
    let timer: number | undefined;
    const tick = () => {
      const observed = Date.now();
      setNow(observed);
      clearTimeout(timer);
      // There is no countdown to animate. One deadline, plus focus/visibility
      // rechecks, avoids recurring work after expiry or while a draft is closed.
      if (observed >= issued && observed < expires)
        timer = window.setTimeout(tick, expires - observed);
    };
    tick();
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [state.quote]);
  function invalidate() {
    generation.current++;
    controller.current?.abort();
    controller.current = null;
    change({ pending: false });
  }
  async function load(request: QuoteRequest, accountId: string) {
    invalidate();
    const ticket = generation.current,
      abort = new AbortController();
    controller.current = abort;
    const original = Object.freeze({ ...request });
    change({ pending: true, request: original });
    const timeout = window.setTimeout(() => abort.abort(), 15000);
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(original),
        cache: "no-store",
        signal: abort.signal,
      });
      const value = await response.json();
      if (ticket !== generation.current) return;
      if (!response.ok) throw new Error("Quote unavailable");
      const quote = confirmedFxPreview(value, original, accountId);
      change({ pending: false, request: original, quote });
      setNow(Date.now());
    } catch {
      if (ticket === generation.current)
        change({
          pending: false,
          request: original,
          message:
            "A valid quote is unavailable. Nothing was submitted or reserved. Check the amount/currencies or try requesting a quote again.",
        });
    } finally {
      clearTimeout(timeout);
      if (ticket === generation.current) controller.current = null;
    }
  }
  const expired =
    !!state.quote &&
    (now >= Date.parse(state.quote.expiresAt) ||
      now < Date.parse(state.quote.issuedAt));
  return {
    ...state,
    expired,
    load,
    invalidate,
    activeQuote: () => {
      const q = current.current.quote;
      return q &&
        Date.now() >= Date.parse(q.issuedAt) &&
        Date.now() < Date.parse(q.expiresAt)
        ? q
        : undefined;
    },
  };
}
