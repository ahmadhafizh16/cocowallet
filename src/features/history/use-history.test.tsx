/** @jest-environment jsdom */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useHistoryRead } from "./use-history";
import type { HistoryPage } from "./contracts";

const page: HistoryPage = {
  account: {
    id: "main",
    role: "main",
    defaultCurrency: "USD",
    inspectOnly: false,
    createdAt: "2026-11-12T12:00:00.000Z",
  },
  transactions: [
    {
      transactionId: "record",
      type: "deposit",
      direction: "incoming",
      status: "completed",
      createdAt: "2026-11-12T12:00:00.000Z",
      source: null,
      target: {
        accountId: "main",
        walletId: "usd",
        currency: "USD",
        name: "Dollar",
        exponent: 2,
        amount: "1.00",
        amountMinor: "100",
      },
      provider: "demo_bank",
      rate: null,
    },
  ],
  pagination: { page: 1, pageSize: 50, totalItems: 1, totalPages: 1 },
};
const listRequest = {
  kind: "list" as const,
  query: { accountId: "main", page: 1, pageSize: 50 },
};
describe("scoped full history read lifecycle", () => {
  let host: HTMLDivElement, root: Root, hook: ReturnType<typeof useHistoryRead>;
  const network = jest.fn(),
    revision = {};
  type ReadRequest = Parameters<typeof useHistoryRead>[0];
  function Harness({
    request,
    enabled,
    token,
  }: {
    request: ReadRequest;
    enabled: boolean;
    token: object;
  }) {
    hook = useHistoryRead(request, token, enabled);
    return null;
  }
  const render = (
    request: ReadRequest = listRequest,
    enabled = true,
    token = revision,
  ) =>
    act(async () => {
      root.render(
        <Harness request={request} enabled={enabled} token={token} />,
      );
    });
  const response = (body: unknown = page, status = 200) => ({
    status,
    ok: status === 200,
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
  it("performs scoped GET-only no-store reads and validates the received page", async () => {
    network.mockResolvedValue(response());
    await render();
    expect(network.mock.calls[0][0]).toBe(
      "/api/transactions?accountId=main&page=1&pageSize=50",
    );
    expect(network.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
    expect(network.mock.calls[0][1].body).toBeUndefined();
    expect(hook.result).toEqual({ kind: "list", page });
  });
  it("discards late results after account switches, even if abort is ignored", async () => {
    let finish!: (value: unknown) => void;
    network.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    await render();
    const other = {
      ...page,
      account: {
        ...page.account,
        id: "other",
        role: "destination",
        inspectOnly: true,
      },
      transactions: [],
      pagination: { page: 1, pageSize: 50, totalItems: 0, totalPages: 0 },
    };
    network.mockResolvedValue(response(other));
    await render({
      kind: "list",
      query: { ...listRequest.query, accountId: "other" },
    });
    await act(() => finish(response()));
    expect(hook.result).toEqual({ kind: "list", page: other });
    expect(network.mock.calls[0][1].signal.aborted).toBe(true);
  });
  it("binds detail to account and ID, never to a previous list or another record", async () => {
    network.mockResolvedValueOnce(response());
    await render();
    network.mockResolvedValueOnce(
      response({ account: page.account, transaction: page.transactions[0] }),
    );
    await render({
      kind: "detail",
      accountId: "main",
      transactionId: "record",
    });
    expect(hook.result?.kind).toBe("detail");
    network.mockResolvedValueOnce(
      response({ account: page.account, transaction: page.transactions[0] }),
    );
    await render({
      kind: "detail",
      accountId: "main",
      transactionId: "different",
    });
    expect(hook.result).toBeUndefined();
    expect(hook.failure).toBe("unavailable");
  });
  it("encodes exact account/record IDs safely and distinguishes missing details without displaying response text", async () => {
    network.mockResolvedValue(response({ private: "not rendered" }, 404));
    await render({
      kind: "detail",
      accountId: " recipient&🌍 ",
      transactionId: "record/with?query",
    });
    expect(network.mock.calls[0][0]).toBe(
      "/api/transactions/record%2Fwith%3Fquery?accountId=+recipient%26%F0%9F%8C%8D+",
    );
    expect(hook.failure).toBe("missing");
    expect(hook.result).toBeUndefined();
  });
  it("does not read hidden history; hiding aborts in-flight reads and hides results immediately", async () => {
    await render(listRequest, false);
    expect(network).not.toHaveBeenCalled();
    network.mockResolvedValue(response());
    await render();
    expect(hook.result).toBeDefined();
    await render(listRequest, false);
    expect(hook.result).toBeUndefined();
    expect(network.mock.calls[0][1].signal.aborted).toBe(true);
  });
  it("requires an explicit retry after failure and invalidates old revisions", async () => {
    network.mockResolvedValueOnce(response({}, 503));
    await render();
    expect(hook.failure).toBe("unavailable");
    expect(network).toHaveBeenCalledTimes(1);
    network.mockResolvedValue(response());
    await act(async () => {
      hook.retry();
    });
    expect(hook.result).toEqual({ kind: "list", page });
    await render(listRequest, true, {});
    expect(network).toHaveBeenCalledTimes(3);
  });
  it("times out without changing data or automatically retrying", async () => {
    jest.useFakeTimers();
    try {
      network.mockImplementation(
        (_url, options) =>
          new Promise((_resolve, reject) =>
            options.signal.addEventListener("abort", () =>
              reject(new Error("timeout")),
            ),
          ),
      );
      await render();
      await act(async () => {
        jest.advanceTimersByTime(15000);
      });
      expect(hook.failure).toBe("unavailable");
      expect(network).toHaveBeenCalledTimes(1);
      await act(async () => {
        jest.advanceTimersByTime(150000);
      });
      expect(network).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
