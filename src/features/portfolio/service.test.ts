import { randomUUID } from "node:crypto";
import { createJournalFixture } from "../../server/db/test-fixture";
import { openDatabase } from "../../server/db/connection";
import { submitFunding } from "../funding/service";
import { withJournalWrite } from "../journal/write";
import {
  capturePortfolio,
  getPortfolioView,
  readPortfolioSeries,
  valuePortfolio,
} from "./service";
import { confirmedPortfolio } from "./preview";

jest.mock("server-only", () => ({}));
const NOW = Date.parse("2026-11-12T12:00:00.000Z");
describe("recorded USD portfolio observations", () => {
  let f: ReturnType<typeof createJournalFixture>, clock: number;
  const client = { catalog: jest.fn(), rate: jest.fn() };
  const deps = () => ({ client, now: () => clock });
  const fund = (
    walletId: string,
    amount: string,
    kind: "deposit" | "withdrawal" = "deposit",
  ) =>
    submitFunding(f.database, kind, randomUUID(), {
      walletId,
      amount,
      provider: "demo_bank",
    });
  beforeEach(() => {
    f = createJournalFixture();
    clock = NOW;
    client.catalog.mockReset().mockImplementation(async () => ({
      currencies: [
        { code: "USD", name: "Dollar", exponent: 2 },
        { code: "GBP", name: "Pound", exponent: 2 },
        { code: "JPY", name: "Yen", exponent: 0 },
      ],
      fetchedAt: new Date(clock).toISOString(),
    }));
    client.rate.mockReset().mockImplementation(async () => ({
      rate: "1.25",
      date: "2026-11-11",
      fetchedAt: new Date(clock).toISOString(),
    }));
  });
  afterEach(() => f.cleanup());
  it("records an actual zero baseline without requesting rates for zero foreign wallets", async () => {
    const view = await getPortfolioView(f.database, "main", deps());
    expect(view.total).toEqual({
      status: "available",
      balanceMinor: "0",
      source: "balances",
      rates: [],
    });
    expect(view.history.points).toEqual([
      { recordedAt: new Date(NOW).toISOString(), balanceMinor: "0" },
    ]);
    expect(client.catalog).not.toHaveBeenCalled();
    expect(client.rate).not.toHaveBeenCalled();
  });
  it("adds exact USD equivalents, using one catalog and the requested foreign→USD pair", async () => {
    fund("main-usd", "10.00");
    fund("main-gbp", "2.00");
    const view = await getPortfolioView(f.database, "main", deps());
    expect(view.total).toMatchObject({
      status: "available",
      balanceMinor: "1250",
      source: "fresh",
    });
    expect(client.catalog).toHaveBeenCalledTimes(1);
    expect(client.rate).toHaveBeenCalledWith("GBP", "USD");
    expect(confirmedPortfolio(view, "main", view.balances)).toEqual(view);
  });
  it("records new committed balance revisions after deposits and withdrawals, not reloads or replay", async () => {
    await getPortfolioView(f.database, "main", deps());
    clock++;
    const key = randomUUID(),
      input = { walletId: "main-usd", amount: "10.00", provider: "demo_bank" };
    const original = submitFunding(f.database, "deposit", key, input);
    await getPortfolioView(f.database, "main", deps());
    clock++;
    expect(submitFunding(f.database, "deposit", key, input)).toEqual({
      ...original,
      replayed: true,
    });
    await getPortfolioView(f.database, "main", deps());
    clock++;
    fund("main-usd", "1.00", "withdrawal");
    const last = await getPortfolioView(f.database, "main", deps());
    expect(last.history.points.map((p) => p.balanceMinor)).toEqual([
      "0",
      "1000",
      "900",
    ]);
    expect(
      f.database.sqlite
        .prepare("SELECT COUNT(*) n FROM portfolio_snapshots")
        .get(),
    ).toEqual({ n: 3n });
  });
  it("keeps snapshots immutable when current reference rates subsequently change", async () => {
    fund("main-gbp", "2.00");
    await getPortfolioView(f.database, "main", deps());
    clock++;
    client.rate.mockResolvedValue({
      rate: "2",
      date: "2026-11-11",
      fetchedAt: new Date(clock).toISOString(),
    });
    const view = await getPortfolioView(f.database, "main", deps());
    expect(view.total).toMatchObject({ balanceMinor: "400" });
    expect(view.history.points[0]!.balanceMinor).toBe("250");
    expect(() =>
      f.database.sqlite
        .prepare("UPDATE portfolio_snapshots SET total_usd_minor=1")
        .run(),
    ).toThrow(/immutable/iu);
    expect(() =>
      f.database.sqlite.prepare("DELETE FROM portfolio_snapshots").run(),
    ).toThrow(/immutable/iu);
  });
  it("does not invent past totals from existing transaction times or current rates", async () => {
    fund("main-usd", "12.00");
    expect(readPortfolioSeries(f.database, "main").points).toEqual([]);
    const view = await getPortfolioView(f.database, "main", deps());
    expect(view.history.points).toEqual([
      { recordedAt: new Date(NOW).toISOString(), balanceMinor: "1200" },
    ]);
  });
  it("values inspect-only destinations independently and never mixes main balances", async () => {
    fund("main-usd", "10.00");
    withJournalWrite(f.database, (s) =>
      s.record({
        id: randomUUID(),
        type: "transfer",
        sourceWalletId: "main-usd",
        targetWalletId: "recipient-usd",
        amountMinor: 200n,
      }),
    );
    const view = await getPortfolioView(f.database, "recipient", deps());
    expect(view.total).toMatchObject({
      balanceMinor: "200",
      source: "balances",
    });
    expect(view.balances.every((w) => w.accountId === "recipient")).toBe(true);
    expect(readPortfolioSeries(f.database, "main").points).toEqual([]);
  });
  it("rounds each foreign wallet half-up using its actual exponent before summing", async () => {
    withJournalWrite(f.database, (s) =>
      s.createWallet({ id: "jpy", accountId: "main", currencyCode: "JPY" }),
    );
    fund("jpy", "3");
    client.rate.mockResolvedValue({
      rate: "0.005",
      date: "2026-11-11",
      fetchedAt: new Date(clock).toISOString(),
    });
    expect(
      (await getPortfolioView(f.database, "main", deps())).total,
    ).toMatchObject({ balanceMinor: "2" });
  });
  it.each(["0.0049", "0.005"])(
    "values a small nonzero foreign balance with rate %s, including a zero-cent contribution",
    async (rate) => {
      withJournalWrite(f.database, (s) =>
        s.createWallet({ id: "jpy", accountId: "main", currencyCode: "JPY" }),
      );
      fund("jpy", "1");
      client.rate.mockResolvedValue({
        rate,
        date: "2026-11-11",
        fetchedAt: new Date(clock).toISOString(),
      });
      const view = await getPortfolioView(f.database, "main", deps());
      expect(view.total).toMatchObject({
        status: "available",
        balanceMinor: rate === "0.005" ? "1" : "0",
        source: "fresh",
      });
      expect(view.history.points[0]!.balanceMinor).toBe(
        rate === "0.005" ? "1" : "0",
      );
      expect(confirmedPortfolio(view, "main", view.balances)).toEqual(view);
      expect(client.rate).toHaveBeenCalledWith("JPY", "USD");
    },
  );
  it("makes the entire total unavailable for a missing rate, without dropping balances or recording a point", async () => {
    fund("main-usd", "10.00");
    fund("main-gbp", "2.00");
    client.rate.mockRejectedValue(new Error("offline"));
    const view = await getPortfolioView(f.database, "main", deps());
    expect(view.total).toEqual({ status: "unavailable" });
    expect(view.balances.map((w) => w.balanceMinor).sort()).toEqual([
      "1000",
      "200",
    ]);
    expect(view.history.points).toEqual([]);
  });
  it("tries fresh first, labels eligible cached data, and rejects the exact 24-hour boundary", async () => {
    fund("main-gbp", "2.00");
    await getPortfolioView(f.database, "main", deps());
    client.catalog.mockRejectedValue(new Error("offline"));
    client.rate.mockRejectedValue(new Error("offline"));
    clock = NOW + 86400000 - 1;
    expect(
      (await getPortfolioView(f.database, "main", deps())).total,
    ).toMatchObject({ source: "cached", balanceMinor: "250" });
    clock++;
    expect((await getPortfolioView(f.database, "main", deps())).total).toEqual({
      status: "unavailable",
    });
    expect(client.catalog).toHaveBeenCalledTimes(3);
  });
  it("never synthesizes a reciprocal from the cached USD→GBP pair", async () => {
    fund("main-gbp", "2.00");
    f.database.sqlite
      .prepare(
        "INSERT INTO fx_rate_cache(base,quote,rate,source_date,fetched_at) VALUES ('USD','GBP','0.8','2026-11-11',?)",
      )
      .run(new Date(clock).toISOString());
    client.rate.mockRejectedValue(new Error("no pair"));
    expect(
      (await getPortfolioView(f.database, "main", deps())).total.status,
    ).toBe("unavailable");
  });
  it("rejects overflowing aggregate totals without changing any wallet", async () => {
    fund("main-usd", "92233720368547758.07");
    fund("main-gbp", "1.00");
    const view = await getPortfolioView(f.database, "main", deps());
    expect(view.total.status).toBe("unavailable");
    expect(view.balances.find((w) => w.currency === "USD")!.balanceMinor).toBe(
      "9223372036854775807",
    );
    expect(view.history.points).toHaveLength(0);
  });
  it("does not display a stale current total when the ledger changes during FX work", async () => {
    fund("main-gbp", "2.00");
    client.rate.mockImplementationOnce(async () => {
      fund("main-gbp", "1.00");
      return {
        rate: "1.25",
        date: "2026-11-11",
        fetchedAt: new Date(clock).toISOString(),
      };
    });
    expect(
      (await getPortfolioView(f.database, "main", deps())).total.status,
    ).toBe("unavailable");
    expect(
      (await getPortfolioView(f.database, "main", deps())).total,
    ).toMatchObject({ balanceMinor: "375" });
  });
  it("retains the observed balance rather than reading changed wallets after yielding", async () => {
    fund("main-usd", "10.00");
    const observation = capturePortfolio(f.database, "main", () => clock);
    fund("main-usd", "5.00");
    expect(await valuePortfolio(f.database, observation, deps())).toMatchObject(
      { balanceMinor: "1000" },
    );
  });
  it("preserves confirmed monetary results even when snapshot storage is unavailable", async () => {
    f.database.sqlite.exec(
      "CREATE TRIGGER broken_snapshot BEFORE INSERT ON portfolio_snapshots BEGIN SELECT RAISE(ABORT,'broken'); END;",
    );
    const result = fund("main-usd", "10.00");
    expect(result.status).toBe(200);
    expect(
      (await getPortfolioView(f.database, "main", deps())).total.status,
    ).toBe("unavailable");
    expect(
      f.database.sqlite.prepare("SELECT COUNT(*) n FROM transactions").get(),
    ).toEqual({ n: 1n });
  });
  it("persists historical totals across a new database connection", async () => {
    fund("main-usd", "10.00");
    await getPortfolioView(f.database, "main", deps());
    const reopened = openDatabase(f.filename);
    try {
      expect(
        readPortfolioSeries(reopened, "main").points[0]!.balanceMinor,
      ).toBe("1000");
    } finally {
      reopened.close();
    }
  });
  it("coalesces same-millisecond observations by committed revision, not asynchronous arrival order", async () => {
    fund("main-usd", "10.00");
    const older = capturePortfolio(f.database, "main", () => clock);
    fund("main-usd", "1.00");
    const newer = capturePortfolio(f.database, "main", () => clock);
    await valuePortfolio(f.database, newer, deps());
    await valuePortfolio(f.database, older, deps());
    expect(readPortfolioSeries(f.database, "main").points).toEqual([
      { recordedAt: new Date(clock).toISOString(), balanceMinor: "1100" },
    ]);
  });
  it("bounds the rendered series to 240 actual records, coalescing same-millisecond observations", () => {
    const insert = f.database.sqlite.prepare(
      "INSERT INTO portfolio_snapshots VALUES (?,?,?,?,?,?,?)",
    );
    for (let i = 0; i < 245; i++)
      insert.run(
        "main",
        String(i),
        new Date(NOW + i).toISOString(),
        new Date(NOW + i).toISOString(),
        BigInt(i),
        "[]",
        "[]",
      );
    const series = readPortfolioSeries(f.database, "main");
    expect(series.points).toHaveLength(240);
    expect(series.points[0]!.balanceMinor).toBe("5");
  });
  it.each(["account", "total", "time", "historyAccount", "rate", "count"])(
    "fails closed on mismatched client response: %s",
    async (field) => {
      fund("main-gbp", "2.00");
      const view = await getPortfolioView(f.database, "main", deps());
      const changed = JSON.parse(JSON.stringify(view));
      if (field === "account") changed.accountId = "recipient";
      if (field === "total") changed.total.balanceMinor = "251";
      if (field === "time") changed.observedAt = "invalid";
      if (field === "historyAccount") changed.history.accountId = "recipient";
      if (field === "rate") changed.total.rates[0].rate = "2";
      if (field === "count") changed.balances.pop();
      expect(() =>
        confirmedPortfolio(changed, "main", view.balances),
      ).toThrow();
    },
  );
});
