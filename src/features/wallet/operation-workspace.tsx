"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Info, LockKeyhole, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHydrated } from "@/lib/use-hydrated";
import { MAX_AMOUNT_INPUT_LENGTH } from "../money/money";
import {
  createDraft,
  OPERATION_LABELS,
  PROVIDERS,
  validateOperation,
  type Operation,
  type OperationDraft,
  type OperationErrors,
  type OperationReview,
} from "./operation-model";
import {
  CURRENCY_SYMBOLS,
  displayAmount,
  displayBalance,
  walletsForAccount,
} from "./presentation";
import type { AccountView, WalletCurrency, WalletView } from "./types";

export function OperationWorkspace({
  operation,
  account,
  wallets: suppliedWallets,
  hidden,
}: {
  operation: Operation;
  account: AccountView | undefined;
  wallets: WalletView[];
  hidden: boolean;
}) {
  const hydrated = useHydrated();
  const wallets = walletsForAccount(suppliedWallets, account?.id);
  const prefix = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const reviewRef = useRef<HTMLHeadingElement>(null);
  const [drafts, setDrafts] = useState<Record<Operation, OperationDraft>>(
    () => {
      const initial = createDraft(wallets, account?.defaultCurrency ?? "USD");
      return {
        deposit: { ...initial },
        withdraw: { ...initial },
        convert: { ...initial },
        transfer: { ...initial },
      };
    },
  );
  const [errorsByOperation, setErrors] = useState<
    Partial<Record<Operation, OperationErrors>>
  >({});
  const [reviews, setReviews] = useState<
    Partial<Record<Operation, OperationReview>>
  >({});
  const draft = drafts[operation];
  const errors = errorsByOperation[operation] ?? {};
  const savedReview = reviews[operation];
  const review =
    savedReview?.accountId === account?.id ? savedReview : undefined;
  const sourceWallet = wallets.find(
    (wallet) => wallet.currency === draft.currency,
  );
  const title =
    operation === "transfer"
      ? "Send money"
      : `${OPERATION_LABELS[operation]} money`;
  const amountLabel =
    operation === "deposit"
      ? "You add"
      : operation === "withdraw"
        ? "You withdraw"
        : operation === "convert"
          ? "You convert"
          : "You send";
  const fieldId = (name: string) => `${prefix}-${operation}-${name}`;

  function updateDraft(field: keyof OperationDraft, value: string) {
    setDrafts((current) => ({
      ...current,
      [operation]: { ...current[operation], [field]: value },
    }));
    setReviews((current) => ({ ...current, [operation]: undefined }));
    setErrors((current) => ({
      ...current,
      [operation]: { ...current[operation], [field]: undefined },
    }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateOperation({ operation, draft, account, wallets });
    setErrors((current) => ({ ...current, [operation]: result.errors }));
    const nextReview = result.review;
    if (nextReview) {
      setReviews((current) => ({ ...current, [operation]: nextReview }));
      requestAnimationFrame(() => reviewRef.current?.focus());
    } else {
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
    }
  }

  function editReview() {
    setReviews((current) => ({ ...current, [operation]: undefined }));
    requestAnimationFrame(() =>
      formRef.current
        ?.querySelector<HTMLInputElement>('input[name="amount"]')
        ?.focus(),
    );
  }

  return (
    <section
      className="wallet-panel wallet-operation-panel"
      id="operations"
      aria-labelledby="operation-heading"
    >
      <div className="wallet-section-head">
        <h2 id="operation-heading" tabIndex={-1}>
          {title}
        </h2>
        <span className="wallet-supporting">Simulated {operation}</span>
      </div>
      {account?.role !== "main" ? (
        <div className="wallet-inspect-state">
          <span className="wallet-empty-symbol">
            <LockKeyhole aria-hidden="true" />
          </span>
          <h3>
            {account
              ? "Here to inspect, not transact."
              : "No account selected."}
          </h3>
          <p>
            {account
              ? "Money actions are available only from the main account. This destination is inspect-only."
              : "Account services are not connected. No money actions are available."}
          </p>
          <p className="wallet-supporting">
            Choose the main account above to explore a workflow.
          </p>
        </div>
      ) : review ? (
        <div className="wallet-review">
          <div className="wallet-inline-notice">
            <Info aria-hidden="true" />
            <p>Interface preview. These details have not been submitted.</p>
          </div>
          <h3 ref={reviewRef} tabIndex={-1}>
            Review {operation}
          </h3>
          <dl className="wallet-review-facts">
            <div>
              <dt>From account</dt>
              <dd>{review.accountId}</dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>
                {hidden
                  ? "Amount hidden"
                  : `${displayAmount(review.minor, review.wallet.exponent)} ${review.wallet.currency}`}
              </dd>
            </div>
            {(operation === "deposit" || operation === "withdraw") && (
              <div>
                <dt>Fictional provider</dt>
                <dd>
                  {
                    PROVIDERS.find(
                      (provider) => provider.code === review.provider,
                    )?.label
                  }
                </dd>
              </div>
            )}
            {operation === "transfer" && (
              <div>
                <dt>Simulated recipient</dt>
                <dd>
                  {review.recipient}
                  <span className="wallet-fact-note">
                    Not verified · no recipient account created
                  </span>
                </dd>
              </div>
            )}
            {operation === "convert" && (
              <>
                <div>
                  <dt>Receive currency</dt>
                  <dd>{review.targetCurrency}</dd>
                </div>
                <div>
                  <dt>Rate & receive amount</dt>
                  <dd>Not available</dd>
                </div>
              </>
            )}
          </dl>
          <p className="wallet-service-note" id={fieldId("connection")}>
            <LockKeyhole aria-hidden="true" />
            Service connection pending.{" "}
            {operation === "convert"
              ? "A rate and a valid quote are required before conversion."
              : "This preview cannot submit an operation or move funds."}
          </p>
          <Button
            className="wallet-full-button"
            disabled
            aria-describedby={fieldId("connection")}
          >
            {OPERATION_LABELS[operation]} unavailable
          </Button>
          <Button
            variant="ghost"
            className="wallet-full-button wallet-edit-button"
            onClick={editReview}
          >
            <ArrowLeft aria-hidden="true" />
            Edit details
          </Button>
        </div>
      ) : (
        <form
          ref={formRef}
          onSubmit={submit}
          noValidate
          className="wallet-operation-form"
        >
          <fieldset
            className="wallet-form-fields"
            disabled={!hydrated}
            aria-labelledby="operation-heading"
          >
            {operation === "transfer" && (
              <div className="wallet-field">
                <label htmlFor={fieldId("recipient")}>
                  Simulated recipient account ID
                </label>
                <Input
                  id={fieldId("recipient")}
                  name="recipient"
                  value={draft.recipient}
                  onChange={(event) =>
                    updateDraft("recipient", event.target.value)
                  }
                  placeholder="Enter an account ID"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={128}
                  aria-invalid={!!errors.recipient}
                  aria-describedby={`${fieldId("recipient-hint")}${errors.recipient ? ` ${fieldId("recipient-error")}` : ""}`}
                />
                <p className="wallet-field-hint" id={fieldId("recipient-hint")}>
                  IDs are not verified or saved in this preview.
                </p>
                {errors.recipient && (
                  <p
                    className="wallet-field-error"
                    id={fieldId("recipient-error")}
                  >
                    {errors.recipient}
                  </p>
                )}
              </div>
            )}

            {(operation === "deposit" || operation === "withdraw") && (
              <div className="wallet-field">
                <label htmlFor={fieldId("provider")}>Fictional provider</label>
                <select
                  className="wallet-select"
                  id={fieldId("provider")}
                  value={draft.provider}
                  onChange={(event) =>
                    updateDraft("provider", event.target.value)
                  }
                  aria-invalid={!!errors.provider}
                  aria-describedby={
                    errors.provider ? fieldId("provider-error") : undefined
                  }
                >
                  {PROVIDERS.map((provider) => (
                    <option key={provider.code} value={provider.code}>
                      {provider.label}
                    </option>
                  ))}
                </select>
                {errors.provider && (
                  <p
                    className="wallet-field-error"
                    id={fieldId("provider-error")}
                  >
                    {errors.provider}
                  </p>
                )}
              </div>
            )}

            <div className="wallet-amount-label">
              <label htmlFor={fieldId("amount")}>{amountLabel}</label>
              <label className="wallet-currency-select">
                <span className="wallet-sr-only">Source currency</span>
                <Wallet aria-hidden="true" />
                <select
                  aria-label="Source currency"
                  value={draft.currency}
                  onChange={(event) =>
                    updateDraft(
                      "currency",
                      event.target.value as WalletCurrency,
                    )
                  }
                  aria-invalid={!!errors.currency}
                  aria-describedby={
                    errors.currency ? fieldId("currency-error") : undefined
                  }
                >
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.currency}>
                      {wallet.currency}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {errors.currency && (
              <p className="wallet-field-error" id={fieldId("currency-error")}>
                {errors.currency}
              </p>
            )}
            <div className="wallet-amount-entry">
              <span aria-hidden="true">{CURRENCY_SYMBOLS[draft.currency]}</span>
              <input
                id={fieldId("amount")}
                name="amount"
                type="text"
                readOnly={hidden}
                inputMode="decimal"
                value={hidden ? "" : draft.amount}
                onChange={(event) => updateDraft("amount", event.target.value)}
                placeholder={hidden ? "Hidden" : "0.00"}
                maxLength={MAX_AMOUNT_INPUT_LENGTH}
                autoComplete="off"
                aria-invalid={!!errors.amount}
                aria-describedby={`${fieldId("available")}${errors.amount ? ` ${fieldId("amount-error")}` : ""}`}
              />
            </div>
            <p className="wallet-field-hint" id={fieldId("available")}>
              {sourceWallet
                ? hidden
                  ? "Preview balance hidden"
                  : `${displayBalance(sourceWallet)} ${sourceWallet.currency} · Preview balance`
                : "Balance unavailable"}
            </p>
            {errors.amount && (
              <p className="wallet-field-error" id={fieldId("amount-error")}>
                {errors.amount}
              </p>
            )}

            {operation === "convert" && (
              <div className="wallet-field wallet-target-field">
                <label htmlFor={fieldId("target")}>Receive currency</label>
                <select
                  className="wallet-select"
                  id={fieldId("target")}
                  value={draft.targetCurrency}
                  onChange={(event) =>
                    updateDraft(
                      "targetCurrency",
                      event.target.value as WalletCurrency,
                    )
                  }
                  aria-invalid={!!errors.targetCurrency}
                  aria-describedby={
                    errors.targetCurrency ? fieldId("target-error") : undefined
                  }
                >
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.currency}>
                      {wallet.currency}
                    </option>
                  ))}
                </select>
                {errors.targetCurrency && (
                  <p
                    className="wallet-field-error"
                    id={fieldId("target-error")}
                  >
                    {errors.targetCurrency}
                  </p>
                )}
              </div>
            )}

            <dl className="wallet-operation-facts">
              <div>
                <dt>
                  {operation === "convert" ? "Exchange rate" : "Service status"}
                </dt>
                <dd>
                  {operation === "convert"
                    ? "Not connected"
                    : "Connection pending"}
                </dd>
              </div>
              <div>
                <dt>
                  {operation === "convert"
                    ? "Receive amount"
                    : "Funds movement"}
                </dt>
                <dd>
                  {operation === "convert"
                    ? "No quote available"
                    : "Not available in preview"}
                </dd>
              </div>
            </dl>
            {errors.form && (
              <p className="wallet-field-error" role="alert">
                {errors.form}
              </p>
            )}
            <Button type="submit" className="wallet-full-button">
              Review {operation}
              <ArrowRight aria-hidden="true" />
            </Button>
            <p className="wallet-simulation-note">
              Preview only. No funds will move.
            </p>
          </fieldset>
        </form>
      )}
    </section>
  );
}
