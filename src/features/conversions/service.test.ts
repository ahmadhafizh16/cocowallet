import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { createJournalFixture } from "../../server/db/test-fixture";
import { openDatabase } from "../../server/db/connection";
import { withJournalWrite } from "../journal/write";
import { readWalletBalance } from "../journal/balances";
import { submitFunding } from "../funding/service";
import { MAX_MINOR } from "../money/money";
import { FX_CACHE_LIFETIME_MS } from "../rates/contracts";
import { createQuote, readQuote } from "../quotes/service";
import type { QuoteRequest } from "../quotes/contracts";
import { submitConversion } from "./service";
import type { ConversionRequest, ConversionReceipt } from "./contracts";

jest.mock("server-only", () => ({}));
const NOW = Date.parse("2026-11-12T12:00:00.000Z");
const base = {
  operation: "conversion" as const,
  sourceWalletId: "main-usd",
  amount: "10.00",
  targetCurrency: "GBP",
};
const currencyList = [
  { code: "USD", name: "US Dollar", exponent: 2 },
  { code: "GBP", name: "Pound Sterling", exponent: 2 },
  { code: "JPY", name: "Yen", exponent: 0 },
  { code: "EUR", name: "Euro", exponent: 2 },
];

describe("atomic quote-bound conversion service", () => {
  let fixture: ReturnType<typeof createJournalFixture>, clock: number;
  let client: { catalog: jest.Mock; rate: jest.Mock };
  const fund = (wallet = "main-usd", amount = 10000n) =>
    withJournalWrite(fixture.database, (scope) =>
      scope.record({
        id: randomUUID(),
        type: "deposit",
        targetWalletId: wallet,
        amountMinor: amount,
        provider: "demo_bank",
      }),
    );
  const counts = () =>
    Object.fromEntries(
      [
        "currencies",
        "accounts",
        "wallets",
        "transactions",
        "journal_entries",
        "fx_quote_uses",
        "conversion_attempts",
      ].map((t) => [
        t,
        fixture.database.sqlite
          .prepare<[], { n: bigint }>(`SELECT COUNT(*) AS n FROM ${t}`)
          .get()!,
      ]),
    );
  async function preview(
    changes: Partial<QuoteRequest> = {},
  ): Promise<ConversionRequest> {
    const request = { ...base, ...changes };
    const { quote } = await createQuote(fixture.database, request, {
      client,
      now: () => clock,
    });
    return {
      quoteId: quote.quoteId,
      sourceWalletId: request.sourceWalletId,
      amount: request.amount,
      targetCurrency: request.targetCurrency,
    };
  }
  const submit = (input: unknown, key: unknown = randomUUID()) =>
    submitConversion(fixture.database, key, input, { now: () => clock });
  beforeEach(() => {
    fixture = createJournalFixture();
    clock = NOW;
    fund();
    client = {
      catalog: jest.fn(async () => ({
        currencies: currencyList,
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

  it("commits exact source/target entries, original provenance, quote use and immutable receipt together", async () => {
    const input = await preview({ amount: "1.00" }),
      key = randomUUID();
    const result = submit(input, key);
    expect(result).toMatchObject({
      status: 200,
      replayed: false,
      body: {
        requestKey: key,
        type: "conversion",
        status: "completed",
        quoteId: input.quoteId,
        source: {
          walletId: "main-usd",
          accountId: "main",
          amount: "1.00",
          amountMinor: "100",
          balanceMinor: "9900",
        },
        target: {
          walletId: "main-gbp",
          accountId: "main",
          amount: "1.01",
          amountMinor: "101",
          balanceMinor: "101",
        },
        rate: { value: "1.005", date: "2026-11-11", source: "fresh" },
      },
    });
    const receipt = result.body as ConversionReceipt;
    expect(readQuote(fixture.database, input.quoteId, clock)).toMatchObject({
      state: "consumed",
      transactionId: receipt.transactionId,
    });
    expect(
      fixture.database.sqlite
        .prepare(
          "SELECT wallet_id,amount_minor FROM journal_entries WHERE transaction_id=? ORDER BY amount_minor",
        )
        .all(receipt.transactionId),
    ).toEqual([
      { wallet_id: "main-usd", amount_minor: -100n },
      { wallet_id: "main-gbp", amount_minor: 101n },
    ]);
    expect(submit(input, key)).toEqual({ ...result, replayed: true });
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(9900n);
    expect(() => JSON.stringify(result)).not.toThrow();
    expect(() =>
      fixture.database.sqlite.exec(
        "UPDATE conversion_attempts SET response='{}'",
      ),
    ).toThrow("immutable");
    expect(() =>
      fixture.database.sqlite.exec("DELETE FROM conversion_attempts"),
    ).toThrow("retained");
  });

  it.each(["EUR", "JPY"])(
    "atomically creates a missing %s currency/wallet from reviewed server metadata",
    async (targetCurrency) => {
      client.rate.mockResolvedValue({
        rate: targetCurrency === "JPY" ? "150" : "1.5",
        date: "2026-11-11",
        fetchedAt: new Date(clock).toISOString(),
      });
      const input = await preview({ targetCurrency, amount: "0.01" });
      const before = counts();
      const result = submit(input),
        receipt = result.body as ConversionReceipt;
      expect(result.status).toBe(200);
      expect(receipt.target).toMatchObject({
        accountId: "main",
        currency: targetCurrency,
        amountMinor: "2",
      });
      expect(readWalletBalance(fixture.database, receipt.target.walletId)).toBe(
        2n,
      );
      expect(counts().wallets).toEqual({ n: before.wallets!.n + 1n });
      expect(
        fixture.database.sqlite
          .prepare("SELECT account_id,currency_code FROM wallets WHERE id=?")
          .get(receipt.target.walletId),
      ).toEqual({ account_id: "main", currency_code: targetCurrency });
    },
  );

  it("replays after expiry, later spending and reopen without reading quotes or fetching/consulting the clock", async () => {
    const input = await preview(),
      key = randomUUID(),
      original = submit(input, key);
    fund();
    clock += 100000;
    const other = openDatabase(fixture.filename);
    try {
      other.sqlite.exec(
        "ALTER TABLE fx_quotes RENAME TO intentionally_unavailable_quotes",
      );
      const result = submitConversion(
        other,
        key.toUpperCase(),
        { ...input, quoteId: input.quoteId.toUpperCase() },
        {
          now: () => {
            throw new Error("Replay must not read the clock");
          },
        },
      );
      expect(result).toEqual({ ...original, replayed: true });
    } finally {
      other.close();
    }
    expect(client.rate).toHaveBeenCalledTimes(1);
  });

  it("uses the full issued minute after a cached rate crosses 24 hours, with no provider work at confirmation", async () => {
    await preview();
    client.catalog.mockRejectedValue(new Error("offline"));
    client.rate.mockRejectedValue(new Error("offline"));
    clock += FX_CACHE_LIFETIME_MS - 20000;
    const input = await preview();
    clock += 30000;
    const calls = [
      client.catalog.mock.calls.length,
      client.rate.mock.calls.length,
    ];
    expect(submit(input)).toMatchObject({
      status: 200,
      body: {
        rate: { source: "cached", fetchedAt: new Date(NOW).toISOString() },
      },
    });
    expect([
      client.catalog.mock.calls.length,
      client.rate.mock.calls.length,
    ]).toEqual(calls);
  });

  it("requires eligible catalog metadata at issuance when a target wallet is missing, even for an already known currency", async () => {
    await preview();
    fixture.database.sqlite
      .prepare("DELETE FROM wallets WHERE id='main-gbp'")
      .run();
    fixture.database.sqlite.prepare("DELETE FROM fx_catalog_cache").run();
    client.catalog.mockRejectedValue(new Error("offline"));
    client.rate.mockRejectedValue(new Error("offline"));
    await expect(preview()).rejects.toMatchObject({
      code: "QUOTE_RATE_UNAVAILABLE",
    });
    expect(
      fixture.database.sqlite
        .prepare("SELECT COUNT(*) AS n FROM fx_quotes")
        .get(),
    ).toEqual({ n: 1n });
    expect(
      fixture.database.sqlite
        .prepare("SELECT key FROM conversion_attempts")
        .all(),
    ).toEqual([]);
  });

  it("preserves the exact int64-compatible boundary without number conversion", async () => {
    fund("main-usd", MAX_MINOR - 10000n);
    client.rate.mockResolvedValue({
      rate: "1",
      date: "2026-11-11",
      fetchedAt: new Date(clock).toISOString(),
    });
    const input = await preview({ amount: "92233720368547758.07" });
    const result = submit(input);
    expect(result).toMatchObject({
      status: 200,
      body: {
        source: { amountMinor: MAX_MINOR.toString(), balanceMinor: "0" },
        target: {
          amountMinor: MAX_MINOR.toString(),
          balanceMinor: MAX_MINOR.toString(),
        },
      },
    });
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(0n);
    expect(readWalletBalance(fixture.database, "main-gbp")).toBe(MAX_MINOR);
  });

  it("converts a zero-decimal source using its accounting exponent", async () => {
    withJournalWrite(fixture.database, (scope) =>
      scope.createWallet({
        id: "main-jpy",
        accountId: "main",
        currencyCode: "JPY",
      }),
    );
    fund("main-jpy", 2n);
    client.rate.mockResolvedValue({
      rate: "0.005",
      date: "2026-11-11",
      fetchedAt: new Date(clock).toISOString(),
    });
    const input = await preview({
      sourceWalletId: "main-jpy",
      amount: "2",
      targetCurrency: "USD",
    });
    expect(submit(input)).toMatchObject({
      status: 200,
      body: {
        source: { exponent: 0, amountMinor: "2", balanceMinor: "0" },
        target: { exponent: 2, amountMinor: "1", balanceMinor: "10001" },
      },
    });
  });

  it.each([59999, 60000])(
    "validates strict quote expiry at %s ms and retains failures outside history",
    async (elapsed) => {
      const input = await preview(),
        key = randomUUID();
      clock += elapsed;
      const result = submit(input, key);
      if (elapsed < 60000) expect(result.status).toBe(200);
      else {
        expect(result).toMatchObject({
          status: 409,
          body: { code: "QUOTE_EXPIRED", definitive: true },
          replayed: false,
        });
        expect(submit(input, key)).toEqual({ ...result, replayed: true });
        expect(readWalletBalance(fixture.database, "main-usd")).toBe(10000n);
        expect(
          fixture.database.sqlite
            .prepare("SELECT quote_id FROM fx_quote_uses")
            .all(),
        ).toEqual([]);
        expect(
          fixture.database.sqlite
            .prepare("SELECT id FROM transactions WHERE type='conversion'")
            .all(),
        ).toEqual([]);
      }
    },
  );

  it("rolls back if the quote expires between final validation and use, without retaining an unconfirmed failure", async () => {
    const input = await preview({ targetCurrency: "EUR" }),
      before = counts(),
      key = randomUUID();
    let calls = 0;
    const result = submitConversion(fixture.database, key, input, {
      now: () => NOW + (++calls === 1 ? 59999 : 60000),
    });
    expect(result).toMatchObject({
      status: 503,
      body: { code: "CONVERSION_OUTCOME_UNKNOWN", definitive: false },
    });
    expect(counts()).toEqual(before);
    expect(submit(input, key).status).toBe(200);
  });

  it("replays a funds rejection even after funding changes, while a new key may still use the unconsumed quote", async () => {
    const input = await preview(),
      key = randomUUID();
    withJournalWrite(fixture.database, (scope) =>
      scope.record({
        id: randomUUID(),
        type: "withdrawal",
        sourceWalletId: "main-usd",
        amountMinor: 10000n,
        provider: "demo_bank",
      }),
    );
    const failure = submit(input, key);
    expect(failure).toMatchObject({
      status: 409,
      body: { code: "INSUFFICIENT_FUNDS", definitive: true },
    });
    fund();
    expect(submit(input, key)).toEqual({ ...failure, replayed: true });
    expect(submit(input).status).toBe(200);
  });

  it.each([
    { amount: "10" },
    { sourceWalletId: "main-gbp" },
    { targetCurrency: "JPY" },
    { quoteId: randomUUID() },
  ])(
    "rejects changed input under the same accepted key: %j",
    async (changes) => {
      const input = await preview(),
        key = randomUUID();
      submit(input, key);
      expect(submit({ ...input, ...changes }, key)).toMatchObject({
        status: 409,
        body: { code: "IDEMPOTENCY_KEY_REUSED", definitive: false },
      });
    },
  );

  it("retains quote/input mismatch for a well-shaped fresh key, without consuming the quote", async () => {
    const input = await preview(),
      key = randomUUID();
    const failure = submit({ ...input, amount: "9.00" }, key);
    expect(failure).toMatchObject({
      status: 409,
      body: { code: "QUOTE_INPUT_MISMATCH", definitive: true },
    });
    expect(readQuote(fixture.database, input.quoteId, clock).state).toBe(
      "active",
    );
    expect(submit(input, key)).toMatchObject({
      status: 409,
      body: { code: "IDEMPOTENCY_KEY_REUSED" },
    });
    expect(submit(input).status).toBe(200);
  });

  it("does not allow a new key to reuse an already successful quote", async () => {
    const input = await preview();
    submit(input);
    expect(submit(input)).toMatchObject({
      status: 409,
      body: { code: "QUOTE_ALREADY_USED", definitive: true },
    });
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(9000n);
  });

  it("retains unknown-quote 404 but leaves malformed input/key outside acceptance", () => {
    const input = {
        quoteId: randomUUID(),
        sourceWalletId: "main-usd",
        amount: "1.00",
        targetCurrency: "GBP",
      },
      key = randomUUID();
    expect(submit(input, key)).toMatchObject({
      status: 404,
      body: { code: "QUOTE_NOT_FOUND", definitive: true },
    });
    const before = counts();
    for (const invalid of [
      null,
      [],
      {},
      { ...input, quoteId: "bad" },
      { ...input, rate: "999" },
      { ...input, amount: 1 },
      { ...input, amount: "1e2" },
      { ...input, sourceWalletId: "\0" },
    ])
      expect(submit(invalid)).toMatchObject({
        status: 400,
        body: { code: "INVALID_CONVERSION_REQUEST" },
      });
    expect(submit(input, "bad").status).toBe(400);
    expect(counts()).toEqual(before);
  });

  it("never accepts a transfer quote and never creates or debits destination accounts", async () => {
    const input = await preview({
      operation: "transfer",
      recipientAccountId: "recipient",
    });
    expect(submit(input)).toMatchObject({
      status: 409,
      body: { code: "QUOTE_INPUT_MISMATCH" },
    });
    expect(readWalletBalance(fixture.database, "recipient-gbp")).toBe(0n);
  });

  it("rechecks target balance bounds at confirmation without consuming failure", async () => {
    const input = await preview();
    fund("main-gbp", MAX_MINOR);
    expect(submit(input)).toMatchObject({
      status: 409,
      body: { code: "BALANCE_OUT_OF_RANGE", definitive: true },
    });
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(10000n);
    expect(readQuote(fixture.database, input.quoteId, clock).state).toBe(
      "active",
    );
  });

  it.each([
    "currencies",
    "wallets",
    "transactions",
    "debit",
    "credit",
    "fx_quote_uses",
    "conversion_attempts",
  ])(
    "rolls back all new metadata, money and quote use when %s insertion fails",
    async (stage) => {
      const input = await preview({ targetCurrency: "EUR" }),
        key = randomUUID(),
        before = counts();
      const table = ["debit", "credit"].includes(stage)
        ? "journal_entries"
        : stage;
      const when =
        stage === "debit"
          ? "WHEN NEW.amount_minor < 0"
          : stage === "credit"
            ? "WHEN NEW.amount_minor > 0"
            : "";
      fixture.database.sqlite.exec(
        `CREATE TRIGGER fail_conversion BEFORE INSERT ON ${table} ${when} BEGIN SELECT RAISE(ABORT,'private storage path'); END;`,
      );
      const result = submit(input, key);
      expect(result).toMatchObject({
        status: 503,
        body: { code: "CONVERSION_OUTCOME_UNKNOWN", definitive: false },
      });
      expect(JSON.stringify(result)).not.toMatch(/private|storage path/);
      expect(counts()).toEqual(before);
      expect(readQuote(fixture.database, input.quoteId, clock).state).toBe(
        "active",
      );
      fixture.database.sqlite.exec("DROP TRIGGER fail_conversion");
      expect(submit(input, key).status).toBe(200);
    },
  );

  it("does not claim a definitive rejection when its error result cannot be stored", async () => {
    const input = await preview(),
      key = randomUUID();
    clock += 60000;
    fixture.database.sqlite.exec(
      "CREATE TRIGGER fail_error BEFORE INSERT ON conversion_attempts BEGIN SELECT RAISE(ABORT,'private'); END;",
    );
    expect(submit(input, key)).toMatchObject({
      status: 503,
      body: { definitive: false },
    });
    expect(
      fixture.database.sqlite
        .prepare("SELECT key FROM conversion_attempts")
        .all(),
    ).toEqual([]);
    fixture.database.sqlite.exec("DROP TRIGGER fail_error");
    expect(submit(input, key)).toMatchObject({
      status: 409,
      body: { code: "QUOTE_EXPIRED" },
      replayed: false,
    });
  });

  it("reserves keys globally across funding and conversion, including definitive errors", async () => {
    const input = await preview(),
      fundingKey = randomUUID(),
      conversionKey = randomUUID();
    expect(
      submitFunding(fixture.database, "deposit", fundingKey, {
        walletId: "main-usd",
        amount: "1.00",
        provider: "demo_bank",
      }).status,
    ).toBe(200);
    expect(submit(input, fundingKey)).toMatchObject({
      status: 409,
      body: { code: "IDEMPOTENCY_KEY_REUSED" },
    });
    const failedInput = { ...input, quoteId: randomUUID() };
    expect(submit(failedInput, conversionKey).status).toBe(404);
    expect(
      submitFunding(fixture.database, "withdrawal", conversionKey, {
        walletId: "main-usd",
        amount: "1.00",
        provider: "demo_bank",
      }),
    ).toMatchObject({ status: 409, body: { code: "IDEMPOTENCY_KEY_REUSED" } });
    expect(() =>
      fixture.database.sqlite
        .prepare(
          "INSERT INTO conversion_attempts(key,request,status,response,created_at) VALUES (?,'[]','404','{}','2026-01-01T00:00:00.000Z')",
        )
        .run(fundingKey),
    ).toThrow("funding");
    expect(() =>
      fixture.database.sqlite
        .prepare(
          "INSERT INTO funding_attempts(key,request,status,response,created_at) VALUES (?,'[]','404','{}','2026-01-01T00:00:00.000Z')",
        )
        .run(conversionKey),
    ).toThrow("conversion");
  });

  it("leaves corrupt stored receipts and quotes unconfirmed instead of fabricating a result", async () => {
    const input = await preview(),
      key = randomUUID();
    submit(input, key);
    fixture.database.sqlite.exec("DROP TRIGGER conversion_attempts_no_update");
    fixture.database.sqlite
      .prepare("UPDATE conversion_attempts SET response='{}' WHERE key=?")
      .run(key);
    expect(submit(input, key)).toMatchObject({
      status: 503,
      body: { definitive: false },
    });
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(9000n);
    const other = await preview();
    fixture.database.sqlite.exec("DROP TRIGGER fx_quotes_no_update");
    fixture.database.sqlite
      .prepare("UPDATE fx_quotes SET terms='{}' WHERE id=?")
      .run(other.quoteId);
    const before = counts();
    expect(submit(other).status).toBe(503);
    expect(counts()).toEqual(before);
  });

  it.each([
    "rate",
    "targetAmount",
    "sourceBalance",
    "transactionId",
    "quoteTime",
  ])(
    "fails closed on altered retained receipt %s without any new debit",
    async (field) => {
      const input = await preview(),
        key = randomUUID();
      const original = submit(input, key).body as ConversionReceipt;
      const altered = structuredClone(original);
      if (field === "rate") altered.rate.value = "9";
      if (field === "targetAmount") altered.target.amountMinor = "1";
      if (field === "sourceBalance")
        altered.source.balanceMinor = MAX_MINOR.toString();
      if (field === "transactionId") altered.transactionId = randomUUID();
      if (field === "quoteTime") altered.expiresAt = altered.issuedAt;
      fixture.database.sqlite.exec(
        "DROP TRIGGER conversion_attempts_no_update",
      );
      fixture.database.sqlite
        .prepare("UPDATE conversion_attempts SET response=? WHERE key=?")
        .run(JSON.stringify(altered), key);
      const before = counts();
      expect(submit(input, key)).toMatchObject({
        status: 503,
        body: { definitive: false },
      });
      expect(counts()).toEqual(before);
      expect(readWalletBalance(fixture.database, "main-usd")).toBe(9000n);
    },
  );

  it("returns an unknown result on lock timeout; retrying the same key after unlock is safe", async () => {
    const input = await preview(),
      key = randomUUID(),
      lock = new Database(fixture.filename);
    fixture.database.sqlite.pragma("busy_timeout=10");
    lock.exec("BEGIN IMMEDIATE");
    try {
      expect(submit(input, key)).toMatchObject({
        status: 503,
        body: { definitive: false },
      });
    } finally {
      lock.exec("ROLLBACK");
      lock.close();
    }
    expect(submit(input, key).status).toBe(200);
    expect(submit(input, key).replayed).toBe(true);
  });
});
