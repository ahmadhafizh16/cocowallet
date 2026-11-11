/** @jest-environment jsdom */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { WalletDashboard } from "./dashboard";
import {
  createPreviewOverview,
  type BalanceHistorySeries,
  type WalletOverview,
} from "./types";

const recordedHistory = (
  accountId: string,
  balanceMinor: string,
): BalanceHistorySeries => ({
  accountId,
  currency: "USD",
  exponent: 2,
  points: [
    { recordedAt: "2026-10-01T00:00:00.000Z", balanceMinor: "0" },
    { recordedAt: "2026-10-02T00:00:00.000Z", balanceMinor },
  ],
});

const environment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

describe("wallet presentation interactions", () => {
  let host: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    environment.IS_REACT_ACT_ENVIRONMENT = true;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: jest.fn((media: string) => ({
        matches: false,
        media,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: () => true,
      })),
    });
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });
  afterEach(async () => {
    await act(() => root.unmount());
    host.remove();
    delete environment.IS_REACT_ACT_ENVIRONMENT;
  });

  const render = async (model: WalletOverview) => {
    await act(() => root.render(<WalletDashboard model={model} />));
  };

  it("switches account-scoped balances and makes destinations inspect-only", async () => {
    const base = createPreviewOverview();
    const usd = base.wallets[0]!;
    await render({
      ...base,
      accounts: [
        ...base.accounts,
        {
          id: "recipient",
          label: "Recipient",
          role: "destination",
          defaultCurrency: "USD",
        },
      ],
      wallets: [
        { ...usd, balanceMinor: "12345" },
        ...base.wallets.slice(1),
        {
          ...usd,
          id: "recipient-usd",
          accountId: "recipient",
          balanceMinor: "4250",
        },
      ],
      balanceHistory: [
        recordedHistory(base.activeAccountId, "12345"),
        recordedHistory("recipient", "4250"),
      ],
    });
    expect(host.querySelector(".wallet-currency-list")?.textContent).toContain(
      "123.45",
    );
    expect(
      host.querySelector(".wallet-balance-history table")?.textContent,
    ).toContain("123.45");
    const selector = host.querySelector<HTMLButtonElement>(
      'button[aria-label="Account being inspected"]',
    )!;
    await act(() => {
      selector.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
    });
    const destination = [
      ...document.querySelectorAll<HTMLElement>('[role="menuitemradio"]'),
    ].find((item) => item.textContent?.includes("Recipient"))!;
    await act(() => destination.click());
    const balances = host.querySelector(".wallet-currency-list")!;
    expect(balances.textContent).toContain("42.50");
    expect(balances.textContent).not.toContain("123.45");
    expect(balances.querySelectorAll("li")).toHaveLength(1);
    expect(
      host.querySelector(".wallet-balance-history table")?.textContent,
    ).toContain("42.50");
    expect(
      host.querySelector(".wallet-balance-history table")?.textContent,
    ).not.toContain("123.45");
    expect(host.querySelector(".wallet-inspect-hint")?.textContent).toContain(
      "main account only",
    );
    expect(host.querySelector(".wallet-operation-form")).toBeNull();
    expect(
      [
        ...host.querySelectorAll<HTMLButtonElement>(".wallet-quick-action"),
      ].every((button) => button.disabled),
    ).toBe(true);
  });

  it("does not reuse main-account balances for a destination without data", async () => {
    const base = createPreviewOverview();
    await render({
      ...base,
      accounts: [
        {
          id: "recipient",
          label: "Recipient",
          role: "destination",
          defaultCurrency: "USD",
        },
      ],
      activeAccountId: "recipient",
      balanceHistory: [recordedHistory(base.activeAccountId, "12345")],
    });
    expect(host.querySelector(".wallet-currency-list")).toBeNull();
    expect(
      host.querySelector(".wallet-currencies-empty")?.textContent,
    ).toContain("Balances not connected");
    expect(host.querySelector(".wallet-total-value")?.textContent).toBe(
      "Unavailable",
    );
    expect(host.querySelector(".wallet-balance-history svg")).toBeNull();
    expect(
      host.querySelector(".wallet-balance-history")?.textContent,
    ).toContain("History not connected");
  });

  it("hides every balance and restores values without changing the model", async () => {
    const model = createPreviewOverview();
    model.balanceHistory = [recordedHistory(model.activeAccountId, "998877")];
    await render(model);
    const button = host.querySelector<HTMLButtonElement>(
      'button[aria-label="Hide monetary amounts"]',
    )!;
    await act(() => button.click());
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(
      [...host.querySelectorAll(".wallet-currency-amount")].every(
        (element) => !element.textContent?.includes("0.00"),
      ),
    ).toBe(true);
    expect(
      host.querySelector(".wallet-total-value")?.textContent,
    ).not.toContain("0.00");
    expect(host.querySelector('input[name="amount"]')).toBeNull();
    const history = host.querySelector(".wallet-balance-history")!;
    expect(history.textContent).toContain("Balance history hidden");
    expect(history.querySelector("svg, table, details, time")).toBeNull();
    expect(history.innerHTML).not.toMatch(/9,988\.77|998877|2026-10/);
    await act(() => button.click());
    expect(host.querySelector(".wallet-total-value")?.textContent).toContain(
      "0.00",
    );
    expect(model.wallets.every((wallet) => wallet.balanceMinor === "0")).toBe(
      true,
    );
    expect(
      host.querySelector(".wallet-balance-history table")?.textContent,
    ).toContain("9,988.77");
  });

  it("does not invent preview history or choose an ambiguous duplicate series", async () => {
    const model = createPreviewOverview();
    await render(model);
    expect(host.querySelectorAll(".wallet-currency-flag")).toHaveLength(3);
    expect(host.querySelector(".wallet-balance-history svg")).toBeNull();
    const history = recordedHistory(model.activeAccountId, "12345");
    await render({ ...model, balanceHistory: [history, history] });
    expect(host.querySelector(".wallet-balance-history svg")).toBeNull();
    expect(host.querySelector(".wallet-balance-history table")).toBeNull();
    expect(
      host.querySelector(".wallet-balance-history")?.getAttribute("data-state"),
    ).toBe("invalid");
  });

  it("labels connected balances truthfully without pretending writes or history are connected", async () => {
    const model = createPreviewOverview();
    model.mode = "connected-readonly";
    model.wallets[0]!.balanceMinor = "12345";
    model.usdTotals = {
      [model.activeAccountId]: { status: "available", balanceMinor: "12345" },
    };
    await render(model);
    expect(host.querySelector(".wallet-total-value")?.textContent).toBe(
      "$123.45",
    );
    expect(host.querySelector(".wallet-total-note")?.textContent).toContain(
      "Journal-derived balances",
    );
    expect(host.querySelector(".wallet-preview-notice")?.textContent).toContain(
      "Balances connected",
    );
    expect(host.querySelector(".wallet-preview-notice")?.textContent).toContain(
      "money operations and history are not connected",
    );
    expect(host.querySelector(".wallet-history-empty")?.textContent).toContain(
      "Transaction history not connected",
    );
    expect(host.querySelector(".wallet-balance-history svg")).toBeNull();
    model.usdTotals[model.activeAccountId] = { status: "unavailable" };
    await render({ ...model });
    expect(host.querySelector(".wallet-total-value")?.textContent).toBe(
      "Unavailable",
    );
    expect(host.querySelector(".wallet-currency-list")?.textContent).toContain(
      "123.45",
    );
  });
});
