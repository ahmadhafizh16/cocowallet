"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { MoneyAmountInput } from "./money-amount-input";
import { MoneyReview, ReviewWallet, ReviewProvider } from "./money-review";
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
    "Choose how much to add and where it comes from. You’ll review the details before confirming.",
  withdraw:
    "Choose an amount and where to withdraw it. Review the details before confirming.",
  convert:
    "Choose your currencies and amount. Review the exchange rate before confirming.",
  transfer:
    "Choose a saved recipient or add a new address, then enter the amount to send.",
};
const SEND_CURRENCIES = ["USD", "GBP", "EUR"];

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
  const targetCurrencies = canTransfer
    ? SEND_CURRENCIES
    : [
        ...new Set([
          ...(catalog.codes ??
            suppliedWallets.map((wallet) => wallet.currency)),
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
  const submissionSucceeded =
    !!funding.result && "transactionId" in funding.result;
  const wallets = walletsForAccount(suppliedWallets, account?.id);
  const sourceWallets =
    operation === "transfer"
      ? SEND_CURRENCIES.flatMap((code) =>
          wallets.filter((wallet) => wallet.currency === code),
        )
      : wallets;
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
          recipientDefaultCurrency: "USD",
          currency: wallets.some((wallet) => wallet.currency === "USD")
            ? "USD"
            : (wallets.find((wallet) =>
                SEND_CURRENCIES.includes(wallet.currency),
              )?.currency ?? "USD"),
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
  const [newRecipient, setNewRecipient] = useState(false);
  const previousDialog = useRef({ open, operation });
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
        next.recipientDefaultCurrency = "USD";
        const saved = accounts.find(
          (account) => account.role === "destination" && account.id === value,
        );
        next.targetCurrency =
          saved && !SEND_CURRENCIES.includes(saved.defaultCurrency)
            ? "USD"
            : "";
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
        ?.querySelector<HTMLElement>(
          operation === "transfer"
            ? newRecipient
              ? 'input[name="recipient"]'
              : "[data-recipient-picker]"
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
    resetCompleted();
    captureMotionFrame(DIALOG_MOTION_SELECTOR, false);
    onOpenChange(false);
  }

  function resetCompleted() {
    if (!submissionSucceeded || funding.storageBlocked) return;
    funding.startAnother();
    quote.invalidate();
    transferQuote.invalidate();
    setReviews({});
  }

  // A confirmed result may arrive after a pending dialog was dismissed. A later
  // explicit operation opens its own form, never a stale success. Unknown results
  // and failed recovery-storage cleanup remain protected by the shared hook.
  useEffect(() => {
    const previous = previousDialog.current;
    previousDialog.current = { open, operation };
    if (open && (!previous.open || previous.operation !== operation))
      resetCompleted();
  }, [open, operation]);

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
        onOpenChange={(next) => (next ? onOpenChange(true) : closeWorkspace())}
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
          <DialogHeader className={submissionSucceeded ? "sr-only" : undefined}>
            <DialogTitle>
              {submissionSucceeded
                ? "Transaction complete"
                : fundingPanel
                  ? "Transaction status"
                  : title}
            </DialogTitle>
            <DialogDescription>
              {submissionSucceeded
                ? "Your wallet has been updated."
                : fundingPanel
                  ? "Check the original request and its status. If the result is unknown, retry that request rather than starting another."
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
                review={review}
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
            <MoneyReview
              title={`Review ${OPERATION_NOUNS[operation]}`}
              heading={reviewRef}
              amount={displayAmount(review.minor, review.wallet.exponent)}
              currency={review.wallet.currency}
              hidden={hidden}
              disabled={!canFund || !funding.ready}
              confirmLabel={`Confirm ${OPERATION_NOUNS[operation]}`}
              onConfirm={confirmFunding}
              onEdit={editReview}
              onCancel={closeWorkspace}
              sourceLabel={operation === "deposit" ? "From" : "From wallet"}
              targetLabel={operation === "deposit" ? "To wallet" : "Recipient"}
              source={
                operation === "deposit" ? (
                  <ReviewProvider
                    label={
                      PROVIDERS.find((p) => p.code === review.provider)
                        ?.label ?? "Bank account"
                    }
                  />
                ) : (
                  <ReviewWallet
                    currency={review.wallet.currency}
                    id={review.wallet.id}
                  />
                )
              }
              target={
                operation === "deposit" ? (
                  <ReviewWallet
                    currency={review.wallet.currency}
                    id={review.wallet.id}
                  />
                ) : (
                  <ReviewProvider
                    label={
                      PROVIDERS.find((p) => p.code === review.provider)
                        ?.label ?? "Bank account"
                    }
                  />
                )
              }
            >
              {!canFund && (
                <p role="status">This operation is not available yet.</p>
              )}
              {errors.form && <FieldError>{errors.form}</FieldError>}
            </MoneyReview>
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
                        Recipient
                      </FieldLabel>
                      <Select
                        value={
                          newRecipient
                            ? "new"
                            : recipient
                              ? `saved:${encodeURIComponent(recipient.id)}`
                              : ""
                        }
                        onValueChange={(value) => {
                          setNewRecipient(value === "new");
                          updateDraft(
                            "recipient",
                            value === "new"
                              ? ""
                              : decodeURIComponent(value.slice(6)),
                          );
                        }}
                        disabled={!hydrated}
                      >
                        <SelectTrigger
                          data-recipient-picker
                          id={fieldId("recipient")}
                          aria-invalid={!!errors.recipient && !newRecipient}
                        >
                          <SelectValue placeholder="Select an available address" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts
                            .filter((a) => a.role === "destination")
                            .map((a) => (
                              <SelectItem
                                key={a.id}
                                value={`saved:${encodeURIComponent(a.id)}`}
                              >
                                <bdi className="wallet-recipient-option">
                                  {a.id}
                                </bdi>
                              </SelectItem>
                            ))}
                          <SelectItem value="new">
                            Create new address
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {newRecipient && (
                        <>
                          <FieldLabel htmlFor={fieldId("new-recipient")}>
                            New address
                          </FieldLabel>
                          <Input
                            id={fieldId("new-recipient")}
                            name="recipient"
                            value={draft.recipient}
                            onChange={(event) =>
                              updateDraft("recipient", event.target.value)
                            }
                            placeholder="Enter a recipient address"
                            autoComplete="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            maxLength={8192}
                            aria-invalid={!!errors.recipient}
                            aria-describedby={`${fieldId("recipient-hint")}${errors.recipient ? ` ${fieldId("recipient-error")}` : ""}`}
                          />
                        </>
                      )}
                      <FieldDescription id={fieldId("recipient-hint")}>
                        {recipient
                          ? `Saved address · default currency ${recipient.defaultCurrency}.`
                          : newRecipient
                            ? "New addresses use USD by default and are saved when the transfer completes."
                            : "Choose someone you’ve sent to, or create a new address."}
                      </FieldDescription>
                      {errors.recipient && (
                        <FieldError id={fieldId("recipient-error")}>
                          {errors.recipient}
                        </FieldError>
                      )}
                    </Field>
                  )}
                  {(operation === "deposit" || operation === "withdraw") && (
                    <Field data-invalid={!!errors.provider}>
                      <FieldLabel htmlFor={fieldId("provider")}>
                        {operation === "deposit"
                          ? "Deposit from"
                          : "Withdraw to"}
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
                        disabled={!hydrated || sourceWallets.length === 0}
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
                          {sourceWallets.map((wallet) => (
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
                    <MoneyAmountInput
                      symbol={CURRENCY_SYMBOLS[draft.currency] ?? "¤"}
                      hidden={hidden}
                      id={fieldId("amount")}
                      value={draft.amount}
                      onValueChange={(value) => updateDraft("amount", value)}
                      aria-invalid={!!errors.amount}
                      aria-describedby={`${fieldId("available")}${errors.amount ? ` ${fieldId("amount-error")}` : ""}`}
                    />
                    <FieldDescription id={fieldId("available")}>
                      {sourceWallet
                        ? hidden
                          ? "Balance hidden"
                          : `Available balance: ${displayBalance(sourceWallet)} ${sourceWallet.currency}`
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
                          {canTransfer &&
                            (!recipient ||
                              SEND_CURRENCIES.includes(
                                recipient.defaultCurrency,
                              )) && (
                              <SelectItem value="recipient-default">
                                Address default
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
                </div>
              </FieldSet>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
