import { randomUUID } from "node:crypto";
import { POST } from "./route";
import { createJournalFixture } from "@/server/db/test-fixture";
import { getRuntimeDatabase } from "@/server/db/runtime";
import { withJournalWrite } from "@/features/journal/write";
import { createQuote } from "@/features/quotes/service";

jest.mock("server-only", () => ({}));
jest.mock("@/server/db/runtime", () => ({ getRuntimeDatabase: jest.fn() }));
const NOW = Date.parse("2026-11-12T12:00:00.000Z");
describe("conversion submission HTTP boundary", () => {
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
    quoteId: "12345678-1234-4123-8123-123456789012",
    sourceWalletId: "main-usd",
    amount: "1.00",
    targetCurrency: "GBP",
  };
  const request = (
    data: unknown = input,
    key: string = randomUUID(),
    headers: Record<string, string> = {},
  ) =>
    new Request("http://localhost:3000/api/conversions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": key,
        ...headers,
      },
      body: typeof data === "string" ? data : JSON.stringify(data),
    });
  it("returns the original receipt and replay header even after quote expiry", async () => {
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
    const { quote } = await createQuote(
      fixture.database,
      {
        operation: "conversion",
        sourceWalletId: input.sourceWalletId,
        amount: input.amount,
        targetCurrency: input.targetCurrency,
      },
      { client, now: () => NOW },
    );
    const key = randomUUID(),
      body = { ...input, quoteId: quote.quoteId };
    const first = await POST(request(body, key));
    expect(first.status).toBe(200);
    expect(first.headers.get("Idempotency-Replayed")).toBe("false");
    expect(first.headers.get("cache-control")).toBe("no-store");
    const receipt = await first.json();
    jest.spyOn(Date, "now").mockReturnValue(NOW + 120000);
    const replay = await POST(request(body, key));
    expect(replay.status).toBe(200);
    expect(replay.headers.get("Idempotency-Replayed")).toBe("true");
    expect(await replay.json()).toEqual(receipt);
    expect((await POST(request({ ...body, amount: "2.00" }, key))).status).toBe(
      409,
    );
  });
  it.each([
    "{",
    "x".repeat(16385),
    { ...input, rate: "2" },
    { ...input, quoteId: "bad" },
    { ...input, amount: 1 },
  ])("rejects malformed/override input before storage", async (value) => {
    const response = await POST(request(value));
    expect(response.status).toBe(400);
    expect(getRuntimeDatabase).not.toHaveBeenCalled();
  });
  it.each<Record<string, string>>([
    { Origin: "https://evil.test" },
    { "Content-Type": "text/plain" },
    { "Sec-Fetch-Site": "cross-site" },
  ])("rejects non-local JSON writes before storage: %j", async (headers) => {
    expect((await POST(request(input, randomUUID(), headers))).status).toBe(
      400,
    );
    expect(getRuntimeDatabase).not.toHaveBeenCalled();
  });
  it("records/replays missing quote failures outside completed history", async () => {
    const key = randomUUID(),
      first = await POST(request(input, key));
    expect(first.status).toBe(404);
    const body = await first.json();
    expect(body).toMatchObject({ code: "QUOTE_NOT_FOUND", definitive: true });
    const replay = await POST(request(input, key));
    expect(replay.headers.get("Idempotency-Replayed")).toBe("true");
    expect(await replay.json()).toEqual(body);
    expect(
      fixture.database.sqlite
        .prepare("SELECT id FROM transactions WHERE type='conversion'")
        .all(),
    ).toEqual([]);
  });
  it("redacts unconfirmed storage errors and preserves the original key", async () => {
    jest.mocked(getRuntimeDatabase).mockImplementation(() => {
      throw new Error("private /app/data");
    });
    const key = randomUUID(),
      response = await POST(request(input, key));
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body).toMatchObject({
      definitive: false,
      requestKey: key,
      code: "CONVERSION_OUTCOME_UNKNOWN",
    });
    expect(JSON.stringify(body)).not.toMatch(/private|\/app/);
  });
});
