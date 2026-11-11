import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { createJournalFixture } from "../../server/db/test-fixture";
import { openDatabase } from "../../server/db/connection";
import { withJournalWrite } from "../journal/write";
import { readWalletBalance } from "../journal/balances";
import { readAccountWallets } from "../accounts/read";
import { submitFunding } from "../funding/service";
import { submitConversion } from "../conversions/service";
import { createQuote, readQuote } from "../quotes/service";
import { MAX_MINOR } from "../money/money";
import { FX_CACHE_LIFETIME_MS } from "../rates/contracts";
import { getCurrencyCatalog } from "../rates/service";
import type { QuoteRequest } from "../quotes/contracts";
import { submitTransfer } from "./service";
import type { TransferRequest, TransferReceipt } from "./contracts";

jest.mock("server-only", () => ({}));
const NOW = Date.parse("2026-11-12T12:00:00.000Z");
const currencies = [
  { code: "USD", name: "Dollar", exponent: 2 },
  { code: "GBP", name: "Pound", exponent: 2 },
  { code: "JPY", name: "Yen", exponent: 0 },
  { code: "EUR", name: "Euro", exponent: 2 },
  { code: "CAD", name: "Canadian Dollar", exponent: 2 },
];
const same: TransferRequest = {
  sourceWalletId: "main-usd",
  recipientAccountId: "recipient",
  amount: "10.00",
  targetCurrency: "USD",
};
describe("atomic simulated transfer service", () => {
  let fixture: ReturnType<typeof createJournalFixture>,
    clock: number,
    client: { catalog: jest.Mock; rate: jest.Mock };
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
  const submit = (input: unknown = same, key: unknown = randomUUID()) =>
    submitTransfer(fixture.database, key, input, { client, now: () => clock });
  const counts = () =>
    Object.fromEntries(
      [
        "currencies",
        "accounts",
        "wallets",
        "transactions",
        "journal_entries",
        "fx_quote_uses",
        "transfer_attempts",
      ].map((table) => [
        table,
        fixture.database.sqlite
          .prepare<[], { n: bigint }>(`SELECT COUNT(*) AS n FROM ${table}`)
          .get()!.n,
      ]),
    );
  async function preview(changes: Partial<QuoteRequest> = {}) {
    const request: QuoteRequest = {
      operation: "transfer",
      sourceWalletId: "main-usd",
      recipientAccountId: "recipient",
      amount: "10.00",
      targetCurrency: "GBP",
      ...changes,
    };
    const { quote } = await createQuote(fixture.database, request, {
      client,
      now: () => clock,
    });
    return {
      sourceWalletId: request.sourceWalletId,
      recipientAccountId: request.recipientAccountId!,
      amount: request.amount,
      targetCurrency: request.targetCurrency,
      ...(request.recipientDefaultCurrency
        ? { recipientDefaultCurrency: request.recipientDefaultCurrency }
        : {}),
      quoteId: quote.quoteId,
    } satisfies TransferRequest;
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

  it("moves identical minor units to an existing nondefault wallet without any provider/quote request", async () => {
    const result = await submit();
    expect(result).toMatchObject({
      status: 200,
      replayed: false,
      body: {
        type: "transfer",
        status: "completed",
        source: {
          accountId: "main",
          amountMinor: "1000",
          balanceMinor: "9000",
        },
        target: {
          accountId: "recipient",
          walletId: "recipient-usd",
          currency: "USD",
          amountMinor: "1000",
          balanceMinor: "1000",
        },
        recipient: { defaultCurrency: "GBP", created: false },
        quoteId: null,
        rate: null,
        issuedAt: null,
        expiresAt: null,
      },
    });
    expect(client.rate).not.toHaveBeenCalled();
    expect(client.catalog).not.toHaveBeenCalled();
    const receipt = result.body as TransferReceipt;
    expect(
      fixture.database.sqlite
        .prepare(
          "SELECT wallet_id,amount_minor FROM journal_entries WHERE transaction_id=? ORDER BY amount_minor",
        )
        .all(receipt.transactionId),
    ).toEqual([
      { wallet_id: "main-usd", amount_minor: -1000n },
      { wallet_id: "recipient-usd", amount_minor: 1000n },
    ]);
    expect(
      fixture.database.sqlite
        .prepare(
          "SELECT rate,rate_date,rate_fetched_at,rate_source FROM transactions WHERE id=?",
        )
        .get(receipt.transactionId),
    ).toEqual({
      rate: null,
      rate_date: null,
      rate_fetched_at: null,
      rate_source: null,
    });
    expect(
      readAccountWallets(fixture.database, "recipient").wallets.find(
        (w) => w.currency === "USD",
      ),
    ).toMatchObject({ balanceMinor: "1000" });
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it.each(["__proto__", "constructor", "a", " recipient ", "وجهة-💰"])(
    "creates arbitrary exact recipient ID %s with its chosen default and selected wallet only",
    async (recipientAccountId) => {
      const result = await submit({
        ...same,
        recipientAccountId,
        recipientDefaultCurrency: "GBP",
      });
      expect(result).toMatchObject({
        status: 200,
        body: {
          recipient: {
            accountId: recipientAccountId,
            defaultCurrency: "GBP",
            created: true,
          },
          target: { accountId: recipientAccountId, currency: "USD" },
        },
      });
      expect(
        fixture.database.sqlite
          .prepare("SELECT role,default_currency FROM accounts WHERE id=?")
          .get(recipientAccountId),
      ).toEqual({ role: "destination", default_currency: "GBP" });
      expect(
        fixture.database.sqlite
          .prepare("SELECT currency_code FROM wallets WHERE account_id=?")
          .all(recipientAccountId),
      ).toEqual([{ currency_code: "USD" }]);
      expect(client.rate).not.toHaveBeenCalled();
      expect(client.catalog).not.toHaveBeenCalled();
    },
  );

  it("defaults the target to an existing recipient's recorded default without changing it", async () => {
    const input = await preview();
    delete (input as TransferRequest).targetCurrency;
    expect(await submit(input)).toMatchObject({
      status: 200,
      body: {
        target: { currency: "GBP", amountMinor: "1005" },
        recipient: { defaultCurrency: "GBP", created: false },
        rate: { value: "1.005" },
      },
    });
    expect(
      fixture.database.sqlite
        .prepare("SELECT default_currency FROM accounts WHERE id='recipient'")
        .get(),
    ).toEqual({ default_currency: "GBP" });
  });

  it("creates a new default/target currency, recipient and exact FX credit only inside successful confirmation", async () => {
    const input = await preview({
      recipientAccountId: "new-fx",
      recipientDefaultCurrency: "EUR",
      targetCurrency: "CAD",
      amount: "1.00",
    });
    expect(
      fixture.database.sqlite
        .prepare("SELECT id FROM accounts WHERE id='new-fx'")
        .get(),
    ).toBeUndefined();
    const calls = [
        client.catalog.mock.calls.length,
        client.rate.mock.calls.length,
      ],
      result = await submit(input);
    expect(result).toMatchObject({
      status: 200,
      body: {
        source: { amountMinor: "100" },
        target: { currency: "CAD", amountMinor: "101" },
        recipient: {
          accountId: "new-fx",
          defaultCurrency: "EUR",
          defaultName: "Euro",
          defaultExponent: 2,
          created: true,
        },
        rate: { value: "1.005", date: "2026-11-11", source: "fresh" },
      },
    });
    expect([
      client.catalog.mock.calls.length,
      client.rate.mock.calls.length,
    ]).toEqual(calls);
    expect(
      fixture.database.sqlite
        .prepare(
          "SELECT code FROM currencies WHERE code IN ('EUR','CAD') ORDER BY code",
        )
        .all(),
    ).toEqual([{ code: "CAD" }, { code: "EUR" }]);
  });

  it("fetches only missing default-currency catalog metadata outside the writer, never an FX rate for a same-currency transfer", async () => {
    client.catalog.mockImplementation(async () => {
      expect(fixture.database.sqlite.inTransaction).toBe(false);
      return { currencies, fetchedAt: new Date(clock).toISOString() };
    });
    const result = await submit({
      ...same,
      recipientAccountId: "new-default",
      recipientDefaultCurrency: "EUR",
    });
    expect(result).toMatchObject({
      status: 200,
      body: {
        recipient: { defaultCurrency: "EUR", created: true },
        target: { currency: "USD" },
        rate: null,
      },
    });
    expect(client.catalog).toHaveBeenCalledTimes(1);
    expect(client.rate).not.toHaveBeenCalled();
  });

  it("uses fresh-first eligible catalog fallback only for missing default metadata", async () => {
    await getCurrencyCatalog(fixture.database, { client, now: () => clock });
    client.catalog.mockRejectedValue(new Error("offline"));
    clock += FX_CACHE_LIFETIME_MS - 1;
    expect(
      await submit({
        ...same,
        recipientAccountId: "cached-default",
        recipientDefaultCurrency: "EUR",
      }),
    ).toMatchObject({
      status: 200,
      body: {
        recipient: { defaultCurrency: "EUR", created: true },
        rate: null,
      },
    });
    expect(client.catalog).toHaveBeenCalledTimes(2);
    expect(client.rate).not.toHaveBeenCalled();
  });

  it.each(["absent", "expired", "corrupt"])(
    "keeps unavailable %s catalog nondefinitive and recovers with the original key",
    async (state) => {
      if (state !== "absent")
        await getCurrencyCatalog(fixture.database, {
          client,
          now: () => clock,
        });
      if (state === "expired") clock += FX_CACHE_LIFETIME_MS;
      if (state === "corrupt")
        fixture.database.sqlite.exec(
          "UPDATE fx_catalog_cache SET currencies='{}'",
        );
      client.catalog.mockRejectedValue(new Error("private provider failure"));
      const input = {
          ...same,
          recipientAccountId: "offline-default",
          recipientDefaultCurrency: "EUR",
        },
        key = randomUUID(),
        before = counts();
      const result = await submit(input, key);
      expect(result).toMatchObject({
        status: 503,
        body: { code: "TRANSFER_OUTCOME_UNKNOWN", definitive: false },
      });
      expect(JSON.stringify(result)).not.toContain("private provider");
      expect(counts()).toEqual(before);
      client.catalog.mockResolvedValue({
        currencies,
        fetchedAt: new Date(clock).toISOString(),
      });
      expect((await submit(input, key)).status).toBe(200);
      expect(client.rate).not.toHaveBeenCalled();
    },
  );

  it("rechecks metadata age under the writer rather than granting a quote-like hold", async () => {
    const input = {
        ...same,
        recipientAccountId: "expired-metadata",
        recipientDefaultCurrency: "EUR",
      },
      key = randomUUID(),
      before = counts();
    client.catalog.mockResolvedValue({
      currencies,
      fetchedAt: new Date(NOW).toISOString(),
    });
    let calls = 0;
    const result = await submitTransfer(fixture.database, key, input, {
      client,
      now: () =>
        ++calls < 3
          ? NOW + FX_CACHE_LIFETIME_MS - 1
          : NOW + FX_CACHE_LIFETIME_MS,
    });
    expect(result).toMatchObject({ status: 503, body: { definitive: false } });
    expect(counts()).toEqual(before);
    expect((await submit(input, key)).status).toBe(200);
  });

  it("retains an eligible catalog's unsupported-default rejection without creating anything", async () => {
    client.catalog.mockResolvedValue({
      currencies: currencies.filter((c) => c.code !== "EUR"),
      fetchedAt: new Date(clock).toISOString(),
    });
    const input = {
        ...same,
        recipientAccountId: "unlisted-default",
        recipientDefaultCurrency: "EUR",
      },
      key = randomUUID(),
      before = counts(),
      result = await submit(input, key);
    expect(result).toMatchObject({
      status: 400,
      body: { code: "INVALID_TARGET_CURRENCY", definitive: true },
    });
    expect(counts()).toEqual({ ...before, transfer_attempts: 1n });
    expect(await submit(input, key)).toEqual({ ...result, replayed: true });
  });

  it("revalidates current funds after catalog work without orphaning default metadata, account or wallet", async () => {
    client.catalog.mockImplementation(async () => {
      withJournalWrite(fixture.database, (scope) =>
        scope.record({
          id: randomUUID(),
          type: "withdrawal",
          sourceWalletId: "main-usd",
          amountMinor: 10000n,
          provider: "demo_bank",
        }),
      );
      return { currencies, fetchedAt: new Date(clock).toISOString() };
    });
    const result = await submit({
      ...same,
      recipientAccountId: "not-created",
      recipientDefaultCurrency: "EUR",
    });
    expect(result).toMatchObject({
      status: 409,
      body: { code: "INSUFFICIENT_FUNDS", definitive: true },
    });
    expect(
      fixture.database.sqlite
        .prepare("SELECT id FROM accounts WHERE id='not-created'")
        .get(),
    ).toBeUndefined();
    expect(
      fixture.database.sqlite
        .prepare("SELECT code FROM currencies WHERE code='EUR'")
        .get(),
    ).toBeUndefined();
  });

  it("revalidates a newly appearing recipient/default after catalog work", async () => {
    client.catalog.mockImplementation(async () => {
      withJournalWrite(fixture.database, (scope) =>
        scope.createDestination({
          id: "racing-recipient",
          defaultCurrency: "GBP",
        }),
      );
      return { currencies, fetchedAt: new Date(clock).toISOString() };
    });
    expect(
      await submit({
        ...same,
        recipientAccountId: "racing-recipient",
        recipientDefaultCurrency: "EUR",
      }),
    ).toMatchObject({
      status: 409,
      body: { code: "RECIPIENT_CONTEXT_CHANGED" },
    });
    expect(
      fixture.database.sqlite
        .prepare("SELECT id FROM wallets WHERE account_id='racing-recipient'")
        .all(),
    ).toEqual([]);
  });

  it("replays the winning same-key result before a delayed catalog error, without a second credit", async () => {
    const input = {
        ...same,
        recipientAccountId: "same-key-race",
        recipientDefaultCurrency: "EUR",
      },
      key = randomUUID();
    const other = openDatabase(fixture.filename);
    let winner: Awaited<ReturnType<typeof submit>> | undefined;
    client.catalog.mockImplementation(async () => {
      winner = await submitTransfer(other, key, input, {
        now: () => clock,
        client: {
          catalog: async () => ({
            currencies,
            fetchedAt: new Date(clock).toISOString(),
          }),
          rate: async () => {
            throw new Error("no rate");
          },
        },
      });
      throw new Error("late offline failure");
    });
    try {
      const result = await submit(input, key);
      expect(winner?.status).toBe(200);
      expect(result).toEqual({ ...winner, replayed: true });
    } finally {
      other.close();
    }
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(9000n);
  });

  it("copies exact input before awaits, including recipient/default and amount", async () => {
    const mutable = {
      ...same,
      recipientAccountId: "copied",
      recipientDefaultCurrency: "EUR",
    };
    client.catalog.mockImplementation(async () => {
      mutable.amount = "25";
      mutable.recipientAccountId = "changed";
      return { currencies, fetchedAt: new Date(clock).toISOString() };
    });
    expect(await submit(mutable)).toMatchObject({
      status: 200,
      body: { target: { accountId: "copied", amountMinor: "1000" } },
    });
  });

  it("replays after restart/expiry and later spending without quote reads, metadata calls or the clock", async () => {
    const input = await preview(),
      key = randomUUID(),
      original = await submit(input, key);
    fund();
    clock += 120000;
    const other = openDatabase(fixture.filename);
    try {
      other.sqlite.exec(
        "ALTER TABLE fx_quotes RENAME TO unavailable_quote_data",
      );
      expect(
        await submitTransfer(
          other,
          key.toUpperCase(),
          { ...input, quoteId: input.quoteId.toUpperCase() },
          {
            now: () => {
              throw new Error("clock");
            },
            client: {
              catalog: async () => {
                throw new Error("network");
              },
              rate: async () => {
                throw new Error("rate");
              },
            },
          },
        ),
      ).toEqual({ ...original, replayed: true });
    } finally {
      other.close();
    }
  });

  it("retains an original funds rejection after funding, while a deliberate new key may succeed", async () => {
    const input = { ...same, amount: "101.00" },
      key = randomUUID(),
      first = await submit(input, key);
    expect(first).toMatchObject({
      status: 409,
      body: { code: "INSUFFICIENT_FUNDS", definitive: true },
    });
    fund();
    expect(await submit(input, key)).toEqual({ ...first, replayed: true });
    expect((await submit(input)).status).toBe(200);
  });

  it.each([
    { amount: "10" },
    { targetCurrency: undefined },
    { recipientAccountId: "elsewhere" },
    { recipientDefaultCurrency: "GBP" },
    { quoteId: randomUUID() },
  ])(
    "rejects changed accepted input under an existing key: %j",
    async (changes) => {
      const key = randomUUID();
      await submit(same, key);
      const changed = { ...same, ...changes };
      if (changed.targetCurrency === undefined) delete changed.targetCurrency;
      expect(await submit(changed, key)).toMatchObject({
        status: 409,
        body: { code: "IDEMPOTENCY_KEY_REUSED", definitive: false },
      });
    },
  );

  it.each([
    [{ ...same, recipientAccountId: "main" }, "INVALID_RECIPIENT"],
    [{ ...same, sourceWalletId: "recipient-usd" }, "INSPECT_ONLY"],
    [{ ...same, sourceWalletId: "missing" }, "SOURCE_WALLET_NOT_FOUND"],
    [{ ...same, recipientAccountId: "new" }, "RECIPIENT_DEFAULT_REQUIRED"],
    [{ ...same, recipientDefaultCurrency: "USD" }, "RECIPIENT_CONTEXT_CHANGED"],
    [{ ...same, targetCurrency: "GBP" }, "FX_QUOTE_REQUIRED"],
    [{ ...same, quoteId: randomUUID() }, "FX_QUOTE_NOT_REQUIRED"],
    [{ ...same, targetCurrency: "ZZZ" }, "INVALID_TARGET_CURRENCY"],
    [{ ...same, amount: "0" }, "AMOUNT_OUT_OF_RANGE"],
    [{ ...same, amount: "1.001" }, "INVALID_PRECISION"],
    [{ ...same, amount: "92233720368547758.08" }, "AMOUNT_OUT_OF_RANGE"],
  ])(
    "records a pre-write business rejection without completed history: %j",
    async (input, code) => {
      const before = counts(),
        key = randomUUID(),
        result = await submit(input, key);
      expect(result).toMatchObject({ body: { code, definitive: true } });
      expect(await submit(input, key)).toEqual({ ...result, replayed: true });
      expect(counts()).toEqual({ ...before, transfer_attempts: 1n });
      expect(client.rate).not.toHaveBeenCalled();
      expect(client.catalog).not.toHaveBeenCalled();
    },
  );

  it.each([
    null,
    [],
    {},
    { ...same, amount: 1 },
    { ...same, amount: "1e2" },
    { ...same, rate: "9" },
    { ...same, recipientAccountId: "\0" },
    { ...same, recipientDefaultCurrency: undefined },
    { ...same, quoteId: "bad" },
  ])(
    "does not accept malformed input or client-owned terms: %j",
    async (input) => {
      const before = counts();
      expect(await submit(input)).toMatchObject({
        status: 400,
        body: { code: "INVALID_TRANSFER_REQUEST" },
      });
      expect(counts()).toEqual(before);
    },
  );

  it("uses strict quote expiry, full-minute cached holds and successful-use exclusivity", async () => {
    const first = await preview();
    client.catalog.mockRejectedValue(new Error("offline"));
    client.rate.mockRejectedValue(new Error("offline"));
    clock = NOW + FX_CACHE_LIFETIME_MS - 20000;
    const cached = await preview();
    clock += 30000;
    expect(await submit(cached)).toMatchObject({
      status: 200,
      body: { rate: { source: "cached" } },
    });
    expect(await submit(cached)).toMatchObject({
      status: 409,
      body: { code: "QUOTE_ALREADY_USED" },
    });
    expect(await submit(first)).toMatchObject({
      status: 409,
      body: { code: "QUOTE_EXPIRED" },
    });
  });

  it("accepts newly appearing compatible recipients without silently changing their defaults", async () => {
    const input = await preview({
      recipientAccountId: "appeared",
      recipientDefaultCurrency: "GBP",
    });
    withJournalWrite(fixture.database, (scope) =>
      scope.createDestination({ id: "appeared", defaultCurrency: "GBP" }),
    );
    expect(await submit(input)).toMatchObject({
      status: 200,
      body: { recipient: { created: false, defaultCurrency: "GBP" } },
    });
  });

  it("rolls back recipient creation and journal if the quote expires at final consumption", async () => {
    const input = await preview({
        recipientAccountId: "late-expiry",
        recipientDefaultCurrency: "GBP",
      }),
      key = randomUUID(),
      before = counts();
    let calls = 0;
    const result = await submitTransfer(fixture.database, key, input, {
      now: () => (++calls === 1 ? NOW : NOW + 60000),
    });
    expect(result).toMatchObject({
      status: 503,
      body: { code: "TRANSFER_OUTCOME_UNKNOWN", definitive: false },
    });
    expect(counts()).toEqual(before);
    expect(readQuote(fixture.database, input.quoteId, NOW).state).toBe(
      "active",
    );
    expect((await submit(input, key)).status).toBe(200);
  });

  it("never consumes a conversion quote for a transfer", async () => {
    const { quote } = await createQuote(
      fixture.database,
      {
        operation: "conversion",
        sourceWalletId: "main-usd",
        amount: "10.00",
        targetCurrency: "GBP",
      },
      { client, now: () => clock },
    );
    expect(
      await submit({ ...same, targetCurrency: "GBP", quoteId: quote.quoteId }),
    ).toMatchObject({ status: 409, body: { code: "QUOTE_INPUT_MISMATCH" } });
  });

  it.each([
    "default-currency",
    "target-currency",
    "accounts",
    "wallets",
    "transactions",
    "debit",
    "credit",
    "fx_quote_uses",
    "transfer_attempts",
  ])(
    "rolls back all creation/accounting/use after %s insertion failure",
    async (stage) => {
      const input = await preview({
          recipientAccountId: "rollback-recipient",
          recipientDefaultCurrency: "EUR",
          targetCurrency: "CAD",
        }),
        before = counts(),
        key = randomUUID();
      const table = stage.endsWith("currency")
        ? "currencies"
        : ["debit", "credit"].includes(stage)
          ? "journal_entries"
          : stage;
      const when =
        stage === "default-currency"
          ? "WHEN NEW.code='EUR'"
          : stage === "target-currency"
            ? "WHEN NEW.code='CAD'"
            : stage === "debit"
              ? "WHEN NEW.amount_minor<0"
              : stage === "credit"
                ? "WHEN NEW.amount_minor>0"
                : "";
      fixture.database.sqlite.exec(
        `CREATE TRIGGER fail_transfer BEFORE INSERT ON ${table} ${when} BEGIN SELECT RAISE(ABORT,'private path'); END;`,
      );
      const result = await submit(input, key);
      expect(result).toMatchObject({
        status: 503,
        body: { code: "TRANSFER_OUTCOME_UNKNOWN", definitive: false },
      });
      expect(JSON.stringify(result)).not.toContain("private path");
      expect(counts()).toEqual(before);
      expect(readQuote(fixture.database, input.quoteId, clock).state).toBe(
        "active",
      );
      fixture.database.sqlite.exec("DROP TRIGGER fail_transfer");
      expect((await submit(input, key)).status).toBe(200);
    },
  );

  it("rolls back same-currency account creation if the retained result cannot be stored", async () => {
    const before = counts();
    fixture.database.sqlite.exec(
      "CREATE TRIGGER fail_same_result BEFORE INSERT ON transfer_attempts BEGIN SELECT RAISE(ABORT,'private'); END;",
    );
    expect(
      (
        await submit({
          ...same,
          recipientAccountId: "no-orphan",
          recipientDefaultCurrency: "USD",
        })
      ).status,
    ).toBe(503);
    expect(counts()).toEqual(before);
  });

  it("does not claim a definitive error if failure persistence is unavailable", async () => {
    fixture.database.sqlite.exec(
      "CREATE TRIGGER fail_error BEFORE INSERT ON transfer_attempts BEGIN SELECT RAISE(ABORT,'private'); END;",
    );
    expect(await submit({ ...same, recipientAccountId: "main" })).toMatchObject(
      { status: 503, body: { definitive: false } },
    );
    expect(
      fixture.database.sqlite
        .prepare("SELECT key FROM transfer_attempts")
        .all(),
    ).toEqual([]);
  });

  it("retains immutable outcomes and enforces key ownership across all three features", async () => {
    const key = randomUUID(),
      first = await submit(same, key);
    expect(first.status).toBe(200);
    expect(
      submitFunding(fixture.database, "deposit", key, {
        walletId: "main-usd",
        amount: "1.00",
        provider: "demo_bank",
      }),
    ).toMatchObject({ status: 409, body: { code: "IDEMPOTENCY_KEY_REUSED" } });
    expect(
      submitConversion(fixture.database, key, {
        quoteId: randomUUID(),
        sourceWalletId: "main-usd",
        amount: "1.00",
        targetCurrency: "GBP",
      }),
    ).toMatchObject({ status: 409, body: { code: "IDEMPOTENCY_KEY_REUSED" } });
    expect(() =>
      fixture.database.sqlite.exec(
        "UPDATE transfer_attempts SET response='{}'",
      ),
    ).toThrow("immutable");
    expect(() =>
      fixture.database.sqlite.exec("DELETE FROM transfer_attempts"),
    ).toThrow("retained");
    for (const table of ["funding_attempts", "conversion_attempts"])
      expect(() =>
        fixture.database.sqlite
          .prepare(
            `INSERT INTO ${table}(key,request,status,response,created_at) VALUES (?,'[]','404','{}','2026-01-01T00:00:00.000Z')`,
          )
          .run(key),
      ).toThrow("transfer");
    for (const kind of ["funding", "conversion"]) {
      const otherKey = randomUUID();
      if (kind === "funding")
        submitFunding(fixture.database, "deposit", otherKey, {
          walletId: "main-usd",
          amount: "1.00",
          provider: "demo_bank",
        });
      else
        submitConversion(fixture.database, otherKey, {
          quoteId: randomUUID(),
          sourceWalletId: "main-usd",
          amount: "1.00",
          targetCurrency: "GBP",
        });
      expect(await submit(same, otherKey)).toMatchObject({
        status: 409,
        body: { code: "IDEMPOTENCY_KEY_REUSED" },
      });
      expect(() =>
        fixture.database.sqlite
          .prepare(
            "INSERT INTO transfer_attempts(key,request,status,response,created_at) VALUES (?,'[]','404','{}','2026-01-01T00:00:00.000Z')",
          )
          .run(otherKey),
      ).toThrow(kind);
    }
  });

  it("checks exact int64 bounds and original target capacity for same-currency sends", async () => {
    fund("main-usd", MAX_MINOR - 10000n);
    const result = await submit({ ...same, amount: "92233720368547758.07" });
    expect(result).toMatchObject({
      status: 200,
      body: {
        source: { balanceMinor: "0" },
        target: { balanceMinor: MAX_MINOR.toString() },
      },
    });
    fund();
    expect(await submit(same)).toMatchObject({
      status: 409,
      body: { code: "BALANCE_OUT_OF_RANGE" },
    });
  });

  it("fails closed on corrupted retained receipts and quotes without another operation", async () => {
    const key = randomUUID();
    await submit(same, key);
    fixture.database.sqlite.exec("DROP TRIGGER transfer_attempts_no_update");
    fixture.database.sqlite
      .prepare("UPDATE transfer_attempts SET response='{}' WHERE key=?")
      .run(key);
    const before = counts();
    expect((await submit(same, key)).status).toBe(503);
    expect(counts()).toEqual(before);
    const input = await preview();
    fixture.database.sqlite.exec("DROP TRIGGER fx_quotes_no_update");
    fixture.database.sqlite
      .prepare("UPDATE fx_quotes SET terms='{}' WHERE id=?")
      .run(input.quoteId);
    expect((await submit(input)).status).toBe(503);
  });

  it.each(["same", "fx"])(
    "refuses a caller-owned transaction for %s without accepting a key",
    async (kind) => {
      const input = kind === "fx" ? await preview() : same,
        key = randomUUID(),
        before = counts();
      fixture.database.sqlite.exec("BEGIN IMMEDIATE");
      try {
        expect(await submit(input, key)).toMatchObject({
          status: 503,
          body: { definitive: false },
        });
        expect(fixture.database.sqlite.inTransaction).toBe(true);
        expect(counts()).toEqual(before);
      } finally {
        fixture.database.sqlite.exec("ROLLBACK");
      }
      expect((await submit(input, key)).status).toBe(200);
    },
  );

  it("moves whole zero-decimal units without an FX request and rejects fractional units", async () => {
    withJournalWrite(fixture.database, (scope) =>
      scope.createWallet({
        id: "main-jpy",
        accountId: "main",
        currencyCode: "JPY",
      }),
    );
    fund("main-jpy", 100n);
    const input = {
      sourceWalletId: "main-jpy",
      recipientAccountId: "yen-recipient",
      recipientDefaultCurrency: "JPY",
      amount: "75",
    };
    expect(await submit(input)).toMatchObject({
      status: 200,
      body: {
        source: { amount: "75", amountMinor: "75", balanceMinor: "25" },
        target: { currency: "JPY", amountMinor: "75", balanceMinor: "75" },
      },
    });
    expect(await submit({ ...input, amount: "0.1" })).toMatchObject({
      status: 400,
      body: { code: "INVALID_PRECISION" },
    });
    expect(client.catalog).not.toHaveBeenCalled();
    expect(client.rate).not.toHaveBeenCalled();
  });

  it.each(["source", "target"])(
    "uses reviewed exact half-up FX with a zero-decimal %s",
    async (side) => {
      if (side === "source") {
        withJournalWrite(fixture.database, (scope) =>
          scope.createWallet({
            id: "main-jpy",
            accountId: "main",
            currencyCode: "JPY",
          }),
        );
        fund("main-jpy", 100n);
      }
      client.rate.mockResolvedValue({
        rate: side === "source" ? "0.005" : "1.5",
        date: "2026-11-11",
        fetchedAt: new Date(clock).toISOString(),
      });
      const input = await preview({
        sourceWalletId: side === "source" ? "main-jpy" : "main-usd",
        targetCurrency: side === "source" ? "GBP" : "JPY",
        amount: "1",
      });
      expect(await submit(input)).toMatchObject({
        status: 200,
        body: {
          source: { amountMinor: side === "source" ? "1" : "100" },
          target: { amountMinor: side === "source" ? "1" : "2" },
        },
      });
    },
  );

  it.each(["amount", "recipient", "default", "target", "source"])(
    "cannot use a quote with changed %s input",
    async (field) => {
      const input = await preview({
          recipientAccountId: "bound-recipient",
          recipientDefaultCurrency: "GBP",
        }),
        changes = {
          amount: { amount: "10" },
          recipient: { recipientAccountId: "another-recipient" },
          default: { recipientDefaultCurrency: "JPY" },
          target: { targetCurrency: "JPY" },
          source: { sourceWalletId: "main-gbp", targetCurrency: "USD" },
        }[field];
      if (field === "source") fund("main-gbp");
      const before = counts();
      expect(await submit({ ...input, ...changes })).toMatchObject({
        status: 409,
        body: { code: "QUOTE_INPUT_MISMATCH", definitive: true },
      });
      expect(counts()).toEqual({
        ...before,
        transfer_attempts: before.transfer_attempts! + 1n,
      });
      expect(readQuote(fixture.database, input.quoteId, clock).state).toBe(
        "active",
      );
    },
  );

  it("retains a missing quote rejection and does not create the recipient", async () => {
    const before = counts();
    expect(
      await submit({
        ...same,
        recipientAccountId: "missing-quote",
        recipientDefaultCurrency: "GBP",
        targetCurrency: "GBP",
        quoteId: randomUUID(),
      }),
    ).toMatchObject({
      status: 404,
      body: { code: "QUOTE_NOT_FOUND", definitive: true },
    });
    expect(counts()).toEqual({ ...before, transfer_attempts: 1n });
  });

  it("returns unknown on a lock timeout and safely retries the identical key after unlock", async () => {
    const key = randomUUID(),
      lock = new Database(fixture.filename);
    fixture.database.sqlite.pragma("busy_timeout=10");
    lock.exec("BEGIN IMMEDIATE");
    try {
      expect(await submit(same, key)).toMatchObject({
        status: 503,
        body: { definitive: false },
      });
    } finally {
      lock.exec("ROLLBACK");
      lock.close();
    }
    expect((await submit(same, key)).status).toBe(200);
    expect((await submit(same, key)).replayed).toBe(true);
  });
});
