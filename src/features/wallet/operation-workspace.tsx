"use client";

import { useId, useRef, useState, type FormEvent, type RefObject } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHydrated } from "@/lib/use-hydrated";
import { useRouter } from "next/navigation";
import { useSubmission } from "../submissions/use-submission";
import { SubmissionPanel } from "../submissions/submission-panel";
import { useConversionQuote } from "../conversions/use-quote";
import { useConversionCurrencies } from "../conversions/use-currencies";
import { ConversionQuoteReview } from "../conversions/quote-review";
import { TransferReview } from "../transfers/transfer-review";
import { createFundingKey } from "../funding/request-key";
import { formatAmount } from "../money/money";
import {
  captureMotionFrame,
  DIALOG_MOTION_SELECTOR,
} from "@/lib/use-motion-open";
import { MAX_AMOUNT_INPUT_LENGTH } from "../money/money";
import {
  createDraft,
  OPERATION_LABELS,
  OPERATION_NOUNS,
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

const DESCRIPTIONS: Record<Operation, string> = {
  deposit:
    "Choose a fictional provider and review a deposit draft. Submission is not connected.",
  withdraw: "Withdrawals need a funded wallet. Submission is not connected.",
  convert:
    "Conversion needs a funded balance and an exchange-rate quote. Exchange-rate quotes and submission are not connected.",
  transfer:
    "Explore a simulated transfer. This preview cannot send funds, verify recipients, or create accounts.",
};

/** Keep this component mounted while its dialog closes so drafts stay in memory. */
export function OperationWorkspace({
  operation,
  account,
  wallets: suppliedWallets,
  hidden,
  balancesConnected = false,
  fundingEnabled = false,
  conversionEnabled = false,
  transferEnabled = false,
  accounts = [],
  open,
  onOpenChange,
  returnFocusRef,
}: {
  operation: Operation;
  account: AccountView | undefined;
  wallets: WalletView[];
  hidden: boolean;
  balancesConnected?: boolean;
  fundingEnabled?: boolean;
  conversionEnabled?: boolean;
  transferEnabled?: boolean;
  accounts?: AccountView[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  const hydrated = useHydrated();
  const router = useRouter();
  const funding = useSubmission(fundingEnabled, () => router.refresh());
  const quote = useConversionQuote();
  const transferQuote = useConversionQuote();
  const canConvert = conversionEnabled && operation === "convert";
  const canTransfer = transferEnabled && operation === "transfer";
  const catalog = useConversionCurrencies(
    (canConvert || canTransfer) &&
      open &&
      account?.role === "main" &&
      !funding.intent &&
      !funding.storageBlocked,
  );
  const targetCurrencies = [
    ...new Set([
      ...(catalog.codes ?? suppliedWallets.map((wallet) => wallet.currency)),
      ...(canTransfer
        ? accounts
            .filter((value) => value.role === "destination")
            .map((value) => value.defaultCurrency)
        : []),
    ]),
  ];
  const canFund =
    fundingEnabled && (operation === "deposit" || operation === "withdraw");
  const fundingPanel =
    fundingEnabled && (funding.intent || funding.storageBlocked);
  const wallets = walletsForAccount(suppliedWallets, account?.id);
  const prefix = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const reviewRef = useRef<HTMLHeadingElement>(null);
  const [drafts, setDrafts] = useState<Record<Operation, OperationDraft>>(
    () => {
      const draft = createDraft(wallets, account?.defaultCurrency ?? "USD");
      return {
        deposit: { ...draft },
        withdraw: { ...draft },
        convert: { ...draft },
        transfer: {
          ...draft,
          targetCurrency: "",
          recipientDefaultCurrency: "",
        },
      };
    },
  );
  const [errorsByOperation, setErrors] = useState<
    Partial<Record<Operation, OperationErrors>>
  >({});
  const [reviews, setReviews] = useState<
    Partial<Record<Operation, OperationReview>>
  >({});
  const [returningToEdit, setReturningToEdit] = useState(false);
  const draft = drafts[operation];
  const recipient = accounts.find(
    (value) => value.id === draft.recipient && value.role === "destination",
  );
  const errors = errorsByOperation[operation] ?? {};
  const savedReview = reviews[operation];
  const review =
    savedReview?.accountId === account?.id ? savedReview : undefined;
  const sourceWallet = wallets.find(
    (wallet) => wallet.currency === draft.currency,
  );
  const fieldId = (name: string) => `${prefix}-${operation}-${name}`;
  const amountLabel = {
    deposit: "You add",
    withdraw: "You withdraw",
    convert: "You convert",
    transfer: "You send",
  }[operation];
  const title =
    operation === "transfer"
      ? "Send money"
      : `${OPERATION_LABELS[operation]} money`;

  function updateDraft(field: keyof OperationDraft, value: string) {
    if (operation === "convert") quote.invalidate();
    if (operation === "transfer") transferQuote.invalidate();
    setDrafts((current) => {
      const next = { ...current[operation], [field]: value };
      if (
        operation === "convert" &&
        field === "currency" &&
        next.targetCurrency === value
      )
        next.targetCurrency = "";
      if (operation === "transfer" && field === "recipient") {
        next.recipientDefaultCurrency = "";
        next.targetCurrency = "";
      }
      return { ...current, [operation]: next };
    });
    setReviews((current) => ({ ...current, [operation]: undefined }));
    setErrors((current) => {
      const next = { ...current[operation] };
      const affected: Array<keyof OperationErrors> =
        field === "recipient"
          ? ["recipient", "recipientDefaultCurrency", "targetCurrency", "form"]
          : field === "recipientDefaultCurrency"
            ? ["recipientDefaultCurrency", "targetCurrency", "form"]
            : field === "currency"
              ? ["currency", "amount", "targetCurrency", "form"]
              : field === "targetCurrency"
                ? ["targetCurrency", "form"]
                : [field, "form"];
      for (const key of affected) delete next[key];
      return { ...current, [operation]: next };
    });
  }

  function focusInitial() {
    if (reviewRef.current) reviewRef.current.focus();
    else
      formRef.current
        ?.querySelector<HTMLInputElement>(
          operation === "transfer"
            ? 'input[name="recipient"]'
            : 'input[name="amount"]',
        )
        ?.focus();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReturningToEdit(false);
    const result = validateOperation({
      operation,
      draft,
      account,
      wallets,
      balancesConnected,
      ...(canConvert || canTransfer ? { targetCurrencies } : {}),
      ...(canTransfer ? { transferAccounts: accounts } : {}),
    });
    setErrors((current) => ({ ...current, [operation]: result.errors }));
    if (result.review) {
      const nextReview = result.review;
      setReviews((current) => ({ ...current, [operation]: nextReview }));
      if (canConvert)
        void quote.load(
          {
            operation: "conversion",
            sourceWalletId: nextReview.wallet.id,
            amount: draft.amount,
            targetCurrency: nextReview.targetCurrency,
          },
          nextReview.accountId,
        );
      if (
        canTransfer &&
        nextReview.wallet.currency !== nextReview.targetCurrency
      )
        void transferQuote.load(
          {
            operation: "transfer",
            sourceWalletId: nextReview.wallet.id,
            amount: draft.amount,
            targetCurrency: nextReview.targetCurrency,
            recipientAccountId: nextReview.recipient,
            recipientDefaultCurrency: nextReview.recipientDefaultCurrency,
          },
          nextReview.accountId,
        );
      requestAnimationFrame(() => reviewRef.current?.focus());
    } else
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
  }

  function editReview() {
    if (operation === "convert") quote.invalidate();
    if (operation === "transfer") transferQuote.invalidate();
    setReturningToEdit(true);
    setReviews((current) => ({ ...current, [operation]: undefined }));
    requestAnimationFrame(() =>
      formRef.current
        ?.querySelector<HTMLInputElement>('input[name="amount"]')
        ?.focus(),
    );
  }

  function confirmFunding() {
    if (!review || !canFund || hidden) return;
    try {
      void funding.send({
        version: 1,
        key: createFundingKey(),
        kind: operation === "deposit" ? "deposit" : "withdrawal",
        request: {
          walletId: review.wallet.id,
          amount: formatAmount(review.minor, review.wallet.exponent),
          provider: review.provider,
        },
      });
    } catch {
      setErrors((current) => ({
        ...current,
        [operation]: {
          form: "A secure retry key could not be created. Nothing was submitted.",
        },
      }));
    }
  }

  function confirmConversion() {
    const active = quote.activeQuote();
    if (
      !canConvert ||
      !review ||
      hidden ||
      !active ||
      !quote.request ||
      active.source.accountId !== account?.id
    )
      return;
    try {
      void funding.send({
        version: 1,
        key: createFundingKey(),
        kind: "conversion",
        request: {
          quoteId: active.quoteId,
          sourceWalletId: quote.request.sourceWalletId,
          amount: quote.request.amount,
          targetCurrency: quote.request.targetCurrency,
        },
      });
    } catch {
      setErrors((current) => ({
        ...current,
        convert: {
          form: "A secure retry key could not be created. Nothing was submitted.",
        },
      }));
    }
  }

  function closeWorkspace() {
    captureMotionFrame(DIALOG_MOTION_SELECTOR, false);
    onOpenChange(false);
  }

  function confirmTransfer() {
    if (!canTransfer || !review || hidden || review.accountId !== account?.id)
      return;
    const fx = review.wallet.currency !== review.targetCurrency;
    const active = transferQuote.activeQuote();
    if (
      fx &&
      (!active ||
        active.operation !== "transfer" ||
        active.source.accountId !== review.accountId ||
        active.source.walletId !== review.wallet.id ||
        active.source.currency !== review.wallet.currency ||
        active.target.currency !== review.targetCurrency ||
        active.recipient?.accountId !== review.recipient ||
        active.recipient.defaultCurrency !== review.recipientDefaultCurrency)
    )
      return;
    try {
      void funding.send({
        version: 1,
        kind: "transfer",
        key: createFundingKey(),
        request: {
          sourceWalletId: review.wallet.id,
          recipientAccountId: review.recipient,
          amount: fx
            ? transferQuote.request!.amount
            : formatAmount(review.minor, review.wallet.exponent),
          targetCurrency: review.targetCurrency,
          recipientDefaultCurrency: review.recipientDefaultCurrency,
          ...(fx ? { quoteId: active!.quoteId } : {}),
        },
      });
    } catch {
      setErrors((current) => ({
        ...current,
        transfer: {
          form: "A secure retry key could not be created. Nothing was submitted.",
        },
      }));
    }
  }

  return (
    <>
      {fundingPanel && account?.role === "main" && !open && (
        <div className="wallet-preview-notice" role="status">
          <p>
            {funding.result
              ? "A submission result is ready to review."
              : funding.storageBlocked
                ? "Money submissions are blocked until recovery storage is available."
                : "An unresolved submission needs confirmation. New money submissions are paused."}
          </p>
          <Button
            variant="outline"
            onClick={(event) => {
              if (returnFocusRef) returnFocusRef.current = event.currentTarget;
              onOpenChange(true);
            }}
          >
            Review submission
          </Button>
        </div>
      )}
      <Dialog
        open={open && account?.role === "main"}
        onOpenChange={onOpenChange}
      >
        <DialogContent
          id="operations"
          className="wallet-operation-dialog"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            focusInitial();
          }}
          onCloseAutoFocus={(event) => {
            if (returnFocusRef?.current) {
              event.preventDefault();
              returnFocusRef.current.focus();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {fundingPanel ? "Money submission" : title}
            </DialogTitle>
            <DialogDescription>
              {fundingPanel
                ? "Inspect or recover the original simulated submission. Keep its retry key and quote unchanged while the outcome is unresolved."
                : canTransfer
                  ? "Review a simulated destination and exact receiving amount, then explicitly confirm. No real funds move; destinations remain inspect-only."
                  : canConvert
                    ? "Review an exact one-minute reference-rate quote, then explicitly confirm a simulated conversion. No real funds move."
                    : canFund
                      ? "Review and confirm a simulated wallet operation. Providers are fictional; no real funds move."
                      : DESCRIPTIONS[operation]}
            </DialogDescription>
          </DialogHeader>
          {fundingPanel ? (
            <SubmissionPanel
              funding={funding}
              hidden={hidden}
              onClose={closeWorkspace}
              onAnother={() => {
                funding.startAnother();
                quote.invalidate();
                transferQuote.invalidate();
                setReviews({});
                editReview();
              }}
            />
          ) : review && canTransfer ? (
            <>
              <TransferReview
                review={review}
                preview={transferQuote}
                hidden={hidden}
                ready={funding.ready}
                heading={reviewRef}
                onConfirm={confirmTransfer}
                onEdit={editReview}
                onClose={closeWorkspace}
              />
              {errors.form && <FieldError>{errors.form}</FieldError>}
            </>
          ) : review && canConvert ? (
            <>
              <ConversionQuoteReview
                preview={quote}
                hidden={hidden}
                ready={funding.ready}
                heading={reviewRef}
                accountId={review.accountId}
                onConfirm={confirmConversion}
                onEdit={editReview}
                onClose={closeWorkspace}
              />
              {errors.form && <FieldError>{errors.form}</FieldError>}
            </>
          ) : review ? (
            <div className="wallet-dialog-review space-y-5">
              <h3
                ref={reviewRef}
                tabIndex={-1}
                className="text-lg font-semibold"
              >
                Review {OPERATION_NOUNS[operation]}
              </h3>
              <p className="text-sm text-muted-foreground">
                These details have not been submitted.
              </p>
              <dl className="wallet-dialog-facts space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">From account</dt>
                  <dd className="min-w-0 text-right wrap-anywhere">
                    {review.accountId}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Amount</dt>
                  <dd className="min-w-0 text-right wrap-anywhere">
                    {hidden
                      ? "Amount hidden"
                      : `${displayAmount(review.minor, review.wallet.exponent)} ${review.wallet.currency}`}
                  </dd>
                </div>
                {(operation === "deposit" || operation === "withdraw") && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">
                      Fictional provider
                    </dt>
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
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">
                      Simulated recipient
                    </dt>
                    <dd className="min-w-0 text-right wrap-anywhere">
                      {review.recipient}
                      <span className="block text-muted-foreground">
                        Not verified; no account created.
                      </span>
                    </dd>
                  </div>
                )}
                {operation === "convert" && (
                  <>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">
                        Receive currency
                      </dt>
                      <dd>{review.targetCurrency}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">
                        Rate and receive amount
                      </dt>
                      <dd>Not available</dd>
                    </div>
                  </>
                )}
              </dl>
              <p
                id={fieldId("connection")}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <LockKeyhole
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                {canFund
                  ? "Confirmation records this simulation once. Uncertain results must be retried with the original request."
                  : "Service not connected. Final submission is unavailable."}
              </p>
              <Button
                className="w-full"
                disabled={!canFund || !funding.ready || hidden}
                onClick={confirmFunding}
                aria-describedby={fieldId("connection")}
              >
                {canFund
                  ? `Confirm simulated ${operation === "deposit" ? "deposit" : "withdrawal"}`
                  : `${OPERATION_LABELS[operation]} unavailable`}
              </Button>
              {hidden && canFund && (
                <p className="text-sm text-muted-foreground">
                  Show amounts before confirming.
                </p>
              )}
              {errors.form && <FieldError>{errors.form}</FieldError>}
              <DialogFooter>
                <Button variant="ghost" onClick={editReview}>
                  <ArrowLeft aria-hidden="true" />
                  Edit details
                </Button>
                <Button variant="outline" onClick={closeWorkspace}>
                  Back to overview
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form
              ref={formRef}
              onSubmit={submit}
              noValidate
              className="wallet-dialog-form"
              data-entry={returningToEdit ? "back" : "initial"}
            >
              <FieldSet
                disabled={!hydrated}
                className="m-0 min-w-0 gap-0 border-0 p-0"
                aria-label={title}
              >
                <FieldGroup>
                  {operation === "transfer" && (
                    <Field data-invalid={!!errors.recipient}>
                      <FieldLabel htmlFor={fieldId("recipient")}>
                        Simulated recipient account ID
                      </FieldLabel>
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
                        maxLength={8192}
                        aria-invalid={!!errors.recipient}
                        aria-describedby={`${fieldId("recipient-hint")}${errors.recipient ? ` ${fieldId("recipient-error")}` : ""}`}
                      />
                      <FieldDescription id={fieldId("recipient-hint")}>
                        {canTransfer
                          ? recipient
                            ? `Stored simulated destination · default ${recipient.defaultCurrency}. IDs are exact, including spaces and case; no real identity is verified.`
                            : "Enter any exact nonblank ID. A new inspect-only destination is created only after successful confirmation."
                          : "IDs are not verified or saved in this preview."}
                      </FieldDescription>
                      {errors.recipient && (
                        <FieldError id={fieldId("recipient-error")}>
                          {errors.recipient}
                        </FieldError>
                      )}
                    </Field>
                  )}
                  {canTransfer && !recipient && (
                    <Field data-invalid={!!errors.recipientDefaultCurrency}>
                      <FieldLabel htmlFor={fieldId("recipient-default")}>
                        New destination default currency
                      </FieldLabel>
                      <Select
                        value={draft.recipientDefaultCurrency ?? ""}
                        onValueChange={(value) =>
                          updateDraft("recipientDefaultCurrency", value)
                        }
                        disabled={!hydrated}
                      >
                        <SelectTrigger
                          id={fieldId("recipient-default")}
                          aria-invalid={!!errors.recipientDefaultCurrency}
                          aria-describedby={
                            errors.recipientDefaultCurrency
                              ? fieldId("recipient-default-error")
                              : fieldId("recipient-default-hint")
                          }
                        >
                          <SelectValue placeholder="Choose a default currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {targetCurrencies.map((code) => (
                            <SelectItem key={code} value={code}>
                              {code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription id={fieldId("recipient-default-hint")}>
                        Only for a new destination; an existing default is never
                        overwritten.
                      </FieldDescription>
                      {errors.recipientDefaultCurrency && (
                        <FieldError id={fieldId("recipient-default-error")}>
                          {errors.recipientDefaultCurrency}
                        </FieldError>
                      )}
                    </Field>
                  )}
                  {(operation === "deposit" || operation === "withdraw") && (
                    <Field data-invalid={!!errors.provider}>
                      <FieldLabel htmlFor={fieldId("provider")}>
                        Fictional provider
                      </FieldLabel>
                      <Select
                        name="provider"
                        value={draft.provider}
                        onValueChange={(value) =>
                          updateDraft("provider", value)
                        }
                        disabled={!hydrated}
                      >
                        <SelectTrigger
                          id={fieldId("provider")}
                          aria-invalid={!!errors.provider}
                          aria-describedby={
                            errors.provider
                              ? fieldId("provider-error")
                              : undefined
                          }
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROVIDERS.map((provider) => (
                            <SelectItem
                              key={provider.code}
                              value={provider.code}
                            >
                              {provider.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.provider && (
                        <FieldError id={fieldId("provider-error")}>
                          {errors.provider}
                        </FieldError>
                      )}
                    </Field>
                  )}
                  <Field data-invalid={!!errors.amount || !!errors.currency}>
                    <div className="flex items-center justify-between gap-3">
                      <FieldLabel htmlFor={fieldId("amount")}>
                        {amountLabel}
                      </FieldLabel>
                      <Select
                        name="currency"
                        value={draft.currency}
                        onValueChange={(value) =>
                          updateDraft("currency", value as WalletCurrency)
                        }
                        disabled={!hydrated || wallets.length === 0}
                      >
                        <SelectTrigger
                          aria-label="Source currency"
                          className="w-28 shrink-0"
                          aria-invalid={!!errors.currency}
                          aria-describedby={
                            errors.currency
                              ? fieldId("currency-error")
                              : undefined
                          }
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {wallets.map((wallet) => (
                            <SelectItem key={wallet.id} value={wallet.currency}>
                              {wallet.currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.currency && (
                      <FieldError id={fieldId("currency-error")}>
                        {errors.currency}
                      </FieldError>
                    )}
                    <div className="relative">
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xl text-muted-foreground"
                      >
                        {CURRENCY_SYMBOLS[draft.currency] ?? "¤"}
                      </span>
                      <Input
                        className="h-14 pl-10 text-2xl font-medium tracking-tight md:text-2xl"
                        id={fieldId("amount")}
                        name="amount"
                        type="text"
                        readOnly={hidden}
                        inputMode="decimal"
                        value={hidden ? "" : draft.amount}
                        onChange={(event) =>
                          updateDraft("amount", event.target.value)
                        }
                        placeholder={hidden ? "Hidden" : "0.00"}
                        maxLength={MAX_AMOUNT_INPUT_LENGTH}
                        autoComplete="off"
                        aria-invalid={!!errors.amount}
                        aria-describedby={`${fieldId("available")}${errors.amount ? ` ${fieldId("amount-error")}` : ""}`}
                      />
                    </div>
                    <FieldDescription id={fieldId("available")}>
                      {sourceWallet
                        ? hidden
                          ? "Balance hidden"
                          : `${displayBalance(sourceWallet)} ${sourceWallet.currency} · ${balancesConnected ? "Journal-derived balance" : "Preview balance"}`
                        : "Balance unavailable"}
                    </FieldDescription>
                    {errors.amount && (
                      <FieldError id={fieldId("amount-error")}>
                        {errors.amount}
                      </FieldError>
                    )}
                  </Field>
                  {(operation === "convert" || canTransfer) && (
                    <Field data-invalid={!!errors.targetCurrency}>
                      <FieldLabel htmlFor={fieldId("target")}>
                        Receive currency
                      </FieldLabel>
                      <Select
                        name="targetCurrency"
                        value={
                          canTransfer
                            ? draft.targetCurrency || "recipient-default"
                            : draft.targetCurrency
                        }
                        onValueChange={(value) =>
                          updateDraft(
                            "targetCurrency",
                            value === "recipient-default"
                              ? ""
                              : (value as WalletCurrency),
                          )
                        }
                        disabled={
                          !hydrated ||
                          (canTransfer
                            ? targetCurrencies.length === 0
                            : canConvert
                              ? targetCurrencies.length < 2
                              : wallets.length < 2)
                        }
                      >
                        <SelectTrigger
                          id={fieldId("target")}
                          aria-invalid={!!errors.targetCurrency}
                          aria-describedby={
                            errors.targetCurrency
                              ? fieldId("target-error")
                              : undefined
                          }
                        >
                          <SelectValue placeholder="Choose a receiving currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {canTransfer && (
                            <SelectItem value="recipient-default">
                              Destination default
                              {(recipient?.defaultCurrency ??
                              draft.recipientDefaultCurrency)
                                ? ` · ${recipient?.defaultCurrency ?? draft.recipientDefaultCurrency}`
                                : ""}
                            </SelectItem>
                          )}
                          {(canConvert || canTransfer
                            ? targetCurrencies
                            : wallets.map((wallet) => wallet.currency)
                          ).map((currency) => (
                            <SelectItem
                              key={currency}
                              value={currency}
                              disabled={
                                operation === "convert" &&
                                currency === draft.currency
                              }
                            >
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(canConvert || canTransfer) && catalog.message && (
                        <FieldDescription>{catalog.message}</FieldDescription>
                      )}
                      {errors.targetCurrency && (
                        <FieldError id={fieldId("target-error")}>
                          {errors.targetCurrency}
                        </FieldError>
                      )}
                    </Field>
                  )}
                  {errors.form && <FieldError>{errors.form}</FieldError>}
                </FieldGroup>
                <div className="mt-6 grid gap-3">
                  <Button type="submit" className="w-full">
                    Review {OPERATION_NOUNS[operation]}
                    <ArrowRight aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={closeWorkspace}
                  >
                    Back to overview
                  </Button>
                </div>
                <FieldDescription className="mt-3 text-center">
                  Closing keeps this draft. Reloading clears it.
                </FieldDescription>
              </FieldSet>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
