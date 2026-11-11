import {
  MAX_AMOUNT_INPUT_LENGTH,
  MAX_MINOR,
  MAX_RATE_FRACTION_DIGITS,
  MAX_RATE_INPUT_LENGTH,
  MAX_RATE_INTEGER_DIGITS,
  MoneyError,
  assertAmountMinor,
  assertBalanceMinor,
  convertMinorUnits,
  formatAmount,
  parseAmount,
} from "./money";
import type { MoneyErrorCode } from "./money";

function expectMoneyError(action: () => unknown, code: MoneyErrorCode): void {
  expect(action).toThrow(MoneyError);
  expect(action).toThrow(expect.objectContaining({ name: "MoneyError", code }));
}

describe("money bounds", () => {
  it("exports the signed int64 maximum and bounded decimal text limits", () => {
    expect(MAX_MINOR).toBe(9223372036854775807n);
    expect(MAX_AMOUNT_INPUT_LENGTH).toBe(24);
    expect(MAX_RATE_INTEGER_DIGITS).toBe(36);
    expect(MAX_RATE_FRACTION_DIGITS).toBe(36);
    expect(MAX_RATE_INPUT_LENGTH).toBe(73);
  });

  it.each([1n, 9007199254740991n, 9007199254740992n, MAX_MINOR])(
    "accepts positive bounded bigint amount %s",
    (minor) => {
      expect(() => assertAmountMinor(minor)).not.toThrow();
      expect(() => assertBalanceMinor(minor)).not.toThrow();
    },
  );

  it("allows zero only for balances", () => {
    expect(() => assertBalanceMinor(0n)).not.toThrow();
    expectMoneyError(() => assertAmountMinor(0n), "amount_out_of_range");
  });

  it.each([-1n, -MAX_MINOR, MAX_MINOR + 1n])(
    "rejects out-of-range amount and balance %s",
    (minor) => {
      expectMoneyError(() => assertAmountMinor(minor), "amount_out_of_range");
      expectMoneyError(() => assertBalanceMinor(minor), "balance_out_of_range");
    },
  );

  it.each([1, 0, NaN, Infinity, "1", null, undefined, {}, true])(
    "rejects runtime non-bigint minor units %p",
    (value) => {
      const minor = value as bigint;
      expectMoneyError(() => assertAmountMinor(minor), "invalid_amount");
      expectMoneyError(() => assertBalanceMinor(minor), "balance_out_of_range");
      expectMoneyError(() => formatAmount(minor, 2), "invalid_amount");
      expectMoneyError(
        () =>
          convertMinorUnits({
            sourceMinor: minor,
            sourceExponent: 2,
            targetExponent: 2,
            rate: "1",
          }),
        "invalid_amount",
      );
    },
  );
});

describe("parseAmount", () => {
  it.each([
    ["1", 0, 1n],
    ["123", 0, 123n],
    ["1", 1, 10n],
    ["0.1", 1, 1n],
    ["1", 2, 100n],
    ["1.2", 2, 120n],
    ["1.23", 2, 123n],
    ["0.01", 2, 1n],
    ["1.005", 3, 1005n],
    ["0.001", 3, 1n],
    ["1.2345", 4, 12345n],
    ["0.0001", 4, 1n],
    ["9007199254740991", 0, 9007199254740991n],
    ["9007199254740992", 0, 9007199254740992n],
    ["9007199254740993", 0, 9007199254740993n],
    ["90071992547409.93", 2, 9007199254740993n],
  ] as const)(
    "parses %s at precision %s exactly",
    (input, exponent, expected) => {
      expect(parseAmount(input, exponent)).toBe(expected);
    },
  );

  it.each([
    "",
    " ",
    " 1",
    "1 ",
    "1\n",
    "1\r",
    "1\r\n",
    "1\t",
    "1\u2028",
    "1\u2029",
    "+1",
    "-1",
    "-0",
    "01",
    "00.1",
    ".1",
    "1.",
    "1..0",
    "1e2",
    "1E2",
    "1_000",
    "1,000",
    "0x10",
    "NaN",
    "Infinity",
    "１",
    "١",
  ])("rejects noncanonical amount %p", (input) => {
    expectMoneyError(() => parseAmount(input, 2), "invalid_amount");
  });

  it.each([null, undefined, 1, 1n, {}, true])(
    "rejects runtime non-string amount %p",
    (input) => {
      expectMoneyError(() => parseAmount(input as string, 2), "invalid_amount");
    },
  );

  it.each([
    ["1.0", 0],
    ["1.005", 2],
    ["1.230", 2],
    ["0.0010", 3],
    ["0.00010", 4],
  ] as const)("never rounds excess precision in %s", (input, exponent) => {
    expectMoneyError(() => parseAmount(input, exponent), "invalid_precision");
  });

  it.each([
    ["0", 0],
    ["0.00", 2],
    ["0.000", 3],
    ["0.0000", 4],
  ] as const)("rejects nonpositive amount %s", (input, exponent) => {
    expectMoneyError(() => parseAmount(input, exponent), "amount_out_of_range");
  });

  it.each([
    ["9223372036854775807", 0],
    ["92233720368547758.07", 2],
    ["9223372036854775.807", 3],
    ["922337203685477.5807", 4],
  ] as const)(
    "parses maximum %s without numeric coercion",
    (input, exponent) => {
      expect(parseAmount(input, exponent)).toBe(MAX_MINOR);
    },
  );

  it.each([
    ["9223372036854775808", 0],
    ["92233720368547758.08", 2],
    ["9223372036854775.808", 3],
    ["922337203685477.5808", 4],
    ["999999999999999999999999", 0],
  ] as const)("rejects bounded overflowing text %s", (input, exponent) => {
    expectMoneyError(() => parseAmount(input, exponent), "amount_out_of_range");
  });

  it.each(["9".repeat(25), "9".repeat(100_000), "0." + "0".repeat(100_000)])(
    "rejects amount text beyond its pre-parse length bound",
    (input) => {
      expectMoneyError(() => parseAmount(input, 4), "invalid_amount");
    },
  );
});

describe("formatAmount", () => {
  it.each([
    [0n, 0, "0"],
    [0n, 1, "0.0"],
    [0n, 2, "0.00"],
    [0n, 3, "0.000"],
    [0n, 4, "0.0000"],
    [1n, 0, "1"],
    [1n, 2, "0.01"],
    [1n, 3, "0.001"],
    [1n, 4, "0.0001"],
    [120n, 2, "1.20"],
    [-1n, 0, "-1"],
    [-1n, 2, "-0.01"],
    [-12345n, 4, "-1.2345"],
    [9007199254740993n, 2, "90071992547409.93"],
    [MAX_MINOR, 0, "9223372036854775807"],
    [MAX_MINOR, 2, "92233720368547758.07"],
    [MAX_MINOR, 3, "9223372036854775.807"],
    [MAX_MINOR, 4, "922337203685477.5807"],
    [-MAX_MINOR, 4, "-922337203685477.5807"],
  ] as const)("formats %s at precision %s", (minor, exponent, expected) => {
    expect(formatAmount(minor, exponent)).toBe(expected);
  });

  it.each([MAX_MINOR + 1n, -MAX_MINOR - 1n])(
    "rejects signed out-of-range formatting %s",
    (minor) => {
      expectMoneyError(() => formatAmount(minor, 2), "amount_out_of_range");
    },
  );

  it("provides decimal text for JSON instead of serializing bigint", () => {
    expect(JSON.stringify({ amount: formatAmount(MAX_MINOR, 2) })).toBe(
      '{"amount":"92233720368547758.07"}',
    );
  });
});

describe("currency precision validation", () => {
  it.each([-1, 5, 1.5, NaN, Infinity, -Infinity, "2", 2n, null, undefined])(
    "rejects invalid runtime precision %p in every operation",
    (value) => {
      const exponent = value as number;
      expectMoneyError(() => parseAmount("1", exponent), "invalid_precision");
      expectMoneyError(() => formatAmount(1n, exponent), "invalid_precision");
      expectMoneyError(
        () =>
          convertMinorUnits({
            sourceMinor: 1n,
            sourceExponent: exponent,
            targetExponent: 2,
            rate: "1",
          }),
        "invalid_precision",
      );
      expectMoneyError(
        () =>
          convertMinorUnits({
            sourceMinor: 1n,
            sourceExponent: 2,
            targetExponent: exponent,
            rate: "1",
          }),
        "invalid_precision",
      );
    },
  );
});

describe("convertMinorUnits", () => {
  it.each([
    [100n, 2, 2, "1.005", 101n],
    [100n, 2, 2, "1.004999999999999999999999999999999999", 100n],
    [100n, 2, 2, "1.005000000000000000000000000000000000", 101n],
    [100n, 2, 2, "1.005000000000000000000000000000000001", 101n],
    [1n, 0, 0, "1.499999999999999999999999999999999999", 1n],
    [1n, 0, 0, "1.500000000000000000000000000000000000", 2n],
    [1n, 0, 0, "1.500000000000000000000000000000000001", 2n],
    [1n, 0, 0, "2.5", 3n],
    [1n, 0, 0, "0.5", 1n],
    [100n, 0, 3, "0.0025", 250n],
    [1n, 0, 3, "0.0025", 3n],
    [1n, 0, 3, "0.002499999999999999999999999999999999", 2n],
    [1001n, 3, 0, "150", 150n],
    [1n, 4, 0, "5000", 1n],
    [1n, 0, 4, "1.23456", 12346n],
    [25n, 1, 2, "2", 500n],
    [9007199254740991n, 0, 0, "1", 9007199254740991n],
    [9007199254740992n, 0, 0, "1", 9007199254740992n],
    [9007199254740993n, 0, 0, "1", 9007199254740993n],
    [1n, 0, 0, "9007199254740993", 9007199254740993n],
    [MAX_MINOR, 4, 4, "1.000000000000000000000000000000000000", MAX_MINOR],
    [MAX_MINOR, 4, 0, "9999.999999999999999999999999999999999999", MAX_MINOR],
    [MAX_MINOR, 0, 0, "1", MAX_MINOR],
    [1n, 0, 0, "9223372036854775807.49", MAX_MINOR],
  ] as const)(
    "converts %s from precision %s to %s at rate %s exactly",
    (sourceMinor, sourceExponent, targetExponent, rate, expected) => {
      expect(
        convertMinorUnits({
          sourceMinor,
          sourceExponent,
          targetExponent,
          rate,
        }),
      ).toBe(expected);
    },
  );

  it.each([
    "",
    " ",
    " 1",
    "1 ",
    "1\n",
    "1\r\n",
    "1\u2028",
    "+1",
    "-1",
    "-0.1",
    "0",
    "0.0000",
    "01",
    "00.1",
    ".1",
    "1.",
    "1..0",
    "1e2",
    "1E-2",
    "1_000",
    "1,000",
    "0x10",
    "NaN",
    "Infinity",
    "１",
    "9".repeat(37),
    "0." + "1".repeat(37),
    "9".repeat(100_000),
    "0." + "0".repeat(100_000),
  ])("rejects invalid, nonpositive, or unbounded rate text", (rate) => {
    expectMoneyError(
      () =>
        convertMinorUnits({
          sourceMinor: 100n,
          sourceExponent: 2,
          targetExponent: 2,
          rate,
        }),
      "invalid_rate",
    );
  });

  it.each([null, undefined, 1, 1n, {}, true])(
    "rejects runtime non-string rate %p",
    (rate) => {
      expectMoneyError(
        () =>
          convertMinorUnits({
            sourceMinor: 1n,
            sourceExponent: 0,
            targetExponent: 0,
            rate: rate as string,
          }),
        "invalid_rate",
      );
    },
  );

  it("accepts the maximum rate text shape before enforcing the result bound", () => {
    const rate = "9".repeat(36) + "." + "9".repeat(36);
    expect(rate).toHaveLength(MAX_RATE_INPUT_LENGTH);
    expectMoneyError(
      () =>
        convertMinorUnits({
          sourceMinor: 1n,
          sourceExponent: 4,
          targetExponent: 0,
          rate,
        }),
      "amount_out_of_range",
    );
  });

  it.each([
    "0.49",
    "0.499999999999999999999999999999999999",
    "0." + "0".repeat(35) + "1",
  ])("rejects a positive conversion rounded to zero at rate %s", (rate) => {
    expectMoneyError(
      () =>
        convertMinorUnits({
          sourceMinor: 1n,
          sourceExponent: 0,
          targetExponent: 0,
          rate,
        }),
      "rounded_to_zero",
    );
  });

  it.each([0n, -1n, MAX_MINOR + 1n])(
    "rejects invalid source amount %s before conversion",
    (sourceMinor) => {
      expectMoneyError(
        () =>
          convertMinorUnits({
            sourceMinor,
            sourceExponent: 2,
            targetExponent: 2,
            rate: "1",
          }),
        "amount_out_of_range",
      );
    },
  );

  it.each([
    [1n, 0, 0, "9223372036854775807.5"],
    [1n, 0, 0, "9223372036854775808"],
    [MAX_MINOR, 2, 2, "2"],
    [MAX_MINOR, 0, 4, "1"],
  ] as const)(
    "rejects final overflow for %s at precision %s to %s and rate %s",
    (sourceMinor, sourceExponent, targetExponent, rate) => {
      expectMoneyError(
        () =>
          convertMinorUnits({
            sourceMinor,
            sourceExponent,
            targetExponent,
            rate,
          }),
        "amount_out_of_range",
      );
    },
  );
});

describe("exactness properties", () => {
  it.each([0, 1, 2, 3, 4])(
    "round-trips positive minor units at precision %s",
    (exponent) => {
      const samples = [
        1n,
        9n,
        10n,
        99n,
        100n,
        1001n,
        9007199254740993n,
        MAX_MINOR,
      ];
      for (const minor of samples) {
        expect(parseAmount(formatAmount(minor, exponent), exponent)).toBe(
          minor,
        );
      }
    },
  );

  it.each([
    ["1", 0, "1"],
    ["1.2", 2, "1.20"],
    ["1.005", 3, "1.005"],
    ["0.0001", 4, "0.0001"],
  ] as const)(
    "round-trips input %s into fixed precision",
    (input, exponent, fixed) => {
      expect(formatAmount(parseAmount(input, exponent), exponent)).toBe(fixed);
    },
  );

  it("preserves exact and monotonic small samples across all precision pairs", () => {
    for (const sourceExponent of [0, 1, 2, 3, 4]) {
      for (const targetExponent of [0, 1, 2, 3, 4]) {
        const sourceScale = 10n ** BigInt(sourceExponent);
        const targetScale = 10n ** BigInt(targetExponent);
        let previous = 0n;
        for (let units = 1n; units <= 20n; units += 1n) {
          const sourceMinor = units * sourceScale;
          const amount = formatAmount(sourceMinor, sourceExponent);
          expect(parseAmount(amount, sourceExponent)).toBe(sourceMinor);
          const result = convertMinorUnits({
            sourceMinor,
            sourceExponent,
            targetExponent,
            rate: "1.25",
          });
          const scaled = units * targetScale * 125n;
          expect(result).toBe(scaled / 100n + (scaled % 100n >= 50n ? 1n : 0n));
          expect(result >= previous).toBe(true);
          previous = result;
        }
      }
    }
  });
});
