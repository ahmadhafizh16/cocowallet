import type { WalletRecord } from "../accounts/types";
import { assertBalanceMinor } from "../money/money";
import { portfolioUsdMinor } from "./usd-value";
import { timestamp, sourceDate } from "../rates/validation";
import { portfolioFingerprint, type PortfolioView } from "./contracts";

export function confirmedPortfolio(
  value: unknown,
  accountId: string,
  wallets: WalletRecord[],
): PortfolioView {
  if (!value || typeof value !== "object")
    throw new Error("Invalid portfolio.");
  const view = value as PortfolioView;
  if (
    view.accountId !== accountId ||
    !Array.isArray(view.balances) ||
    portfolioFingerprint(view.balances) !== portfolioFingerprint(wallets) ||
    view.balances.some((w) => w.accountId !== accountId) ||
    timestamp(Date.parse(view.observedAt)) !== view.observedAt
  )
    throw new Error("Mismatched portfolio context.");
  const history = view.history;
  if (
    !history ||
    history.accountId !== accountId ||
    history.currency !== "USD" ||
    history.exponent !== 2 ||
    !Array.isArray(history.points) ||
    history.points.length > 240
  )
    throw new Error("Invalid portfolio history.");
  let previous = "";
  for (const p of history.points) {
    if (
      timestamp(Date.parse(p.recordedAt)) !== p.recordedAt ||
      p.recordedAt <= previous ||
      !/^(0|[1-9][0-9]*)$/u.test(p.balanceMinor)
    )
      throw new Error("Invalid portfolio point.");
    assertBalanceMinor(BigInt(p.balanceMinor));
    previous = p.recordedAt;
  }
  if (!view.total || !["available", "unavailable"].includes(view.total.status))
    throw new Error("Invalid portfolio total.");
  if (view.total.status === "available") {
    const total = view.total;
    if (
      !Array.isArray(total.rates) ||
      !/^(0|[1-9][0-9]*)$/u.test(total.balanceMinor)
    )
      throw new Error("Invalid valuation.");
    const foreign = wallets.filter(
      (w) => w.currency !== "USD" && w.balanceMinor !== "0",
    );
    if (
      total.rates.length !== foreign.length ||
      new Set(total.rates.map((r) => r.base)).size !== foreign.length ||
      total.source !==
        (foreign.length
          ? total.rates.some((r) => r.source === "cached")
            ? "cached"
            : "fresh"
          : "balances")
    )
      throw new Error("Invalid portfolio provenance.");
    let sum = 0n;
    for (const wallet of wallets) {
      const minor = BigInt(wallet.balanceMinor);
      assertBalanceMinor(minor);
      if (wallet.currency === "USD") sum += minor;
      else if (minor !== 0n) {
        const rate = total.rates.find(
          (r) => r.base === wallet.currency && r.quote === "USD",
        );
        if (
          !rate ||
          rate.provider !== "frankfurter" ||
          !["fresh", "cached"].includes(rate.source) ||
          timestamp(Date.parse(rate.fetchedAt)) !== rate.fetchedAt ||
          sourceDate(rate.date, rate.fetchedAt) !== rate.date
        )
          throw new Error("Invalid portfolio rate.");
        sum += portfolioUsdMinor({
          sourceMinor: minor,
          sourceExponent: wallet.exponent,
          rate: rate.rate,
        });
      }
    }
    assertBalanceMinor(sum);
    if (sum.toString() !== total.balanceMinor)
      throw new Error("Inexact portfolio total.");
  }
  return view;
}
