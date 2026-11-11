import { renderToStaticMarkup } from "react-dom/server";
import { TransactionFacts, historyAmountLabel } from "./transaction-facts";
import { confirmedHistoryDetail } from "./preview";
import type { HistoryDetail } from "./contracts";
import { getCurrencyExponent } from "../money/currency-precision";

const account = {
  id: "main",
  role: "main" as const,
  defaultCurrency: "USD",
  createdAt: "2026-11-12T12:00:00.000Z",
  inspectOnly: false,
};
describe("recorded history presentation", () => {
  it.each([
    ["USD", "92233720368547758.07", "9223372036854775807"],
    ["JPY", "123", "123"],
    ["BHD", "0.123", "123"],
    ["CLF", "1.2345", "12345"],
  ])(
    "preserves exact historical %s amounts without JSON-number/display rounding",
    (currency, amount, amountMinor) => {
      const detail: HistoryDetail = {
        account,
        transaction: {
          transactionId: "precision",
          type: "deposit",
          status: "completed",
          direction: "incoming",
          createdAt: account.createdAt,
          provider: "demo_bank",
          rate: null,
          source: null,
          target: {
            accountId: "main",
            walletId: "target",
            currency,
            name: "Recorded currency",
            exponent: getCurrencyExponent(currency),
            amount,
            amountMinor,
          },
        },
      };
      const t = confirmedHistoryDetail(detail, "main", "precision").transaction;
      expect(historyAmountLabel(t)).toBe(`${amount} ${currency}`);
      const html = renderToStaticMarkup(<TransactionFacts transaction={t} />);
      expect(html).toContain(`${amount} ${currency}`);
      expect(html).toContain("Demo Bank");
      expect(html).not.toMatch(
        /Retry key|Quote ID|Balance after|balanceMinor/u,
      );
    },
  );
  it("labels incoming same-currency facts without fabricating FX", () => {
    const side = {
      walletId: "source",
      accountId: "main",
      currency: "USD",
      name: "Dollar",
      exponent: 2,
      amount: "1.00",
      amountMinor: "100",
    };
    const detail: HistoryDetail = {
      account: {
        ...account,
        id: "recipient",
        role: "destination",
        inspectOnly: true,
      },
      transaction: {
        transactionId: "same",
        type: "transfer",
        status: "completed",
        direction: "incoming",
        createdAt: account.createdAt,
        provider: null,
        rate: null,
        source: side,
        target: { ...side, walletId: "target", accountId: "recipient" },
      },
    };
    const t = confirmedHistoryDetail(detail, "recipient", "same").transaction;
    const html = renderToStaticMarkup(<TransactionFacts transaction={t} />);
    expect(html).toContain("Incoming transfer");
    expect(html).toContain("Same currency · no FX rate");
    expect(html).not.toContain("Applied reference rate");
  });
  it("escapes arbitrary counterparty text and keeps original source→target rate direction", () => {
    const detail: HistoryDetail = {
      account,
      transaction: {
        transactionId: "fx",
        type: "transfer",
        status: "completed",
        direction: "outgoing",
        createdAt: account.createdAt,
        provider: null,
        source: {
          walletId: "source",
          accountId: "main",
          currency: "USD",
          name: "Dollar",
          exponent: 2,
          amount: "1.00",
          amountMinor: "100",
        },
        target: {
          walletId: "target",
          accountId: "<script>alert(1)</script>",
          currency: "GBP",
          name: "Pound",
          exponent: 2,
          amount: "0.80",
          amountMinor: "80",
        },
        rate: {
          value: "0.8000",
          date: "2026-11-10",
          fetchedAt: "2026-11-11T00:00:00.000Z",
          source: "cached",
        },
      },
    };
    const t = confirmedHistoryDetail(detail, "main", "fx").transaction,
      html = renderToStaticMarkup(<TransactionFacts transaction={t} />);
    expect(html).toContain("1 USD = 0.8000 GBP");
    expect(html).toContain("Cached");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
});
