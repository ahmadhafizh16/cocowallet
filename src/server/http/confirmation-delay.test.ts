import { randomUUID } from "node:crypto";
import { waitForConfirmation } from "./confirmation-delay";
import { handleFunding } from "./funding-handler";
import { handleConversion } from "./conversion-handler";
import { handleTransfer } from "./transfer-handler";
import { getRuntimeDatabase } from "../db/runtime";

jest.mock("../db/runtime", () => ({
  getRuntimeDatabase: jest.fn(() => {
    throw new Error("test storage unavailable");
  }),
}));
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it("waits exactly one second asynchronously", async () => {
  let done = false;
  const pending = waitForConfirmation().then(() => {
    done = true;
  });
  await jest.advanceTimersByTimeAsync(999);
  expect(done).toBe(false);
  await jest.advanceTimersByTimeAsync(1);
  await pending;
  expect(done).toBe(true);
});

it.each(["deposit", "withdrawal", "conversion", "transfer"] as const)(
  "%s waits before any database access without changing unknown-outcome handling",
  async (kind) => {
    const funding = {
        walletId: "main-usd",
        amount: "1.00",
        provider: "demo_bank",
      },
      conversion = {
        sourceWalletId: "main-usd",
        amount: "1.00",
        targetCurrency: "GBP",
        quoteId: randomUUID(),
      },
      transfer = {
        sourceWalletId: "main-usd",
        amount: "1.00",
        recipientAccountId: "recipient",
        targetCurrency: "USD",
      };
    const request = new Request(`http://localhost:3000/api/${kind}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": randomUUID(),
      },
      body: JSON.stringify(
        kind === "conversion"
          ? conversion
          : kind === "transfer"
            ? transfer
            : funding,
      ),
    });
    const pending =
      kind === "conversion"
        ? handleConversion(request)
        : kind === "transfer"
          ? handleTransfer(request)
          : handleFunding(request, kind);
    await jest.advanceTimersByTimeAsync(0);
    expect(getRuntimeDatabase).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(999);
    expect(getRuntimeDatabase).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    const response = await pending;
    expect(getRuntimeDatabase).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(503);
    expect((await response.json()).definitive).toBe(false);
  },
);
