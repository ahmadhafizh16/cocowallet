import { randomUUID } from "node:crypto";
import { createJournalFixture } from "../../server/db/test-fixture";
import { openDatabase } from "../../server/db/connection";
import { withJournalWrite } from "../journal/write";
import { readWalletBalance } from "../journal/balances";
import { FX_CACHE_LIFETIME_MS } from "../rates/contracts";
import { MAX_MINOR } from "../money/money";
import {
  createQuote,
  readQuote,
  validateQuoteForConfirmation,
  consumeQuote,
} from "./service";
import type { QuoteRequest, StoredQuote } from "./contracts";

jest.mock("server-only", () => ({}));
const NOW = Date.parse("2026-11-12T12:00:00.000Z");
const currencies = [
  { code: "USD", name: "Dollar", exponent: 2 },
  { code: "GBP", name: "Pound", exponent: 2 },
  { code: "EUR", name: "Euro", exponent: 2 },
  { code: "JPY", name: "Yen", exponent: 0 },
];
const request: QuoteRequest = {
  operation: "conversion",
  sourceWalletId: "main-usd",
  amount: "10.00",
  targetCurrency: "GBP",
};

describe("immutable server-owned quote lifecycle", () => {
  let fixture: ReturnType<typeof createJournalFixture>;
  let clock: number;
  let client: { catalog: jest.Mock; rate: jest.Mock };
  const deps = () => ({ client, now: () => clock });
  function fund(wallet = "main-usd", amount = 10000n) {
    withJournalWrite(fixture.database, (scope) =>
      scope.record({
        id: randomUUID(),
        type: "deposit",
        targetWalletId: wallet,
        amountMinor: amount,
        provider: "demo_bank",
      }),
    );
  }
  beforeEach(() => {
    fixture = createJournalFixture();
    clock = NOW;
    fund();
    client = {
      catalog: jest.fn(async () => ({
        currencies,
        fetchedAt: new Date(clock).toISOString(),
      })),
      rate: jest.fn(async () => ({
        rate: "1.005",
        date: "2026-11-11",
        fetchedAt: new Date(clock).toISOString(),
      })),
    };
  });
  afterEach(() => fixture.cleanup());
  const create = (input: unknown = request) =>
    createQuote(fixture.database, input, deps());
  const inWrite = (quoteId: string, input: unknown = request, now = clock) =>
    withJournalWrite(fixture.database, () =>
      validateQuoteForConfirmation(fixture.database, quoteId, input, now),
    );
  function complete(quote: StoredQuote, input: QuoteRequest = request) {
    return withJournalWrite(fixture.database, (scope) => {
      const checked = validateQuoteForConfirmation(
        fixture.database,
        quote.quoteId,
        input,
        clock,
      );
      return scope.record(
        {
          id: randomUUID(),
          type: "conversion",
          sourceWalletId: checked.quote.source.walletId,
          targetWalletId: checked.context.targetWalletId!,
          amountMinor: BigInt(checked.quote.source.amountMinor),
          rate: {
            value: checked.quote.rate.value,
            date: checked.quote.rate.date,
            fetchedAt: checked.quote.rate.fetchedAt,
            source: checked.quote.rate.source,
          },
        },
        ({ transactionId }) => {
          consumeQuote(fixture.database, quote.quoteId, transactionId, clock);
        },
      );
    });
  }

  it("returns exact rounded amounts/provenance and reserves or moves no funds", async () => {
    const rows = [
      "accounts",
      "wallets",
      "currencies",
      "transactions",
      "journal_entries",
      "funding_attempts",
    ].map((t) => fixture.database.sqlite.prepare(`SELECT * FROM ${t}`).all());
    const view = await create({ ...request, amount: "1.00" });
    expect(view).toMatchObject({
      state: "active",
      quote: {
        operation: "conversion",
        source: {
          walletId: "main-usd",
          accountId: "main",
          amount: "1.00",
          amountMinor: "100",
        },
        target: { currency: "GBP", amount: "1.01", amountMinor: "101" },
        rate: { value: "1.005", source: "fresh", date: "2026-11-11" },
        issuedAt: new Date(NOW).toISOString(),
        expiresAt: new Date(NOW + 60000).toISOString(),
      },
    });
    expect(
      [
        "accounts",
        "wallets",
        "currencies",
        "transactions",
        "journal_entries",
        "funding_attempts",
      ].map((t) => fixture.database.sqlite.prepare(`SELECT * FROM ${t}`).all()),
    ).toEqual(rows);
    expect(() => JSON.stringify(view)).not.toThrow();
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(10000n);
  });

  it("starts the hold after slow network work, not when the preview was requested", async () => {
    client.rate.mockImplementation(async () => {
      clock += 120000;
      return {
        rate: "0.5",
        date: "2026-11-11",
        fetchedAt: new Date(clock).toISOString(),
      };
    });
    const { quote } = await create();
    expect(quote.issuedAt).toBe(new Date(NOW + 120000).toISOString());
    expect(quote.expiresAt).toBe(new Date(NOW + 180000).toISOString());
  });

  it.each([0, 59999, 60000, 60001])(
    "has strict expiry at elapsed %s ms",
    async (elapsed) => {
      const { quote } = await create();
      clock += elapsed;
      expect(readQuote(fixture.database, quote.quoteId, clock).state).toBe(
        elapsed < 60000 ? "active" : "expired",
      );
      if (elapsed < 60000) expect(inWrite(quote.quoteId).quote).toEqual(quote);
      else
        expect(() => inWrite(quote.quoteId)).toThrow(
          expect.objectContaining({ code: "QUOTE_EXPIRED" }),
        );
    },
  );

  it("preserves the full issued minute across the cache's 24-hour boundary, without issuing a stale new quote", async () => {
    await create();
    client.catalog.mockRejectedValue(new Error("offline"));
    client.rate.mockRejectedValue(new Error("offline"));
    clock = NOW + FX_CACHE_LIFETIME_MS - 20000;
    const { quote } = await create();
    expect(quote.rate.source).toBe("cached");
    clock += 30000;
    expect(inWrite(quote.quoteId).quote).toEqual(quote);
    await expect(create()).rejects.toMatchObject({
      code: "QUOTE_RATE_UNAVAILABLE",
    });
  });

  it("rechecks cache eligibility at issuance after waiting for the writer", async () => {
    await create();
    client.catalog.mockRejectedValue(new Error("offline"));
    client.rate.mockImplementation(async () => {
      clock = NOW + FX_CACHE_LIFETIME_MS;
      throw new Error("offline");
    });
    clock = NOW + FX_CACHE_LIFETIME_MS - 1;
    await expect(create()).rejects.toMatchObject({
      code: "QUOTE_RATE_UNAVAILABLE",
    });
  });

  it("rechecks the cache boundary inside the writer reservation, not just in the rate fetch", async () => {
    await create();
    client.catalog.mockRejectedValue(new Error("offline"));
    client.rate.mockRejectedValue(new Error("offline"));
    const controlledClock = () =>
      NOW +
      FX_CACHE_LIFETIME_MS -
      (fixture.database.sqlite.inTransaction ? 0 : 1);
    await expect(
      createQuote(fixture.database, request, { client, now: controlledClock }),
    ).rejects.toMatchObject({ code: "QUOTE_RATE_UNAVAILABLE" });
    expect(
      fixture.database.sqlite
        .prepare("SELECT COUNT(*) AS n FROM fx_quotes")
        .get(),
    ).toEqual({ n: 1n });
  });

  it.each([
    { amount: "9.00" },
    { amount: "10" },
    { sourceWalletId: "main-gbp" },
    { targetCurrency: "JPY" },
    { operation: "transfer", recipientAccountId: "recipient" },
  ])(
    "rejects changed input while reusing an issued quote: %j",
    async (changes) => {
      const { quote } = await create();
      expect(() => inWrite(quote.quoteId, { ...request, ...changes })).toThrow(
        expect.objectContaining({ code: "QUOTE_INPUT_MISMATCH" }),
      );
    },
  );

  it("ignores object property order but not exact input spelling", async () => {
    const { quote } = await create();
    expect(
      inWrite(quote.quoteId, {
        targetCurrency: "GBP",
        amount: "10.00",
        sourceWalletId: "main-usd",
        operation: "conversion",
      }).quote,
    ).toEqual(quote);
  });

  it.each([
    null,
    [],
    {},
    { ...request, rate: "2" },
    { ...request, expiresAt: "2099" },
    { ...request, amount: 1 },
    { ...request, amount: "1e2" },
    { ...request, operation: { toString: "conversion" } },
  ])(
    "rejects malformed/client-owned quote terms before network: %j",
    async (input) => {
      await expect(create(input)).rejects.toMatchObject({
        status: 400,
        code: "INVALID_QUOTE_REQUEST",
      });
      expect(client.catalog).not.toHaveBeenCalled();
    },
  );

  it.each(["0", "1.001", "92233720368547758.08"])(
    "rejects invalid monetary amount %s",
    async (amount) => {
      await expect(create({ ...request, amount })).rejects.toMatchObject({
        status: 400,
      });
      expect(client.catalog).not.toHaveBeenCalled();
    },
  );

  it("rejects unaffordable/inspect-only/missing sources and identity FX before network", async () => {
    await expect(create({ ...request, amount: "101" })).rejects.toMatchObject({
      code: "INSUFFICIENT_FUNDS",
      status: 409,
    });
    await expect(
      create({ ...request, sourceWalletId: "recipient-usd" }),
    ).rejects.toMatchObject({ code: "INSPECT_ONLY" });
    await expect(
      create({ ...request, sourceWalletId: "missing" }),
    ).rejects.toMatchObject({ code: "SOURCE_WALLET_NOT_FOUND", status: 404 });
    await expect(
      create({ ...request, targetCurrency: "USD" }),
    ).rejects.toMatchObject({ code: "INVALID_TARGET_CURRENCY" });
    await expect(
      create({
        ...request,
        operation: "transfer",
        recipientAccountId: "recipient",
        targetCurrency: "USD",
      }),
    ).rejects.toMatchObject({ code: "FX_QUOTE_NOT_REQUIRED" });
    expect(client.catalog).not.toHaveBeenCalled();
  });

  it("rechecks funds after network work and again at confirmation, without consuming failure", async () => {
    const { quote } = await create();
    withJournalWrite(fixture.database, (scope) =>
      scope.record({
        id: randomUUID(),
        type: "withdrawal",
        sourceWalletId: "main-usd",
        amountMinor: 10000n,
        provider: "demo_bank",
      }),
    );
    expect(() => inWrite(quote.quoteId)).toThrow(
      expect.objectContaining({ code: "INSUFFICIENT_FUNDS" }),
    );
    expect(readQuote(fixture.database, quote.quoteId, clock).state).toBe(
      "active",
    );
    fund();
    expect(inWrite(quote.quoteId).quote).toEqual(quote);
    client.rate.mockImplementation(async () => {
      withJournalWrite(fixture.database, (scope) =>
        scope.record({
          id: randomUUID(),
          type: "withdrawal",
          sourceWalletId: "main-usd",
          amountMinor: 10000n,
          provider: "demo_bank",
        }),
      );
      return {
        rate: "1",
        date: "2026-11-11",
        fetchedAt: new Date(clock).toISOString(),
      };
    });
    await expect(create()).rejects.toMatchObject({
      code: "INSUFFICIENT_FUNDS",
    });
  });

  it("checks rounded zero and final monetary bounds", async () => {
    client.rate.mockResolvedValue({
      rate: "0.1",
      date: "2026-11-11",
      fetchedAt: new Date(clock).toISOString(),
    });
    await expect(
      create({ ...request, amount: "0.01", targetCurrency: "JPY" }),
    ).rejects.toMatchObject({ code: "ROUNDED_TO_ZERO" });
    fund("main-gbp", MAX_MINOR);
    await expect(create()).rejects.toMatchObject({
      code: "BALANCE_OUT_OF_RANGE",
    });
  });

  it("persists through a new connection, rejects clock rollback, and never fetches on readback", async () => {
    const { quote } = await create();
    const calls = client.rate.mock.calls.length;
    const other = openDatabase(fixture.filename);
    try {
      expect(
        readQuote(other, quote.quoteId.toUpperCase(), clock).quote,
      ).toEqual(quote);
    } finally {
      other.close();
    }
    expect(client.rate).toHaveBeenCalledTimes(calls);
    expect(() => readQuote(fixture.database, quote.quoteId, NOW - 1)).toThrow(
      expect.objectContaining({ code: "QUOTE_DATA_UNAVAILABLE" }),
    );
  });

  it("has immutable terms and use records; success consumes once atomically", async () => {
    const { quote } = await create();
    const result = complete(quote);
    expect(readQuote(fixture.database, quote.quoteId, clock)).toEqual({
      quote,
      state: "consumed",
      transactionId: result.transactionId,
    });
    expect(() => complete(quote)).toThrow(
      expect.objectContaining({ code: "QUOTE_ALREADY_USED" }),
    );
    expect(() =>
      fixture.database.sqlite.exec("UPDATE fx_quotes SET terms='{}'"),
    ).toThrow();
    expect(() =>
      fixture.database.sqlite.exec("DELETE FROM fx_quotes"),
    ).toThrow();
    expect(() =>
      fixture.database.sqlite.exec("UPDATE fx_quote_uses SET used_at='bad'"),
    ).toThrow();
    expect(() =>
      fixture.database.sqlite.exec("DELETE FROM fx_quote_uses"),
    ).toThrow();
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(9000n);
    expect(readWalletBalance(fixture.database, "main-gbp")).toBe(1005n);
  });

  it("does not reserve balances when several quotes review the same available funds", async () => {
    const input = { ...request, amount: "100.00" };
    const first = await create(input);
    const second = await create(input);
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(10000n);
    complete(first.quote, input);
    expect(() => inWrite(second.quote.quoteId, input)).toThrow(
      expect.objectContaining({ code: "INSUFFICIENT_FUNDS" }),
    );
    expect(readQuote(fixture.database, second.quote.quoteId, clock).state).toBe(
      "active",
    );
  });

  it("cannot attach a past completed transaction outside its active scoped hook", async () => {
    const { quote } = await create();
    const completed = complete(quote);
    fixture.database.sqlite.transaction(() => {
      expect(() =>
        consumeQuote(
          fixture.database,
          quote.quoteId,
          completed.transactionId,
          clock,
        ),
      ).toThrow(expect.objectContaining({ code: "QUOTE_STORAGE_UNAVAILABLE" }));
    })();
  });

  it.each([false, true])(
    "rolls back money when a late consumption error is swallowed (inside hook: %s)",
    async (catchInside) => {
      const { quote } = await create();
      fixture.database.sqlite.exec(
        "CREATE TRIGGER fail_use BEFORE INSERT ON fx_quote_uses BEGIN SELECT RAISE(ABORT,'private'); END;",
      );
      expect(() =>
        withJournalWrite(fixture.database, (scope) => {
          try {
            scope.record(
              {
                id: randomUUID(),
                type: "conversion",
                sourceWalletId: "main-usd",
                targetWalletId: "main-gbp",
                amountMinor: 1000n,
                rate: {
                  value: quote.rate.value,
                  date: quote.rate.date,
                  fetchedAt: quote.rate.fetchedAt,
                  source: quote.rate.source,
                },
              },
              ({ transactionId }) => {
                try {
                  consumeQuote(
                    fixture.database,
                    quote.quoteId,
                    transactionId,
                    clock,
                  );
                } catch (error) {
                  if (!catchInside) throw error;
                }
              },
            );
          } catch {
            /* Scope must still roll back. */
          }
        }),
      ).toThrow(expect.objectContaining({ code: "QUOTE_STORAGE_UNAVAILABLE" }));
      expect(readWalletBalance(fixture.database, "main-usd")).toBe(10000n);
      expect(readWalletBalance(fixture.database, "main-gbp")).toBe(0n);
      expect(readQuote(fixture.database, quote.quoteId, clock).state).toBe(
        "active",
      );
    },
  );

  it("rejects a recorded transaction whose actual terms differ from the quote", async () => {
    const { quote } = await create();
    expect(() =>
      withJournalWrite(fixture.database, (scope) =>
        scope.record(
          {
            id: randomUUID(),
            type: "conversion",
            sourceWalletId: "main-usd",
            targetWalletId: "main-gbp",
            amountMinor: 100n,
            rate: {
              value: quote.rate.value,
              date: quote.rate.date,
              fetchedAt: quote.rate.fetchedAt,
              source: quote.rate.source,
            },
          },
          ({ transactionId }) => {
            consumeQuote(fixture.database, quote.quoteId, transactionId, clock);
          },
        ),
      ),
    ).toThrow(expect.objectContaining({ code: "QUOTE_CONTEXT_CHANGED" }));
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(10000n);
  });

  it("does not create recipients, currencies or wallets while quoting arbitrary new IDs", async () => {
    const input: QuoteRequest = {
      ...request,
      operation: "transfer",
      recipientAccountId: "__proto__",
      recipientDefaultCurrency: "EUR",
    };
    const { quote } = await create(input);
    expect(quote.recipient).toMatchObject({
      accountId: "__proto__",
      defaultCurrency: "EUR",
      defaultName: "Euro",
      defaultExponent: 2,
      existed: false,
    });
    expect(
      fixture.database.sqlite
        .prepare("SELECT id FROM accounts WHERE id='__proto__'")
        .get(),
    ).toBeUndefined();
    expect(
      fixture.database.sqlite
        .prepare("SELECT code FROM currencies WHERE code='EUR'")
        .get(),
    ).toBeUndefined();
    expect(inWrite(quote.quoteId, input).quote).toEqual(quote);
  });

  it("binds existing recipient defaults and rejects self/new-recipient ambiguity", async () => {
    const transfer: QuoteRequest = {
      ...request,
      operation: "transfer",
      recipientAccountId: "recipient",
    };
    const { quote } = await create(transfer);
    expect(quote.recipient).toMatchObject({
      defaultCurrency: "GBP",
      existed: true,
    });
    // Simulate out-of-band corruption; the real database already prevents edits.
    fixture.database.sqlite.exec("DROP TRIGGER destination_default_no_update");
    fixture.database.sqlite
      .prepare(
        "UPDATE accounts SET default_currency='USD' WHERE id='recipient'",
      )
      .run();
    expect(() => inWrite(quote.quoteId, transfer)).toThrow(
      expect.objectContaining({ code: "QUOTE_CONTEXT_CHANGED" }),
    );
    await expect(
      create({ ...transfer, recipientAccountId: "main" }),
    ).rejects.toMatchObject({ code: "INVALID_RECIPIENT" });
    await expect(
      create({ ...transfer, recipientAccountId: "unknown" }),
    ).rejects.toMatchObject({ code: "RECIPIENT_DEFAULT_REQUIRED" });
    await expect(
      create({ ...transfer, recipientDefaultCurrency: "GBP" }),
    ).rejects.toMatchObject({ code: "RECIPIENT_CONTEXT_CHANGED" });
  });

  it("copies immutable original input before any async work", async () => {
    const mutable = { ...request };
    client.rate.mockImplementation(async () => {
      mutable.amount = "25";
      return {
        rate: "1",
        date: "2026-11-11",
        fetchedAt: new Date(clock).toISOString(),
      };
    });
    const { quote } = await create(mutable);
    expect(quote.source.amount).toBe("10.00");
    expect(inWrite(quote.quoteId, request).quote).toEqual(quote);
  });

  it("fails closed on corrupted stored arithmetic without fetching new terms", async () => {
    const { quote } = await create();
    const altered = { ...quote, rate: { ...quote.rate, value: "9" } };
    fixture.database.sqlite.exec("DROP TRIGGER fx_quotes_no_update");
    fixture.database.sqlite
      .prepare("UPDATE fx_quotes SET terms=? WHERE id=?")
      .run(JSON.stringify(altered), quote.quoteId);
    expect(() => readQuote(fixture.database, quote.quoteId, clock)).toThrow(
      expect.objectContaining({ code: "QUOTE_DATA_UNAVAILABLE" }),
    );
    expect(client.rate).toHaveBeenCalledTimes(1);
  });

  it("leaves no quote or monetary write when quote persistence fails", async () => {
    fixture.database.sqlite.exec(
      "CREATE TRIGGER fail_quote BEFORE INSERT ON fx_quotes BEGIN SELECT RAISE(ABORT,'private storage'); END;",
    );
    await expect(create()).rejects.toMatchObject({
      code: "QUOTE_STORAGE_UNAVAILABLE",
      status: 503,
    });
    expect(
      fixture.database.sqlite.prepare("SELECT id FROM fx_quotes").all(),
    ).toEqual([]);
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(10000n);
  });
});
