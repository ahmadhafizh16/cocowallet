/** @jest-environment jsdom */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { TransactionFacts } from "./transaction-facts";
import type { HistoryTransaction } from "./contracts";

it("copies exact IDs and offers selected, readable text when clipboard access fails", async () => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  document.body.append(host);
  const copied: string[] = [];
  const resizeObserver = Object.getOwnPropertyDescriptor(
    globalThis,
    "ResizeObserver",
  );
  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    value: class {
      observe = jest.fn();
      unobserve = jest.fn();
      disconnect = jest.fn();
    },
  });
  const root = createRoot(host),
    descriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard"),
    writeText = jest.fn(async (value: string) => {
      copied.push(value);
    });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  const id = "  legacy 🌍 <id>  ",
    transaction: HistoryTransaction = {
      transactionId: id,
      type: "deposit",
      direction: "incoming",
      status: "completed",
      createdAt: "2026-11-12T12:00:00.000Z",
      source: null,
      target: {
        accountId: "main",
        walletId: "wallet",
        amount: "12.00",
        amountMinor: "1200",
        currency: "USD",
        name: "US dollar",
        exponent: 2,
      },
      provider: "demo_bank",
      rate: null,
    };
  try {
    await act(() =>
      root.render(<TransactionFacts transaction={transaction} />),
    );
    const button = host.querySelector<HTMLButtonElement>(
      '[aria-label="Copy transaction id"]',
    )!;
    expect(button).not.toBeNull();
    await act(async () => button.click());
    expect(writeText).toHaveBeenCalledWith(id);
    expect(copied).toEqual([id]);
    expect(host.querySelector('[role="status"]')?.textContent).toBe("Copied!");
    expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
      "Copied!",
    );
    expect(host.querySelector(".wallet-detail-copy-feedback")).toBeNull();
    expect(
      document
        .querySelector('[data-slot="tooltip-arrow"]')
        ?.classList.contains("-translate-y-px"),
    ).toBe(true);
    writeText.mockRejectedValueOnce(new Error("blocked"));
    await act(async () => button.click());
    expect(host.querySelector('[role="status"]')?.textContent).toContain(
      "Copy unavailable",
    );
    expect(window.getSelection()?.toString()).toBe(id);
    expect(document.activeElement?.tagName).toBe("BDI");
  } finally {
    await act(() => root.unmount());
    host.remove();
    if (resizeObserver)
      Object.defineProperty(globalThis, "ResizeObserver", resizeObserver);
    else delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
    if (descriptor) Object.defineProperty(navigator, "clipboard", descriptor);
    else delete (navigator as { clipboard?: unknown }).clipboard;
    delete (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
      .IS_REACT_ACT_ENVIRONMENT;
  }
});
