"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleDollarSign,
  Copy,
  Eye,
  EyeOff,
  History,
  House,
  Info,
  Plus,
  Send,
  Wallet,
} from "lucide-react";
import { CocoWalletLogo } from "@/components/brand/cocowallet-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeMenu } from "@/features/theme/theme-menu";
import { useHydrated } from "@/lib/use-hydrated";
import { RecentFunding } from "../funding/recent-funding";
import { RecentTransactions } from "../history/recent-transactions";
import { HistoryWorkspace } from "../history/workspace";
import { usePortfolio } from "../portfolio/use-portfolio";
import type { TransactionType } from "../history/contracts";
import { BalanceHistory } from "./balance-history";
import { CurrencyFlag } from "./currency-flag";
import { OperationWorkspace } from "./operation-workspace";
import { type Operation } from "./operation-model";
import {
  displayBalance,
  displayUsdTotal,
  hasZeroTotal,
  walletsForAccount,
} from "./presentation";
import type { WalletOverview } from "./types";

const NAVIGATION = [
  { id: "overview", label: "Overview", icon: House },
  { id: "wallets", label: "Wallets", icon: Wallet },
  { id: "history", label: "History", icon: History },
] as const;

const ACTIONS = [
  { operation: "deposit", label: "Deposit", icon: Plus },
  { operation: "withdraw", label: "Withdraw", icon: ArrowUpRight },
  { operation: "convert", label: "Convert", icon: ArrowRightLeft },
  { operation: "transfer", label: "Send money", icon: Send },
] as const;

const HISTORY_FILTERS = [
  { value: "all", label: "All activity", empty: "No activity yet" },
  { value: "deposit", label: "Deposits", empty: "No deposits to show." },
  { value: "withdraw", label: "Withdrawals", empty: "No withdrawals to show." },
  { value: "convert", label: "Conversions", empty: "No conversions to show." },
  { value: "transfer", label: "Transfers", empty: "No transfers to show." },
] as const;

export function WalletDashboard({
  model,
  children,
}: {
  model: WalletOverview;
  children?: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const historyPage = pathname === "/history";
  const previousHistoryPage = useRef(historyPage);
  const hydrated = useHydrated();
  const [activeAccountId, setActiveAccount] = useState(model.activeAccountId);
  const [hidden, setHidden] = useState(false);
  const [operation, setOperation] = useState<Operation>("transfer");
  const [operationOpen, setOperationOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<string>();
  const [copyResult, setCopyResult] = useState<{
    accountId: string;
    message: string;
  }>();
  const operationTriggerRef = useRef<HTMLElement | null>(null);
  const mobileActionsRef = useRef<HTMLButtonElement>(null);
  const menuOpeningOperationRef = useRef(false);
  const account =
    model.accounts.find((item) => item.id === activeAccountId) ??
    model.accounts[0];
  const isMain = account?.role === "main";
  const wallets = walletsForAccount(model.wallets, account?.id);
  const zeroTotal = hasZeroTotal(wallets);
  const balancesConnected = model.mode !== "interface-preview";
  const fundingEnabled = model.mode === "connected-funding";
  const portfolio = usePortfolio(
    account?.id,
    wallets,
    model,
    fundingEnabled && !historyPage && !hidden,
  );
  const recentFunding = model.transactions.filter(
    (receipt) =>
      (receipt.type === "conversion"
        ? receipt.source.accountId
        : receipt.accountId) === account?.id &&
      (historyFilter === "all" ||
        receipt.type ===
          (historyFilter === "withdraw"
            ? "withdrawal"
            : historyFilter === "convert"
              ? "conversion"
              : historyFilter)),
  );
  const suppliedTotal = account ? model.usdTotals?.[account.id] : undefined;
  const totalLabel = fundingEnabled
    ? portfolio.view?.total.status === "available"
      ? displayUsdTotal({
          status: "available",
          balanceMinor: portfolio.view.total.balanceMinor,
        })
      : null
    : suppliedTotal !== undefined
      ? displayUsdTotal(suppliedTotal)
      : zeroTotal
        ? "$0.00"
        : null;
  const invalidHistory =
    model.balanceHistory !== undefined && !Array.isArray(model.balanceHistory);
  const histories = Array.isArray(model.balanceHistory)
    ? model.balanceHistory.filter(
        (series) => series && series.accountId === account?.id,
      )
    : [];
  // Ambiguous duplicate series are not combined or silently selected.
  const balanceHistory = fundingEnabled
    ? portfolio.view?.history
    : invalidHistory || histories.length > 1
      ? null
      : histories[0];
  const valuationRates =
    portfolio.view?.total.status === "available"
      ? portfolio.view.total.rates
      : [];
  const copyFeedback =
    copyResult?.accountId === account?.id ? (copyResult?.message ?? "") : "";
  const emptyHistoryHeading = fundingEnabled
    ? "No matching completed activity"
    : balancesConnected
      ? "Transaction history not connected"
      : (HISTORY_FILTERS.find((filter) => filter.value === historyFilter)
          ?.empty ?? HISTORY_FILTERS[0].empty);

  useEffect(() => {
    function syncHash() {
      const id = window.location.hash.slice(1);
      if (NAVIGATION.some((item) => item.id === id)) setActiveSection(id);
    }
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    if (historyPage)
      document
        .getElementById("history")
        ?.querySelector<HTMLElement>("h3")
        ?.focus();
    else if (previousHistoryPage.current)
      document.getElementById("overview")?.focus();
    previousHistoryPage.current = historyPage;
  }, [historyPage]);

  function openOperation(next: Operation, trigger: HTMLElement | null) {
    if (!isMain || !hydrated) return;
    operationTriggerRef.current = trigger;
    setOperation(next);
    setOperationOpen(true);
  }

  function inspectAccount(id: string) {
    setOperationOpen(false);
    setActiveAccount(id);
    setCopyResult(undefined);
  }

  async function copyAccountId() {
    if (!account) return;
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(account.id);
      setCopyResult({ accountId: account.id, message: "Account ID copied." });
    } catch {
      setCopyResult({
        accountId: account.id,
        message:
          "Couldn’t copy. Select the account ID above and copy it manually.",
      });
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="wallet-app">
        <header className="wallet-topbar">
          <Link
            href="/"
            className="wallet-brand"
            onClick={() => setActiveSection("overview")}
            aria-label="CocoWallet overview"
          >
            <CocoWalletLogo aria-hidden="true" />
          </Link>
          <div className="wallet-top-meta">
            <ThemeMenu />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="wallet-account-trigger"
                  aria-label="Account being inspected"
                  disabled={!hydrated || model.accounts.length === 0}
                >
                  <span className="wallet-avatar" aria-hidden="true">
                    <Wallet />
                  </span>
                  <span className="wallet-account-trigger-name">
                    {account?.label ?? "No account"}
                  </span>
                  <ChevronDown aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="wallet-account-menu">
                <DropdownMenuLabel>Inspect account</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={account?.id ?? ""}
                  onValueChange={inspectAccount}
                >
                  {model.accounts.map((item) => (
                    <DropdownMenuRadioItem
                      key={item.id}
                      value={item.id}
                      className="wallet-account-option"
                    >
                      <span>{item.label}</span>
                      {item.role === "destination" && (
                        <Badge variant="outline">Inspect only</Badge>
                      )}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <div className="wallet-account-details">
                  <p className="wallet-supporting">Account ID</p>
                  <p className="wallet-account-id" tabIndex={0}>
                    {account?.id ?? "Account unavailable"}
                  </p>
                  <p className="wallet-supporting">
                    Default currency ·{" "}
                    {account?.defaultCurrency ?? "Unavailable"}
                  </p>
                </div>
                <DropdownMenuItem
                  disabled={!account}
                  onSelect={(event) => {
                    event.preventDefault();
                    void copyAccountId();
                  }}
                >
                  {copyFeedback === "Account ID copied." ? (
                    <Check aria-hidden="true" />
                  ) : (
                    <Copy aria-hidden="true" />
                  )}
                  Copy account ID
                </DropdownMenuItem>
                <p className="wallet-copy-feedback" role="status">
                  {copyFeedback}
                </p>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>
                  {balancesConnected
                    ? "About this wallet"
                    : "About this preview"}
                </DropdownMenuLabel>
                <p className="wallet-account-about">
                  {balancesConnected
                    ? "Balances are a snapshot of stored journal entries. Reload to refresh. "
                    : "Balances are presentation-only, not stored. "}
                  Form drafts stay on this page and clear when you reload.
                  {fundingEnabled &&
                    " Only unresolved submissions temporarily use per-tab recovery storage."}
                </p>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="wallet-workspace">
          <nav className="wallet-rail" aria-label="Wallet navigation">
            <div className="wallet-rail-group">
              {NAVIGATION.map(({ id, label, icon: Icon }) => (
                <Tooltip key={id}>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="wallet-nav-button"
                    >
                      <Link
                        href={
                          id === "history"
                            ? "/history"
                            : id === "overview"
                              ? "/"
                              : "/#wallets"
                        }
                        aria-label={label}
                        aria-current={
                          historyPage
                            ? id === "history"
                              ? "page"
                              : undefined
                            : activeSection === id && id !== "history"
                              ? "location"
                              : undefined
                        }
                        onClick={() => {
                          if (id !== "history") setActiveSection(id);
                          if (id === "history")
                            setSelectedTransaction(undefined);
                        }}
                      >
                        <Icon aria-hidden="true" />
                        <span className="wallet-mobile-nav-label">{label}</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
            <Separator className="wallet-rail-separator" />
            <div className="wallet-rail-group wallet-desktop-actions">
              {ACTIONS.map(({ operation: action, label, icon: Icon }) => (
                <Tooltip key={action}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="wallet-nav-button"
                      aria-label={label}
                      aria-haspopup="dialog"
                      aria-controls="operations"
                      aria-expanded={operationOpen && operation === action}
                      disabled={!isMain || !hydrated}
                      onClick={(event) =>
                        openOperation(action, event.currentTarget)
                      }
                    >
                      <Icon aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
            <div className="wallet-mobile-actions">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    ref={mobileActionsRef}
                    variant="ghost"
                    className="wallet-nav-button"
                    aria-label="Money actions"
                  >
                    <Send aria-hidden="true" />
                    <span className="wallet-mobile-nav-label">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="end"
                  sideOffset={12}
                  className="wallet-actions-menu"
                  onCloseAutoFocus={(event) => {
                    if (menuOpeningOperationRef.current) {
                      event.preventDefault();
                      menuOpeningOperationRef.current = false;
                    }
                  }}
                >
                  <DropdownMenuLabel>Money actions</DropdownMenuLabel>
                  {!isMain && (
                    <p className="wallet-actions-hint">
                      Choose the main account to explore these forms.
                    </p>
                  )}
                  {ACTIONS.map(({ operation: action, label, icon: Icon }) => (
                    <DropdownMenuItem
                      key={action}
                      disabled={!isMain || !hydrated}
                      onSelect={() => {
                        menuOpeningOperationRef.current = true;
                        openOperation(action, mobileActionsRef.current);
                      }}
                    >
                      <Icon aria-hidden="true" />
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>
          <main id="main-content" className="wallet-main" tabIndex={-1}>
            <div className="wallet-page-heading" id="overview" tabIndex={-1}>
              <h1>
                {historyPage
                  ? "Transaction history"
                  : "Your wallet, at a glance."}
              </h1>
              {historyPage && (
                <Button
                  variant="ghost"
                  className="wallet-privacy-button"
                  aria-label="Hide monetary amounts"
                  aria-pressed={hidden}
                  onClick={() => setHidden((value) => !value)}
                >
                  {hidden ? (
                    <EyeOff aria-hidden="true" />
                  ) : (
                    <Eye aria-hidden="true" />
                  )}
                  {hidden ? "Show" : "Hide"}
                </Button>
              )}
              {account?.role === "destination" && (
                <Badge variant="outline">Inspect only</Badge>
              )}
            </div>
            <OperationWorkspace
              operation={operation}
              account={account}
              wallets={wallets}
              hidden={hidden}
              balancesConnected={balancesConnected}
              fundingEnabled={fundingEnabled}
              conversionEnabled={model.conversionEnabled}
              transferEnabled={model.transferEnabled}
              accounts={model.accounts}
              open={operationOpen}
              onOpenChange={setOperationOpen}
              returnFocusRef={operationTriggerRef}
            />
            <div
              className={`wallet-dashboard-grid${historyPage ? " wallet-history-page" : ""}`}
            >
              <div className="wallet-column">
                {!historyPage && (
                  <Card
                    className="wallet-panel wallet-total-panel"
                    aria-labelledby="total-heading"
                  >
                    <CardHeader className="wallet-card-header wallet-section-head">
                      <CardTitle>
                        <h2 id="total-heading" className="wallet-panel-title">
                          <CircleDollarSign aria-hidden="true" />
                          Approximate total
                        </h2>
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="wallet-privacy-button"
                        aria-label="Hide monetary amounts"
                        aria-pressed={hidden}
                        disabled={!hydrated}
                        onClick={() => setHidden((value) => !value)}
                      >
                        {hidden ? (
                          <EyeOff aria-hidden="true" />
                        ) : (
                          <Eye aria-hidden="true" />
                        )}
                        <span>{hidden ? "Show" : "Hide"}</span>
                      </Button>
                    </CardHeader>
                    <CardContent className="wallet-card-content">
                      <div className="wallet-balance-overview">
                        <div className="wallet-total-copy">
                          <div className="wallet-total">
                            <span
                              className={`wallet-total-value${totalLabel === null && !hidden ? " wallet-total-unavailable" : ""}`}
                            >
                              {hidden ? (
                                <span aria-label="Amount hidden">••••</span>
                              ) : (
                                (totalLabel ??
                                (portfolio.pending
                                  ? "Updating…"
                                  : "Unavailable"))
                              )}
                            </span>
                            {totalLabel !== null && (
                              <span className="wallet-total-unit">USD</span>
                            )}
                          </div>
                          {valuationRates.length > 0 && !hidden ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="wallet-total-note wallet-rate-info"
                                >
                                  {portfolio.view?.total.status ===
                                    "available" &&
                                  portfolio.view.total.source === "cached"
                                    ? "Cached"
                                    : "Fresh"}{" "}
                                  Frankfurter rates
                                  <Info aria-hidden="true" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="bottom"
                                className="max-w-80 space-y-3"
                              >
                                {valuationRates.map((rate) => (
                                  <p key={rate.base}>
                                    1 {rate.base} = {rate.rate} USD ·{" "}
                                    {rate.source}
                                    <br />
                                    Source date {rate.date}
                                    <br />
                                    Fetched {rate.fetchedAt}
                                  </p>
                                ))}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <p className="wallet-total-note">
                              {hidden
                                ? "Amounts are hidden."
                                : fundingEnabled
                                  ? portfolio.pending
                                    ? "Updating USD total…"
                                    : portfolio.view?.total.status ===
                                        "available"
                                      ? portfolio.view.total.source ===
                                        "balances"
                                        ? "USD balances · No FX needed"
                                        : `${portfolio.view.total.source === "cached" ? "Cached" : "Fresh"} Frankfurter reference rates`
                                      : "USD total unavailable · Your wallet balances are unchanged."
                                  : !account
                                    ? "No account balances supplied."
                                    : !isMain
                                      ? wallets.length > 0
                                        ? balancesConnected
                                          ? "Inspect-only destination · Journal-derived balances"
                                          : "Inspect-only destination · Presentation balances"
                                        : "No destination balances supplied."
                                      : balancesConnected && totalLabel !== null
                                        ? "Journal-derived balances · No FX applied"
                                        : zeroTotal
                                          ? "Presentation only · Not a stored balance"
                                          : "A combined total needs connected exchange rates."}
                            </p>
                          )}
                        </div>
                        <BalanceHistory
                          series={balanceHistory}
                          accountId={account?.id}
                          hidden={hidden}
                          compact
                        />
                      </div>
                      {fundingEnabled &&
                        !hidden &&
                        (portfolio.failed ||
                          portfolio.view?.total.status === "unavailable") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={portfolio.retry}
                          >
                            Retry USD total
                          </Button>
                        )}
                      <div
                        className="wallet-quick-actions"
                        aria-label="Quick actions"
                      >
                        {ACTIONS.map(
                          ({ operation: action, label, icon: Icon }) => (
                            <Button
                              variant="secondary"
                              key={action}
                              className="wallet-quick-action"
                              data-operation={action}
                              disabled={!isMain || !hydrated}
                              onClick={(event) =>
                                openOperation(action, event.currentTarget)
                              }
                              aria-haspopup="dialog"
                              aria-controls="operations"
                              aria-expanded={
                                operationOpen && operation === action
                              }
                            >
                              <Icon aria-hidden="true" />
                              {label}
                            </Button>
                          ),
                        )}
                      </div>
                      {account?.role === "destination" && (
                        <p className="wallet-inspect-hint">
                          Money actions are available from the main account
                          only.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
                <Card
                  className="wallet-panel wallet-history-panel"
                  id="history"
                  aria-labelledby="history-heading"
                >
                  <CardHeader className="wallet-card-header wallet-section-head">
                    <CardTitle>
                      <h2 id="history-heading" className="wallet-panel-title">
                        <History aria-hidden="true" />
                        {historyPage
                          ? "Completed transactions"
                          : "Recent transactions"}
                      </h2>
                    </CardTitle>
                    {!historyPage && (
                      <Select
                        value={historyFilter}
                        onValueChange={setHistoryFilter}
                        disabled={!hydrated}
                      >
                        <SelectTrigger
                          aria-label="Filter transactions"
                          className="wallet-history-filter"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HISTORY_FILTERS.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </CardHeader>
                  {historyPage && account ? (
                    <CardContent className="wallet-card-content">
                      <HistoryWorkspace
                        key={account.id}
                        accountId={account.id}
                        hidden={hidden}
                        revision={model}
                        initialTransactionId={selectedTransaction}
                        onClose={() => {
                          setActiveSection("overview");
                          router.push("/");
                        }}
                      />
                    </CardContent>
                  ) : model.transferEnabled && account ? (
                    <CardContent className="wallet-card-content">
                      <RecentTransactions
                        accountId={account.id}
                        type={
                          historyFilter === "all"
                            ? undefined
                            : historyFilter === "withdraw"
                              ? "withdrawal"
                              : historyFilter === "convert"
                                ? "conversion"
                                : (historyFilter as TransactionType)
                        }
                        hidden={hidden}
                        revision={model}
                        onClear={() => setHistoryFilter("all")}
                        onOpenTransaction={(id) => {
                          setSelectedTransaction(id);
                          router.push("/history");
                        }}
                      />
                    </CardContent>
                  ) : fundingEnabled && recentFunding.length > 0 ? (
                    <CardContent className="wallet-card-content">
                      <RecentFunding receipts={recentFunding} hidden={hidden} />
                    </CardContent>
                  ) : (
                    <CardContent className="wallet-card-content wallet-history-empty">
                      <span className="wallet-empty-symbol">
                        <ArrowDownLeft aria-hidden="true" />
                      </span>
                      <div>
                        <h3>{emptyHistoryHeading}</h3>
                        <p>
                          {isMain
                            ? fundingEnabled
                              ? "Completed simulated deposits, withdrawals and conversions will appear here; rejected attempts are not transactions."
                              : balancesConnected
                                ? "Completed transactions will appear when the history service is connected."
                                : "Transactions will appear here when wallet services are connected."
                            : "Destination history is not connected. Main-account activity is not shown here."}
                        </p>
                        {historyFilter !== "all" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setHistoryFilter("all")}
                            className="wallet-reset-filter"
                          >
                            Clear filter
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
              {!historyPage && (
                <Card
                  className="wallet-panel wallet-currencies-panel"
                  id="wallets"
                  aria-labelledby="currencies-heading"
                >
                  <CardHeader className="wallet-card-header">
                    <div className="wallet-section-head">
                      <CardTitle>
                        <h2
                          id="currencies-heading"
                          className="wallet-panel-title"
                        >
                          <Wallet aria-hidden="true" />
                          Currency wallets
                        </h2>
                      </CardTitle>
                      <Badge variant="secondary" className="wallet-count-badge">
                        {wallets.length}{" "}
                        {wallets.length === 1 ? "wallet" : "wallets"}
                      </Badge>
                    </div>
                    <CardDescription className="wallet-currencies-description">
                      Default currency ·{" "}
                      {account?.defaultCurrency ?? "Unavailable"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="wallet-card-content">
                    {wallets.length > 0 ? (
                      <ul className="wallet-currency-list">
                        {wallets.map((wallet) => (
                          <li className="wallet-currency-row" key={wallet.id}>
                            <div className="wallet-currency-identity">
                              <span
                                className="wallet-currency-token"
                                aria-hidden="true"
                              >
                                <CurrencyFlag currency={wallet.currency} />
                              </span>
                              <div>
                                <p className="wallet-currency-code">
                                  {wallet.currency}
                                </p>
                                <p className="wallet-currency-name">
                                  {wallet.name}
                                </p>
                              </div>
                            </div>
                            <p className="wallet-currency-amount">
                              {hidden ? (
                                <span aria-label="Amount hidden">••••</span>
                              ) : (
                                displayBalance(wallet)
                              )}
                              <span>{wallet.currency}</span>
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="wallet-currencies-empty">
                        <Wallet aria-hidden="true" />
                        <h3>
                          {isMain
                            ? "No currency wallets yet."
                            : "Balances not connected."}
                        </h3>
                        <p>
                          {isMain
                            ? "Currency wallets will appear when the account service is connected."
                            : "No balances were supplied for this destination. They are not inferred from the main account."}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
            <p className="wallet-prototype-note">
              Prototype · Local ledger only. No real funds move.
            </p>
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
