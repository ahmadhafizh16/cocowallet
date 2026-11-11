import { createHash } from "node:crypto";
import precision from "./currency-precision.json";
import {
  CurrencyPrecisionError,
  getCurrencyExponent,
} from "./currency-precision";

const entries = Object.entries(precision);
const unspecifiedCodes = [
  "XAG",
  "XAU",
  "XBA",
  "XBB",
  "XBC",
  "XBD",
  "XDR",
  "XPD",
  "XPT",
  "XSU",
  "XTS",
  "XUA",
  "XXX",
];

function expectUnsupported(currencyCode: unknown): void {
  expect(() => getCurrencyExponent(currencyCode as string)).toThrow(
    CurrencyPrecisionError,
  );
  try {
    getCurrencyExponent(currencyCode as string);
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      name: "CurrencyPrecisionError",
      code: "unsupported_currency",
    });
    expect((error as CurrencyPrecisionError).currencyCode).toBe(currencyCode);
  }
}

describe("pinned currency precision metadata", () => {
  it("locks every code/precision pair independently of JSON formatting", () => {
    const sortedCodes = Object.keys(precision).sort();
    const canonical = JSON.stringify(
      Object.fromEntries(
        sortedCodes.map((code) => [
          code,
          precision[code as keyof typeof precision],
        ]),
      ),
    );

    expect(entries).toHaveLength(178);
    expect(Object.keys(precision)).toEqual(sortedCodes);
    expect(createHash("sha256").update(canonical).digest("hex")).toBe(
      "314b8d0367c9ad7ee2796d8c598d287effaaa18cb6d8ee6daf59d56164908ddd",
    );
    expect(sortedCodes.every((code) => /^[A-Z]{3}$/.test(code))).toBe(true);
  });

  it("locks the complete non-two-digit exception lists and distribution", () => {
    const codesWith = (exponent: number | null) =>
      entries.filter(([, value]) => value === exponent).map(([code]) => code);

    expect(codesWith(0)).toEqual([
      "BIF",
      "CLP",
      "DJF",
      "GNF",
      "ISK",
      "JPY",
      "KMF",
      "KRW",
      "PYG",
      "RWF",
      "UGX",
      "UYI",
      "VND",
      "VUV",
      "XAF",
      "XOF",
      "XPF",
    ]);
    expect(codesWith(2)).toHaveLength(139);
    expect(codesWith(3)).toEqual([
      "BHD",
      "IQD",
      "JOD",
      "KWD",
      "LYD",
      "OMR",
      "TND",
    ]);
    expect(codesWith(4)).toEqual(["CLF", "UYW"]);
    expect(codesWith(null)).toEqual(unspecifiedCodes);
    expect(
      entries.every(([, value]) => [0, 2, 3, 4, null].includes(value)),
    ).toBe(true);
  });
});

describe("getCurrencyExponent", () => {
  it.each(entries.filter(([, exponent]) => exponent !== null))(
    "resolves the pinned exponent for %s",
    (code, exponent) => {
      expect(getCurrencyExponent(code)).toBe(exponent);
    },
  );

  it.each(["AFN", "COP", "IRR", "MGA", "MRU"])(
    "uses ISO accounting precision, not CLDR display digits, for %s",
    (code) => {
      expect(getCurrencyExponent(code)).toBe(2);
    },
  );

  it.each(["XCG", "ZWG", "XAD", "SLE", "VED"])(
    "includes the current code %s without aliasing a retired code",
    (code) => {
      expect(getCurrencyExponent(code)).toBe(2);
    },
  );

  it.each(unspecifiedCodes)(
    "fails closed for the ISO N.A. minor units of %s",
    (code) => {
      expectUnsupported(code);
    },
  );

  it.each([
    "ZZZ",
    "BTC",
    "ETH",
    "USDT",
    "CNH",
    "CMD",
    "GGP",
    "IMP",
    "JEP",
    "ANG",
    "BGN",
    "SLL",
    "ZWL",
    "VEF",
    "MRO",
    "STD",
    "usd",
    "Usd",
    " USD",
    "USD ",
    "USD\n",
    "",
    "840",
    "\0USD",
    "ＵＳＤ",
    "toString",
    "constructor",
    "__proto__",
    "prototype",
    "valueOf",
    "hasOwnProperty",
    "__defineGetter__",
    "isPrototypeOf",
  ])("rejects unknown, noncanonical or inherited key %j", (code) => {
    expectUnsupported(code);
  });

  const nonStringInputs: [string, unknown][] = [
    ["undefined", undefined],
    ["null", null],
    ["number", 840],
    ["NaN", NaN],
    ["infinity", Infinity],
    ["boolean", true],
    ["bigint", 0n],
    ["symbol", Symbol("USD")],
    ["array", ["USD"]],
    ["boxed string", Object("USD")],
    ["plain object", {}],
    ["null-prototype object", Object.create(null)],
    ["string-coercible object", { toString: () => "USD" }],
    [
      "throwing coercion",
      {
        [Symbol.toPrimitive]() {
          throw new Error("Currency lookup must not coerce objects.");
        },
      },
    ],
  ];

  it.each(nonStringInputs)(
    "rejects runtime %s input without coercion",
    (_, code) => {
      expectUnsupported(code);
    },
  );
});
