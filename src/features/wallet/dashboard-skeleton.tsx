import { Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function TextLines({ count = 3 }: { count?: number }) {
  return (
    <div className="wallet-skeleton-lines">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton
          className={index === count - 1 ? "wallet-skeleton-short" : ""}
          key={index}
        />
      ))}
    </div>
  );
}

export function WalletDashboardSkeleton() {
  return (
    <main
      id="main-content"
      className="wallet-app"
      aria-busy="true"
      aria-label="Wallet overview"
      tabIndex={-1}
    >
      <span className="wallet-sr-only" role="status">
        Loading wallet overview
      </span>
      <div aria-hidden="true">
        <div className="wallet-topbar">
          <div className="wallet-brand">
            <span className="wallet-brand-mark">
              <Wallet />
            </span>
            <span className="wallet-brand-name">
              wallet<span>Multi-currency simulation</span>
            </span>
          </div>
          <div className="wallet-top-meta">
            <Skeleton className="wallet-skeleton-utility" />
            <Skeleton className="wallet-skeleton-utility" />
          </div>
        </div>
        <div className="wallet-workspace">
          <div className="wallet-rail wallet-skeleton-rail">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                className={
                  index === 4
                    ? "wallet-rail-end"
                    : index === 3
                      ? "wallet-mobile-transfer"
                      : ""
                }
                key={index}
              >
                <Skeleton className="wallet-skeleton-nav" />
                <Skeleton className="wallet-skeleton-nav-label" />
              </div>
            ))}
          </div>
          <div className="wallet-main">
            <div className="wallet-page-heading">
              <div className="wallet-skeleton-heading">
                <Skeleton className="wallet-skeleton-title" />
                <Skeleton className="wallet-skeleton-subtitle" />
              </div>
              <Skeleton className="wallet-skeleton-badge" />
            </div>
            <div className="wallet-dashboard-grid">
              <div className="wallet-column">
                <div className="wallet-panel wallet-total-panel">
                  <Skeleton className="wallet-skeleton-section-title" />
                  <Skeleton className="wallet-skeleton-total" />
                  <Skeleton className="wallet-skeleton-subtitle" />
                  <div className="wallet-skeleton-actions">
                    {Array.from({ length: 4 }, (_, index) => (
                      <div key={index}>
                        <Skeleton className="wallet-skeleton-action" />
                        <Skeleton className="wallet-skeleton-nav-label" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="wallet-panel wallet-history-panel">
                  <Skeleton className="wallet-skeleton-section-title" />
                  <Skeleton className="wallet-skeleton-filter" />
                  <div className="wallet-skeleton-history">
                    <Skeleton className="wallet-skeleton-action" />
                    <Skeleton className="wallet-skeleton-section-title" />
                    <TextLines />
                    <Skeleton className="wallet-skeleton-pill" />
                  </div>
                  <Skeleton className="wallet-skeleton-subtitle" />
                </div>
              </div>
              <div className="wallet-column">
                <div className="wallet-summary-grid">
                  {Array.from({ length: 2 }, (_, index) => (
                    <div className="wallet-panel wallet-mini-panel" key={index}>
                      <Skeleton className="wallet-skeleton-section-title" />
                      <Skeleton className="wallet-skeleton-mini-value" />
                      <Skeleton className="wallet-skeleton-short" />
                    </div>
                  ))}
                </div>
                <div className="wallet-panel wallet-currencies-panel">
                  <Skeleton className="wallet-skeleton-section-title" />
                  <div className="wallet-currency-list">
                    {Array.from({ length: 3 }, (_, index) => (
                      <div className="wallet-currency-row" key={index}>
                        <div className="wallet-currency-identity">
                          <Skeleton className="wallet-skeleton-currency" />
                          <TextLines count={2} />
                        </div>
                        <Skeleton className="wallet-skeleton-balance" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="wallet-panel wallet-conversion-panel">
                  <Skeleton className="wallet-skeleton-section-title" />
                  <Skeleton className="wallet-skeleton-subtitle" />
                  <div className="wallet-conversion-strip">
                    <TextLines count={2} />
                    <div />
                    <TextLines count={2} />
                  </div>
                  <Skeleton className="wallet-skeleton-subtitle" />
                  <Skeleton className="wallet-skeleton-pill" />
                </div>
              </div>
              <div className="wallet-column">
                <div className="wallet-panel wallet-operation-panel">
                  <Skeleton className="wallet-skeleton-section-title" />
                  <Skeleton className="wallet-skeleton-section-title wallet-skeleton-recipient-label" />
                  <Skeleton className="wallet-skeleton-input" />
                  <Skeleton className="wallet-skeleton-subtitle" />
                  <Skeleton className="wallet-skeleton-section-title wallet-skeleton-amount-label" />
                  <Skeleton className="wallet-skeleton-amount" />
                  <Skeleton className="wallet-skeleton-subtitle" />
                  <div className="wallet-skeleton-facts">
                    <TextLines count={2} />
                  </div>
                  <Skeleton className="wallet-skeleton-pill" />
                  <Skeleton className="wallet-skeleton-simulation" />
                </div>
                <div className="wallet-panel wallet-account-panel">
                  <Skeleton className="wallet-skeleton-section-title" />
                  <div className="wallet-skeleton-account">
                    <Skeleton className="wallet-skeleton-subtitle" />
                    <Skeleton className="wallet-skeleton-account-id" />
                    <Skeleton className="wallet-skeleton-subtitle" />
                  </div>
                  <Skeleton className="wallet-skeleton-subtitle wallet-skeleton-about" />
                </div>
              </div>
            </div>
            <div className="wallet-footer">
              <Skeleton className="wallet-skeleton-footer" />
              <Skeleton className="wallet-skeleton-footer" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
