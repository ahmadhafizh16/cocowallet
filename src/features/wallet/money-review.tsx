"use client";
import { useState, type ReactNode, type RefObject } from "react";
import { Check, Copy, Landmark, Pencil, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyFlag } from "./currency-flag";
import { CURRENCY_SYMBOLS } from "./presentation";

export function ReviewWallet({
  currency,
  id,
}: {
  currency: string;
  id: string;
}) {
  const [copied, setCopied] = useState(false),
    [failed, setFailed] = useState(false);
  return (
    <div className="wallet-review-identity">
      <span className="wallet-review-currency">
        <CurrencyFlag currency={currency} />
      </span>
      <span>{currency} Balance Wallet</span>
      <span className="wallet-review-id" title={id}>
        <bdi>{id.length > 16 ? `${id.slice(0, 5)}…${id.slice(-5)}` : id}</bdi>
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label={copied ? "Wallet ID copied" : "Copy wallet ID"}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(id);
            setCopied(true);
            setFailed(false);
          } catch {
            setFailed(true);
          }
        }}
      >
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      </Button>
      {failed && (
        <span className="wallet-review-copy-fallback" role="status">
          Copy unavailable. Select this ID: <bdi>{id}</bdi>
        </span>
      )}
    </div>
  );
}

export function ReviewProvider({ label }: { label: string }) {
  return (
    <div className="wallet-review-identity">
      <Landmark className="wallet-review-bank" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function MoneyReview({
  title,
  heading,
  amount,
  currency,
  source,
  target,
  sourceLabel = "From wallet",
  targetLabel = "Recipient",
  children,
  hidden,
  disabled,
  loading = false,
  confirmLabel,
  onConfirm,
  onEdit,
  onCancel,
}: {
  title: string;
  heading: RefObject<HTMLHeadingElement | null>;
  amount: string;
  currency: string;
  source: ReactNode;
  target: ReactNode;
  sourceLabel?: string;
  targetLabel?: string;
  children?: ReactNode;
  hidden: boolean;
  disabled: boolean;
  loading?: boolean;
  confirmLabel: string;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="wallet-dialog-review wallet-money-review"
      aria-busy={loading}
    >
      <div className="wallet-review-heading">
        <h3 ref={heading} tabIndex={-1}>
          {title}
        </h3>
        <Button variant="outline" onClick={onEdit} disabled={loading}>
          <Pencil aria-hidden="true" />
          Edit details
        </Button>
      </div>
      <section className="wallet-review-section" aria-label={sourceLabel}>
        <h4>{sourceLabel}</h4>
        {source}
      </section>
      <div className="wallet-review-amount">
        <p>Amount</p>
        <strong>
          {hidden ? (
            "Amount hidden"
          ) : (
            <>
              {CURRENCY_SYMBOLS[currency] ?? ""}
              {amount} <span>{currency}</span>
            </>
          )}
        </strong>
      </div>
      <section className="wallet-review-section" aria-label={targetLabel}>
        <h4>{targetLabel}</h4>
        {target}
      </section>
      {children}
      {hidden && (
        <p className="text-sm text-muted-foreground">
          Show amounts before confirming.
        </p>
      )}
      <div className="wallet-review-actions">
        <Button variant="danger" onClick={onCancel} disabled={loading}>
          <Undo2 aria-hidden="true" />
          Cancel
        </Button>
        <Button
          variant="success"
          onClick={onConfirm}
          disabled={disabled || hidden}
          loading={loading}
        >
          {!loading && <Check aria-hidden="true" />}
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
