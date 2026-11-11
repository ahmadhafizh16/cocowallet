"use client";

import { useEffect, useRef, useState } from "react";
import {
  confirmedSubmissionResult,
  SUBMISSION_RECOVERY_KEY,
  parseSubmissionRecovery,
  type SubmissionIntent,
  type SubmissionResult,
} from "./contracts";

type State = {
  ready: boolean;
  pending: boolean;
  intent?: SubmissionIntent;
  result?: SubmissionResult;
  storageBlocked: boolean;
  message?: string;
};
const UNKNOWN =
  "Outcome not confirmed. Retry this exact submission with its original key; do not start another attempt.";

export function useSubmission(enabled: boolean, onKnown: () => void) {
  const [state, setState] = useState<State>({
    ready: false,
    pending: false,
    storageBlocked: false,
  });
  const current = useRef(state);
  const busy = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const callback = useRef(onKnown);
  useEffect(() => {
    callback.current = onKnown;
  }, [onKnown]);
  function change(next: State) {
    current.current = next;
    setState(next);
  }

  useEffect(() => {
    if (!enabled) return;
    let next: State;
    try {
      const raw = sessionStorage.getItem(SUBMISSION_RECOVERY_KEY);
      next = {
        ready: true,
        pending: false,
        storageBlocked: false,
        ...(raw === null
          ? {}
          : { intent: parseSubmissionRecovery(raw), message: UNKNOWN }),
      };
    } catch {
      next = {
        ready: true,
        pending: false,
        storageBlocked: true,
        message:
          "Recovery storage is unavailable or contains unreadable submission data. New submissions are blocked; restore access in this tab before continuing.",
      };
    }
    current.current = next;
    setState(next);
    return () => controller.current?.abort();
  }, [enabled]);

  async function send(candidate?: SubmissionIntent) {
    const previous = current.current;
    if (
      !enabled ||
      !previous.ready ||
      previous.storageBlocked ||
      previous.result ||
      busy.current
    )
      return;
    const original = previous.intent ?? candidate;
    if (!original) return;
    let intent: SubmissionIntent;
    busy.current = true;
    try {
      // Never overwrite another unresolved request, including data changed by a
      // same-tab script. Read back the exact saved bytes before network activity.
      const raw = sessionStorage.getItem(SUBMISSION_RECOVERY_KEY);
      intent = parseSubmissionRecovery(JSON.stringify(original));
      Object.freeze(intent.request);
      Object.freeze(intent);
      const encoded = JSON.stringify(intent);
      if (
        raw !== null &&
        JSON.stringify(parseSubmissionRecovery(raw)) !== encoded
      )
        throw new Error("Conflicting recovery context.");
      sessionStorage.setItem(SUBMISSION_RECOVERY_KEY, encoded);
      if (sessionStorage.getItem(SUBMISSION_RECOVERY_KEY) !== encoded)
        throw new Error("Recovery write was not retained.");
    } catch {
      busy.current = false;
      change({
        ...previous,
        storageBlocked: true,
        message:
          "Could not safely save recovery context. Nothing new was sent. Restore session storage access and reload this tab before submitting.",
      });
      return;
    }
    change({ ready: true, storageBlocked: false, pending: true, intent });
    const abort = new AbortController();
    controller.current = abort;
    const timeout = window.setTimeout(() => abort.abort(), 15000);
    try {
      const response = await fetch(
        intent.kind === "transfer"
          ? "/api/transfers"
          : intent.kind === "conversion"
            ? "/api/conversions"
            : intent.kind === "deposit"
              ? "/api/deposits"
              : "/api/withdrawals",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": intent.key,
          },
          body: JSON.stringify(intent.request),
          cache: "no-store",
          signal: abort.signal,
        },
      );
      const result = confirmedSubmissionResult(
        await response.json(),
        response.status,
        intent,
      );
      if (!result) throw new Error("Unknown response.");
      let cleared = false;
      try {
        // Never erase a different record installed while the request was in flight.
        const raw = sessionStorage.getItem(SUBMISSION_RECOVERY_KEY);
        if (
          raw !== null &&
          JSON.stringify(parseSubmissionRecovery(raw)) !==
            JSON.stringify(intent)
        )
          throw new Error("Recovery context changed.");
        sessionStorage.removeItem(SUBMISSION_RECOVERY_KEY);
        cleared = sessionStorage.getItem(SUBMISSION_RECOVERY_KEY) === null;
      } catch {
        /* Known result remains visible; block new attempts until cleanup succeeds. */
      }
      change({
        ready: true,
        storageBlocked: !cleared,
        pending: false,
        result,
        intent,
        ...(!cleared
          ? {
              message:
                "Result confirmed, but recovery context could not be cleared. New attempts remain blocked; restore storage access and reload to replay safely.",
            }
          : {}),
      });
      try {
        callback.current();
      } catch {
        // Refresh is not part of committing money. Never relabel a validated
        // known outcome as uncertain because a presentation callback failed.
        change({
          ...current.current,
          message:
            "Result confirmed. The overview could not refresh; reload to update its balances.",
        });
      }
    } catch {
      change({
        ready: true,
        pending: false,
        storageBlocked: false,
        intent,
        message: UNKNOWN,
      });
    } finally {
      clearTimeout(timeout);
      busy.current = false;
      controller.current = null;
    }
  }

  function startAnother() {
    if (
      current.current.result &&
      !current.current.storageBlocked &&
      !busy.current
    )
      change({ ready: true, pending: false, storageBlocked: false });
  }
  return { ...state, send, startAnother };
}
