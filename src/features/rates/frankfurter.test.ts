import { createFrankfurterClient } from "./frankfurter";
import { parseCatalog, cacheEligible, parseRateCsv } from "./validation";
import { FX_CACHE_LIFETIME_MS } from "./contracts";

jest.mock("server-only", () => ({}));
const NOW = Date.parse("2026-11-12T12:00:00.000Z");
const catalog = [
  { iso_code: "USD", name: "US Dollar", type: "currency" },
  { iso_code: "EUR", name: "Euro", type: "currency" },
  { iso_code: "JPY", name: "Yen", type: "currency" },
  { iso_code: "BTC", name: "Bitcoin", type: "crypto" },
  { iso_code: "XAU", name: "Gold", type: "metal" },
  { iso_code: "XDR", name: "Special Drawing Rights", type: "currency" },
  { iso_code: "CLF", name: "Indexed accounting unit", type: "currency" },
  { iso_code: "ZZZ", name: "Unknown precision", type: "currency" },
];
const csv = (rate = "0.893930000000000000000000000000000001") =>
  `date,base,quote,rate\n2026-11-11,USD,EUR,${rate}\n`;

describe("Frankfurter exact reference adapter", () => {
  it("filters to eligible fiat and pinned accounting precision, without seeding wallets", async () => {
    const fetcher = jest.fn().mockResolvedValue(
      new Response(JSON.stringify(catalog), {
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }),
    );
    const result = await createFrankfurterClient({
      fetcher,
      now: () => NOW,
    }).catalog();
    expect(result).toEqual({
      fetchedAt: "2026-11-12T12:00:00.000Z",
      currencies: [
        { code: "EUR", name: "Euro", exponent: 2 },
        { code: "JPY", name: "Yen", exponent: 0 },
        { code: "USD", name: "US Dollar", exponent: 2 },
      ],
    });
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.frankfurter.dev/v2/currencies",
      expect.objectContaining({
        cache: "no-store",
        redirect: "error",
        headers: { Accept: "application/json" },
      }),
    );
  });

  it("preserves original decimal lexemes rather than parsing rates as JSON numbers", async () => {
    const text = "0.893930000000000000000000000000000001";
    const fetcher = jest
      .fn()
      .mockResolvedValue(
        new Response(csv(text), { headers: { "Content-Type": "text/csv" } }),
      );
    expect(
      await createFrankfurterClient({ fetcher, now: () => NOW }).rate(
        "USD",
        "EUR",
      ),
    ).toEqual({
      rate: text,
      date: "2026-11-11",
      fetchedAt: "2026-11-12T12:00:00.000Z",
    });
    expect(fetcher.mock.calls[0]![0]).toBe(
      "https://api.frankfurter.dev/v2/rates.csv?base=USD&quotes=EUR",
    );
  });

  it.each([
    "0",
    "-1",
    "1e-6",
    "1.0\n",
    '"1.23"',
    "01.2",
    `1.${"1".repeat(37)}`,
    "1".repeat(37),
  ])("rejects unsupported rate text %j", async (rate) => {
    const fetcher = jest
      .fn()
      .mockResolvedValue(
        new Response(csv(rate), { headers: { "Content-Type": "text/csv" } }),
      );
    await expect(
      createFrankfurterClient({ fetcher, now: () => NOW }).rate("USD", "EUR"),
    ).rejects.toThrow();
  });

  it.each([
    "date,base,quote,rate\n2026-11-11,EUR,USD,1\n",
    "date,base,quote,rate\n2026-11-11,USD,GBP,1\n",
    "date,base,quote,rate\n2026-02-30,USD,EUR,1\n",
    "date,base,quote,rate\n2026-11-13,USD,EUR,1\n",
    "date,base,quote,rate\n2026-11-11,USD,EUR,1\n2026-11-11,USD,GBP,1\n",
    "date,base,quote,rate\n",
    "other,header\n1,2\n",
  ])("refuses malformed, missing, future or unexpected pairs: %s", (text) => {
    expect(() =>
      parseRateCsv(text, "USD", "EUR", new Date(NOW).toISOString()),
    ).toThrow();
  });

  it("accepts documented CRLF and a source date older than fetch day", () => {
    expect(
      parseRateCsv(
        csv("1.2300").replaceAll("\n", "\r\n"),
        "USD",
        "EUR",
        new Date(NOW).toISOString(),
      ),
    ).toEqual({ rate: "1.2300", date: "2026-11-11" });
  });

  it.each([
    null,
    {},
    [],
    [catalog[0], catalog[0]],
    [{ iso_code: "USD", name: "", type: "currency" }],
    [{ iso_code: "USD", name: "Dollar", type: "surprise" }],
    [{ iso_code: "BTC", name: "Bitcoin", type: "crypto" }],
  ])(
    "rejects invalid catalog rather than fabricating an eligible list: %j",
    (data) => {
      expect(() => parseCatalog(data)).toThrow();
    },
  );

  it.each([404, 429, 500])("rejects upstream status %s", async (status) => {
    const fetcher = jest.fn().mockResolvedValue(
      new Response("{}", {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await expect(
      createFrankfurterClient({ fetcher }).catalog(),
    ).rejects.toThrow();
  });

  it("bounds bodies without trusting Content-Length and rejects wrong media type", async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(
        new Response("x".repeat(8193), {
          headers: { "Content-Type": "text/csv" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(csv(), {
          headers: { "Content-Type": "application/json" },
        }),
      );
    const client = createFrankfurterClient({ fetcher });
    await expect(client.rate("USD", "EUR")).rejects.toThrow("Oversized");
    await expect(client.rate("USD", "EUR")).rejects.toThrow("media type");
  });

  it("times out a pending upstream request without automatic retries", async () => {
    jest.useFakeTimers();
    try {
      const fetcher = jest.fn(
        (_url, options) =>
          new Promise<Response>((_resolve, reject) =>
            options?.signal?.addEventListener("abort", () =>
              reject(new Error("aborted")),
            ),
          ),
      );
      const pending = createFrankfurterClient({
        fetcher,
        timeoutMs: 10,
      }).catalog();
      const rejection = expect(pending).rejects.toThrow("aborted");
      await jest.advanceTimersByTimeAsync(10);
      await rejection;
      expect(fetcher).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it.each(["usd", "USD\n", "BTC", "XAU", "CLF", "ZZZ", "__proto__"])(
    "rejects ineligible code %j before network access",
    async (base) => {
      const fetcher = jest.fn();
      await expect(
        createFrankfurterClient({ fetcher }).rate(base, "EUR"),
      ).rejects.toThrow();
      expect(fetcher).not.toHaveBeenCalled();
    },
  );

  it("rejects an identity pair instead of inventing a fetched observation", async () => {
    await expect(
      createFrankfurterClient({ fetcher: jest.fn() }).rate("USD", "USD"),
    ).rejects.toThrow("Distinct");
  });

  it.each([
    [NOW, true],
    [NOW - FX_CACHE_LIFETIME_MS + 1, true],
    [NOW - FX_CACHE_LIFETIME_MS, false],
    [NOW - FX_CACHE_LIFETIME_MS - 1, false],
    [NOW + 1, false],
  ])("evaluates exact 24-hour and future boundary %s", (fetched, eligible) => {
    expect(cacheEligible(new Date(fetched).toISOString(), NOW)).toBe(eligible);
  });
  it.each([
    null,
    "not-a-time",
    "2026",
    "2026-11-12",
    "2026-02-30T00:00:00.000Z",
    "1960-01-01T00:00:00.000Z",
  ])("rejects malformed cached timestamp %j", (value) => {
    expect(cacheEligible(value, NOW)).toBe(false);
  });
});
