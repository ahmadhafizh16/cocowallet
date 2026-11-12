/** @jest-environment jsdom */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { RecentTransactions } from "./recent-transactions";
import { confirmedRecentHistory } from "./preview";
import type { HistoryPage } from "./contracts";

const page: HistoryPage = {
  account: {
    id: "recipient",
    role: "destination",
    defaultCurrency: "GBP",
    createdAt: "2026-11-12T12:00:00.000Z",
    inspectOnly: true,
  },
  pagination: { page: 1, pageSize: 50, totalItems: 1, totalPages: 1 },
  transactions: [
    {
      transactionId: "transaction",
      type: "transfer",
      status: "completed",
      direction: "incoming",
      createdAt: "2026-11-12T12:00:00.000Z",
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
        date: "2026-11-11",
        fetchedAt: "2026-11-12T11:00:00.000Z",
        source: "cached",
      },
    },
  ],
};
describe("validated scoped recent history", () => {
  it("preserves incoming direction and original applied rate without current-clock checks", () =>
    expect(confirmedRecentHistory(page, "recipient", "transfer")).toEqual(
      page,
    ));
  it.each([
    "account",
    "side",
    "direction",
    "rate",
    "precision",
    "amount",
    "time",
    "count",
    "type",
  ])("rejects mismatched untrusted history %s", (field) => {
    const altered = JSON.parse(JSON.stringify(page));
    if (field === "account") altered.account.id = "main";
    if (field === "side") altered.transactions[0].target.accountId = "other";
    if (field === "direction") altered.transactions[0].direction = "outgoing";
    if (field === "rate") altered.transactions[0].rate.value = "2";
    if (field === "precision") altered.transactions[0].target.exponent = 3;
    if (field === "amount") altered.transactions[0].target.amountMinor = "1";
    if (field === "time") altered.transactions[0].createdAt = "invalid";
    if (field === "count") altered.pagination.totalItems = 2;
    if (field === "type") altered.transactions[0].type = "deposit";
    expect(() =>
      confirmedRecentHistory(altered, "recipient", "transfer"),
    ).toThrow();
  });
});

describe("recent history loading and account isolation", () => {
  let host: HTMLDivElement, root: Root;
  const network = jest.fn(),
    revision = {},
    clear = jest.fn(),
    open = jest.fn();
  beforeEach(() => {
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    network.mockReset();
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: network,
    });
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });
  afterEach(async () => {
    await act(() => root.unmount());
    host.remove();
    delete (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
      .IS_REACT_ACT_ENVIRONMENT;
  });
  const render = (accountId = "recipient", hidden = false, token = revision) =>
    act(() =>
      root.render(
        <RecentTransactions
          accountId={accountId}
          hidden={hidden}
          revision={token}
          onClear={clear}
          onOpenTransaction={open}
        />,
      ),
    );
  const response = (body: unknown = page) => ({
    ok: true,
    json: async () => body,
  });
  it("uses explicit scoped GETs, renders incoming facts, and removes every record under privacy", async () => {
    network.mockResolvedValue(response());
    await render();
    expect(network.mock.calls[0][0]).toContain("accountId=recipient");
    expect(host.textContent).toContain("Incoming transfer");
    expect(host.querySelector(".wallet-credit")?.textContent).toBe("+0.80 GBP");
    const row = host.querySelector<HTMLButtonElement>(".wallet-recent-button")!;
    expect(row.getAttribute("aria-label")).toContain(
      "Nov 12, 2026, 12:00:00 PM UTC",
    );
    expect(row.getAttribute("aria-label")).toContain("Completed");
    expect(row.querySelector(".wallet-transaction-status svg")).not.toBeNull();
    await act(() => row.click());
    expect(open).toHaveBeenCalledWith("transaction");
    expect(host.textContent).not.toContain("Retry key");
    await render("recipient", true);
    expect(host.textContent).toBe("Transaction amounts hidden.");
    expect(host.querySelectorAll("time,details")).toHaveLength(0);
  });
  it("discards stale responses when account context changes, including a late response after abort", async () => {
    let finish!: (value: unknown) => void;
    network.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    await render();
    expect(host.textContent).toContain("Loading");
    const empty = {
      ...page,
      account: { ...page.account, id: "other" },
      transactions: [],
      pagination: { page: 1, pageSize: 50, totalItems: 0, totalPages: 0 },
    };
    network.mockResolvedValue(response(empty));
    await render("other");
    expect(host.textContent).toContain("No matching");
    await act(() => finish(response()));
    expect(host.textContent).not.toContain("Incoming transfer");
    expect(network.mock.calls[0][1].signal.aborted).toBe(true);
  });
  it("fails closed on foreign data and offers a bounded read-only retry", async () => {
    network.mockResolvedValueOnce(
      response({ ...page, account: { ...page.account, id: "main" } }),
    );
    await render();
    expect(host.textContent).toContain("could not be loaded");
    expect(host.textContent).not.toContain("1.00 USD");
    network.mockResolvedValue(response());
    await act(() => host.querySelector<HTMLButtonElement>("button")!.click());
    expect(host.textContent).toContain("Incoming transfer");
  });
  it("refreshes scoped activity after a server overview refresh and handles empty results", async () => {
    network.mockResolvedValue(response());
    await render();
    network.mockResolvedValue(
      response({
        ...page,
        transactions: [],
        pagination: { page: 1, pageSize: 50, totalItems: 0, totalPages: 0 },
      }),
    );
    await render("recipient", false, {});
    expect(network).toHaveBeenCalledTimes(2);
    expect(host.textContent).toContain("No matching completed activity");
  });
});
