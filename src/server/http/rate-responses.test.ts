import { GET as currencies } from "@/app/api/currencies/route";
import { GET as rates } from "@/app/api/rates/route";
import { createJournalFixture } from "../db/test-fixture";
import { getRuntimeDatabase } from "../db/runtime";

jest.mock("server-only", () => ({}));
jest.mock("../db/runtime", () => ({ getRuntimeDatabase: jest.fn() }));
const NOW = Date.parse("2026-11-12T12:00:00.000Z");
describe("reference-data HTTP boundary", () => {
  let fixture: ReturnType<typeof createJournalFixture>;
  let network: jest.SpyInstance;
  beforeEach(() => {
    fixture = createJournalFixture();
    jest.mocked(getRuntimeDatabase).mockReturnValue(fixture.database);
    jest.spyOn(Date, "now").mockReturnValue(NOW);
    network = jest
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (url) => {
        if (String(url).endsWith("/currencies"))
          return new Response(
            JSON.stringify([
              { iso_code: "USD", name: "US Dollar", type: "currency" },
              { iso_code: "EUR", name: "Euro", type: "currency" },
            ]),
            { headers: { "Content-Type": "application/json" } },
          );
        return new Response(
          "date,base,quote,rate\n2026-11-11,USD,EUR,0.893930000000000000000000000000000001\n",
          { headers: { "Content-Type": "text/csv" } },
        );
      });
  });
  afterEach(() => fixture.cleanup());

  it("returns documented fresh catalog and exact string rates without cached HTTP responses", async () => {
    const list = await currencies();
    expect(list.status).toBe(200);
    expect(list.headers.get("cache-control")).toBe("no-store");
    expect(await list.json()).toMatchObject({
      provider: "frankfurter",
      source: "fresh",
      currencies: [
        { code: "EUR", exponent: 2 },
        { code: "USD", exponent: 2 },
      ],
    });
    const response = await rates(
      new Request("http://localhost/api/rates?base=USD&quote=EUR"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({
      base: "USD",
      quote: "EUR",
      rate: "0.893930000000000000000000000000000001",
      date: "2026-11-11",
      fetchedAt: new Date(NOW).toISOString(),
      source: "fresh",
    });
  });

  it("tries fresh first on each HTTP request, then labels fallback without changing fetch age", async () => {
    const first = await (
      await rates(new Request("http://localhost/api/rates?base=USD&quote=EUR"))
    ).json();
    network.mockRejectedValue(new Error("private upstream internals"));
    const fallback = await rates(
      new Request("http://localhost/api/rates?base=USD&quote=EUR"),
    );
    expect(fallback.status).toBe(200);
    expect(await fallback.json()).toEqual({ ...first, source: "cached" });
    expect(network).toHaveBeenCalledTimes(4);
  });

  it.each([
    "",
    "?base=USD",
    "?base=usd&quote=EUR",
    "?base=USD&quote=USD",
    "?base=BTC&quote=USD",
    "?base=USD&quote=EUR&provider=other",
    "?base=USD&base=GBP&quote=EUR",
  ])(
    "rejects invalid query %s before database/network access",
    async (query) => {
      const response = await rates(
        new Request(`http://localhost/api/rates${query}`),
      );
      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toBe(
        "application/problem+json",
      );
      expect(getRuntimeDatabase).not.toHaveBeenCalled();
      expect(network).not.toHaveBeenCalled();
    },
  );

  it("returns safe 503 on outage without eligible data and never fabricates a rate", async () => {
    network.mockRejectedValue(new Error("private upstream URL /secret"));
    const response = await rates(
      new Request("http://localhost/api/rates?base=USD&quote=EUR"),
    );
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const text = await response.text();
    expect(text).toContain("FX_RATE_UNAVAILABLE");
    expect(text).not.toMatch(/private|secret|"rate":/);
    const missing = await currencies();
    expect(missing.status).toBe(503);
    expect(await missing.json()).toMatchObject({
      code: "CURRENCY_CATALOG_UNAVAILABLE",
    });
  });

  it("redacts unexpected storage failures", async () => {
    jest.mocked(getRuntimeDatabase).mockImplementation(() => {
      throw new Error("secret database path");
    });
    const response = await currencies();
    expect(response.status).toBe(503);
    expect(await response.text()).not.toMatch(/secret|path/);
  });
});
