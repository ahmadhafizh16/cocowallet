import { GET as list } from "@/app/api/transactions/route";
import { GET as detail } from "@/app/api/transactions/[transactionId]/route";
import { getRuntimeDatabase } from "../db/runtime";
import { createHistoryFixture } from "@/features/history/test-fixture";
import { readApiDocument } from "./openapi";
import { assertContract } from "@/test/json-contract";
import { openDatabase } from "../db/connection";
import { migrateDatabase } from "../db/migrate";

jest.mock("server-only", () => ({}));
jest.mock("../db/runtime", () => ({ getRuntimeDatabase: jest.fn() }));
describe("history HTTP boundary", () => {
  let fixture: ReturnType<typeof createHistoryFixture>;
  beforeEach(() => {
    fixture = createHistoryFixture();
    jest.mocked(getRuntimeDatabase).mockReturnValue(fixture.database);
  });
  afterEach(() => fixture.cleanup());
  const request = (query = "accountId=main") =>
    new Request(`http://localhost/api/transactions?${query}`);
  const read = (id = "transfer-tie-z", query = "accountId=main") =>
    detail(request(query), { params: Promise.resolve({ transactionId: id }) });
  it("returns exact no-store numbered-page and detail bodies matching their published schemas", async () => {
    const response = list(
        request(
          "accountId=main&type=transfer&currency=GBP&from=2026-11-12&to=2026-11-12&page=1&pageSize=1",
        ),
      ),
      page = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.has("Idempotency-Replayed")).toBe(false);
    expect(page).toMatchObject({
      transactions: [
        {
          transactionId: "transfer-tie-z",
          direction: "outgoing",
          source: { amountMinor: "100" },
          target: { amountMinor: "80" },
        },
      ],
      pagination: { page: 1, pageSize: 1, totalItems: 1, totalPages: 1 },
    });
    assertContract(
      page,
      readApiDocument.components.schemas.HistoryPage,
      readApiDocument.components.schemas,
    );
    const incoming = await read("transfer-tie-z", "accountId=recipient"),
      body = await incoming.json();
    expect(incoming.status).toBe(200);
    expect(body).toMatchObject({
      account: { id: "recipient", inspectOnly: true },
      transaction: { direction: "incoming", rate: { value: "0.8000" } },
    });
    assertContract(
      body,
      readApiDocument.components.schemas.HistoryDetail,
      readApiDocument.components.schemas,
    );
    expect(JSON.stringify(body)).not.toMatch(
      /requestKey|balanceMinor|quoteId/u,
    );
  });
  it.each([
    "",
    "accountId=",
    "accountId=main&accountId=recipient",
    "accountId=main&page=0",
    "accountId=main&pageSize=101",
    "accountId=main&page=9007199254740992",
    "accountId=main&from=2026-02-30",
    "accountId=main&from=2026-11-13&to=2026-11-12",
    "accountId=main&currency=ZZZ",
    "accountId=main&cursor=abc",
    "accountId=main&__proto__=other",
  ])(
    "rejects malformed list query before database acquisition: %s",
    async (query) => {
      const response = list(request(query)),
        body = await response.json();
      expect(response.status).toBe(400);
      expect(getRuntimeDatabase).not.toHaveBeenCalled();
      expect(body.code).toBe("INVALID_HISTORY_QUERY");
      assertContract(
        body,
        readApiDocument.components.schemas.HistoryProblem,
        readApiDocument.components.schemas,
      );
    },
  );
  it.each(["", "accountId=main&page=1", "accountId=main&accountId=recipient"])(
    "rejects malformed detail query before storage: %s",
    async (query) => {
      expect((await read("transfer-tie-z", query)).status).toBe(400);
      expect(getRuntimeDatabase).not.toHaveBeenCalled();
    },
  );
  it.each(["", " ", "\0", "x".repeat(8193)])(
    "rejects malformed transaction ID before storage",
    async (id) => {
      const response = await read(id);
      expect(response.status).toBe(400);
      expect((await response.json()).code).toBe("INVALID_TRANSACTION_ID");
      expect(getRuntimeDatabase).not.toHaveBeenCalled();
    },
  );
  it("returns 404 for missing accounts and missing/unrelated transaction IDs without disclosing records", async () => {
    expect(list(request("accountId=missing")).status).toBe(404);
    const missing = await read("missing", "accountId=recipient"),
      foreign = await read("deposit-start", "accountId=recipient");
    expect(foreign.status).toBe(404);
    expect(await foreign.json()).toEqual(await missing.json());
    expect((await read("transfer-tie-z", "accountId=missing")).status).toBe(
      404,
    );
  });
  it("redacts unexpected storage and parameter-resolution errors", async () => {
    jest.mocked(getRuntimeDatabase).mockImplementation(() => {
      throw new Error("private /app/data/wallet.sqlite stack");
    });
    for (const response of [
      list(request()),
      await read(),
      await detail(request(), {
        params: Promise.reject(new Error("private parameters")),
      }),
    ]) {
      expect(response.status).toBe(503);
      expect(response.headers.get("content-type")).toBe(
        "application/problem+json",
      );
      expect(response.headers.get("cache-control")).toBe("no-store");
      const body = await response.json();
      expect(body.code).toBe("HISTORY_DATA_UNAVAILABLE");
      expect(JSON.stringify(body)).not.toMatch(/private|\/app|sqlite|stack/u);
      assertContract(
        body,
        readApiDocument.components.schemas.HistoryProblem,
        readApiDocument.components.schemas,
      );
    }
  });
  it("returns unavailable data rather than fabricated history for a damaged selected transaction", async () => {
    fixture.database.sqlite.exec(
      "DROP TRIGGER transactions_no_update; UPDATE transactions SET rate='0' WHERE id='transfer-tie-z';",
    );
    for (const response of [list(request()), await read()]) {
      expect(response.status).toBe(503);
      expect((await response.json()).code).toBe("HISTORY_DATA_UNAVAILABLE");
    }
  });
  it("never seeds an uninitialized database", async () => {
    const empty = openDatabase(":memory:");
    try {
      migrateDatabase(empty);
      jest.mocked(getRuntimeDatabase).mockReturnValue(empty);
      const before = empty.sqlite.prepare("SELECT total_changes() AS n").get();
      for (const response of [list(request()), await read()]) {
        expect(response.status).toBe(503);
        expect((await response.json()).code).toBe("ACCOUNT_NOT_INITIALIZED");
      }
      expect(
        empty.sqlite.prepare("SELECT COUNT(*) AS n FROM accounts").get(),
      ).toEqual({ n: 0n });
      expect(empty.sqlite.prepare("SELECT total_changes() AS n").get()).toEqual(
        before,
      );
    } finally {
      empty.close();
    }
  });
});
