import { convertMinorUnits, MAX_MINOR } from "../money/money";
import { portfolioUsdMinor } from "./usd-value";

it.each([
  ["0.0049", 0n],
  ["0.005", 1n],
  ["0.015", 2n],
] as const)(
  "values one foreign unit at %s without weakening payment conversion",
  (rate, expected) => {
    const input = { sourceMinor: 1n, sourceExponent: 0, rate };
    expect(portfolioUsdMinor(input)).toBe(expected);
    if (expected === 0n)
      expect(() => convertMinorUnits({ ...input, targetExponent: 2 })).toThrow(
        "rounds to zero",
      );
  },
);
it.each([
  { sourceMinor: 0n, sourceExponent: 0, rate: "0.0049" },
  { sourceMinor: -1n, sourceExponent: 0, rate: "0.0049" },
  { sourceMinor: 1n, sourceExponent: 5, rate: "0.0049" },
  { sourceMinor: 1n, sourceExponent: 0, rate: "0" },
  { sourceMinor: 1n, sourceExponent: 0, rate: "invalid" },
  { sourceMinor: MAX_MINOR, sourceExponent: 2, rate: "2" },
])("does not swallow input, rate, precision or overflow errors %#", (input) => {
  expect(() => portfolioUsdMinor(input)).toThrow();
});
