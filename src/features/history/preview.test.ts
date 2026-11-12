import { createHistoryFixture } from "./test-fixture";
import { listTransactionHistory, readTransactionHistory } from "./read";
import { confirmedHistoryPage, confirmedHistoryDetail } from "./preview";
import {
  listAccountingCurrencies,
  getCurrencyExponent,
} from "../money/currency-precision";
import type { HistoryQuery } from "./contracts";

jest.mock("server-only", () => ({}));
describe("full-history client response validation", () => {
  let fixture: ReturnType<typeof createHistoryFixture>;
  beforeEach(() => {
    fixture = createHistoryFixture();
  });
  afterEach(() => fixture.cleanup());
  const query: HistoryQuery = { accountId: "main", page: 1, pageSize: 3 };
  const page = (q: HistoryQuery = query) =>
    listTransactionHistory(fixture.database, q);
  it("accepts exact numbered pages, page boundaries and max-safe beyond-end pages", () => {
    for (const q of [
      query,
      { ...query, page: 3 },
      { ...query, page: 4 },
      { ...query, page: Number.MAX_SAFE_INTEGER, pageSize: 100 },
    ])
      expect(confirmedHistoryPage(page(q), q)).toEqual(page(q));
  });
  it("binds an exact-ID list response and rejects a different ID or impossible count", () => {
    const q = { ...query, transactionId: "deposit-old" };
    const value = page(q);
    expect(confirmedHistoryPage(value, q)).toEqual(value);
    expect(() =>
      confirmedHistoryPage(value, { ...q, transactionId: "another" }),
    ).toThrow();
    expect(() =>
      confirmedHistoryPage(
        {
          ...value,
          pagination: { ...value.pagination, totalItems: 2, totalPages: 1 },
        },
        q,
      ),
    ).toThrow();
  });
  it.each(["deposit", "withdrawal", "conversion", "transfer"] as const)(
    "accepts stored %s details in their explicit account",
    (type) => {
      const q = { ...query, type, pageSize: 50 };
      const result = page(q);
      expect(confirmedHistoryPage(result, q)).toEqual(result);
      for (const t of result.transactions) {
        const detail = readTransactionHistory(
          fixture.database,
          "main",
          t.transactionId,
        );
        expect(confirmedHistoryDetail(detail, "main", t.transactionId)).toEqual(
          detail,
        );
      }
    },
  );
  it("validates either affected currency, inclusive days and incoming transfer details", () => {
    for (const currency of ["USD", "GBP"]) {
      const q = {
        ...query,
        type: "transfer" as const,
        currency,
        from: "2026-11-12",
        to: "2026-11-12",
      };
      expect(confirmedHistoryPage(page(q), q)).toEqual(page(q));
    }
    const d = readTransactionHistory(
      fixture.database,
      "recipient",
      "transfer-tie-z",
    );
    expect(
      confirmedHistoryDetail(d, "recipient", "transfer-tie-z").transaction
        .direction,
    ).toBe("incoming");
  });
  it.each([
    "account",
    "page",
    "pageSize",
    "total",
    "pages",
    "count",
    "duplicate",
    "order",
    "currency",
    "date",
    "type",
  ])("fails closed on changed page/filter %s", (field) => {
    const value = JSON.parse(JSON.stringify(page()));
    let q = query;
    if (field === "account") value.account.id = "other";
    if (field === "page") value.pagination.page = 2;
    if (field === "pageSize") value.pagination.pageSize = 2;
    if (field === "total")
      value.pagination.totalItems = Number.MAX_SAFE_INTEGER + 1;
    if (field === "pages") value.pagination.totalPages = 999;
    if (field === "count") value.transactions.pop();
    if (field === "duplicate") value.transactions[1] = value.transactions[0];
    if (field === "order") value.transactions.reverse();
    if (field === "currency") q = { ...q, currency: "JPY" };
    if (field === "date") q = { ...q, to: "2026-11-11" };
    if (field === "type") q = { ...q, type: "deposit" };
    expect(() => confirmedHistoryPage(value, q)).toThrow();
  });
  it.each(["id", "account", "side", "rate", "amount", "timestamp"])(
    "never substitutes mismatched detail facts: %s",
    (field) => {
      const d = JSON.parse(
        JSON.stringify(
          readTransactionHistory(
            fixture.database,
            "recipient",
            "transfer-tie-z",
          ),
        ),
      );
      if (field === "id") d.transaction.transactionId = "other";
      if (field === "account") d.account.id = "main";
      if (field === "side") d.transaction.target.accountId = "unrelated";
      if (field === "rate") d.transaction.rate.value = "999";
      if (field === "amount") d.transaction.target.amount = "0.81";
      if (field === "timestamp") d.transaction.createdAt = "invalid";
      expect(() =>
        confirmedHistoryDetail(d, "recipient", "transfer-tie-z"),
      ).toThrow();
    },
  );
  it("does not mistake UTF-16 surrogate order for SQLite UTF-8 ID ties", () => {
    for (const id of ["\uE000", "🌍"]) {
      fixture.add({
        id,
        type: "deposit",
        createdAt: "2026-11-15T00:00:00.000Z",
        targetWalletId: "main-usd",
        credit: 1n,
        provider: "demo_bank",
      });
    }
    const value = page();
    expect(value.transactions.slice(0, 2).map((t) => t.transactionId)).toEqual([
      "🌍",
      "\uE000",
    ]);
    expect(confirmedHistoryPage(value, query)).toEqual(value);
  });
  it("lists pinned historical accounting codes without a provider request or mutable registry", () => {
    const codes = listAccountingCurrencies();
    expect(codes).toEqual([...codes].sort());
    expect(codes).toEqual(expect.arrayContaining(["USD", "JPY", "BHD", "CLF"]));
    expect(codes).not.toContain("XAU");
    codes.length = 0;
    expect(listAccountingCurrencies()).toContain("CLF");
    expect(getCurrencyExponent("CLF")).toBe(4);
  });
});
