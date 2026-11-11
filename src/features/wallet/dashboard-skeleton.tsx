import { CocoWalletLogo } from "@/components/brand/cocowallet-logo";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function TextLines({ count = 2 }: { count?: number }) {
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
            <CocoWalletLogo aria-hidden="true" />
          </div>
          <div className="wallet-top-meta">
            <Skeleton className="wallet-skeleton-theme" />
            <Skeleton className="wallet-skeleton-account-trigger" />
          </div>
        </div>
        <div className="wallet-workspace">
          <div className="wallet-rail wallet-skeleton-rail">
            <div className="wallet-rail-group">
              {Array.from({ length: 3 }, (_, index) => (
                <div className="wallet-skeleton-nav-item" key={index}>
                  <Skeleton className="wallet-skeleton-nav" />
                  <Skeleton className="wallet-skeleton-nav-label" />
                </div>
              ))}
            </div>
            <Skeleton className="wallet-rail-separator" />
            <div className="wallet-rail-group wallet-desktop-actions">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton className="wallet-skeleton-nav" key={index} />
              ))}
            </div>
            <div className="wallet-mobile-actions wallet-skeleton-nav-item">
              <Skeleton className="wallet-skeleton-nav" />
              <Skeleton className="wallet-skeleton-nav-label" />
            </div>
          </div>
          <div className="wallet-main">
            <div className="wallet-page-heading">
              <Skeleton className="wallet-skeleton-title" />
            </div>
            <div className="wallet-preview-notice wallet-skeleton-notice">
              <Skeleton className="wallet-skeleton-notice-text" />
            </div>
            <div className="wallet-dashboard-grid">
              <div className="wallet-column">
                <Card className="wallet-panel wallet-total-panel">
                  <CardHeader className="wallet-card-header wallet-section-head">
                    <Skeleton className="wallet-skeleton-section-title" />
                    <Skeleton className="wallet-skeleton-privacy" />
                  </CardHeader>
                  <CardContent className="wallet-card-content">
                    <Skeleton className="wallet-skeleton-total" />
                    <Skeleton className="wallet-skeleton-caption" />
                    <div className="wallet-quick-actions">
                      {Array.from({ length: 4 }, (_, index) => (
                        <Skeleton
                          className="wallet-skeleton-action"
                          key={index}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="wallet-panel wallet-history-panel">
                  <CardHeader className="wallet-card-header wallet-section-head">
                    <Skeleton className="wallet-skeleton-section-title" />
                    <Skeleton className="wallet-skeleton-filter" />
                  </CardHeader>
                  <CardContent className="wallet-card-content wallet-history-empty">
                    <Skeleton className="wallet-skeleton-empty-symbol" />
                    <div className="wallet-skeleton-history-copy">
                      <Skeleton className="wallet-skeleton-empty-title" />
                      <TextLines />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Card className="wallet-panel wallet-currencies-panel">
                <CardHeader className="wallet-card-header">
                  <div className="wallet-section-head">
                    <Skeleton className="wallet-skeleton-section-title" />
                    <Skeleton className="wallet-skeleton-count" />
                  </div>
                  <Skeleton className="wallet-skeleton-caption" />
                </CardHeader>
                <CardContent className="wallet-card-content">
                  <div className="wallet-currency-list">
                    {Array.from({ length: 3 }, (_, index) => (
                      <div className="wallet-currency-row" key={index}>
                        <div className="wallet-currency-identity">
                          <Skeleton className="wallet-skeleton-currency" />
                          <TextLines />
                        </div>
                        <div className="wallet-skeleton-balance">
                          <Skeleton />
                          <Skeleton className="wallet-skeleton-short" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
