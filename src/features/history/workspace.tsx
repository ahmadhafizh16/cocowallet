"use client";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { identifierContract } from "@/lib/contracts";
import { listAccountingCurrencies } from "../money/currency-precision";
import {
  historyDateContract,
  parseHistoryQuery,
  type HistoryQuery,
  type TransactionType,
} from "./contracts";
import { useHistoryRead } from "./use-history";
import {
  historyAmountLabel,
  historyTypeLabel,
  TransactionFacts,
} from "./transaction-facts";

const CURRENCIES = listAccountingCurrencies();
const TYPES = [
  ["deposit", "Deposits"],
  ["withdrawal", "Withdrawals"],
  ["conversion", "Conversions"],
  ["transfer", "Transfers"],
] as const;
const EMPTY = { type: "all", currency: "all", from: "", to: "" };
type FilterDraft = typeof EMPTY;
type Errors = Partial<Record<"from" | "to", string>>;

/** Mounted per selected account: ordinary filters/details stay in memory only.
 * Revisions/queries/privacy cancel reads; stale facts never become a fallback. */
export function HistoryWorkspace({
  accountId,
  hidden,
  revision,
  onClose,
  initialTransactionId,
}: {
  accountId: string;
  hidden: boolean;
  revision: object;
  onClose: () => void;
  initialTransactionId?: string;
}) {
  const [draft, setDraft] = useState<FilterDraft>(EMPTY);
  const [query, setQuery] = useState<HistoryQuery>({
    accountId,
    page: 1,
    pageSize: 50,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [transactionId, setTransaction] = useState(initialTransactionId);
  const [lookup, setLookup] = useState("");
  const [lookupError, setLookupError] = useState<string>();
  const [pageDraft, setPageDraft] = useState("1"),
    [pageError, setPageError] = useState<string>();
  const form = useRef<HTMLFormElement>(null),
    heading = useRef<HTMLHeadingElement>(null),
    list = useRef<HTMLUListElement>(null),
    lookupInput = useRef<HTMLInputElement>(null);
  const restore = useRef<string | undefined>(undefined);
  const previousTransaction = useRef(transactionId);
  const prefix = useId();
  const id = (field: string) => `${prefix}-${field}`;
  const read = useHistoryRead(
    transactionId
      ? { kind: "detail", accountId, transactionId }
      : { kind: "list", query: { ...query, accountId } },
    revision,
    !hidden,
  );
  useEffect(() => {
    // The parent focuses explicit entry. An account-switch remount must not
    // compete with the account menu's native focus restoration.
    if (previousTransaction.current !== transactionId) heading.current?.focus();
    previousTransaction.current = transactionId;
  }, [transactionId]);
  useEffect(() => {
    if (transactionId || !read.result || restore.current === undefined) return;
    const target = Array.from(
      list.current?.querySelectorAll<HTMLButtonElement>(
        "button[data-transaction-id]",
      ) ?? [],
    ).find(
      (button) =>
        button.getAttribute("data-transaction-id") === restore.current,
    );
    (target ?? heading.current)?.focus();
    restore.current = undefined;
  }, [transactionId, read.result]);
  function change(field: keyof FilterDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors({});
  }
  function page(next: number) {
    read.retry();
    restore.current = "";
    setQuery((current) => ({ ...current, page: next }));
    setPageDraft(String(next));
    setPageError(undefined);
  }
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Errors = {};
    if (draft.from && !historyDateContract.is(draft.from))
      next.from = "Use a valid UTC day in YYYY-MM-DD format.";
    if (draft.to && !historyDateContract.is(draft.to))
      next.to = "Use a valid UTC day in YYYY-MM-DD format.";
    if (
      !next.from &&
      !next.to &&
      draft.from &&
      draft.to &&
      draft.from > draft.to
    )
      next.to = "End day cannot be before start day.";
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        form.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    restore.current = "";
    setPageDraft("1");
    setPageError(undefined);
    read.retry();
    setQuery({
      accountId,
      page: 1,
      pageSize: 50,
      ...(draft.type !== "all" ? { type: draft.type as TransactionType } : {}),
      ...(draft.currency !== "all" ? { currency: draft.currency } : {}),
      ...(draft.from ? { from: draft.from } : {}),
      ...(draft.to ? { to: draft.to } : {}),
    });
  }
  function clear() {
    read.retry();
    setDraft(EMPTY);
    setErrors({});
    restore.current = "";
    setQuery({ accountId, page: 1, pageSize: 50 });
    setPageDraft("1");
    setPageError(undefined);
  }
  function go(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      page(
        parseHistoryQuery(new URLSearchParams({ accountId, page: pageDraft }))
          .page,
      );
    } catch {
      setPageError(
        "Enter a positive whole page number, without signs or leading zeros.",
      );
      event.currentTarget.querySelector<HTMLInputElement>("input")?.focus();
    }
  }
  function find(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identifierContract.is(lookup)) {
      setLookupError(
        "Enter a nonblank transaction ID without NUL characters, up to 8,192 characters.",
      );
      lookupInput.current?.focus();
      return;
    }
    setLookupError(undefined);
    setTransaction(lookup);
  }
  if (hidden)
    return (
      <div className="space-y-4">
        <h3 ref={heading} tabIndex={-1} className="text-lg font-semibold">
          History hidden
        </h3>
        <p className="text-sm text-muted-foreground">
          Show amounts to browse transactions and recorded details. Your
          browsing context stays in memory.
        </p>
        <Button variant="outline" onClick={onClose}>
          Back to overview
        </Button>
      </div>
    );
  const result = read.result?.kind === "list" ? read.result.page : undefined;
  if (transactionId)
    return (
      <div className="space-y-5">
        <Button
          variant="ghost"
          onClick={() => {
            restore.current = transactionId;
            setTransaction(undefined);
          }}
        >
          <ArrowLeft aria-hidden="true" />
          Back to results
        </Button>
        <h3 ref={heading} tabIndex={-1} className="text-lg font-semibold">
          Transaction details
        </h3>
        {read.pending ? (
          <Loading label="Loading transaction details…" />
        ) : read.failure ? (
          <div className="space-y-3">
            <p role="status" className="text-sm text-muted-foreground">
              {read.failure === "missing"
                ? "Transaction not found in this account’s completed history. No other account’s record is shown."
                : "Transaction details could not be loaded or validated. No preview or previous record is used instead."}
            </p>
            <Button variant="outline" onClick={read.retry}>
              Retry transaction details
            </Button>
          </div>
        ) : (
          read.result?.kind === "detail" && (
            <>
              <TransactionFacts transaction={read.result.detail.transaction} />
              <p className="text-sm text-muted-foreground">
                Recorded transaction facts, not current balances or today’s
                rate.
              </p>
            </>
          )
        )}
      </div>
    );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 ref={heading} tabIndex={-1} className="text-lg font-semibold">
          Browse completed activity
        </h3>
        <Button variant="ghost" onClick={onClose}>
          <ArrowLeft aria-hidden="true" />
          Back to overview
        </Button>
      </div>
      <p className="text-sm text-muted-foreground wrap-anywhere">
        Inspecting account <bdi>{accountId}</bdi>. Completed simulations only;
        rejected attempts are not transactions.
      </p>
      <form
        ref={form}
        onSubmit={apply}
        noValidate
        className="space-y-4"
        aria-label="History filters"
      >
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field>
            <FieldLabel htmlFor={id("type")}>History type</FieldLabel>
            <Select
              value={draft.type}
              onValueChange={(value) => change("type", value)}
            >
              <SelectTrigger id={id("type")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All activity</SelectItem>
                {TYPES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor={id("currency")}>History currency</FieldLabel>
            <Select
              value={draft.currency}
              onValueChange={(value) => change("currency", value)}
            >
              <SelectTrigger
                id={id("currency")}
                aria-describedby={id("currency-hint")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All currencies</SelectItem>
                {CURRENCIES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {(["from", "to"] as const).map((field) => (
            <Field key={field} data-invalid={!!errors[field]}>
              <FieldLabel htmlFor={id(field)}>
                {field === "from" ? "From day (UTC)" : "To day (UTC)"}
              </FieldLabel>
              <Input
                id={id(field)}
                value={draft[field]}
                onChange={(event) => change(field, event.target.value)}
                placeholder="YYYY-MM-DD"
                maxLength={10}
                autoComplete="off"
                aria-invalid={!!errors[field]}
                aria-describedby={`${id("date-hint")}${errors[field] ? ` ${id(`${field}-error`)}` : ""}`}
              />
              {errors[field] && (
                <FieldError id={id(`${field}-error`)}>
                  {errors[field]}
                </FieldError>
              )}
            </Field>
          ))}
        </div>
        <p id={id("currency-hint")} className="text-sm text-muted-foreground">
          Currency matches either affected side, including historical accounting
          codes. No current FX is requested.
        </p>
        <p id={id("date-hint")} className="text-sm text-muted-foreground">
          Days use YYYY-MM-DD, both inclusive in UTC—not your browser’s
          timezone. Leave either day empty for no boundary.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button type="submit">Apply history filters</Button>
          <Button variant="outline" onClick={clear}>
            Clear history filters
          </Button>
        </div>
      </form>
      <div className="space-y-4" aria-busy={read.pending}>
        {read.pending ? (
          <Loading label="Loading this account’s history…" />
        ) : read.failure ? (
          <div className="space-y-3">
            <p role="status" className="text-sm text-muted-foreground">
              History could not be loaded or validated. No previous page or
              other account’s records are shown.
            </p>
            <Button variant="outline" onClick={read.retry}>
              Retry history
            </Button>
          </div>
        ) : (
          result && (
            <>
              <p role="status" className="text-sm text-muted-foreground">
                {result.pagination.totalItems} matching completed{" "}
                {result.pagination.totalItems === 1
                  ? "operation"
                  : "operations"}{" "}
                ·{" "}
                {result.pagination.totalPages
                  ? `Page ${query.page} of ${result.pagination.totalPages}`
                  : "No pages to display"}
              </p>
              <p className="text-sm text-muted-foreground">
                Applied:{" "}
                {TYPES.find(([type]) => type === query.type)?.[1] ??
                  "All activity"}{" "}
                · {query.currency ?? "All currencies"} ·{" "}
                {query.from ?? "No start day"} to {query.to ?? "No end day"}{" "}
                (UTC)
              </p>
              <p className="text-sm text-muted-foreground">
                Newest first · 50 per page. New activity between requests can
                shift numbered pages.
              </p>
              {result.transactions.length ? (
                <ul
                  ref={list}
                  className="space-y-2"
                  aria-label="Full transaction history"
                >
                  {result.transactions.map((t) => (
                    <li
                      key={t.transactionId}
                      className="min-w-0 border-b border-border last:border-0"
                    >
                      <Button
                        variant="ghost"
                        className="h-auto min-h-11 w-full justify-start gap-3 px-0 py-3 text-left whitespace-normal"
                        data-transaction-id={t.transactionId}
                        aria-label={`View ${historyTypeLabel(t).toLowerCase()} ${t.transactionId} · ${historyAmountLabel(t)} · Recorded at (UTC) ${t.createdAt}`}
                        onClick={() => setTransaction(t.transactionId)}
                      >
                        <span className="min-w-0 flex-1 wrap-anywhere">
                          <span className="block">
                            {historyTypeLabel(t)} · {historyAmountLabel(t)}
                          </span>
                          <time
                            className="mt-1 block text-sm font-normal text-muted-foreground"
                            dateTime={t.createdAt}
                          >
                            {t.createdAt}
                          </time>
                        </span>
                        <ArrowRight className="shrink-0" aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-2">
                  <h4 className="font-semibold">
                    {result.pagination.totalItems
                      ? "No records on this page"
                      : "No matching completed activity"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {result.pagination.totalItems
                      ? "Choose an earlier page or return to page 1."
                      : "Try clearing the filters. Completed simulations will appear here; rejected attempts never do."}
                  </p>
                </div>
              )}
              <nav
                className="flex flex-wrap items-center gap-3"
                aria-label="History pages"
              >
                <Button
                  variant="outline"
                  disabled={query.page === 1}
                  onClick={() => page(query.page - 1)}
                >
                  <ChevronLeft aria-hidden="true" />
                  Previous page
                </Button>
                <Button
                  variant="outline"
                  disabled={query.page >= result.pagination.totalPages}
                  onClick={() => page(query.page + 1)}
                >
                  Next page
                  <ChevronRight aria-hidden="true" />
                </Button>
                {query.page > 1 && (
                  <Button variant="ghost" onClick={() => page(1)}>
                    First page
                  </Button>
                )}
              </nav>
              <form
                onSubmit={go}
                noValidate
                className="flex flex-wrap items-end gap-3"
                aria-label="Choose history page"
              >
                <Field className="w-32" data-invalid={!!pageError}>
                  <FieldLabel htmlFor={id("page")}>Page number</FieldLabel>
                  <Input
                    id={id("page")}
                    inputMode="numeric"
                    maxLength={16}
                    value={pageDraft}
                    onChange={(event) => {
                      setPageDraft(event.target.value);
                      setPageError(undefined);
                    }}
                    aria-invalid={!!pageError}
                    aria-describedby={pageError ? id("page-error") : undefined}
                  />
                </Field>
                <Button variant="outline" type="submit">
                  Go to page
                </Button>
                {pageError && (
                  <FieldError id={id("page-error")}>{pageError}</FieldError>
                )}
              </form>
            </>
          )
        )}
      </div>
      <details>
        <summary className="cursor-pointer min-h-11 py-2 text-sm">
          Find by transaction ID
        </summary>
        <form onSubmit={find} noValidate className="space-y-3 pt-3">
          <Field data-invalid={!!lookupError}>
            <FieldLabel htmlFor={id("lookup")}>Transaction ID</FieldLabel>
            <Input
              ref={lookupInput}
              id={id("lookup")}
              value={lookup}
              onChange={(event) => {
                setLookup(event.target.value);
                setLookupError(undefined);
              }}
              maxLength={8192}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={!!lookupError}
              aria-describedby={lookupError ? id("lookup-error") : undefined}
            />
            {lookupError && (
              <FieldError id={id("lookup-error")}>{lookupError}</FieldError>
            )}
          </Field>
          <Button variant="outline" type="submit">
            Find transaction
          </Button>
        </form>
      </details>
    </div>
  );
}
function Loading({ label }: { label: string }) {
  return (
    <div className="space-y-3">
      <p role="status" className="text-sm text-muted-foreground">
        {label}
      </p>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
