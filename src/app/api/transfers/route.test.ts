import { randomUUID } from "node:crypto";
import { POST } from "./route";

jest.mock("@/server/http/confirmation-delay", () => ({
  waitForConfirmation: jest.fn(async () => {}),
}));
import { createJournalFixture } from "@/server/db/test-fixture";
import { getRuntimeDatabase } from "@/server/db/runtime";
import { withJournalWrite } from "@/features/journal/write";
import { createQuote } from "@/features/quotes/service";
import { readWalletBalance } from "@/features/journal/balances";
import { readApiDocument } from "@/server/http/openapi";
import { assertContract } from "@/test/json-contract";

jest.mock("server-only", () => ({}));
jest.mock("@/server/db/runtime", () => ({ getRuntimeDatabase: jest.fn() }));
const NOW = Date.parse("2026-11-12T12:00:00.000Z");
const client = {
  catalog: async () => ({
    currencies: [
      { code: "USD", name: "Dollar", exponent: 2 },
      { code: "GBP", name: "Pound", exponent: 2 },
    ],
    fetchedAt: new Date(NOW).toISOString(),
  }),
  rate: async () => ({
    rate: "0.8",
    date: "2026-11-11",
    fetchedAt: new Date(NOW).toISOString(),
  }),
};
describe("transfer HTTP boundary", () => {
  let fixture: ReturnType<typeof createJournalFixture>;
  beforeEach(() => {
    fixture = createJournalFixture();
    jest.mocked(getRuntimeDatabase).mockReturnValue(fixture.database);
    jest.spyOn(Date, "now").mockReturnValue(NOW);
    withJournalWrite(fixture.database, (scope) =>
      scope.record({
        id: randomUUID(),
        type: "deposit",
        targetWalletId: "main-usd",
        amountMinor: 10000n,
        provider: "demo_bank",
      }),
    );
  });
  afterEach(() => fixture.cleanup());
  const input = {
    sourceWalletId: "main-usd",
    recipientAccountId: " 新しい وجهة-💰 ",
    amount: "1.00",
    recipientDefaultCurrency: "USD",
  };
  const request = (
    data: unknown = input,
    key: string = randomUUID(),
    headers: Record<string, string> = {},
  ) =>
    new Request("http://localhost:3000/api/transfers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": key,
        ...headers,
      },
      body: typeof data === "string" ? data : JSON.stringify(data),
    });
  const validate = (
    body: unknown,
    schema: "TransferReceipt" | "TransferProblem",
  ) =>
    assertContract(
      body,
      readApiDocument.components.schemas[schema],
      readApiDocument.components.schemas,
    );
  it("creates exact arbitrary destinations in a no-FX transfer and replays the original balance snapshots", async () => {
    const key = randomUUID(),
      first = await POST(request(input, key.toUpperCase())),
      body = await first.json();
    expect(first.status).toBe(200);
    expect(first.headers.get("cache-control")).toBe("no-store");
    expect(first.headers.get("Idempotency-Replayed")).toBe("false");
    expect(body).toMatchObject({
      requestKey: key,
      type: "transfer",
      source: { amountMinor: "100", balanceMinor: "9900" },
      target: {
        accountId: input.recipientAccountId,
        amountMinor: "100",
        balanceMinor: "100",
      },
      recipient: { created: true, defaultCurrency: "USD" },
      quoteId: null,
      rate: null,
    });
    validate(body, "TransferReceipt");
    jest.spyOn(Date, "now").mockImplementation(() => {
      throw new Error("Replay must not read the clock");
    });
    const second = await POST(request(input, key));
    expect(second.headers.get("Idempotency-Replayed")).toBe("true");
    expect(await second.json()).toEqual(body);
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(9900n);
    const conflict = await POST(request({ ...input, amount: "2.00" }, key));
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({
      code: "IDEMPOTENCY_KEY_REUSED",
      definitive: false,
    });
  });
  it("honors reviewed FX terms and retained success even after expiry and later spending", async () => {
    const terms = {
      ...input,
      recipientDefaultCurrency: "GBP",
      targetCurrency: "GBP",
    };
    const { quote } = await createQuote(
      fixture.database,
      { operation: "transfer", ...terms },
      { client, now: () => NOW },
    );
    const key = randomUUID(),
      data = { ...terms, quoteId: quote.quoteId };
    const first = await POST(request(data, key)),
      body = await first.json();
    expect(first.status).toBe(200);
    expect(body).toMatchObject({
      source: { amountMinor: "100" },
      target: { amountMinor: "80", currency: "GBP" },
      recipient: { created: true, defaultCurrency: "GBP" },
      rate: { value: "0.8" },
    });
    validate(body, "TransferReceipt");
    withJournalWrite(fixture.database, (scope) =>
      scope.record({
        id: randomUUID(),
        type: "withdrawal",
        sourceWalletId: "main-usd",
        amountMinor: 9900n,
        provider: "demo_bank",
      }),
    );
    jest.spyOn(Date, "now").mockReturnValue(NOW + 120000);
    const replay = await POST(request(data, key));
    expect(replay.headers.get("Idempotency-Replayed")).toBe("true");
    expect(await replay.json()).toEqual(body);
  });
  it("retains definitive expiry with no recipient or debit, and does not overwrite existing defaults", async () => {
    const data = {
      ...input,
      recipientDefaultCurrency: "GBP",
      targetCurrency: "GBP",
    };
    const { quote } = await createQuote(
      fixture.database,
      { operation: "transfer", ...data },
      { client, now: () => NOW },
    );
    jest.spyOn(Date, "now").mockReturnValue(NOW + 60000);
    const key = randomUUID(),
      first = await POST(request({ ...data, quoteId: quote.quoteId }, key)),
      body = await first.json();
    expect(first.status).toBe(409);
    expect(body).toMatchObject({ code: "QUOTE_EXPIRED", definitive: true });
    validate(body, "TransferProblem");
    expect(
      fixture.database.sqlite
        .prepare("SELECT id FROM accounts WHERE id=?")
        .get(input.recipientAccountId),
    ).toBeUndefined();
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(10000n);
    expect(
      (
        await POST(request({ ...data, quoteId: quote.quoteId }, key))
      ).headers.get("Idempotency-Replayed"),
    ).toBe("true");
    const mismatch = await POST(
      request({
        ...input,
        recipientAccountId: "recipient",
        recipientDefaultCurrency: "USD",
      }),
    );
    expect(mismatch.status).toBe(409);
    expect(await mismatch.json()).toMatchObject({
      code: "RECIPIENT_CONTEXT_CHANGED",
    });
  });
  it.each([
    "{",
    "x".repeat(16385),
    { ...input, rate: "2" },
    { ...input, targetAmount: "2" },
    { ...input, quoteId: "bad" },
    { ...input, amount: 1 },
    { ...input, recipientAccountId: " " },
    { ...input, recipientAccountId: "recipient\0" },
    { ...input, recipientAccountId: "a".repeat(8193) },
  ])("rejects malformed/override input before storage", async (data) => {
    const response = await POST(request(data));
    expect(response.status).toBe(400);
    expect(getRuntimeDatabase).not.toHaveBeenCalled();
    validate(await response.json(), "TransferProblem");
  });
  it.each<Record<string, string>>([
    { Origin: "https://evil.test" },
    { "Content-Type": "text/plain" },
    { "Sec-Fetch-Site": "cross-site" },
    { "Idempotency-Key": "bad" },
  ])(
    "rejects non-local or unkeyed writes before storage %j",
    async (headers) => {
      expect((await POST(request(input, randomUUID(), headers))).status).toBe(
        400,
      );
      expect(getRuntimeDatabase).not.toHaveBeenCalled();
    },
  );
  it.each([
    { recipientAccountId: "main", code: "INVALID_RECIPIENT", status: 400 },
    { sourceWalletId: "recipient-usd", code: "INSPECT_ONLY", status: 409 },
    { amount: "1000.00", code: "INSUFFICIENT_FUNDS", status: 409 },
  ])(
    "enforces source permissions and retains rejection $code",
    async ({ code, status, ...changes }) => {
      const key = randomUUID(),
        data = { ...input, ...changes },
        first = await POST(request(data, key)),
        body = await first.json();
      expect(first.status).toBe(status);
      expect(body).toMatchObject({ code, definitive: true });
      validate(body, "TransferProblem");
      const replay = await POST(request(data, key));
      expect(replay.headers.get("Idempotency-Replayed")).toBe("true");
      expect(await replay.json()).toEqual(body);
      expect(readWalletBalance(fixture.database, "main-usd")).toBe(10000n);
    },
  );
  it("redacts storage exceptions and retains original-key uncertainty", async () => {
    jest.mocked(getRuntimeDatabase).mockImplementation(() => {
      throw new Error("private /app/data");
    });
    const key = randomUUID(),
      response = await POST(request(input, key)),
      body = await response.json();
    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      code: "TRANSFER_OUTCOME_UNKNOWN",
      definitive: false,
      requestKey: key,
    });
    expect(JSON.stringify(body)).not.toMatch(/private|\/app/u);
    validate(body, "TransferProblem");
  });
});
