import { getRuntimeDatabase } from "@/server/db/runtime";
import { createJournalFixture } from "@/server/db/test-fixture";
import { GET } from "./route";

jest.mock("server-only", () => ({}));
jest.mock("@/server/db/runtime", () => ({ getRuntimeDatabase: jest.fn() }));
describe("GET /api/portfolio", () => {
  let f: ReturnType<typeof createJournalFixture>;
  beforeEach(() => {
    f = createJournalFixture();
    jest.mocked(getRuntimeDatabase).mockReset().mockReturnValue(f.database);
  });
  afterEach(() => f.cleanup());
  it("exposes exact scoped totals and immutable technical history without changing money", async () => {
    const before = f.database.sqlite
      .prepare("SELECT * FROM journal_entries")
      .all();
    const response = await GET(
      new Request("http://wallet.test/api/portfolio?accountId=main"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body.accountId).toBe("main");
    expect(body.total).toMatchObject({
      status: "available",
      balanceMinor: "0",
      source: "balances",
    });
    expect(body.history.points).toHaveLength(1);
    expect(
      f.database.sqlite.prepare("SELECT * FROM journal_entries").all(),
    ).toEqual(before);
  });
  it.each([
    "",
    "?accountId=",
    "?accountId=main&accountId=recipient",
    "?accountId=main&unknown=x",
    "?accountId=%00",
  ])("rejects malformed context before database access: %s", async (query) => {
    const response = await GET(
      new Request(`http://wallet.test/api/portfolio${query}`),
    );
    expect(response.status).toBe(400);
    expect(getRuntimeDatabase).not.toHaveBeenCalled();
  });
  it("returns 404 for an unknown account without falling back to main", async () => {
    const response = await GET(
      new Request("http://wallet.test/api/portfolio?accountId=unknown"),
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      code: "PORTFOLIO_UNAVAILABLE",
    });
  });
  it("redacts storage errors", async () => {
    jest.mocked(getRuntimeDatabase).mockImplementation(() => {
      throw new Error("secret.sqlite");
    });
    const response = await GET(
      new Request("http://wallet.test/api/portfolio?accountId=main"),
    );
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("secret");
  });
});
