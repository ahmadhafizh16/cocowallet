import { renderToStaticMarkup } from "react-dom/server";
import { HistoryWorkspace } from "./workspace";
import { useHistoryRead } from "./use-history";
import type { HistoryPage } from "./contracts";

jest.mock("./use-history", () => ({ useHistoryRead: jest.fn() }));

it("keeps exact visible amounts, currencies and recorded time in each history row's accessible name", () => {
  const createdAt = "2026-11-12T12:00:00.000Z";
  const page: HistoryPage = {
    account: {
      id: "main",
      role: "main",
      defaultCurrency: "USD",
      inspectOnly: false,
      createdAt,
    },
    pagination: { page: 1, pageSize: 50, totalItems: 1, totalPages: 1 },
    transactions: [
      {
        transactionId: "record",
        type: "transfer",
        direction: "outgoing",
        status: "completed",
        createdAt,
        provider: null,
        source: {
          accountId: "main",
          walletId: "usd",
          currency: "USD",
          name: "Dollar",
          exponent: 2,
          amount: "1.00",
          amountMinor: "100",
        },
        target: {
          accountId: "recipient",
          walletId: "gbp",
          currency: "GBP",
          name: "Pound",
          exponent: 2,
          amount: "0.80",
          amountMinor: "80",
        },
        rate: {
          value: "0.8",
          date: "2026-11-12",
          fetchedAt: createdAt,
          source: "fresh",
        },
      },
    ],
  };
  jest.mocked(useHistoryRead).mockReturnValue({
    result: { kind: "list", page },
    pending: false,
    failure: undefined,
    retry: jest.fn(),
  });
  const html = renderToStaticMarkup(
    <HistoryWorkspace
      accountId="main"
      hidden={false}
      revision={{}}
      onClose={() => {}}
    />,
  );
  expect(html).toContain(
    'aria-label="View outgoing transfer record · 1.00 USD → 0.80 GBP · Nov 12, 2026, 12:00:00 PM UTC"',
  );
  expect(html).toContain("wallet-history-row");
  expect(html).toContain('class="wallet-debit">−1.00');
  expect(html).toContain('class="wallet-credit">+0.80');
  expect(html).toContain('title="Completed"');
  expect(html).toContain('placeholder="Search by transaction ID…"');
  expect(html).not.toContain("Browse completed activity");
  expect(html).toContain("Apply Filter");
  expect(html).toContain("Reset Filter");
  expect(html).not.toContain("About these results");
});

it("centers honest zero-match information with a large decorative icon and the exact bold guidance", () => {
  jest.mocked(useHistoryRead).mockReturnValue({
    result: {
      kind: "list",
      page: {
        account: {
          id: "main",
          role: "main",
          defaultCurrency: "USD",
          inspectOnly: false,
          createdAt: "2026-11-12T12:00:00.000Z",
        },
        pagination: { page: 1, pageSize: 50, totalItems: 0, totalPages: 0 },
        transactions: [],
      },
    },
    pending: false,
    failure: undefined,
    retry: jest.fn(),
  });
  const html = renderToStaticMarkup(
    <HistoryWorkspace
      accountId="main"
      hidden={false}
      revision={{}}
      onClose={() => {}}
    />,
  );
  expect(html).toContain("wallet-history-empty wallet-history-filter-empty");
  expect(html).toContain('class="wallet-empty-symbol" aria-hidden="true"');
  expect(html).toContain("No matching completed activity");
  expect(html).toContain(
    "<strong>Try clearing the search or filters. Your completed transactions will appear here.</strong>",
  );
  expect(html).not.toContain("About these results");
});
