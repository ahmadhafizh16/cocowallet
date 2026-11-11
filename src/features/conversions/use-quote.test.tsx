/** @jest-environment jsdom */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useConversionQuote } from "./use-quote";
const NOW = Date.parse("2026-11-12T12:00:00.000Z");
const request = {
  operation: "conversion" as const,
  sourceWalletId: "source",
  amount: "1.00",
  targetCurrency: "GBP",
};
const quote = {
  version: 1,
  quoteId: "aaaaaaaa-1234-4123-8123-123456789012",
  operation: "conversion",
  source: {
    accountId: "main",
    walletId: "source",
    currency: "USD",
    name: "Dollar",
    exponent: 2,
    amount: "1.00",
    amountMinor: "100",
  },
  target: {
    accountId: "main",
    currency: "GBP",
    name: "Pound",
    exponent: 2,
    amount: "0.80",
    amountMinor: "80",
  },
  rate: {
    provider: "frankfurter",
    value: "0.8",
    date: "2026-11-11",
    fetchedAt: new Date(NOW).toISOString(),
    source: "fresh",
  },
  issuedAt: new Date(NOW).toISOString(),
  expiresAt: new Date(NOW + 60000).toISOString(),
};
describe("reviewed server quote client lifecycle", () => {
  let root: Root,
    host: HTMLDivElement,
    hook: ReturnType<typeof useConversionQuote>,
    clock: number;
  const network = jest.fn();
  function Harness() {
    hook = useConversionQuote();
    return null;
  }
  beforeEach(async () => {
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    clock = NOW;
    jest.spyOn(Date, "now").mockImplementation(() => clock);
    network.mockReset();
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: network,
    });
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    await act(() => root.render(<Harness />));
  });
  afterEach(async () => {
    await act(() => root.unmount());
    host.remove();
    delete (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
      .IS_REACT_ACT_ENVIRONMENT;
  });
  const response = (body: unknown = { quote, state: "active" }) => ({
    ok: true,
    json: async () => body,
  });
  it("does not request automatically, validates fixed terms, and expires on focus without extending the minute", async () => {
    expect(network).not.toHaveBeenCalled();
    network.mockResolvedValue(response());
    await act(() => hook.load(request, "main"));
    expect(hook.quote).toEqual(quote);
    expect(hook.expired).toBe(false);
    clock = NOW + 60000;
    await act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(hook.expired).toBe(true);
    expect(hook.activeQuote()).toBeUndefined();
    expect(network).toHaveBeenCalledTimes(1);
    expect(hook.quote?.expiresAt).toBe(quote.expiresAt);
  });
  it("discards late responses after editing rather than binding stale terms", async () => {
    let finish!: (value: unknown) => void;
    network.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    let waiting!: Promise<void>;
    await act(async () => {
      waiting = hook.load(request, "main");
    });
    await act(() => hook.invalidate());
    await act(async () => {
      finish(response());
      await waiting;
    });
    expect(hook.quote).toBeUndefined();
    expect(hook.request).toBeUndefined();
    expect(hook.pending).toBe(false);
  });
  it.each(["amount", "rate", "account", "expiry", "cachedTime"])(
    "blocks confirmation for altered preview %s",
    async (field) => {
      const altered = JSON.parse(JSON.stringify(quote));
      if (field === "amount") altered.target.amountMinor = "1";
      if (field === "rate") altered.rate.value = "9";
      if (field === "account") altered.target.accountId = "destination";
      if (field === "expiry") altered.expiresAt = altered.issuedAt;
      if (field === "cachedTime")
        altered.rate.fetchedAt = new Date(NOW - 86400000).toISOString();
      network.mockResolvedValue(response({ quote: altered, state: "active" }));
      await act(() => hook.load(request, "main"));
      expect(hook.quote).toBeUndefined();
      expect(hook.message).toContain("unavailable");
    },
  );
  it("allows a labelled cached preview, but no replacement terms are auto-confirmed", async () => {
    network.mockResolvedValue(
      response({
        quote: { ...quote, rate: { ...quote.rate, source: "cached" } },
        state: "active",
      }),
    );
    await act(() => hook.load(request, "main"));
    expect(hook.quote?.rate.source).toBe("cached");
    expect(network.mock.calls[0][0]).toBe("/api/quotes");
    expect(network).toHaveBeenCalledTimes(1);
  });

  it("uses one deadline and leaves no recurring timer after expiry", async () => {
    jest.useFakeTimers();
    try {
      network.mockResolvedValue(response());
      await act(() => hook.load(request, "main"));
      expect(jest.getTimerCount()).toBe(1);
      clock = NOW + 60000;
      await act(() => {
        jest.advanceTimersByTime(60000);
      });
      expect(hook.expired).toBe(true);
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });
  const transferRequest = {
    ...request,
    operation: "transfer" as const,
    recipientAccountId: " وجهة-💰 ",
    recipientDefaultCurrency: "GBP",
  };
  const transferQuote = {
    ...quote,
    operation: "transfer",
    target: { ...quote.target, accountId: transferRequest.recipientAccountId },
    recipient: {
      accountId: transferRequest.recipientAccountId,
      defaultCurrency: "GBP",
      defaultName: "Pound",
      defaultExponent: 2,
      existed: false,
    },
  };
  it("validates transfer-specific recipient context without creating or submitting anything", async () => {
    network.mockResolvedValue(
      response({ quote: transferQuote, state: "active" }),
    );
    await act(() => hook.load(transferRequest, "main"));
    expect(hook.quote).toEqual(transferQuote);
    expect(network).toHaveBeenCalledTimes(1);
    expect(network.mock.calls[0][0]).toBe("/api/quotes");
  });
  it.each([
    "recipient",
    "targetAccount",
    "self",
    "default",
    "existed",
    "precision",
    "missingDefault",
    "sameCurrency",
    "operation",
  ])("rejects altered transfer preview %s", async (field) => {
    const altered = JSON.parse(JSON.stringify(transferQuote)),
      input = { ...transferRequest };
    if (field === "recipient") altered.recipient.accountId = "other";
    if (field === "targetAccount") altered.target.accountId = "other";
    if (field === "self") {
      altered.target.accountId = "main";
      altered.recipient.accountId = "main";
      input.recipientAccountId = "main";
    }
    if (field === "default") altered.recipient.defaultCurrency = "USD";
    if (field === "existed") altered.recipient.existed = "yes";
    if (field === "precision") altered.recipient.defaultExponent = 0;
    if (field === "missingDefault")
      delete (input as { recipientDefaultCurrency?: string })
        .recipientDefaultCurrency;
    if (field === "sameCurrency") altered.target.currency = "USD";
    if (field === "operation") altered.operation = "conversion";
    network.mockResolvedValue(response({ quote: altered, state: "active" }));
    await act(() => hook.load(input, "main"));
    expect(hook.quote).toBeUndefined();
    expect(hook.message).toContain("unavailable");
  });
});
