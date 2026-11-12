import { useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { readableDate, readableTime } from "@/lib/date-presentation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { assertBalanceMinor } from "../money/money";
import { displayAmount } from "./presentation";
import type { BalanceHistorySeries } from "./types";

type BalanceHistoryProps = {
  series?: BalanceHistorySeries | null;
  accountId?: string;
  hidden: boolean;
  compact?: boolean;
};

type RecordedBalance = {
  recordedAt: string;
  timestamp: bigint;
  balance: bigint;
};

const CANONICAL_MINOR = /^(?:0|[1-9][0-9]{0,18})(?![\s\S])/u;
const CANONICAL_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z(?![\s\S])/u;
const PLOT = { left: 6, right: 594, top: 6, bottom: 104 };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Reject the whole payload rather than repairing or mixing account history. */
function verifySeries(
  series: unknown,
  accountId: string | undefined,
): RecordedBalance[] | null {
  if (
    typeof accountId !== "string" ||
    accountId.length === 0 ||
    !isRecord(series) ||
    series.accountId !== accountId ||
    series.currency !== "USD" ||
    series.exponent !== 2 ||
    !Array.isArray(series.points)
  ) {
    return null;
  }

  const records: RecordedBalance[] = [];
  let previousTimestamp: number | undefined;
  for (const point of series.points) {
    if (
      !isRecord(point) ||
      typeof point.recordedAt !== "string" ||
      !CANONICAL_UTC.test(point.recordedAt) ||
      typeof point.balanceMinor !== "string" ||
      !CANONICAL_MINOR.test(point.balanceMinor)
    ) {
      return null;
    }

    const timestamp = Date.parse(point.recordedAt);
    if (
      !Number.isFinite(timestamp) ||
      new Date(timestamp).toISOString() !== point.recordedAt ||
      (previousTimestamp !== undefined && timestamp <= previousTimestamp)
    ) {
      return null;
    }

    try {
      const balance = BigInt(point.balanceMinor);
      assertBalanceMinor(balance);
      records.push({
        recordedAt: point.recordedAt,
        timestamp: BigInt(timestamp),
        balance,
      });
    } catch {
      return null;
    }
    previousTimestamp = timestamp;
  }
  return records;
}

/** Only a bounded, unitless ratio becomes a Number, never a monetary value. */
function plotRatio(value: bigint, maximum: bigint): number {
  return maximum === 0n ? 0 : Number((value * 1000n) / maximum) / 1000;
}

function endpointLabel(recordedAt: string, includeTime: boolean): string {
  return includeTime
    ? readableTime(recordedAt)
    : `${readableDate(recordedAt.slice(0, 10))} UTC`;
}

export function BalanceHistory({
  series,
  accountId,
  hidden,
  compact = false,
}: BalanceHistoryProps) {
  const id = useId();
  const [page, setPage] = useState(1);
  const tableHeading = useRef<HTMLTableCaptionElement>(null);
  // Privacy takes precedence: do not validate or render any supplied records.
  const records =
    hidden || series === undefined ? null : verifySeries(series, accountId);
  const state = hidden
    ? "hidden"
    : series === undefined
      ? "unavailable"
      : records === null
        ? "invalid"
        : records.length === 0
          ? "empty"
          : "ready";
  const pages = Math.ceil((records?.length ?? 0) / 6);
  const visiblePage = Math.max(1, Math.min(page, pages));
  function changePage(next: number) {
    setPage(next);
    requestAnimationFrame(() => tableHeading.current?.focus());
  }

  let content;
  let chart: ReactNode;
  if (state !== "ready" || !records?.length) {
    const message = {
      hidden: "Balance history hidden",
      unavailable: "History not connected",
      invalid: "Balance history unavailable",
      empty: "No recorded balances yet.",
      ready: "",
    }[state];
    content = (
      <div className="wallet-balance-history-empty">
        <p>{message}</p>
        {state === "unavailable" && (
          <p>Recorded balances will appear here once history is connected.</p>
        )}
        {state === "invalid" && <p>Recorded balances could not be verified.</p>}
      </div>
    );
  } else {
    const first = records[0]!;
    const last = records[records.length - 1]!;
    const duration = last.timestamp - first.timestamp;
    const maximum = records.reduce(
      (max, record) => (record.balance > max ? record.balance : max),
      0n,
    );
    const minimum = compact
      ? records.reduce(
          (min, r) => (r.balance < min ? r.balance : min),
          first.balance,
        )
      : 0n;
    const range = maximum - minimum;
    const points = records.map((record) => ({
      ...record,
      x:
        duration === 0n
          ? (PLOT.left + PLOT.right) / 2
          : PLOT.left +
            plotRatio(record.timestamp - first.timestamp, duration) *
              (PLOT.right - PLOT.left),
      y:
        compact && range === 0n
          ? (PLOT.top + PLOT.bottom) / 2
          : PLOT.bottom -
            plotRatio(record.balance - minimum, range) *
              (PLOT.bottom - PLOT.top),
    }));
    // Dense markers can erase a continuous trace. Keep every segment and table
    // record, but show only endpoint markers when the observations are crowded.
    const markers =
      compact && points.length > 1
        ? []
        : points.length > 24
          ? [points[0]!, points[points.length - 1]!]
          : points;
    const includeTime =
      first.recordedAt.slice(0, 10) === last.recordedAt.slice(0, 10);
    chart = (
      <svg
        className={`wallet-balance-history-plot${compact ? " wallet-sparkline" : ""}`}
        viewBox="0 0 600 112"
        preserveAspectRatio="none"
        width="100%"
        role="img"
        aria-label="Recorded balance history in USD"
        aria-describedby={`${id}-description`}
      >
        <desc id={`${id}-description`}>
          Each point is a recorded balance snapshot, not continuous tracking.
          Straight lines connect recorded snapshots, not continuous tracking.
          {compact
            ? "The vertical scale spans the recorded minimum and maximum. Open for exact values."
            : "The vertical scale starts at zero. Exact balances and times are available below."}
        </desc>
        {compact && points.length > 1 && (
          <>
            <defs>
              <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon
              points={`${points[0]!.x},112 ${points.map(({ x, y }) => `${x},${y}`).join(" ")} ${points[points.length - 1]!.x},112`}
              fill={`url(#${id}-fill)`}
            />
          </>
        )}
        {points.length > 1 && (
          <polyline
            className="wallet-balance-history-line"
            points={points.map(({ x, y }) => `${x},${y}`).join(" ")}
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {markers.map(({ recordedAt, x, y }) => (
          <circle
            key={recordedAt}
            className="wallet-balance-history-point"
            cx={x}
            cy={y}
            r="3"
          />
        ))}
      </svg>
    );
    content = (
      <>
        {chart}
        <div className="wallet-balance-history-axis">
          <time dateTime={first.recordedAt}>
            {endpointLabel(first.recordedAt, includeTime)}
          </time>
          {records.length > 1 && (
            <time dateTime={last.recordedAt}>
              {endpointLabel(last.recordedAt, includeTime)}
            </time>
          )}
        </div>
        <details className="wallet-balance-history-details">
          <summary>View recorded balances</summary>
          <table>
            <caption ref={tableHeading} tabIndex={-1}>
              Recorded balance snapshots in USD
            </caption>
            <thead>
              <tr>
                <th scope="col">Recorded at (UTC)</th>
                <th scope="col">Balance (USD)</th>
              </tr>
            </thead>
            <tbody>
              {records
                .slice((visiblePage - 1) * 6, visiblePage * 6)
                .map(({ recordedAt, balance }) => (
                  <tr key={recordedAt}>
                    <td>
                      <time dateTime={recordedAt}>
                        {readableTime(recordedAt)}
                      </time>
                    </td>
                    <td>{displayAmount(balance, 2)} USD</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {pages > 1 && (
            <nav
              className="wallet-balance-pages"
              aria-label="Recorded balance pages"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={visiblePage === 1}
                onClick={() => changePage(visiblePage - 1)}
              >
                <ChevronLeft aria-hidden="true" />
                Previous
              </Button>
              <p aria-live="polite">
                Page {visiblePage} of {pages}
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={visiblePage === pages}
                onClick={() => changePage(visiblePage + 1)}
              >
                Next
                <ChevronRight aria-hidden="true" />
              </Button>
            </nav>
          )}
        </details>
      </>
    );
  }

  if (compact)
    return (
      <section
        className="wallet-balance-history-compact"
        data-state={state}
        aria-label="Balance history"
      >
        {state === "ready" ? (
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="wallet-sparkline-button"
                aria-label="View recorded USD balance history"
              >
                {chart}
              </button>
            </DialogTrigger>
            <DialogContent className="wallet-history-dialog">
              <DialogHeader>
                <DialogTitle>USD balance history</DialogTitle>
                <DialogDescription>
                  Recorded portfolio totals, valued when observed. Missing
                  valuations are not invented or backfilled.
                </DialogDescription>
              </DialogHeader>
              <BalanceHistory
                series={series}
                accountId={accountId}
                hidden={hidden}
              />
            </DialogContent>
          </Dialog>
        ) : (
          <p className="wallet-sparkline-empty">
            {hidden
              ? "History hidden"
              : state === "invalid"
                ? "History unavailable"
                : "No history yet"}
          </p>
        )}
      </section>
    );

  return (
    <section
      className="wallet-balance-history"
      data-state={state}
      aria-labelledby={`${id}-heading`}
    >
      <div className="wallet-balance-history-heading">
        <h3 id={`${id}-heading`}>Balance history</h3>
        <span>USD</span>
      </div>
      {content}
    </section>
  );
}
