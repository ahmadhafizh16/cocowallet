"use client";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Check,
  History,
  Search,
  X,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import { readableTime } from "@/lib/date-presentation";
import { listAccountingCurrencies } from "../money/currency-precision";
import {
  historyDateContract,
  parseHistoryQuery,
  type HistoryQuery,
  type HistoryTransaction,
  type TransactionType,
} from "./contracts";
import { useHistoryRead } from "./use-history";
import {
  historyAmountLabel,
  historyTypeLabel,
  TransactionFacts,
  TransactionSummary,
  TransactionDirection,
  CompletedStatus,
} from "./transaction-facts";
import { HistoryDateRange } from "./date-range";

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
      ...(query.transactionId ? { transactionId: query.transactionId } : {}),
      ...(draft.type !== "all" ? { type: draft.type as TransactionType } : {}),
      ...(draft.currency !== "all" ? { currency: draft.currency } : {}),
      ...(draft.from ? { from: draft.from } : {}),
      ...(draft.to ? { to: draft.to } : {}),
    });
  }
  function clear() {
    read.retry();
    setDraft(EMPTY);
    setLookup("");
    setLookupError(undefined);
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
    if (lookup === "") {
      clearSearch();
      return;
    }
    if (!identifierContract.is(lookup)) {
      setLookupError(
        "Enter a nonblank transaction ID without NUL characters, up to 8,192 characters.",
      );
      lookupInput.current?.focus();
      return;
    }
    setLookupError(undefined);
    read.retry();
    restore.current = "";
    setPageDraft("1");
    setPageError(undefined);
    setQuery((current) => ({ ...current, page: 1, transactionId: lookup }));
  }
  function clearSearch() {
    setLookup("");
    setLookupError(undefined);
    read.retry();
    restore.current = "";
    setPageDraft("1");
    setPageError(undefined);
    setQuery((current) => {
      const next = { ...current, page: 1 };
      delete next.transactionId;
      return next;
    });
  }
  if (hidden)
    return (
      <div className="wallet-history-sheet space-y-4">
        <h3
          id="history-heading"
          ref={heading}
          tabIndex={-1}
          className="text-lg font-semibold"
        >
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
      <div className="wallet-history-sheet wallet-detail-sheet">
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
        <div className="wallet-detail-header">
          <div className="wallet-detail-title">
            <h3
              id="history-heading"
              ref={heading}
              tabIndex={-1}
              className="wallet-detail-heading"
            >
              Transaction details
            </h3>
            {read.result?.kind === "detail" && (
              <>
                <CompletedStatus />
                <TransactionDirection
                  transaction={read.result.detail.transaction}
                />
              </>
            )}
          </div>
          {read.result?.kind === "detail" && (
            <TransactionSummary transaction={read.result.detail.transaction} />
          )}
        </div>
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
              <div className="wallet-detail-footer">
                <Info aria-hidden="true" />
                Recorded transaction facts, not current balances or today’s
                rate.
              </div>
            </>
          )
        )}
      </div>
    );
  return (
    <div className="wallet-history-workspace">
      <div className="wallet-history-heading">
        <h3
          id="history-heading"
          ref={heading}
          tabIndex={-1}
          className="wallet-panel-title"
        >
          <History aria-hidden="true" />
          Completed transactions
        </h3>
        <span className="wallet-history-account">
          Account <bdi>{accountId}</bdi>
        </span>
      </div>
      <div className="wallet-history-sheet">
        <div className="wallet-history-toolbar">
          <form
            ref={form}
            onSubmit={apply}
            noValidate
            className="wallet-history-filters"
            aria-label="History filters"
          >
            <div className="wallet-history-filter-grid">
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
                <FieldLabel htmlFor={id("currency")}>
                  History currency
                </FieldLabel>
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
              <HistoryDateRange
                id={id("dates")}
                from={draft.from}
                to={draft.to}
                errors={errors}
                onChange={(from, to) => {
                  setDraft((current) => ({ ...current, from, to }));
                  setErrors({});
                }}
              />
            </div>
            <p id={id("currency-hint")} className="sr-only">
              Currency matches either affected side, including historical
              accounting codes. No current FX is requested.
            </p>
            <p id={id("date-hint")} className="sr-only">
              Days use YYYY-MM-DD, both inclusive in UTC—not your browser’s
              timezone. Leave either day empty for no boundary.
            </p>
            <div className="wallet-history-filter-actions">
              <Button type="submit">Apply Filter</Button>
              <Button variant="outline" onClick={clear}>
                Reset Filter
              </Button>
            </div>
          </form>
          <form
            onSubmit={find}
            noValidate
            className="wallet-history-search"
            aria-label="Find by transaction ID"
          >
            <Field data-invalid={!!lookupError}>
              <FieldLabel htmlFor={id("lookup")} className="sr-only">
                Transaction ID
              </FieldLabel>
              <div
                className="wallet-history-search-control"
                data-has-search={!!(lookup || query.transactionId) || undefined}
              >
                <Search aria-hidden="true" />
                <Input
                  ref={lookupInput}
                  id={id("lookup")}
                  type="search"
                  value={lookup}
                  placeholder="Search by transaction ID…"
                  onChange={(event) => {
                    setLookup(event.target.value);
                    setLookupError(undefined);
                  }}
                  maxLength={8192}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={!!lookupError}
                  aria-describedby={`${id("lookup-hint")}${lookupError ? ` ${id("lookup-error")}` : ""}`}
                />
                {(lookup || query.transactionId) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="wallet-history-clear-search"
                    aria-label="Clear transaction search"
                    title="Clear transaction search"
                    onClick={clearSearch}
                  >
                    <X aria-hidden="true" />
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  aria-label="Find transaction"
                  title="Find exact transaction ID"
                >
                  <ArrowRight aria-hidden="true" />
                </Button>
              </div>
              <p id={id("lookup-hint")} className="sr-only">
                Enter an exact transaction ID to filter this account’s History
                list. Select a result to view details.
              </p>
              {lookupError && (
                <FieldError id={id("lookup-error")}>{lookupError}</FieldError>
              )}
            </Field>
          </form>
        </div>
        <div className="wallet-history-results" aria-busy={read.pending}>
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
                <p role="status" className="wallet-history-summary">
                  {result.pagination.totalItems} matching completed{" "}
                  {result.pagination.totalItems === 1
                    ? "operation"
                    : "operations"}{" "}
                  ·{" "}
                  {result.pagination.totalPages
                    ? `Page ${query.page} of ${result.pagination.totalPages}`
                    : "No pages to display"}{" "}
                  · Newest first
                </p>
                {result.transactions.length ? (
                  <ul
                    ref={list}
                    className="wallet-history-list"
                    aria-label="Full transaction history"
                  >
                    {result.transactions.map((t) => (
                      <HistoryRow
                        key={t.transactionId}
                        transaction={t}
                        onOpen={() => setTransaction(t.transactionId)}
                      />
                    ))}
                  </ul>
                ) : (
                  <div className="wallet-history-empty wallet-history-filter-empty">
                    <span className="wallet-empty-symbol" aria-hidden="true">
                      <History />
                    </span>
                    <h4 className="font-semibold">
                      {result.pagination.totalItems
                        ? "No records on this page"
                        : "No matching completed activity"}
                    </h4>
                    <p>
                      <strong>
                        {result.pagination.totalItems
                          ? "Choose an earlier page or return to page 1."
                          : "Try clearing the search or filters. Your completed transactions will appear here."}
                      </strong>
                    </p>
                  </div>
                )}
                <div className="wallet-history-footer">
                  <p>
                    Showing {result.transactions.length} of{" "}
                    {result.pagination.totalItems} transactions
                  </p>
                  <nav
                    className="wallet-history-pages"
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
                    <form
                      onSubmit={go}
                      noValidate
                      className="wallet-history-page-jump"
                      aria-label="Choose history page"
                    >
                      <Field data-invalid={!!pageError}>
                        <FieldLabel htmlFor={id("page")} className="sr-only">
                          Page number
                        </FieldLabel>
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
                          aria-describedby={
                            pageError ? id("page-error") : undefined
                          }
                        />
                      </Field>
                      <Button variant="outline" type="submit">
                        Go to page
                      </Button>
                      {pageError && (
                        <FieldError id={id("page-error")}>
                          {pageError}
                        </FieldError>
                      )}
                    </form>
                    <Button
                      variant="outline"
                      disabled={query.page >= result.pagination.totalPages}
                      onClick={() => page(query.page + 1)}
                    >
                      Next page <ChevronRight aria-hidden="true" />
                    </Button>
                    {query.page > 1 && (
                      <Button variant="ghost" onClick={() => page(1)}>
                        First page
                      </Button>
                    )}
                  </nav>
                </div>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
function HistoryRow({
  transaction: t,
  onOpen,
}: {
  transaction: HistoryTransaction;
  onOpen: () => void;
}) {
  const incoming = t.direction === "incoming",
    conversion = t.type === "conversion";
  const Icon = conversion
    ? ArrowRightLeft
    : incoming
      ? ArrowDownLeft
      : ArrowUpRight;
  return (
    <li className="wallet-recent-row">
      <Button
        variant="ghost"
        className="wallet-history-row"
        data-transaction-id={t.transactionId}
        aria-label={`View ${historyTypeLabel(t).toLowerCase()} ${t.transactionId} · ${historyAmountLabel(t)} · ${readableTime(t.createdAt)}`}
        onClick={onOpen}
      >
        <span
          className={`wallet-transaction-icon ${conversion ? "is-conversion" : incoming ? "is-credit" : "is-debit"}`}
          aria-hidden="true"
        >
          <Icon />
        </span>
        <span className="wallet-transaction-identity">
          <span className="wallet-transaction-title">
            {historyTypeLabel(t)}
          </span>
          <time dateTime={t.createdAt}>{readableTime(t.createdAt)}</time>
        </span>
        <span className="wallet-transaction-amounts">
          {!incoming && t.source && (
            <span className="wallet-debit">
              −{t.source.amount} {t.source.currency}
            </span>
          )}
          {t.target && (
            <span className="wallet-credit">
              +{t.target.amount} {t.target.currency}
            </span>
          )}
        </span>
        <span className="wallet-transaction-status" title="Completed">
          <Check aria-hidden="true" />
          <span className="wallet-status-label">Completed</span>
        </span>
        <ChevronRight className="wallet-history-chevron" aria-hidden="true" />
      </Button>
    </li>
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
