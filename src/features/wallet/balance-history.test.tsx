import { renderToStaticMarkup } from "react-dom/server";
import { BalanceHistory } from "./balance-history";
import type { BalanceHistorySeries } from "./types";

const START = "2026-01-01T00:00:00.000Z";
const END = "2026-01-11T00:00:00.000Z";
const series = (
  points: BalanceHistorySeries["points"] = [
    { recordedAt: START, balanceMinor: "12345" },
    { recordedAt: END, balanceMinor: "23456" },
  ],
): BalanceHistorySeries => ({
  accountId: "main-account",
  currency: "USD",
  exponent: 2,
  points,
});

function render(
  supplied: unknown,
  { accountId = "main-account", hidden = false } = {},
) {
  return renderToStaticMarkup(
    <BalanceHistory
      series={supplied as BalanceHistorySeries | undefined}
      accountId={accountId}
      hidden={hidden}
    />,
  );
}

function expectNoRecords(markup: string) {
  expect(markup).not.toMatch(/<(?:svg|polyline|circle|time|table|details)\b/u);
  expect(markup).not.toContain("123.45");
  expect(markup).not.toContain("234.56");
  expect(markup).not.toContain(START);
  expect(markup).not.toContain(END);
  expect(markup).not.toContain('aria-label="Recorded balance');
  expect(markup).not.toMatch(/data-(?:amount|balance|points|recorded)/u);
}

function coordinates(markup: string) {
  return [
    ...markup.matchAll(/<circle\b[^>]*\bcx="([^"]+)" cy="([^"]+)"/gu),
  ].map(([, x, y]) => ({ x: Number(x), y: Number(y) }));
}

describe("BalanceHistory", () => {
  it("shows disconnected history without a fictional zero chart or date range", () => {
    const markup = render(undefined);
    expect(markup).toContain('data-state="unavailable"');
    expect(markup).toContain("Balance history</h3>");
    expect(markup).toContain("History not connected");
    expect(markup).toContain(
      "Recorded balances will appear here once history is connected.",
    );
    expect(markup).not.toContain("0.00");
    expectNoRecords(markup);
  });

  it("distinguishes a supplied empty series from disconnected history", () => {
    const markup = render(series([]));
    expect(markup).toContain('data-state="empty"');
    expect(markup).toContain("No recorded balances yet.");
    expect(markup).not.toContain("History not connected");
    expectNoRecords(markup);
  });

  it.each([undefined, null, series(), series([]), { points: "invalid" }])(
    "privacy omits every record, chart, time, and table for payload %#",
    (supplied) => {
      const markup = render(supplied, { hidden: true });
      expect(markup).toContain('data-state="hidden"');
      expect(markup).toContain("Balance history hidden");
      expect(markup).toContain("<span>USD</span>");
      expect(markup).not.toContain("main-account");
      expect(markup).not.toContain("could not be verified");
      expectNoRecords(markup);
    },
  );

  it("does not inspect sensitive records while private", () => {
    const supplied = {
      get points() {
        throw new Error("Private records must not be inspected");
      },
    };
    expect(() => render(supplied, { hidden: true })).not.toThrow();
  });

  it.each([
    null,
    [],
    {},
    { ...series(), currency: "EUR" },
    { ...series(), currency: "usd" },
    { ...series(), exponent: 3 },
    { ...series(), exponent: "2" },
    { ...series(), points: null },
    { ...series(), points: {} },
    { ...series(), points: [null] },
    { ...series(), points: [undefined] },
    { ...series(), accountId: undefined },
    { ...series(), accountId: ["main-account"] },
  ])("rejects malformed series metadata or records %#", (supplied) => {
    const markup = render(supplied);
    expect(markup).toContain('data-state="invalid"');
    expect(markup).toContain("Balance history unavailable");
    expect(markup).toContain("Recorded balances could not be verified.");
    expectNoRecords(markup);
  });

  it.each([
    "-1",
    "+1",
    "01",
    "00",
    "1.00",
    "1e2",
    " 1",
    "1 ",
    "1\n",
    "",
    "9223372036854775808",
    "1000000000000000000000000000000000000000000",
    12345,
    null,
    undefined,
  ])(
    "rejects an invalid minor-unit value without exposing valid records: %p",
    (balanceMinor) => {
      const markup = render({
        ...series(),
        points: [series().points[0], { recordedAt: END, balanceMinor }],
      });
      expect(markup).toContain('data-state="invalid"');
      expectNoRecords(markup);
    },
  );

  it.each([
    "2026-01-11",
    "2026-01-11T00:00:00Z",
    "2026-01-11T00:00:00.00Z",
    "2026-01-11T00:00:00.000+00:00",
    "2026-01-11t00:00:00.000z",
    "2026-02-30T00:00:00.000Z",
    "2026-13-11T00:00:00.000Z",
    "2026-01-11T24:00:00.000Z",
    "2026-01-11T00:00:60.000Z",
    "2026-01-11T00:00:00.000Z\n",
    "+010000-01-11T00:00:00.000Z",
    "not-a-date",
    1768089600000,
    null,
    undefined,
  ])("rejects noncanonical or invalid UTC timestamps: %p", (recordedAt) => {
    const markup = render({
      ...series(),
      points: [series().points[0], { recordedAt, balanceMinor: "23456" }],
    });
    expect(markup).toContain('data-state="invalid"');
    expectNoRecords(markup);
  });

  it.each([
    [START, START],
    [END, START],
    [START, END, "2026-01-05T00:00:00.000Z"],
  ])(
    "rejects duplicate or descending timestamps without sorting: %p",
    (...dates) => {
      const markup = render(
        series(
          dates.map((recordedAt) => ({ recordedAt, balanceMinor: "12345" })),
        ),
      );
      expect(markup).toContain('data-state="invalid"');
      expectNoRecords(markup);
    },
  );

  it.each([
    ["main-account", "destination"],
    ["destination", "main-account"],
    ["main-account", "MAIN-ACCOUNT"],
    ["main-account", "main-account "],
    ["main-account", ""],
  ])("never leaks %s history when inspecting %s", (owner, accountId) => {
    const markup = render({ ...series(), accountId: owner }, { accountId });
    expect(markup).toContain('data-state="invalid"');
    expectNoRecords(markup);
  });

  it("rejects supplied history without an active account, even when empty", () => {
    for (const supplied of [series(), series([])]) {
      const markup = renderToStaticMarkup(
        <BalanceHistory series={supplied} hidden={false} />,
      );
      expect(markup).toContain('data-state="invalid"');
      expectNoRecords(markup);
    }
  });

  it("allows the exact matching destination account's own supplied history", () => {
    const markup = render(
      { ...series(), accountId: "destination" },
      { accountId: "destination" },
    );
    expect(markup).toContain('data-state="ready"');
    expect(markup).toContain("123.45 USD");
  });

  it("renders only recorded markers with straight segments and timestamp-spaced x coordinates", () => {
    const markup = render(
      series([
        { recordedAt: START, balanceMinor: "0" },
        { recordedAt: "2026-01-02T00:00:00.000Z", balanceMinor: "100" },
        { recordedAt: END, balanceMinor: "200" },
      ]),
    );
    expect(markup).toContain('data-state="ready"');
    expect(coordinates(markup)).toEqual([
      { x: 6, y: 104 },
      { x: 64.80000000000001, y: 55 },
      { x: 594, y: 6 },
    ]);
    expect(markup.match(/<polyline\b/gu)).toHaveLength(1);
    expect(markup).toContain('preserveAspectRatio="none"');
    expect(markup).not.toContain("<path");
    expect(markup).toContain(
      'role="img" aria-label="Recorded balance history in USD"',
    );
    expect(markup).toContain("not continuous tracking");
    expect(markup).toContain("Straight lines connect recorded snapshots");
    expect(markup).toContain("View recorded balances");
    expect(markup).toContain("Recorded at (UTC)");
    expect(markup).toContain("0.00 USD");
    expect(markup).toContain("1.00 USD");
    expect(markup).toContain("2.00 USD");
    expect(markup.match(/<tbody><tr>|<\/tr><tr>/gu)).toHaveLength(3);
    expect(markup).toContain(
      'dateTime="2026-01-02T00:00:00.000Z">Jan 2, 2026, 12:00:00 AM UTC</time>',
    );
    expect(markup).not.toMatch(/NaN|Infinity|return|Last 7|Last 30/u);
    expect(markup).not.toMatch(/>[^<]*%/u);
  });

  it("renders a real all-zero series as a finite horizontal baseline", () => {
    const markup = render(
      series([
        { recordedAt: START, balanceMinor: "0" },
        { recordedAt: END, balanceMinor: "0" },
      ]),
    );
    expect(coordinates(markup)).toEqual([
      { x: 6, y: 104 },
      { x: 594, y: 104 },
    ]);
    expect(markup).toContain('points="6,104 594,104"');
    expect(markup.match(/0\.00 USD/gu)).toHaveLength(2);
    expect(markup).not.toMatch(/NaN|Infinity/u);
  });

  it.each([
    ["0", 104, "0.00"],
    ["1", 6, "0.01"],
    ["9223372036854775807", 6, "92,233,720,368,547,758.07"],
  ])(
    "shows one actual %s snapshot without inventing a connecting line",
    (balanceMinor, y, amount) => {
      const markup = render(series([{ recordedAt: START, balanceMinor }]));
      expect(coordinates(markup)).toEqual([{ x: 300, y }]);
      expect(markup).not.toContain("<polyline");
      expect(markup).toContain(`${amount} USD`);
      expect(markup).not.toMatch(/NaN|Infinity/u);
    },
  );

  it("preserves amounts beyond Number precision and max signed-64-bit minor units", () => {
    const markup = render(
      series([
        { recordedAt: START, balanceMinor: "9007199254740993" },
        { recordedAt: END, balanceMinor: "9223372036854775807" },
      ]),
    );
    expect(markup).toContain("90,071,992,547,409.93 USD");
    expect(markup).toContain("92,233,720,368,547,758.07 USD");
    for (const point of coordinates(markup)) {
      expect(Number.isFinite(point.x)).toBe(true);
      expect(Number.isFinite(point.y)).toBe(true);
      expect(point.x).toBeGreaterThanOrEqual(6);
      expect(point.x).toBeLessThanOrEqual(594);
      expect(point.y).toBeGreaterThanOrEqual(6);
      expect(point.y).toBeLessThanOrEqual(104);
    }
  });

  it("labels same-day endpoints with human UTC times while preserving exact machine timestamps", () => {
    const markup = render(
      series([
        { recordedAt: "2026-01-01T12:34:56.001Z", balanceMinor: "1" },
        { recordedAt: "2026-01-01T12:34:56.002Z", balanceMinor: "2" },
      ]),
    );
    expect(markup).toContain("Jan 1, 2026, 12:34:56 PM UTC");
    expect(markup).toContain('dateTime="2026-01-01T12:34:56.001Z"');
    expect(markup).toContain('dateTime="2026-01-01T12:34:56.002Z"');
    expect(coordinates(markup)).toEqual([
      { x: 6, y: 55 },
      { x: 594, y: 6 },
    ]);
  });

  it("renders canonical UTC endpoints outside the usual epoch range", () => {
    const markup = render(
      series([
        { recordedAt: "0000-01-01T00:00:00.000Z", balanceMinor: "1" },
        { recordedAt: "9999-12-31T23:59:59.999Z", balanceMinor: "2" },
      ]),
    );
    expect(markup).toContain('data-state="ready"');
    expect(coordinates(markup)).toEqual([
      { x: 6, y: 55 },
      { x: 594, y: 6 },
    ]);
    expect(markup).toContain('dateTime="0000-01-01T00:00:00.000Z"');
    expect(markup).toContain("Dec 31, 9999 UTC");
  });

  it("does not mutate supplied metadata, records, or their ordering", () => {
    const supplied = series();
    const before = JSON.stringify(supplied);
    supplied.points.forEach(Object.freeze);
    Object.freeze(supplied.points);
    Object.freeze(supplied);
    expect(() => render(supplied)).not.toThrow();
    expect(() => render(supplied, { hidden: true })).not.toThrow();
    expect(JSON.stringify(supplied)).toBe(before);
  });
  it("keeps every dense-series segment and exact record without markers obscuring the line", () => {
    const points = Array.from({ length: 240 }, (_, i) => ({
      recordedAt: new Date(Date.parse(START) + i * 1000).toISOString(),
      balanceMinor: String(i + 1),
    }));
    const markup = render(series(points));
    expect(coordinates(markup)).toHaveLength(2);
    expect(markup.match(/<polyline\b/gu)).toHaveLength(1);
    expect(markup.match(/<tbody><tr>|<\/tr><tr>/gu)).toHaveLength(6);
    expect(markup).toContain("Page 1 of 40");
    const segments = markup
      .match(/<polyline[^>]*points="([^"]+)"/u)![1]!
      .split(" ");
    expect(segments).toHaveLength(240);
  });
});
