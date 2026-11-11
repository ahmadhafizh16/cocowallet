import { useId } from "react";
import { assertBalanceMinor } from "../money/money";
import { displayAmount } from "./presentation";
import type { BalanceHistorySeries } from "./types";

type BalanceHistoryProps = {
  series?: BalanceHistorySeries | null;
  accountId?: string;
  hidden: boolean;
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
  return `${recordedAt.slice(0, 10)}${includeTime ? ` ${recordedAt.slice(11, 23)}` : ""} UTC`;
}

export function BalanceHistory({
  series,
  accountId,
  hidden,
}: BalanceHistoryProps) {
  const id = useId();
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

  let content;
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
    const points = records.map((record) => ({
      ...record,
      x:
        duration === 0n
          ? (PLOT.left + PLOT.right) / 2
          : PLOT.left +
            plotRatio(record.timestamp - first.timestamp, duration) *
              (PLOT.right - PLOT.left),
      y:
        PLOT.bottom -
        plotRatio(record.balance, maximum) * (PLOT.bottom - PLOT.top),
    }));
    const includeTime =
      first.recordedAt.slice(0, 10) === last.recordedAt.slice(0, 10);
    content = (
      <>
        <svg
          className="wallet-balance-history-plot"
          viewBox="0 0 600 112"
          preserveAspectRatio="none"
          width="100%"
          role="img"
          aria-label="Recorded balance history in USD"
          aria-describedby={`${id}-description`}
        >
          <desc id={`${id}-description`}>
            Each point is a recorded balance snapshot, not continuous tracking.
            Straight lines connect recorded snapshots. The vertical scale starts
            at zero. Exact balances and times are available below.
          </desc>
          {points.length > 1 && (
            <polyline
              className="wallet-balance-history-line"
              points={points.map(({ x, y }) => `${x},${y}`).join(" ")}
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {points.map(({ recordedAt, x, y }) => (
            <circle
              key={recordedAt}
              className="wallet-balance-history-point"
              cx={x}
              cy={y}
              r="3"
            />
          ))}
        </svg>
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
            <caption>Recorded balance snapshots in USD</caption>
            <thead>
              <tr>
                <th scope="col">Recorded at (UTC)</th>
                <th scope="col">Balance (USD)</th>
              </tr>
            </thead>
            <tbody>
              {records.map(({ recordedAt, balance }) => (
                <tr key={recordedAt}>
                  <td>
                    <time dateTime={recordedAt}>{recordedAt}</time>
                  </td>
                  <td>{displayAmount(balance, 2)} USD</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </>
    );
  }

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
