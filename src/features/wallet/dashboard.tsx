"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowRightLeft,
  ArrowUpRight,
  Check,
  Copy,
  Eye,
  EyeOff,
  History,
  House,
  Info,
  Plus,
  Send,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeMenu } from "@/features/theme/theme-menu";
import { useHydrated } from "@/lib/use-hydrated";
import { OperationWorkspace } from "./operation-workspace";
import { OPERATION_LABELS, type Operation } from "./operation-model";
import {
  CURRENCY_SYMBOLS,
  displayBalance,
  hasZeroTotal,
  walletsForAccount,
} from "./presentation";
import type { WalletOverview } from "./types";

const NAVIGATION = [
  { id: "overview", label: "Overview", icon: House },
  { id: "wallets", label: "Wallets", icon: Wallet },
  { id: "history", label: "History", icon: History },
  { id: "operations", label: "Actions", icon: Send },
  { id: "account", label: "Account", icon: SlidersHorizontal },
] as const;
const ACTIONS = [
  { operation: "deposit", icon: Plus },
  { operation: "withdraw", icon: ArrowUpRight },
  { operation: "convert", icon: ArrowRightLeft },
  { operation: "transfer", icon: Send },
] as const;

export function WalletDashboard({ model }: { model: WalletOverview }) {
  const hydrated = useHydrated();
  const [activeAccountId, setActiveAccount] = useState(model.activeAccountId);
  const [hidden, setHidden] = useState(false);
  const [operation, setOperation] = useState<Operation>("transfer");
  const [activeSection, setActiveSection] = useState("overview");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [copyResult, setCopyResult] = useState<{
    accountId: string;
    message: string;
  }>();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const account =
    model.accounts.find((item) => item.id === activeAccountId) ??
    model.accounts[0];
  const isMain = account?.role === "main";
  const wallets = walletsForAccount(model.wallets, account?.id);
  const zeroTotal = hasZeroTotal(wallets);
  const defaultWallet = wallets.find(
    (wallet) => wallet.currency === account?.defaultCurrency,
  );
  const conversionSource = defaultWallet ?? wallets[0];
  const conversionTarget = wallets.find(
    (wallet) => wallet.currency !== conversionSource?.currency,
  );
  const copyFeedback =
    copyResult?.accountId === account?.id ? (copyResult?.message ?? "") : "";

  useEffect(() => {
    function syncHash() {
      const id = window.location.hash.slice(1);
      if (NAVIGATION.some((item) => item.id === id)) setActiveSection(id);
    }
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  function openOperation(next: Operation) {
    if (!isMain) return;
    setOperation(next);
    setActiveSection("operations");
    requestAnimationFrame(() => {
      const heading =
        dashboardRef.current?.querySelector<HTMLElement>("#operation-heading");
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
    });
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
    <div className="wallet-app" ref={dashboardRef}>
      <header className="wallet-topbar">
        <a
          href="#overview"
          className="wallet-brand"
          onClick={() => setActiveSection("overview")}
          aria-label="Wallet overview"
        >
          <span className="wallet-brand-mark">
            <Wallet aria-hidden="true" />
          </span>
          <span className="wallet-brand-name">
            wallet<span>Multi-currency simulation</span>
          </span>
        </a>
        <div className="wallet-top-meta">
          <span className="wallet-preview-label">Interface preview</span>
          <ThemeMenu />
          <label className="wallet-account-select">
            <span className="wallet-avatar" aria-hidden="true">
              {isMain ? "MA" : "ID"}
            </span>
            <span className="wallet-sr-only">Account being inspected</span>
            <select
              aria-label="Account being inspected"
              disabled={!hydrated || model.accounts.length === 0}
              value={account?.id ?? ""}
              onChange={(event) => {
                setActiveAccount(event.target.value);
                setCopyResult(undefined);
              }}
            >
              {model.accounts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                  {item.role === "destination" ? " · Inspect only" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <div className="wallet-workspace">
        <nav className="wallet-rail" aria-label="Wallet navigation">
          {NAVIGATION.map(({ id, label, icon: Icon }) => (
            <a
              href={`#${id}`}
              key={id}
              className={`${id === "account" ? "wallet-rail-end" : ""} ${id === "operations" ? "wallet-mobile-transfer" : ""}`}
              aria-current={activeSection === id ? "location" : undefined}
              onClick={() => {
                setActiveSection(id);
              }}
            >
              <span className="wallet-nav-circle">
                <Icon aria-hidden="true" />
              </span>
              {label}
            </a>
          ))}
        </nav>
        <main id="main-content" className="wallet-main" tabIndex={-1}>
          <div className="wallet-page-heading" id="overview" tabIndex={-1}>
            <div>
              <h1>Your wallet, at a glance.</h1>
              <p>
                <span className="wallet-connection-dot" />
                Interface preview · Service connection pending
              </p>
            </div>
            <span className="wallet-simulation-badge">
              <Info aria-hidden="true" />
              Simulation
              <span className="wallet-desktop-only"> · No real funds</span>
            </span>
          </div>
          <div className="wallet-dashboard-grid">
            <div className="wallet-column">
              <section
                className="wallet-panel wallet-total-panel"
                aria-labelledby="total-heading"
              >
                <div className="wallet-section-head">
                  <h2 className="wallet-total-heading" id="total-heading">
                    <Wallet aria-hidden="true" />
                    Approximate total
                  </h2>
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
                </div>
                <div className="wallet-total">
                  <span
                    className={`wallet-total-value${!zeroTotal && !hidden ? " wallet-total-unavailable" : ""}`}
                  >
                    {hidden ? (
                      <span aria-label="Amount hidden">••••</span>
                    ) : zeroTotal ? (
                      "$0.00"
                    ) : (
                      "Unavailable"
                    )}
                  </span>
                  {zeroTotal && <span className="wallet-total-unit">USD</span>}
                </div>
                <p className="wallet-total-note">
                  {!isMain
                    ? wallets.length > 0
                      ? "Inspect-only destination · Preview balances"
                      : "No destination balances supplied in this preview."
                    : zeroTotal
                      ? "Zero-state preview · Not a stored balance"
                      : "A combined total needs connected exchange rates."}
                </p>
                <p className="wallet-quick-label">
                  Quick actions{!isMain && <span> · Inspect only</span>}
                </p>
                <div className="wallet-quick-actions">
                  {ACTIONS.map(({ operation: action, icon: Icon }) => (
                    <button
                      type="button"
                      key={action}
                      className="wallet-quick-action"
                      disabled={!isMain || !hydrated}
                      onClick={() => openOperation(action)}
                      aria-controls="operations"
                      aria-pressed={operation === action && isMain}
                    >
                      <span className="wallet-action-circle">
                        <Icon aria-hidden="true" />
                      </span>
                      {OPERATION_LABELS[action]}
                    </button>
                  ))}
                </div>
              </section>
              <section
                className="wallet-panel wallet-history-panel"
                id="history"
                aria-labelledby="history-heading"
              >
                <div className="wallet-section-head">
                  <h2 id="history-heading">Recent transactions</h2>
                  <History className="wallet-heading-icon" aria-hidden="true" />
                </div>
                <label className="wallet-history-filter">
                  <span>Show</span>
                  <select
                    aria-label="Filter transactions"
                    disabled={!hydrated}
                    value={historyFilter}
                    onChange={(event) => setHistoryFilter(event.target.value)}
                  >
                    <option value="all">All activity</option>
                    <option value="deposit">Deposits</option>
                    <option value="withdraw">Withdrawals</option>
                    <option value="convert">Conversions</option>
                    <option value="transfer">Transfers</option>
                  </select>
                </label>
                <div className="wallet-history-empty">
                  <span className="wallet-empty-symbol">
                    <ArrowDownLeft aria-hidden="true" />
                  </span>
                  <h3>
                    {historyFilter === "all"
                      ? "A fresh start."
                      : `No ${historyFilter === "withdraw" ? "withdrawals" : historyFilter === "convert" ? "conversions" : `${historyFilter}s`} to show.`}
                  </h3>
                  <p>
                    {isMain
                      ? "Your activity will live here once wallet services are connected. Previewing a form won’t create a transaction."
                      : "Destination history is not connected. This view does not reuse main-account activity."}
                  </p>
                  {historyFilter !== "all" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHistoryFilter("all")}
                    >
                      Clear filter
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!isMain || !hydrated}
                      onClick={() => openOperation("deposit")}
                    >
                      Explore a deposit
                      <ArrowRight aria-hidden="true" />
                    </Button>
                  )}
                </div>
                <p className="wallet-history-footnote">
                  <Info aria-hidden="true" />
                  Nothing has been submitted or moved.
                </p>
              </section>
            </div>
            <div className="wallet-column">
              <div className="wallet-summary-grid">
                <section className="wallet-panel wallet-mini-panel">
                  <h2>Currency wallets</h2>
                  <strong>{wallets.length || (isMain ? 0 : "—")}</strong>
                  <p>
                    {wallets.length > 0
                      ? wallets.map((wallet) => wallet.currency).join(", ") ||
                        "No wallets available"
                      : "Not connected"}
                  </p>
                </section>
                <section className="wallet-panel wallet-mini-panel">
                  <h2>Default currency</h2>
                  <strong className="wallet-default-currency">
                    {account?.defaultCurrency ?? "—"}
                  </strong>
                  <p>{defaultWallet?.name ?? "Account preference"}</p>
                </section>
              </div>
              <section
                className="wallet-panel wallet-currencies-panel"
                id="wallets"
                aria-labelledby="currencies-heading"
              >
                <div className="wallet-section-head">
                  <h2 id="currencies-heading">Your currencies</h2>
                  <span className="wallet-supporting">
                    {isMain ? "Preview" : "Inspect only"}
                  </span>
                </div>
                {wallets.length > 0 ? (
                  <ul className="wallet-currency-list">
                    {wallets.map((wallet) => (
                      <li className="wallet-currency-row" key={wallet.id}>
                        <div className="wallet-currency-identity">
                          <span
                            className="wallet-currency-token"
                            aria-hidden="true"
                          >
                            {CURRENCY_SYMBOLS[wallet.currency]}
                          </span>
                          <div>
                            <p className="wallet-currency-code">
                              {wallet.currency}
                              {wallet.currency === account?.defaultCurrency && (
                                <span className="wallet-default-badge">
                                  Default
                                </span>
                              )}
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
                        ? "Currency wallets will appear here when the account service is connected."
                        : "The preview contains main-account wallets only. Destination balances are not inferred."}
                    </p>
                  </div>
                )}
              </section>
              <section
                className="wallet-panel wallet-conversion-panel"
                id="conversion"
                aria-labelledby="conversion-heading"
              >
                <div className="wallet-section-head">
                  <h2 id="conversion-heading">A different currency?</h2>
                  <ArrowRightLeft
                    className="wallet-heading-icon"
                    aria-hidden="true"
                  />
                </div>
                <p className="wallet-convert-caption">
                  See both sides before you convert.
                </p>
                <div className="wallet-conversion-strip">
                  <div>
                    <span>
                      You convert · {conversionSource?.currency ?? "—"}
                    </span>
                    <strong>—</strong>
                  </div>
                  <ArrowRight aria-hidden="true" />
                  <div>
                    <span>
                      You receive · {conversionTarget?.currency ?? "—"}
                    </span>
                    <strong>Not quoted</strong>
                  </div>
                </div>
                <div className="wallet-rate-row">
                  <span>No exchange rate connected</span>
                  <Info aria-hidden="true" />
                </div>
                <Button
                  variant="secondary"
                  className="wallet-full-button"
                  disabled={!isMain || !hydrated}
                  onClick={() => openOperation("convert")}
                >
                  Explore conversion
                  <ArrowRight aria-hidden="true" />
                </Button>
              </section>
            </div>
            <div className="wallet-column">
              <OperationWorkspace
                operation={operation}
                account={account}
                wallets={wallets}
                hidden={hidden}
              />
              <section
                className="wallet-panel wallet-account-panel"
                id="account"
                aria-labelledby="account-heading"
              >
                <div className="wallet-section-head">
                  <h2 id="account-heading">Your account</h2>
                  <span className="wallet-supporting">
                    {isMain
                      ? "Main · Preview"
                      : account
                        ? "Destination · Inspect only"
                        : "Not connected"}
                  </span>
                </div>
                <div className="wallet-account-sheet">
                  <div className="wallet-account-sheet-head">
                    <strong>Multi-currency wallet</strong>
                    <span>
                      <Info aria-hidden="true" />
                      Simulation
                    </span>
                  </div>
                  <p className="wallet-account-id">
                    {account?.id ?? "Account unavailable"}
                  </p>
                  <div className="wallet-account-sheet-foot">
                    <span>
                      Default currency ·{" "}
                      {account?.defaultCurrency ?? "Unavailable"}
                    </span>
                    <button
                      type="button"
                      disabled={!account || !hydrated}
                      onClick={copyAccountId}
                    >
                      {copyFeedback === "Account ID copied." ? (
                        <Check aria-hidden="true" />
                      ) : (
                        <Copy aria-hidden="true" />
                      )}
                      Copy ID
                    </button>
                  </div>
                </div>
                <p className="wallet-copy-feedback" role="status">
                  {copyFeedback}
                </p>
                <details className="wallet-about">
                  <summary>About this preview</summary>
                  <p>
                    Presentation-only values, not database balances. Wallet
                    services, bank connections, recipients, and exchange rates
                    are not connected. No real funds or payment cards.
                  </p>
                  <p>
                    Form details stay in this page’s memory and are cleared when
                    you reload. Theme is a display preference.
                  </p>
                </details>
              </section>
            </div>
          </div>
          <footer className="wallet-footer">
            <span>
              <strong>Simulation, not a bank.</strong> No real money or payment
              services.
            </span>
            <span>Interface preview · Connection pending</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
