"use client";

import { AlertCircle, RotateCcw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WalletError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="error-page">
      <div className="error-brand">
        <Wallet aria-hidden="true" /> wallet
      </div>
      <section className="error-panel" role="alert">
        <AlertCircle aria-hidden="true" />
        <h1>We couldn’t load your wallet</h1>
        <p>
          Try again in a moment. This screen cannot confirm balances or
          operation outcomes.
        </p>
        <Button onClick={reset}>
          <RotateCcw aria-hidden="true" /> Try again
        </Button>
        <p className="error-guidance">
          If an operation’s outcome is uncertain, don’t submit a new attempt.
          Retry the original request with the same key once the service is
          available.
        </p>
      </section>
      <p className="error-simulation">Local simulation · No real funds move</p>
    </main>
  );
}
