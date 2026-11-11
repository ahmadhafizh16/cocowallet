/** @jest-environment jsdom */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useSubmission as useFunding } from "../submissions/use-submission";
import { FUNDING_RECOVERY_KEY } from "./recovery";
import type { FundingIntent } from "./contracts";
import type {
  ConversionIntent,
  TransferIntent,
} from "../submissions/contracts";
import { transferFailures, transferProblem } from "../transfers/contracts";
import {
  conversionFailures,
  conversionProblem,
} from "../conversions/contracts";

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
const conversionIntent: ConversionIntent = {
  version: 1,
  key: intent.key,
  kind: "conversion",
  request: {
    quoteId: "aaaaaaaa-1234-4123-8123-123456789012",
    sourceWalletId: "wallet",
    amount: "10.00",
    targetCurrency: "GBP",
  },
};
const conversionReceipt = {
  requestKey: intent.key,
  transactionId: receipt.transactionId,
  type: "conversion",
  status: "completed",
  quoteId: conversionIntent.request.quoteId,
  source: {
    walletId: "wallet",
    accountId: "main",
    currency: "USD",
    name: "Dollar",
    exponent: 2,
    amount: "10.00",
    amountMinor: "1000",
    balanceMinor: "9000",
  },
  target: {
    walletId: "target",
    accountId: "main",
    currency: "GBP",
    name: "Pound",
    exponent: 2,
    amount: "8.00",
    amountMinor: "800",
    balanceMinor: "800",
  },
  rate: {
    provider: "frankfurter",
    value: "0.8",
    date: "2026-11-10",
    fetchedAt: "2026-11-11T00:00:00.000Z",
    source: "fresh",
  },
  issuedAt: "2026-11-11T00:00:00.000Z",
  expiresAt: "2026-11-11T00:01:00.000Z",
  createdAt: "2026-11-11T00:00:01.000Z",
};
const transferIntent: TransferIntent = {
  version: 1,
  key: intent.key,
  kind: "transfer",
  request: {
    sourceWalletId: "wallet",
    recipientAccountId: " وجهة-💰 ",
    recipientDefaultCurrency: "GBP",
    targetCurrency: "GBP",
    amount: "10.00",
    quoteId: conversionIntent.request.quoteId,
  },
};
const transferReceipt = {
  ...conversionReceipt,
  type: "transfer",
  target: {
    ...conversionReceipt.target,
    accountId: transferIntent.request.recipientAccountId,
  },
  recipient: {
    accountId: transferIntent.request.recipientAccountId,
    defaultCurrency: "GBP",
    defaultName: "Pound",
    defaultExponent: 2,
    created: true,
  },
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

  it("shares one immutable recovery slot for conversion and funding; remount never fetches a replacement quote", async () => {
    await mount();
    fetchMock.mockRejectedValue(new Error("lost response"));
    await act(() => hook.send(conversionIntent));
    expect(JSON.parse(sessionStorage.getItem(FUNDING_RECOVERY_KEY)!)).toEqual(
      conversionIntent,
    );
    await act(() => root.unmount());
    root = createRoot(host);
    await mount();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockResolvedValue({
      status: 200,
      json: async () => conversionReceipt,
    });
    await act(() => hook.send(intent));
    expect(fetchMock.mock.calls[1]).toEqual([
      "/api/conversions",
      expect.objectContaining({
        body: JSON.stringify(conversionIntent.request),
        headers: expect.objectContaining({
          "Idempotency-Key": conversionIntent.key,
        }),
      }),
    ]);
    expect(hook.result).toEqual(conversionReceipt);
    expect(sessionStorage.getItem(FUNDING_RECOVERY_KEY)).toBeNull();
  });

  it.each(["quoteId", "amountMinor", "rate"])(
    "preserves conversion uncertainty for a mismatched receipt %s",
    async (field) => {
      await mount();
      const altered = JSON.parse(JSON.stringify(conversionReceipt));
      if (field === "quoteId")
        altered.quoteId = "bbbbbbbb-1234-4123-8123-123456789012";
      if (field === "amountMinor") altered.target.amountMinor = "1";
      if (field === "rate") altered.rate.value = "4";
      fetchMock.mockResolvedValue({ status: 200, json: async () => altered });
      await act(() => hook.send(conversionIntent));
      expect(hook.result).toBeUndefined();
      expect(hook.intent).toEqual(conversionIntent);
      expect(sessionStorage.getItem(FUNDING_RECOVERY_KEY)).not.toBeNull();
    },
  );

  it("retains original conversion input after a definite expiry until an explicit new-attempt boundary", async () => {
    await mount();
    fetchMock.mockResolvedValue({
      status: 409,
      json: async () =>
        conversionProblem(
          409,
          "QUOTE_EXPIRED",
          conversionFailures.QUOTE_EXPIRED.detail,
          true,
          conversionIntent.key,
        ),
    });
    await act(() => hook.send(conversionIntent));
    expect(hook.result).toMatchObject({ code: "QUOTE_EXPIRED" });
    expect(sessionStorage.getItem(FUNDING_RECOVERY_KEY)).toBeNull();
    await act(() =>
      hook.send({
        ...conversionIntent,
        key: "bbbbbbbb-1234-4123-8123-123456789012",
      }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(() => hook.startAnother());
    expect(hook.result).toBeUndefined();
  });

  it("does not erase recovery data replaced during an in-flight confirmed request", async () => {
    await mount();
    fetchMock.mockImplementation(async () => {
      sessionStorage.setItem(
        FUNDING_RECOVERY_KEY,
        JSON.stringify(conversionIntent),
      );
      return { status: 200, json: async () => receipt };
    });
    await act(() => hook.send(intent));
    expect(hook.result).toEqual(receipt);
    expect(hook.storageBlocked).toBe(true);
    expect(JSON.parse(sessionStorage.getItem(FUNDING_RECOVERY_KEY)!)).toEqual(
      conversionIntent,
    );
  });
  it("extends the historical slot to transfers; reload and cross-feature candidates only recover original terms", async () => {
    await mount();
    fetchMock.mockRejectedValue(new Error("lost transfer response"));
    await act(() => hook.send(transferIntent));
    expect(JSON.parse(sessionStorage.getItem(FUNDING_RECOVERY_KEY)!)).toEqual(
      transferIntent,
    );
    await act(() => root.unmount());
    root = createRoot(host);
    await mount();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(hook.intent).toEqual(transferIntent);
    fetchMock.mockResolvedValue({
      status: 200,
      json: async () => transferReceipt,
    });
    await act(() => hook.send(conversionIntent));
    expect(fetchMock.mock.calls[1]).toEqual([
      "/api/transfers",
      expect.objectContaining({
        body: JSON.stringify(transferIntent.request),
        headers: expect.objectContaining({
          "Idempotency-Key": transferIntent.key,
        }),
      }),
    ]);
    expect(hook.result).toEqual(transferReceipt);
    expect(sessionStorage.getItem(FUNDING_RECOVERY_KEY)).toBeNull();
  });
  it.each([
    "recipient",
    "default",
    "rate",
    "amount",
    "quote",
    "balance",
    "key",
  ])(
    "retains transfer uncertainty for mismatched receipt %s",
    async (field) => {
      await mount();
      const altered = JSON.parse(JSON.stringify(transferReceipt));
      if (field === "recipient") altered.target.accountId = "other";
      if (field === "default") altered.recipient.defaultCurrency = "USD";
      if (field === "rate") altered.rate.value = "9";
      if (field === "amount") altered.target.amountMinor = "1";
      if (field === "quote")
        altered.quoteId = "bbbbbbbb-1234-4123-8123-123456789012";
      if (field === "balance") altered.source.balanceMinor = "-1";
      if (field === "key") altered.requestKey = "other";
      fetchMock.mockResolvedValue({ status: 200, json: async () => altered });
      await act(() => hook.send(transferIntent));
      expect(hook.result).toBeUndefined();
      expect(hook.intent).toEqual(transferIntent);
      expect(sessionStorage.getItem(FUNDING_RECOVERY_KEY)).not.toBeNull();
    },
  );
  it("validates same-currency receipts with explicit null terms", async () => {
    await mount();
    const same = {
      ...transferIntent,
      request: {
        ...transferIntent.request,
        recipientDefaultCurrency: "USD",
        targetCurrency: "USD",
        quoteId: undefined,
      },
    };
    delete same.request.quoteId;
    const body = {
      ...transferReceipt,
      target: {
        ...transferReceipt.target,
        currency: "USD",
        name: "Dollar",
        amount: "10.00",
        amountMinor: "1000",
        balanceMinor: "1000",
      },
      recipient: {
        ...transferReceipt.recipient,
        defaultCurrency: "USD",
        defaultName: "Dollar",
      },
      quoteId: null,
      rate: null,
      issuedAt: null,
      expiresAt: null,
    };
    fetchMock.mockResolvedValue({ status: 200, json: async () => body });
    await act(() => hook.send(same));
    expect(hook.result).toEqual(body);
  });
  it("blocks transfers before network when recovery storage fails", async () => {
    await mount();
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    await act(() => hook.send(transferIntent));
    expect(hook.storageBlocked).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("retains original transfer input through a definitive expiry until explicit editing", async () => {
    await mount();
    fetchMock.mockResolvedValue({
      status: 409,
      json: async () =>
        transferProblem(
          409,
          "QUOTE_EXPIRED",
          transferFailures.QUOTE_EXPIRED.detail,
          true,
          transferIntent.key,
        ),
    });
    await act(() => hook.send(transferIntent));
    expect(hook.result).toMatchObject({ code: "QUOTE_EXPIRED" });
    expect(hook.intent).toEqual(transferIntent);
    expect(sessionStorage.getItem(FUNDING_RECOVERY_KEY)).toBeNull();
    await act(() => hook.send(intent));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(() => hook.startAnother());
    expect(hook.intent).toBeUndefined();
  });
});
