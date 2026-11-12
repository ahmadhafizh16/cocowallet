import { randomUUID } from "node:crypto";
import { createHistoryFixture } from "./test-fixture";
import { listTransactionHistory, readTransactionHistory } from "./read";
import { openDatabase } from "../../server/db/connection";
import { currencies } from "../../server/db/schema";
import { readWalletBalance } from "../journal/balances";
import { withJournalWrite } from "../journal/write";
import { MAX_MINOR } from "../money/money";
import { getCurrencyExponent } from "../money/currency-precision";
import { submitFunding } from "../funding/service";
import { submitConversion } from "../conversions/service";
import { submitTransfer } from "../transfers/service";
import { createQuote } from "../quotes/service";
import { assertContract } from "../../test/json-contract";
import { readApiDocument } from "../../server/http/openapi";

jest.mock("server-only", () => ({}));
describe("account-scoped completed transaction history", () => {
  let fixture: ReturnType<typeof createHistoryFixture>;
  beforeEach(() => {
    fixture = createHistoryFixture();
  });
  afterEach(() => fixture.cleanup());
  const list = (changes: Record<string, unknown> = {}) =>
    listTransactionHistory(fixture.database, { accountId: "main", ...changes });
  const detail = (id = "transfer-tie-z", accountId = "main") =>
    readTransactionHistory(fixture.database, accountId, id);
  const ids = (changes: Record<string, unknown> = {}) =>
    list(changes).transactions.map((value) => value.transactionId);
  it("returns each transaction once, newest first with a descending ID tie-breaker", () => {
    expect(ids()).toEqual([
      "transfer-other",
      "transfer-next",
      "transfer-same",
      "withdraw-middle",
      "transfer-tie-z",
      "conversion-tie-a",
      "deposit-start",
      "deposit-before",
      "deposit-old",
    ]);
    expect(list().pagination).toEqual({
      page: 1,
      pageSize: 50,
      totalItems: 9,
      totalPages: 1,
    });
    assertContract(
      list(),
      readApiDocument.components.schemas.HistoryPage,
      readApiDocument.components.schemas,
    );
  });
  it("uses numbered pages and returns empty pages beyond the end", () => {
    const all = ids(),
      pages = [1, 2, 3].flatMap((page) => ids({ page, pageSize: 4 }));
    expect(pages).toEqual(all);
    expect(list({ page: 4, pageSize: 4 })).toMatchObject({
      transactions: [],
      pagination: { page: 4, pageSize: 4, totalItems: 9, totalPages: 3 },
    });
    expect(
      list({ page: Number.MAX_SAFE_INTEGER, pageSize: 100 }).transactions,
    ).toEqual([]);
  });
  it("filters an exact ID outside the current page, combines filters and never leaks another account's record", () => {
    expect(ids({ pageSize: 1 })).not.toContain("deposit-old");
    expect(ids({ transactionId: "deposit-old", pageSize: 1 })).toEqual([
      "deposit-old",
    ]);
    expect(list({ transactionId: "deposit-old" }).pagination).toMatchObject({
      totalItems: 1,
      totalPages: 1,
    });
    for (const changes of [
      { type: "transfer" },
      { currency: "GBP" },
      { from: "2026-11-12" },
      { accountId: "recipient" },
      { transactionId: "missing" },
      { transactionId: "x' OR 1=1 --" },
    ])
      expect(ids({ transactionId: "deposit-old", ...changes })).toEqual([]);
    expect(ids()).toHaveLength(9);
  });
  it("matches legacy Unicode and surrounding spaces literally without normalizing IDs", () => {
    const id = "  🌍 <legacy> '  ";
    fixture.add({
      id,
      type: "deposit",
      createdAt: "2026-11-15T00:00:00.000Z",
      targetWalletId: "main-usd",
      credit: 1n,
      provider: "demo_bank",
    });
    expect(ids({ transactionId: id })).toEqual([id]);
    expect(ids({ transactionId: id.trim() })).toEqual([]);
  });
  it("truthfully permits numbered-page shifts when new activity arrives between requests", () => {
    const first = ids({ page: 1, pageSize: 2 });
    fixture.add({
      id: "arrived-later",
      type: "deposit",
      targetWalletId: "main-usd",
      credit: 1n,
      provider: "demo_bank",
      createdAt: "2026-11-14T00:00:00.000Z",
    });
    const second = ids({ page: 2, pageSize: 2 });
    expect(second).toContain(first[1]);
    expect(list({ page: 2, pageSize: 2 }).pagination.totalItems).toBe(10);
  });
  it.each(["deposit", "withdrawal", "conversion", "transfer"])(
    "filters operation type %s without duplicating paired entries",
    (type) => {
      const result = list({ type });
      expect(result.transactions.length).toBeGreaterThan(0);
      expect(result.transactions.every((value) => value.type === type)).toBe(
        true,
      );
      expect(result.pagination.totalItems).toBe(result.transactions.length);
    },
  );
  it.each(["USD", "GBP"])(
    "finds a cross-currency conversion and transfer by either side: %s",
    (currency) => {
      expect(ids({ currency })).toContain("conversion-tie-a");
      expect(ids({ currency })).toContain("transfer-tie-z");
    },
  );
  it("combines destination scoping with either-side currency matching without leaking main-only activity", () => {
    expect(ids({ accountId: "recipient", currency: "USD" })).toEqual([
      "transfer-same",
      "transfer-tie-z",
    ]);
    expect(
      ids({ accountId: "recipient", currency: "GBP", type: "transfer" }),
    ).toEqual(["transfer-next", "transfer-tie-z"]);
  });
  it("combines filters and includes both UTC day boundaries, never the neighboring days", () => {
    expect(ids({ from: "2026-11-12", to: "2026-11-12" })).toEqual([
      "transfer-same",
      "withdraw-middle",
      "transfer-tie-z",
      "conversion-tie-a",
      "deposit-start",
    ]);
    expect(
      ids({
        type: "transfer",
        currency: "GBP",
        from: "2026-11-12",
        to: "2026-11-12",
      }),
    ).toEqual(["transfer-tie-z"]);
    expect(ids({ to: "2026-11-11" })).toEqual([
      "deposit-before",
      "deposit-old",
    ]);
    expect(ids({ from: "2026-11-13" })).toEqual([
      "transfer-other",
      "transfer-next",
    ]);
  });
  it("does not depend on the process/browser timezone or today's clock", () => {
    const before = ids({ from: "2026-11-12", to: "2026-11-12" }),
      previous = process.env.TZ;
    try {
      process.env.TZ = "Pacific/Honolulu";
      jest.spyOn(Date, "now").mockImplementation(() => {
        throw new Error("No current clock");
      });
      expect(ids({ from: "2026-11-12", to: "2026-11-12" })).toEqual(before);
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  });
  it("returns a useful empty page with zero totals for a valid empty account/filter", () => {
    withJournalWrite(fixture.database, (scope) =>
      scope.createDestination({ id: "empty", defaultCurrency: "JPY" }),
    );
    for (const input of [
      { accountId: "empty" },
      { currency: "JPY" },
      { from: "9999-12-31", to: "9999-12-31" },
      { from: "0000-01-01", to: "0000-01-01" },
    ])
      expect(list(input)).toMatchObject({
        transactions: [],
        pagination: { page: 1, pageSize: 50, totalItems: 0, totalPages: 0 },
      });
  });
  it("shows the same immutable transfer as outgoing/incoming without keys or balance leaks", () => {
    const main = detail().transaction,
      recipient = detail("transfer-tie-z", "recipient").transaction;
    expect(main).toMatchObject({
      type: "transfer",
      direction: "outgoing",
      source: {
        accountId: "main",
        currency: "USD",
        amount: "1.00",
        amountMinor: "100",
      },
      target: {
        accountId: "recipient",
        currency: "GBP",
        amount: "0.80",
        amountMinor: "80",
      },
      rate: { value: "0.8000", date: "2026-11-10", source: "fresh" },
    });
    expect(recipient).toEqual({ ...main, direction: "incoming" });
    expect(ids({ accountId: "recipient" })).toEqual([
      "transfer-next",
      "transfer-same",
      "transfer-tie-z",
    ]);
    expect(ids({ accountId: "other" })).toEqual(["transfer-other"]);
    expect(JSON.stringify(detail("transfer-tie-z", "recipient"))).not.toMatch(
      /requestKey|balanceMinor|quoteId/u,
    );
    expect(detail("transfer-tie-z", "recipient").account.inspectOnly).toBe(
      true,
    );
  });
  it.each([
    ["deposit-start", "incoming"],
    ["withdraw-middle", "outgoing"],
    ["conversion-tie-a", "internal"],
  ])("represents %s direction and explicit nulls", (id, direction) => {
    const value = detail(id).transaction;
    expect(value.direction).toBe(direction);
    if (value.type === "deposit")
      expect(value).toMatchObject({
        source: null,
        rate: null,
        provider: "demo_bank",
      });
    if (value.type === "withdrawal")
      expect(value).toMatchObject({
        target: null,
        rate: null,
        provider: "crypto_gateway",
      });
    if (value.type === "conversion")
      expect(value).toMatchObject({
        provider: null,
        rate: { value: "0.805" },
        target: { amount: "0.81", amountMinor: "81" },
      });
    assertContract(
      detail(id),
      readApiDocument.components.schemas.HistoryDetail,
      readApiDocument.components.schemas,
    );
  });
  it("does not return unrelated completed records or fall back to the main account", () => {
    for (const id of [
      "deposit-start",
      "conversion-tie-a",
      "transfer-other",
      "does-not-exist",
    ])
      expect(() => detail(id, "recipient")).toThrow(
        expect.objectContaining({ code: "TRANSACTION_NOT_FOUND" }),
      );
    expect(() => list({ accountId: "unknown" })).toThrow(
      expect.objectContaining({ code: "account_not_found" }),
    );
    expect(() => detail("missing", "unknown")).toThrow(
      expect.objectContaining({ code: "account_not_found" }),
    );
  });
  it.each(["__proto__", "constructor", " recipient ", "وجهة-💰"])(
    "keeps arbitrary exact destination context %s isolated",
    (accountId) => {
      const walletId = randomUUID(),
        transactionId = randomUUID();
      withJournalWrite(fixture.database, (scope) => {
        scope.createDestination({ id: accountId, defaultCurrency: "USD" });
        scope.createWallet({ id: walletId, accountId, currencyCode: "USD" });
        scope.record({
          id: transactionId,
          type: "transfer",
          sourceWalletId: "main-usd",
          targetWalletId: walletId,
          amountMinor: 1n,
        });
      });
      const value = list({ accountId });
      expect(value.account.id).toBe(accountId);
      expect(value.transactions).toHaveLength(1);
      expect(value.transactions[0]).toMatchObject({
        transactionId,
        direction: "incoming",
        target: { accountId, amountMinor: "1" },
      });
    },
  );
  it("excludes recorded failures and reads journal facts without requiring technical results", async () => {
    const before = ids();
    expect(
      submitFunding(fixture.database, "withdrawal", randomUUID(), {
        walletId: "main-usd",
        amount: "999999.00",
        provider: "demo_bank",
      }).status,
    ).toBe(409);
    expect(
      submitConversion(fixture.database, randomUUID(), {
        quoteId: randomUUID(),
        sourceWalletId: "main-usd",
        amount: "1.00",
        targetCurrency: "GBP",
      }).status,
    ).toBe(404);
    expect(
      (
        await submitTransfer(fixture.database, randomUUID(), {
          sourceWalletId: "main-usd",
          recipientAccountId: "main",
          amount: "1.00",
        })
      ).status,
    ).toBe(400);
    expect(ids()).toEqual(before);
    for (const table of [
      "funding_attempts",
      "conversion_attempts",
      "transfer_attempts",
      "fx_quote_uses",
      "fx_quotes",
      "fx_rate_cache",
      "fx_catalog_cache",
    ])
      fixture.database.sqlite.exec(
        `ALTER TABLE ${table} RENAME TO unused_${table}`,
      );
    expect(ids()).toEqual(before);
    expect(detail().transaction.rate!.value).toBe("0.8000");
  });
  it("keeps original historical amounts/rates after restart, cache refresh and later spending", () => {
    const original = detail();
    withJournalWrite(fixture.database, (scope) =>
      scope.record({
        id: randomUUID(),
        type: "withdrawal",
        sourceWalletId: "main-usd",
        amountMinor: 1n,
        provider: "demo_bank",
      }),
    );
    fixture.database.sqlite
      .prepare(
        "INSERT INTO fx_rate_cache(base,quote,rate,source_date,fetched_at) VALUES ('USD','GBP','999','2026-11-12','2026-11-12T12:00:00.000Z')",
      )
      .run();
    const reopened = openDatabase(fixture.filename);
    try {
      expect(
        readTransactionHistory(reopened, "main", "transfer-tie-z"),
      ).toEqual(original);
    } finally {
      reopened.close();
    }
  });
  it("returns exact zero/three/four-decimal and int64-limit amounts without JSON numbers", () => {
    fixture.database.db
      .insert(currencies)
      .values([
        { code: "BHD", name: "Dinar", minorUnit: 3 },
        { code: "CLF", name: "Historical unit", minorUnit: 4 },
      ])
      .run();
    for (const currency of ["JPY", "BHD", "CLF"]) {
      const wallet = `main-${currency}`;
      withJournalWrite(fixture.database, (scope) =>
        scope.createWallet({
          id: wallet,
          accountId: "main",
          currencyCode: currency,
        }),
      );
      fixture.add({
        id: `precision-${currency}`,
        type: "deposit",
        targetWalletId: wallet,
        credit: MAX_MINOR,
        provider: "demo_bank",
        createdAt: "2026-11-14T00:00:00.000Z",
      });
      const value = detail(`precision-${currency}`).transaction.target!;
      expect(value).toMatchObject({
        amountMinor: MAX_MINOR.toString(),
        exponent: getCurrencyExponent(currency),
      });
      expect(typeof value.amount).toBe("string");
      expect(ids({ currency })).toContain(`precision-${currency}`);
    }
  });
  it("holds account metadata, count, rows and entries in one WAL snapshot", () => {
    const second = openDatabase(fixture.filename),
      prepare = fixture.database.sqlite.prepare.bind(fixture.database.sqlite);
    let committed = false;
    jest.spyOn(fixture.database.sqlite, "prepare").mockImplementation((sql) => {
      if (sql.startsWith("SELECT t.*") && !committed) {
        committed = true;
        withJournalWrite(second, (scope) => {
          second.sqlite
            .prepare(
              "UPDATE accounts SET default_currency='GBP' WHERE id='main'",
            )
            .run();
          scope.record({
            id: "concurrent-deposit",
            type: "deposit",
            targetWalletId: "main-usd",
            amountMinor: 100n,
            provider: "demo_bank",
          });
        });
      }
      return prepare(sql);
    });
    try {
      const first = list();
      expect(committed).toBe(true);
      expect(first.account.defaultCurrency).toBe("USD");
      expect(first.pagination.totalItems).toBe(9);
      expect(first.transactions).toHaveLength(9);
      expect(
        first.transactions.some(
          (value) => value.transactionId === "concurrent-deposit",
        ),
      ).toBe(false);
      const after = list();
      expect(after.account.defaultCurrency).toBe("GBP");
      expect(after.pagination.totalItems).toBe(10);
      expect(after.transactions).toHaveLength(10);
    } finally {
      second.close();
    }
  });
  it("performs no writes on a query-only connection and does not aggregate current balances", () => {
    const before = fixture.database.sqlite
      .prepare("SELECT total_changes() AS n")
      .get();
    fixture.database.sqlite.pragma("query_only=ON");
    expect(list().transactions).toHaveLength(9);
    expect(detail().transaction.status).toBe("completed");
    expect(
      fixture.database.sqlite.prepare("SELECT total_changes() AS n").get(),
    ).toEqual(before);
  });
  it("accepts actual service-produced funding/conversion/transfers without rereading current quotes", async () => {
    const now = () => Date.parse("2026-11-12T12:00:00.000Z"),
      client = {
        catalog: async () => ({
          currencies: [
            { code: "USD", name: "Dollar", exponent: 2 },
            { code: "GBP", name: "Pound", exponent: 2 },
          ],
          fetchedAt: new Date(now()).toISOString(),
        }),
        rate: async () => ({
          rate: "0.8",
          date: "2026-11-11",
          fetchedAt: new Date(now()).toISOString(),
        }),
      };
    const q = await createQuote(
      fixture.database,
      {
        operation: "conversion",
        sourceWalletId: "main-usd",
        amount: "1.00",
        targetCurrency: "GBP",
      },
      { client, now },
    );
    const converted = submitConversion(
      fixture.database,
      randomUUID(),
      {
        quoteId: q.quote.quoteId,
        sourceWalletId: "main-usd",
        amount: "1.00",
        targetCurrency: "GBP",
      },
      { now },
    );
    const sent = await submitTransfer(
      fixture.database,
      randomUUID(),
      {
        sourceWalletId: "main-usd",
        recipientAccountId: "recipient",
        targetCurrency: "USD",
        amount: "1.00",
      },
      { now },
    );
    const funded = submitFunding(fixture.database, "deposit", randomUUID(), {
      walletId: "main-usd",
      amount: "1.00",
      provider: "demo_bank",
    });
    for (const result of [converted, sent, funded]) {
      expect(result.status).toBe(200);
      expect("transactionId" in result.body).toBe(true);
      if ("transactionId" in result.body) {
        expect(detail(result.body.transactionId).transaction.type).toBe(
          result.body.type,
        );
      }
    }
    expect(readWalletBalance(fixture.database, "main-usd")).toBeGreaterThan(0n);
  });
  it.each([
    "credit",
    "debit",
    "missing-entry",
    "extra-entry",
    "rate",
    "timestamp",
    "precision",
    "name",
    "missing-wallet",
    "partial-rate",
    "rate-time",
    "rate-date",
    "provider",
    "noninteger-entry",
    "int64-negative-limit",
  ])(
    "fails closed on selected damaged %s data without changing it",
    (stage) => {
      fixture.database.sqlite.exec(
        "DROP TRIGGER journal_entries_no_update; DROP TRIGGER journal_entries_no_delete; DROP TRIGGER journal_entry_matches_transaction_side; DROP TRIGGER transactions_no_update; DROP TRIGGER used_currency_precision_no_update;",
      );
      fixture.database.sqlite.pragma("ignore_check_constraints=ON");
      if (stage === "credit")
        fixture.database.sqlite.exec(
          "UPDATE journal_entries SET amount_minor=79 WHERE transaction_id='transfer-tie-z' AND amount_minor>0",
        );
      if (stage === "debit")
        fixture.database.sqlite.exec(
          "UPDATE journal_entries SET amount_minor=100 WHERE transaction_id='transfer-tie-z' AND amount_minor<0",
        );
      if (stage === "missing-entry")
        fixture.database.sqlite.exec(
          "DELETE FROM journal_entries WHERE transaction_id='transfer-tie-z' AND amount_minor>0",
        );
      if (stage === "extra-entry")
        fixture.database.sqlite.exec(
          "INSERT INTO journal_entries(id,transaction_id,wallet_id,amount_minor) VALUES ('extra','transfer-tie-z','other-usd',1)",
        );
      if (stage === "rate")
        fixture.database.sqlite.exec(
          "UPDATE transactions SET rate='0' WHERE id='transfer-tie-z'",
        );
      if (stage === "timestamp")
        fixture.database.sqlite.exec(
          "UPDATE transactions SET created_at='invalid' WHERE id='transfer-tie-z'",
        );
      if (stage === "precision")
        fixture.database.sqlite.exec(
          "UPDATE currencies SET minor_unit=0 WHERE code='GBP'",
        );
      if (stage === "name")
        fixture.database.sqlite.exec(
          "UPDATE currencies SET name='' WHERE code='GBP'",
        );
      if (stage === "missing-wallet") {
        fixture.database.sqlite.pragma("foreign_keys=OFF");
        fixture.database.sqlite.exec(
          "DELETE FROM wallets WHERE id='recipient-gbp'",
        );
      }
      if (stage === "partial-rate")
        fixture.database.sqlite.exec(
          "UPDATE transactions SET rate_date=NULL WHERE id='transfer-tie-z'",
        );
      if (stage === "rate-time")
        fixture.database.sqlite.exec(
          "UPDATE transactions SET rate_fetched_at='invalid' WHERE id='transfer-tie-z'",
        );
      if (stage === "rate-date")
        fixture.database.sqlite.exec(
          "UPDATE transactions SET rate_date='2026-11-12' WHERE id='transfer-tie-z'",
        );
      if (stage === "provider")
        fixture.database.sqlite.exec(
          "UPDATE transactions SET provider='private-invalid' WHERE id='transfer-tie-z'",
        );
      if (stage === "noninteger-entry")
        fixture.database.sqlite.exec(
          "UPDATE journal_entries SET amount_minor=0.5 WHERE transaction_id='transfer-tie-z' AND amount_minor>0",
        );
      if (stage === "int64-negative-limit")
        fixture.database.sqlite.exec(
          "UPDATE journal_entries SET amount_minor=-9223372036854775808 WHERE transaction_id='transfer-tie-z' AND amount_minor<0",
        );
      const before = fixture.database.sqlite
        .prepare("SELECT total_changes() AS n")
        .get();
      expect(() => detail()).toThrow();
      expect(() => list()).toThrow();
      expect(
        fixture.database.sqlite.prepare("SELECT total_changes() AS n").get(),
      ).toEqual(before);
    },
  );
});
