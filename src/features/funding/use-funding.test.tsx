/** @jest-environment jsdom */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useFunding } from "./use-funding";
import { FUNDING_RECOVERY_KEY } from "./recovery";
import type { FundingIntent } from "./contracts";

const intent: FundingIntent = {
  version: 1,
  key: "12345678-1234-4123-8123-123456789012",
  kind: "deposit",
  request: { walletId: "wallet", amount: "10.00", provider: "demo_bank" },
};
const receipt = {
  requestKey: intent.key,
  transactionId: "87654321-1234-4123-8123-123456789012",
  type: "deposit",
  status: "completed",
  accountId: "main",
  walletId: "wallet",
  currency: "USD",
  exponent: 2,
  amountMinor: "1000",
  balanceMinor: "1000",
  provider: "demo_bank",
  createdAt: "2026-11-11T00:00:00.000Z",
};

describe("per-tab submission recovery", () => {
  let host: HTMLDivElement;
  let root: Root;
  let hook: ReturnType<typeof useFunding>;
  const refresh = jest.fn();
  const fetchMock = jest.fn();
  function Harness() {
    hook = useFunding(true, refresh);
    return null;
  }
  const mount = () =>
    act(() => {
      root.render(<Harness />);
    });
  beforeEach(() => {
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    sessionStorage.clear();
    fetchMock.mockReset();
    refresh.mockReset();
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: fetchMock,
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

  it("saves and verifies before sending, clears only after a confirmed result", async () => {
    await mount();
    fetchMock.mockImplementation(async () => {
      expect(JSON.parse(sessionStorage.getItem(FUNDING_RECOVERY_KEY)!)).toEqual(
        intent,
      );
      return { status: 200, json: async () => receipt };
    });
    await act(() => hook.send(intent));
    expect(hook.result).toEqual(receipt);
    expect(sessionStorage.getItem(FUNDING_RECOVERY_KEY)).toBeNull();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("does not relabel a known outcome as unknown if refreshing the overview fails", async () => {
    await mount();
    fetchMock.mockResolvedValue({ status: 200, json: async () => receipt });
    refresh.mockImplementationOnce(() => {
      throw new Error("presentation failure");
    });
    await act(() => hook.send(intent));
    expect(hook.result).toEqual(receipt);
    expect(hook.message).toContain("Result confirmed");
    expect(sessionStorage.getItem(FUNDING_RECOVERY_KEY)).toBeNull();
  });

  it("retains unknown context across remount; explicit retry uses the same key/body, never auto-submits", async () => {
    await mount();
    fetchMock.mockRejectedValue(new Error("network"));
    await act(() => hook.send(intent));
    expect(hook.result).toBeUndefined();
    expect(hook.intent).toEqual(intent);
    await act(() => root.unmount());
    root = createRoot(host);
    await mount();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(hook.intent).toEqual(intent);
    fetchMock.mockResolvedValue({ status: 200, json: async () => receipt });
    await act(() =>
      hook.send({ ...intent, key: "aaaaaaaa-1234-4123-8123-123456789012" }),
    );
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      headers: { "Idempotency-Key": intent.key },
      body: JSON.stringify(intent.request),
    });
    expect(hook.result).toEqual(receipt);
  });

  it("blocks sending if recovery cannot be retained or contains invalid context", async () => {
    await mount();
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    await act(() => hook.send(intent));
    expect(hook.storageBlocked).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks unreadable persisted context without sending or deleting it", async () => {
    sessionStorage.setItem(FUNDING_RECOVERY_KEY, "{broken");
    await mount();
    expect(hook.storageBlocked).toBe(true);
    await act(() => hook.send(intent));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(FUNDING_RECOVERY_KEY)).toBe("{broken");
  });

  it("blocks when recovery storage cannot be read", async () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    await mount();
    expect(hook.storageBlocked).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retains a timed-out request and permits only original-key recovery", async () => {
    jest.useFakeTimers();
    try {
      await mount();
      fetchMock.mockImplementation(
        (_url, options) =>
          new Promise((_resolve, reject) =>
            options.signal.addEventListener("abort", () =>
              reject(new Error("timeout")),
            ),
          ),
      );
      let waiting!: Promise<void>;
      await act(async () => {
        waiting = hook.send(intent);
      });
      await act(async () => {
        jest.advanceTimersByTime(15000);
        await waiting;
      });
      expect(hook.pending).toBe(false);
      expect(hook.intent).toEqual(intent);
      expect(hook.result).toBeUndefined();
      expect(sessionStorage.getItem(FUNDING_RECOVERY_KEY)).not.toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it("does not overwrite an existing different unresolved request", async () => {
    await mount();
    sessionStorage.setItem(
      FUNDING_RECOVERY_KEY,
      JSON.stringify({
        ...intent,
        request: { ...intent.request, amount: "25" },
      }),
    );
    await act(() => hook.send(intent));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(hook.storageBlocked).toBe(true);
  });

  it.each([
    { ...receipt, requestKey: "wrong" },
    { ...receipt, amountMinor: "1" },
    { ...receipt, balanceMinor: "-1" },
    { ...receipt, status: "pending" },
    { definitive: true, status: 503 },
  ])(
    "cannot clear uncertainty for malformed/unmatched response %j",
    async (body) => {
      await mount();
      fetchMock.mockResolvedValue({ status: 200, json: async () => body });
      await act(() => hook.send(intent));
      expect(hook.result).toBeUndefined();
      expect(sessionStorage.getItem(FUNDING_RECOVERY_KEY)).not.toBeNull();
    },
  );

  it("shows a known result but blocks new attempts if context cleanup fails", async () => {
    await mount();
    fetchMock.mockResolvedValue({ status: 200, json: async () => receipt });
    jest.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("denied");
    });
    await act(() => hook.send(intent));
    expect(hook.result).toEqual(receipt);
    expect(hook.storageBlocked).toBe(true);
    await act(() => hook.startAnother());
    expect(hook.result).toEqual(receipt);
  });

  it("ignores rapid duplicate clicks while a request is in flight", async () => {
    await mount();
    let finish!: (value: unknown) => void;
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    let first!: Promise<void>;
    await act(async () => {
      first = hook.send(intent);
      await hook.send(intent);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => {
      finish({ status: 200, json: async () => receipt });
      await first;
    });
  });

  it("clears context after a matched definitive error, preserving a deliberate new-attempt boundary", async () => {
    await mount();
    fetchMock.mockResolvedValue({
      status: 409,
      json: async () => ({
        type: "about:blank",
        title: "Conflict",
        status: 409,
        code: "INSUFFICIENT_FUNDS",
        detail: "Insufficient funds.",
        definitive: true,
        requestKey: intent.key,
      }),
    });
    await act(() => hook.send(intent));
    expect(hook.result).toMatchObject({ code: "INSUFFICIENT_FUNDS" });
    expect(sessionStorage.getItem(FUNDING_RECOVERY_KEY)).toBeNull();
    await act(() => hook.send(intent));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(() => hook.startAnother());
    expect(hook.result).toBeUndefined();
  });
});
