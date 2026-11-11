import { MAX_MINOR } from "../money/money";
import {
  displayAmount,
  displayBalance,
  displayUsdTotal,
  hasZeroTotal,
  walletBalance,
  walletsForAccount,
} from "./presentation";
import { createPreviewOverview } from "./types";

describe("wallet presentation", () => {
  const wallets = createPreviewOverview().wallets;
  const usd = wallets[0]!;

  it("scopes every displayed balance to the selected account", () => {
    const destination = {
      ...usd,
      id: "destination-usd",
      accountId: "destination",
      balanceMinor: "1234",
    };
    const all = [...wallets, destination];
    expect(walletsForAccount(all, "main-account")).toEqual(wallets);
    expect(walletsForAccount(all, "destination")).toEqual([destination]);
    expect(walletsForAccount(all, "missing")).toEqual([]);
    expect(walletsForAccount(all, undefined)).toEqual([]);
    expect(hasZeroTotal(walletsForAccount(all, "destination"))).toBe(false);
  });

  it("shows exact fixed-precision text without floating-point conversion", () => {
    expect(displayAmount(MAX_MINOR, 2)).toBe("92,233,720,368,547,758.07");
    expect(displayAmount(-1234567n, 2)).toBe("-12,345.67");
    expect(displayAmount(123456n, 0)).toBe("123,456");
    expect(displayBalance(usd)).toBe("0.00");
  });

  it("formats supplied USD totals exactly and preserves unavailable state", () => {
    expect(
      displayUsdTotal({
        status: "available",
        balanceMinor: MAX_MINOR.toString(),
      }),
    ).toBe("$92,233,720,368,547,758.07");
    expect(displayUsdTotal({ status: "unavailable" })).toBeNull();
    expect(displayUsdTotal(undefined)).toBeNull();
    expect(
      displayUsdTotal({
        status: "available",
        balanceMinor: "9223372036854775808",
      }),
    ).toBeNull();
    expect(
      displayUsdTotal({ status: "available", balanceMinor: "01" }),
    ).toBeNull();
  });

  it("only allows a rate-free total for complete, valid zero balances", () => {
    expect(hasZeroTotal(wallets)).toBe(true);
    expect(hasZeroTotal([])).toBe(false);
    expect(hasZeroTotal([{ ...usd, balanceMinor: "1" }])).toBe(false);
  });

  it.each([
    "invalid",
    "-1",
    "01",
    "1.0",
    "0\n",
    "1\r\n",
    "1\u2028",
    "9223372036854775808",
    "0".repeat(200),
  ])("does not turn invalid balance %s into zero", (balanceMinor) => {
    const wallet = { ...usd, balanceMinor };
    expect(walletBalance(wallet)).toBeNull();
    expect(displayBalance(wallet)).toBe("Unavailable");
    expect(hasZeroTotal([wallet])).toBe(false);
  });

  it("rejects an invalid integration exponent", () => {
    expect(walletBalance({ ...usd, exponent: 5 })).toBeNull();
  });

  it.each([0, 1n, null, undefined, { toString: () => "0" }])(
    "does not coerce runtime non-string balance %p",
    (value) => {
      expect(
        walletBalance({ ...usd, balanceMinor: value as unknown as string }),
      ).toBeNull();
    },
  );
});
