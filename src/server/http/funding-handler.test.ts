import { randomUUID } from "node:crypto";
import { POST as deposit } from "@/app/api/deposits/route";
import { POST as withdraw } from "@/app/api/withdrawals/route";
import { createJournalFixture } from "../db/test-fixture";
import { getRuntimeDatabase } from "../db/runtime";

jest.mock("../db/runtime", () => ({ getRuntimeDatabase: jest.fn() }));

describe("funding HTTP boundary", () => {
  let fixture: ReturnType<typeof createJournalFixture>;
  beforeEach(() => {
    fixture = createJournalFixture();
    jest.mocked(getRuntimeDatabase).mockReturnValue(fixture.database);
  });
  afterEach(() => fixture.cleanup());
  const body = { walletId: "main-usd", amount: "10.00", provider: "demo_bank" };
  const request = (
    key = randomUUID(),
    data = JSON.stringify(body),
    headers: Record<string, string> = {},
  ) =>
    new Request("http://localhost:3000/api/deposits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": key,
        ...headers,
      },
      body: data,
    });

  it("returns exact receipts and replay headers from both thin handlers", async () => {
    const key = randomUUID();
    const first = await deposit(request(key));
    expect(first.status).toBe(200);
    expect(first.headers.get("cache-control")).toBe("no-store");
    expect(first.headers.get("idempotency-replayed")).toBe("false");
    const saved = await first.json();
    expect(saved).toMatchObject({
      amountMinor: "1000",
      balanceMinor: "1000",
      requestKey: key,
    });
    const replay = await deposit(request(key));
    expect(replay.headers.get("idempotency-replayed")).toBe("true");
    expect(await replay.json()).toEqual(saved);
    expect((await withdraw(request())).status).toBe(200);
  });

  it.each([
    [{ "Content-Type": "text/plain" }, JSON.stringify(body)],
    [{ "Idempotency-Key": "invalid" }, JSON.stringify(body)],
    [{ Origin: "http://evil.example" }, JSON.stringify(body)],
    [{ "sec-fetch-site": "cross-site" }, JSON.stringify(body)],
    [{}, "{"],
    [{}, "x".repeat(16385)],
  ])(
    "rejects malformed/cross-origin request before storage: %j",
    async (headers, data) => {
      const response = await deposit(request(randomUUID(), data, headers));
      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toBe(
        "application/problem+json",
      );
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(getRuntimeDatabase).not.toHaveBeenCalled();
      expect(
        fixture.database.sqlite
          .prepare("SELECT key FROM funding_attempts")
          .all(),
      ).toEqual([]);
    },
  );

  it("redacts unavailable storage and explicitly leaves the outcome unknown", async () => {
    jest.mocked(getRuntimeDatabase).mockImplementation(() => {
      throw new Error("secret /app/data/sqlite");
    });
    const response = await deposit(request());
    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data).toMatchObject({
      definitive: false,
      code: "FUNDING_OUTCOME_UNKNOWN",
    });
    expect(JSON.stringify(data)).not.toMatch(/secret|\/app|sqlite/);
  });

  it("uses the direct Host authority rather than Next's internal bind-address URL", async () => {
    const response = await deposit(
      new Request("http://0.0.0.0:3000/api/deposits", {
        method: "POST",
        headers: {
          Host: "wallet.test:3000",
          Origin: "http://wallet.test:3000",
          "Content-Type": "application/json",
          "Idempotency-Key": randomUUID(),
        },
        body: JSON.stringify(body),
      }),
    );
    expect(response.status).toBe(200);
  });
});
