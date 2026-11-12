/** @jest-environment jsdom */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { usePortfolio } from "./use-portfolio";
import type { WalletRecord } from "../accounts/types";

const wallet: WalletRecord = {
  id: "usd",
  accountId: "main",
  currency: "USD",
  name: "Dollar",
  exponent: 2,
  balanceMinor: "100",
};
const view = {
  accountId: "main",
  balances: [wallet],
  observedAt: "2026-11-12T12:00:00.000Z",
  total: {
    status: "available",
    balanceMinor: "100",
    source: "balances",
    rates: [],
  },
  history: {
    accountId: "main",
    currency: "USD",
    exponent: 2,
    points: [{ recordedAt: "2026-11-12T12:00:00.000Z", balanceMinor: "100" }],
  },
};
describe("scoped portfolio lifecycle", () => {
  let root: Root, host: HTMLDivElement, hook: ReturnType<typeof usePortfolio>;
  const network = jest.fn(),
    revision = {};
  function Harness({
    accountId,
    enabled,
    token,
  }: {
    accountId: string;
    enabled: boolean;
    token: object;
  }) {
    hook = usePortfolio(accountId, [{ ...wallet, accountId }], token, enabled);
    return null;
  }
  const render = (accountId = "main", enabled = true, token = revision) =>
    act(async () => {
      root.render(
        <Harness accountId={accountId} enabled={enabled} token={token} />,
      );
    });
  const response = (body: unknown = view) => ({
    ok: true,
    json: async () => body,
  });
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
  it("uses scoped no-store GETs and removes totals immediately under privacy", async () => {
    await render("main", false);
    expect(network).not.toHaveBeenCalled();
    network.mockResolvedValue(response());
    await render();
    expect(hook.view?.total).toMatchObject({ balanceMinor: "100" });
    expect(network.mock.calls[0][0]).toBe("/api/portfolio?accountId=main");
    expect(network.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
    await render("main", false);
    expect(hook.view).toBeUndefined();
    expect(network.mock.calls[0][1].signal.aborted).toBe(true);
  });
  it("ignores late foreign-account results even when the transport ignores abort", async () => {
    let finish!: (value: unknown) => void;
    network.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    await render();
    network.mockResolvedValue(
      response({
        ...view,
        accountId: "other",
        balances: [{ ...wallet, accountId: "other" }],
        history: { ...view.history, accountId: "other" },
      }),
    );
    await render("other");
    await act(async () => finish(response()));
    expect(hook.view?.accountId).toBe("other");
    expect(network.mock.calls[0][1].signal.aborted).toBe(true);
  });
  it("rejects unmatched amounts and requires explicit retry, never a previous total", async () => {
    network.mockResolvedValueOnce(
      response({ ...view, total: { ...view.total, balanceMinor: "999" } }),
    );
    await render();
    expect(hook.failed).toBe(true);
    expect(hook.view).toBeUndefined();
    network.mockResolvedValue(response());
    await act(async () => hook.retry());
    expect(hook.view?.total).toMatchObject({ balanceMinor: "100" });
    await render("main", true, {});
    expect(network).toHaveBeenCalledTimes(3);
  });
  it("times out without automatically sending another request", async () => {
    jest.useFakeTimers();
    try {
      network.mockImplementation(
        (_url, options) =>
          new Promise((_resolve, reject) =>
            options.signal.addEventListener("abort", () =>
              reject(new Error("aborted")),
            ),
          ),
      );
      await render();
      await act(async () => {
        jest.advanceTimersByTime(15000);
      });
      expect(hook.failed).toBe(true);
      await act(async () => {
        jest.advanceTimersByTime(150000);
      });
      expect(network).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
