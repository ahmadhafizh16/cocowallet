/** @jest-environment jsdom */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { BalanceHistory } from "./balance-history";

it("pages all exact observations six at a time, preserves the whole chart and hides all data under privacy", async () => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const points = Array.from({ length: 13 }, (_, i) => ({
    recordedAt: new Date(Date.UTC(2026, 10, 12, 12, 0, i)).toISOString(),
    balanceMinor: String(100 + i),
  }));
  const render = (hidden = false) =>
    act(() =>
      root.render(
        <BalanceHistory
          accountId="main"
          hidden={hidden}
          series={{ accountId: "main", currency: "USD", exponent: 2, points }}
        />,
      ),
    );
  const click = (name: string) =>
    act(() => {
      [...host.querySelectorAll("button")]
        .find((button) => button.textContent === name)!
        .click();
    });
  try {
    await render();
    expect(host.querySelectorAll("tbody tr")).toHaveLength(6);
    expect(host.textContent).toContain("Page 1 of 3");
    await click("Next");
    expect(host.querySelectorAll("tbody tr")).toHaveLength(6);
    expect(host.textContent).toContain("Page 2 of 3");
    expect(host.querySelector("tbody")?.textContent).toContain("1.06 USD");
    await click("Next");
    expect(host.querySelectorAll("tbody tr")).toHaveLength(1);
    expect(host.querySelector("tbody")?.textContent).toContain("1.12 USD");
    expect(
      host.querySelector("polyline")?.getAttribute("points")?.split(" "),
    ).toHaveLength(13);
    await click("Previous");
    expect(host.textContent).toContain("Page 2 of 3");
    await render(true);
    expect(host.querySelectorAll("time,svg,table,nav")).toHaveLength(0);
  } finally {
    await act(() => root.unmount());
    host.remove();
    delete (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
      .IS_REACT_ACT_ENVIRONMENT;
  }
});
