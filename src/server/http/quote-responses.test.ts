import { randomUUID } from "node:crypto";
import { POST } from "@/app/api/quotes/route";
import { GET } from "@/app/api/quotes/[quoteId]/route";
import { createJournalFixture } from "../db/test-fixture";
import { getRuntimeDatabase } from "../db/runtime";
import { withJournalWrite } from "@/features/journal/write";

jest.mock("server-only", () => ({}));
jest.mock("../db/runtime", () => ({ getRuntimeDatabase: jest.fn() }));
const NOW = Date.parse("2026-11-12T12:00:00.000Z");
const input = {
  operation: "conversion",
  sourceWalletId: "main-usd",
  amount: "10.00",
  targetCurrency: "GBP",
};
describe("quote HTTP preview and immutable readback", () => {
  let fixture: ReturnType<typeof createJournalFixture>;
  let network: jest.SpyInstance;
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
    network = jest.spyOn(globalThis, "fetch").mockImplementation(async (url) =>
      String(url).endsWith("/currencies")
        ? new Response(
            JSON.stringify([
              { iso_code: "USD", name: "Dollar", type: "currency" },
              { iso_code: "GBP", name: "Pound", type: "currency" },
            ]),
            { headers: { "Content-Type": "application/json" } },
          )
        : new Response("date,base,quote,rate\n2026-11-11,USD,GBP,1.005\n", {
            headers: { "Content-Type": "text/csv" },
          }),
    );
  });
  afterEach(() => fixture.cleanup());
  const request = (
    data = JSON.stringify(input),
    headers: Record<string, string> = {},
  ) =>
    new Request("http://localhost:3000/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: data,
    });
  const read = (quoteId: string) =>
    GET(new Request("http://localhost:3000/api/quotes/example"), {
      params: Promise.resolve({ quoteId }),
    });

  it("returns the exact server terms without needing a money key or moving funds", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body).toMatchObject({
      state: "active",
      quote: {
        source: { amountMinor: "1000" },
        target: { amountMinor: "1005" },
        rate: { value: "1.005", date: "2026-11-11" },
        expiresAt: new Date(NOW + 60000).toISOString(),
      },
    });
    const calls = network.mock.calls.length;
    expect(await (await read(body.quote.quoteId)).json()).toEqual(body);
    expect(network).toHaveBeenCalledTimes(calls);
    jest.spyOn(Date, "now").mockReturnValue(NOW + 60000);
    expect(await (await read(body.quote.quoteId)).json()).toMatchObject({
      state: "expired",
      quote: body.quote,
    });
    expect(
      fixture.database.sqlite
        .prepare("SELECT COUNT(*) AS n FROM transactions")
        .get(),
    ).toEqual({ n: 1n });
  });

  it.each([
    ["{", {}],
    ["x".repeat(16385), {}],
    [JSON.stringify({ ...input, rate: "2" }), {}],
    [JSON.stringify(input), { Origin: "http://evil.test" }],
    [JSON.stringify(input), { "Content-Type": "text/plain" }],
  ] as Array<[string, Record<string, string>]>)(
    "rejects malformed/foreign input before database access",
    async (data, headers) => {
      const response = await POST(request(data, headers));
      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toBe(
        "application/problem+json",
      );
      expect(getRuntimeDatabase).not.toHaveBeenCalled();
      expect(network).not.toHaveBeenCalled();
    },
  );

  it("rejects invalid IDs before database access and returns safe 404 for unknown quotes", async () => {
    expect((await read("bad")).status).toBe(400);
    expect(getRuntimeDatabase).not.toHaveBeenCalled();
    const missing = await read(randomUUID());
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({ code: "QUOTE_NOT_FOUND" });
  });

  it("redacts unexpected storage failures without claiming a monetary outcome", async () => {
    jest.mocked(getRuntimeDatabase).mockImplementation(() => {
      throw new Error("private /app/data");
    });
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toMatch(/private|\/app/);
  });

  it("returns unavailable without fabricating terms when no eligible rate exists", async () => {
    network.mockRejectedValue(new Error("private upstream"));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      code: "QUOTE_RATE_UNAVAILABLE",
    });
    expect(
      fixture.database.sqlite.prepare("SELECT id FROM fx_quotes").all(),
    ).toEqual([]);
  });
});
