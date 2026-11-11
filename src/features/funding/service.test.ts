import { randomUUID } from "node:crypto";
import { openDatabase } from "../../server/db/connection";
import { createJournalFixture } from "../../server/db/test-fixture";
import { readWalletBalance } from "../journal/balances";
import { MAX_MINOR } from "../money/money";
import { submitFunding } from "./service";

describe("durable simulated funding", () => {
  let fixture: ReturnType<typeof createJournalFixture>;
  beforeEach(() => {
    fixture = createJournalFixture();
  });
  afterEach(() => fixture.cleanup());
  const input = (
    amount = "100.00",
    walletId = "main-usd",
    provider = "demo_bank",
  ) => ({ walletId, amount, provider });
  const submit = (
    kind: "deposit" | "withdrawal",
    amount = "100.00",
    key = randomUUID(),
    wallet = "main-usd",
  ) => submitFunding(fixture.database, kind, key, input(amount, wallet));
  const counts = () =>
    ["funding_attempts", "transactions", "journal_entries"].map((table) =>
      fixture.database.sqlite
        .prepare(`SELECT COUNT(*) AS n FROM ${table}`)
        .get(),
    );

  it("commits exact funding, original receipt and key atomically; replay survives later changes", () => {
    const key = randomUUID();
    const first = submit("deposit", "100.00", key);
    expect(first).toMatchObject({
      status: 200,
      replayed: false,
      body: { amountMinor: "10000", balanceMinor: "10000", type: "deposit" },
    });
    expect(submit("withdrawal", "25.50")).toMatchObject({
      status: 200,
      body: { amountMinor: "2550", balanceMinor: "7450" },
    });
    expect(submit("deposit", "100.00", key)).toEqual({
      ...first,
      replayed: true,
    });
    expect(readWalletBalance(fixture.database, "main-usd")).toBe(7450n);
    expect(counts()).toEqual([{ n: 2n }, { n: 2n }, { n: 2n }]);
  });

  it("retains definitive failures even after funds arrive, without history clutter", () => {
    const key = randomUUID();
    const first = submit("withdrawal", "10.00", key);
    expect(first).toMatchObject({
      status: 409,
      body: { code: "INSUFFICIENT_FUNDS", definitive: true },
    });
    submit("deposit");
    expect(submit("withdrawal", "10.00", key)).toEqual({
      ...first,
      replayed: true,
    });
    expect(counts()).toEqual([{ n: 2n }, { n: 1n }, { n: 1n }]);
  });

  it.each([
    ["deposit", "1.00", "main-usd", "demo_bank"],
    ["deposit", "100", "main-usd", "demo_bank"],
    ["deposit", "100.00", "main-gbp", "demo_bank"],
    ["deposit", "100.00", "main-usd", "community_bank"],
    ["withdrawal", "100.00", "main-usd", "demo_bank"],
  ] as const)(
    "rejects changed key input %s %s %s %s",
    (kind, amount, walletId, provider) => {
      const key = randomUUID();
      submit("deposit", "100.00", key);
      expect(
        submitFunding(
          fixture.database,
          kind,
          key,
          input(amount, walletId, provider),
        ),
      ).toMatchObject({
        status: 409,
        body: { code: "IDEMPOTENCY_KEY_REUSED", definitive: false },
      });
      expect(readWalletBalance(fixture.database, "main-usd")).toBe(10000n);
    },
  );

  it.each([
    null,
    [],
    {},
    { ...input(), extra: true },
    input("1e2"),
    input("-1"),
    input("1\n"),
    input("01"),
    input("1", ""),
    input("1", "x\0x"),
    input("1", "main-usd", "bank"),
    { ...input(), amount: 1 },
  ])("rejects malformed input before accepting a key: %j", (request) => {
    expect(
      submitFunding(fixture.database, "deposit", randomUUID(), request).status,
    ).toBe(400);
    expect(counts()).toEqual([{ n: 0n }, { n: 0n }, { n: 0n }]);
  });

  it.each(["0", "1.001", "92233720368547758.08"])(
    "records amount validation result for %s",
    (amount) => {
      const key = randomUUID();
      const first = submit("deposit", amount, key);
      expect(first).toMatchObject({ status: 400, body: { definitive: true } });
      expect(submit("deposit", amount, key)).toEqual({
        ...first,
        replayed: true,
      });
      expect(counts()).toEqual([{ n: 1n }, { n: 0n }, { n: 0n }]);
    },
  );

  it("supports exact int64 maximum and zero-decimal wallets, refusing overflow", () => {
    fixture.database.sqlite
      .prepare(
        "INSERT INTO wallets (id,account_id,currency_code,created_at) VALUES ('main-jpy','main','JPY',?)",
      )
      .run(new Date().toISOString());
    expect(submit("deposit", "92233720368547758.07")).toMatchObject({
      status: 200,
      body: { amountMinor: MAX_MINOR.toString() },
    });
    expect(submit("deposit", "0.01")).toMatchObject({
      status: 409,
      body: { code: "BALANCE_OUT_OF_RANGE" },
    });
    expect(submit("deposit", "17", randomUUID(), "main-jpy")).toMatchObject({
      status: 200,
      body: { amountMinor: "17", exponent: 0 },
    });
  });

  it.each(["deposit", "withdrawal"] as const)(
    "enforces wallet existence and inspect-only rules for %s",
    (kind) => {
      expect(submit(kind, "1", randomUUID(), "missing")).toMatchObject({
        status: 404,
        body: { definitive: true, code: "WALLET_NOT_FOUND" },
      });
      expect(submit(kind, "1", randomUUID(), "recipient-gbp")).toMatchObject({
        status: 409,
        body: { definitive: true, code: "INSPECT_ONLY" },
      });
      expect(counts()).toEqual([{ n: 2n }, { n: 0n }, { n: 0n }]);
    },
  );

  it("rolls back journal if durable success recording fails; same key can safely retry", () => {
    const key = randomUUID();
    fixture.database.sqlite.exec(
      "CREATE TRIGGER fail_result BEFORE INSERT ON funding_attempts BEGIN SELECT RAISE(ABORT, 'private storage error'); END;",
    );
    const result = submit("deposit", "10", key);
    expect(result).toMatchObject({ status: 503, body: { definitive: false } });
    expect(JSON.stringify(result)).not.toContain("private");
    expect(counts()).toEqual([{ n: 0n }, { n: 0n }, { n: 0n }]);
    fixture.database.sqlite.exec("DROP TRIGGER fail_result");
    expect(submit("deposit", "10", key).status).toBe(200);
  });

  it("cannot report definitive failure if its storage fails, and cannot swallow journal failures", () => {
    fixture.database.sqlite.exec(
      "CREATE TRIGGER fail_result BEFORE INSERT ON funding_attempts BEGIN SELECT RAISE(ABORT, 'private'); END;",
    );
    expect(submit("withdrawal", "1")).toMatchObject({
      status: 503,
      body: { definitive: false },
    });
    fixture.database.sqlite.exec(
      "DROP TRIGGER fail_result; CREATE TRIGGER fail_entry BEFORE INSERT ON journal_entries BEGIN SELECT RAISE(ABORT, 'private'); END;",
    );
    expect(submit("deposit", "1").status).toBe(503);
    expect(counts()).toEqual([{ n: 0n }, { n: 0n }, { n: 0n }]);
  });

  it("replays after a fresh connection and treats UUID casing/property order as immaterial", () => {
    const key = randomUUID();
    const first = submit("deposit", "2.50", key);
    const other = openDatabase(fixture.filename);
    try {
      expect(
        submitFunding(other, "deposit", key.toUpperCase(), {
          provider: "demo_bank",
          amount: "2.50",
          walletId: "main-usd",
        }),
      ).toEqual({ ...first, replayed: true });
    } finally {
      other.close();
    }
  });

  it("enforces append-only retention and rejects nested submission", () => {
    submit("deposit");
    expect(() =>
      fixture.database.sqlite.exec("DELETE FROM funding_attempts"),
    ).toThrow();
    expect(() =>
      fixture.database.sqlite.exec(
        "UPDATE funding_attempts SET response = '{}' ",
      ),
    ).toThrow();
    fixture.database.sqlite.transaction(() => {
      expect(submit("deposit").status).toBe(503);
    })();
    expect(counts()).toEqual([{ n: 1n }, { n: 1n }, { n: 1n }]);
  });
});
