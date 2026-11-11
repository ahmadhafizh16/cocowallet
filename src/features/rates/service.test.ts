import { createJournalFixture } from "../../server/db/test-fixture";
import { openDatabase } from "../../server/db/connection";
import { FX_CACHE_LIFETIME_MS } from "./contracts";
import type { FrankfurterClient } from "./frankfurter";
import { getCurrencyCatalog, getReferenceRate } from "./service";

jest.mock("server-only", () => ({}));
const NOW = Date.parse("2026-11-12T12:00:00.000Z");
const currencies = [
  { code: "USD", name: "US Dollar", exponent: 2 },
  { code: "EUR", name: "Euro", exponent: 2 },
  { code: "GBP", name: "Pound", exponent: 2 },
];
describe("fresh-first persistent reference metadata", () => {
  let fixture: ReturnType<typeof createJournalFixture>;
  let clock: number;
  let client: { catalog: jest.Mock; rate: jest.Mock };
  const deps = () => ({
    client: client as FrankfurterClient,
    now: () => clock,
  });
  beforeEach(() => {
    fixture = createJournalFixture();
    clock = NOW;
    client = {
      catalog: jest.fn(async () => ({
        currencies,
        fetchedAt: new Date(clock).toISOString(),
      })),
      rate: jest.fn(async () => ({
        rate: "0.893930000000000000000000000000000001",
        date: "2026-11-11",
        fetchedAt: new Date(clock).toISOString(),
      })),
    };
  });
  afterEach(() => fixture.cleanup());

  it("requests a fresh catalog every time, then falls back only after failure", async () => {
    expect((await getCurrencyCatalog(fixture.database, deps())).source).toBe(
      "fresh",
    );
    expect((await getCurrencyCatalog(fixture.database, deps())).source).toBe(
      "fresh",
    );
    client.catalog.mockRejectedValue(new Error("offline"));
    const cached = await getCurrencyCatalog(fixture.database, deps());
    expect(cached).toMatchObject({
      source: "cached",
      fetchedAt: new Date(NOW).toISOString(),
    });
    expect(client.catalog).toHaveBeenCalledTimes(3);
    expect(cached.currencies.map((c) => c.code)).toEqual(["EUR", "GBP", "USD"]);
  });

  it("retains exact pair/rate/source/fetch dates across a new database connection", async () => {
    const first = await getReferenceRate(
      fixture.database,
      "USD",
      "EUR",
      deps(),
    );
    client.rate.mockRejectedValue(new Error("offline"));
    const other = openDatabase(fixture.filename);
    try {
      expect(await getReferenceRate(other, "USD", "EUR", deps())).toEqual({
        ...first,
        source: "cached",
      });
    } finally {
      other.close();
    }
    expect(first.date).not.toBe(first.fetchedAt.slice(0, 10));
    expect(first.rate).toBe("0.893930000000000000000000000000000001");
  });

  it("never uses reverse or unrelated cached pairs, even when both codes are listed", async () => {
    await getReferenceRate(fixture.database, "USD", "EUR", deps());
    client.rate.mockRejectedValue(new Error("pair unavailable"));
    await expect(
      getReferenceRate(fixture.database, "EUR", "USD", deps()),
    ).rejects.toMatchObject({ code: "FX_RATE_UNAVAILABLE", status: 503 });
    await expect(
      getReferenceRate(fixture.database, "USD", "GBP", deps()),
    ).rejects.toMatchObject({ code: "FX_RATE_UNAVAILABLE" });
  });

  it.each([
    FX_CACHE_LIFETIME_MS - 1,
    FX_CACHE_LIFETIME_MS,
    FX_CACHE_LIFETIME_MS + 1,
  ])("checks fallback age at resolution, boundary %s", async (age) => {
    await getReferenceRate(fixture.database, "USD", "EUR", deps());
    clock += age;
    client.rate.mockRejectedValue(new Error("down"));
    if (age < FX_CACHE_LIFETIME_MS)
      expect(
        (await getReferenceRate(fixture.database, "USD", "EUR", deps())).source,
      ).toBe("cached");
    else
      await expect(
        getReferenceRate(fixture.database, "USD", "EUR", deps()),
      ).rejects.toMatchObject({ code: "FX_RATE_UNAVAILABLE" });
  });

  it("does not refresh the age of cached data while replaying a fallback", async () => {
    const first = await getCurrencyCatalog(fixture.database, deps());
    client.catalog.mockRejectedValue(new Error("offline"));
    clock += 1000;
    expect((await getCurrencyCatalog(fixture.database, deps())).fetchedAt).toBe(
      first.fetchedAt,
    );
    clock = NOW + FX_CACHE_LIFETIME_MS;
    await expect(
      getCurrencyCatalog(fixture.database, deps()),
    ).rejects.toMatchObject({ code: "CURRENCY_CATALOG_UNAVAILABLE" });
  });

  it("can recover an eligible previously validated pair when the catalog is unavailable", async () => {
    const first = await getReferenceRate(
      fixture.database,
      "USD",
      "EUR",
      deps(),
    );
    fixture.database.sqlite.prepare("DELETE FROM fx_catalog_cache").run();
    client.catalog.mockRejectedValue(new Error("offline"));
    expect(
      await getReferenceRate(fixture.database, "USD", "EUR", deps()),
    ).toEqual({ ...first, source: "cached" });
    expect(client.rate).toHaveBeenCalledTimes(1);
    await expect(
      getCurrencyCatalog(fixture.database, deps()),
    ).rejects.toMatchObject({ code: "CURRENCY_CATALOG_UNAVAILABLE" });
  });

  it("honors fresh catalog removals instead of allowing an obsolete cached pair", async () => {
    await getReferenceRate(fixture.database, "USD", "EUR", deps());
    client.catalog.mockResolvedValue({
      currencies: currencies.filter((c) => c.code !== "EUR"),
      fetchedAt: new Date(clock).toISOString(),
    });
    await expect(
      getReferenceRate(fixture.database, "USD", "EUR", deps()),
    ).rejects.toMatchObject({ status: 400, code: "UNSUPPORTED_CURRENCY" });
  });

  it("cannot silently serve future or corrupt cache data", async () => {
    await getReferenceRate(fixture.database, "USD", "EUR", deps());
    client.rate.mockRejectedValue(new Error("down"));
    fixture.database.sqlite
      .prepare("UPDATE fx_rate_cache SET fetched_at = ?")
      .run(new Date(NOW + 1).toISOString());
    await expect(
      getReferenceRate(fixture.database, "USD", "EUR", deps()),
    ).rejects.toMatchObject({ code: "FX_RATE_UNAVAILABLE" });
    fixture.database.sqlite
      .prepare("UPDATE fx_rate_cache SET fetched_at = ?, rate='NaN'")
      .run(new Date(NOW).toISOString());
    await expect(
      getReferenceRate(fixture.database, "USD", "EUR", deps()),
    ).rejects.toMatchObject({ code: "FX_RATE_UNAVAILABLE" });
  });

  it("preserves prior valid cache when fresh data is malformed", async () => {
    const first = await getReferenceRate(
      fixture.database,
      "USD",
      "EUR",
      deps(),
    );
    client.rate.mockResolvedValue({
      rate: "1e3",
      date: "2026-11-11",
      fetchedAt: new Date(clock).toISOString(),
    });
    expect(
      await getReferenceRate(fixture.database, "USD", "EUR", deps()),
    ).toEqual({ ...first, source: "cached" });
    client.catalog.mockResolvedValue({
      currencies: [],
      fetchedAt: new Date(clock).toISOString(),
    });
    expect((await getCurrencyCatalog(fixture.database, deps())).source).toBe(
      "cached",
    );
  });

  it.each([
    "{bad",
    JSON.stringify([{ code: "BTC", name: "Crypto", exponent: 2 }]),
    JSON.stringify([{ code: "USD", name: "Dollar", exponent: 3 }]),
  ])(
    "cannot use corrupted or ineligible cached catalog %s",
    async (payload) => {
      await getCurrencyCatalog(fixture.database, deps());
      client.catalog.mockRejectedValue(new Error("down"));
      fixture.database.sqlite
        .prepare("UPDATE fx_catalog_cache SET currencies = ?")
        .run(payload);
      await expect(
        getCurrencyCatalog(fixture.database, deps()),
      ).rejects.toMatchObject({
        code: "CURRENCY_CATALOG_UNAVAILABLE",
        status: 503,
      });
    },
  );

  it("rejects future-dated catalog fallback", async () => {
    await getCurrencyCatalog(fixture.database, deps());
    client.catalog.mockRejectedValue(new Error("down"));
    fixture.database.sqlite
      .prepare("UPDATE fx_catalog_cache SET fetched_at = ?")
      .run(new Date(NOW + 1).toISOString());
    await expect(
      getCurrencyCatalog(fixture.database, deps()),
    ).rejects.toMatchObject({ code: "CURRENCY_CATALOG_UNAVAILABLE" });
  });

  it("never fetches inside a database transaction or mutates accounting rows", async () => {
    let nested!: ReturnType<typeof getReferenceRate>;
    fixture.database.sqlite.transaction(() => {
      nested = getReferenceRate(fixture.database, "USD", "EUR", deps());
    })();
    await expect(nested).rejects.toMatchObject({
      code: "FX_STORAGE_UNAVAILABLE",
    });
    expect(client.catalog).not.toHaveBeenCalled();
    const before = [
      "accounts",
      "wallets",
      "transactions",
      "journal_entries",
      "funding_attempts",
    ].map((t) => fixture.database.sqlite.prepare(`SELECT * FROM ${t}`).all());
    await getReferenceRate(fixture.database, "USD", "EUR", deps());
    const after = [
      "accounts",
      "wallets",
      "transactions",
      "journal_entries",
      "funding_attempts",
    ].map((t) => fixture.database.sqlite.prepare(`SELECT * FROM ${t}`).all());
    expect(after).toEqual(before);
  });

  it("reports storage failure without pretending the new rate was cached", async () => {
    fixture.database.sqlite.exec(
      "CREATE TRIGGER fail_catalog BEFORE INSERT ON fx_catalog_cache BEGIN SELECT RAISE(ABORT,'private file'); END;",
    );
    await expect(
      getCurrencyCatalog(fixture.database, deps()),
    ).rejects.toMatchObject({ code: "FX_STORAGE_UNAVAILABLE", status: 503 });
  });

  it("does not return a fresh rate as cached if persistence fails after catalog validation", async () => {
    const first = await getReferenceRate(
      fixture.database,
      "USD",
      "EUR",
      deps(),
    );
    fixture.database.sqlite.exec(
      "CREATE TRIGGER fail_rate BEFORE INSERT ON fx_rate_cache BEGIN SELECT RAISE(ABORT,'private'); END;",
    );
    client.rate.mockResolvedValue({
      rate: "2.5",
      date: "2026-11-12",
      fetchedAt: new Date(clock).toISOString(),
    });
    await expect(
      getReferenceRate(fixture.database, "USD", "EUR", deps()),
    ).rejects.toMatchObject({ code: "FX_STORAGE_UNAVAILABLE", status: 503 });
    expect(
      fixture.database.sqlite.prepare("SELECT rate FROM fx_rate_cache").get(),
    ).toEqual({ rate: first.rate });
  });

  it("checks cache expiry after the failed network request, not before it began", async () => {
    await getReferenceRate(fixture.database, "USD", "EUR", deps());
    clock = NOW + FX_CACHE_LIFETIME_MS - 1;
    client.rate.mockImplementation(async () => {
      clock += 2;
      throw new Error("slow failure");
    });
    await expect(
      getReferenceRate(fixture.database, "USD", "EUR", deps()),
    ).rejects.toMatchObject({ code: "FX_RATE_UNAVAILABLE" });
  });

  it("does not let an older delayed response overwrite newer cache on another connection", async () => {
    let finish!: (value: {
      rate: string;
      date: string;
      fetchedAt: string;
    }) => void;
    let reached!: () => void;
    const ready = new Promise<void>((resolve) => {
      reached = resolve;
    });
    client.rate.mockImplementation(() => {
      reached();
      return new Promise((resolve) => {
        finish = resolve;
      });
    });
    const slow = getReferenceRate(fixture.database, "USD", "EUR", deps());
    await ready;
    const other = openDatabase(fixture.filename);
    try {
      const newer = {
        catalog: async () => ({
          currencies,
          fetchedAt: new Date(NOW + 1000).toISOString(),
        }),
        rate: async () => ({
          rate: "2.5000",
          date: "2026-11-12",
          fetchedAt: new Date(NOW + 1000).toISOString(),
        }),
      };
      await getReferenceRate(other, "USD", "EUR", {
        client: newer,
        now: () => NOW + 1000,
      });
      finish({
        rate: "1.2500",
        date: "2026-11-11",
        fetchedAt: new Date(NOW).toISOString(),
      });
      await slow;
      expect(
        other.sqlite
          .prepare(
            "SELECT rate,source_date,fetched_at FROM fx_rate_cache WHERE base='USD' AND quote='EUR'",
          )
          .get(),
      ).toEqual({
        rate: "2.5000",
        source_date: "2026-11-12",
        fetched_at: new Date(NOW + 1000).toISOString(),
      });
      expect(
        other.sqlite.prepare("SELECT fetched_at FROM fx_catalog_cache").get(),
      ).toEqual({ fetched_at: new Date(NOW + 1000).toISOString() });
    } finally {
      other.close();
    }
  });
});
