import {
  historyDateContract,
  normalizeHistoryQuery,
  parseHistoryAccount,
  parseHistoryQuery,
} from "./contracts";
import { integerContract } from "../../lib/contracts";

describe("history query contracts", () => {
  const parse = (query: string) =>
    parseHistoryQuery(new URLSearchParams(query));
  it("uses explicit exact account context and numbered-page defaults", () => {
    expect(parse("accountId=+recipient+")).toEqual({
      accountId: " recipient ",
      page: 1,
      pageSize: 50,
    });
    expect(
      parse(
        "accountId=constructor&page=2&pageSize=100&type=conversion&currency=GBP&from=2026-11-12&to=2026-11-12",
      ),
    ).toEqual({
      accountId: "constructor",
      page: 2,
      pageSize: 100,
      type: "conversion",
      currency: "GBP",
      from: "2026-11-12",
      to: "2026-11-12",
    });
  });
  it("accepts one exact transaction ID without changing its bytes", () =>
    expect(
      parse("accountId=main&transactionId=+legacy+%F0%9F%8C%8D+"),
    ).toMatchObject({ transactionId: " legacy 🌍 " }));
  it.each(["2024-02-29", "2000-02-29", "0000-01-01", "9999-12-31"])(
    "accepts canonical UTC calendar day %s",
    (day) => expect(historyDateContract.is(day)).toBe(true),
  );
  it.each([
    "2026-02-29",
    "1900-02-29",
    "2026-02-30",
    "2026-13-01",
    "2026-00-01",
    "2026-11-00",
    "2026-1-01",
    "2026-11-12T00:00:00Z",
    "2026-11-12\n",
  ])("rejects invalid calendar day %j", (day) =>
    expect(historyDateContract.is(day)).toBe(false),
  );
  it.each([
    "",
    "accountId=",
    "accountId=+",
    "accountId=%00",
    "accountId=main&accountId=other",
    "accountId=main&type=deposit&type=withdrawal",
    "accountId=main&transactionId=one&transactionId=two",
    "accountId=main&transactionId=",
    "accountId=main&transactionId=%00",
    "accountId=main&currency=usd",
    "accountId=main&currency=ZZZ",
    "accountId=main&type=DEPOSIT",
    "accountId=main&type=unknown",
    "accountId=main&from=2026-11-13&to=2026-11-12",
    "accountId=main&page=0",
    "accountId=main&page=-1",
    "accountId=main&page=01",
    "accountId=main&page=1.5",
    "accountId=main&page=1e2",
    "accountId=main&page=9007199254740992",
    "accountId=main&page=1%0A",
    "accountId=main&pageSize=0",
    "accountId=main&pageSize=101",
    "accountId=main&pageSize=01",
    "accountId=main&cursor=abc",
    "accountId=main&sort=oldest",
    "accountId=main&__proto__=x",
  ])("rejects malformed/duplicate/unknown filter %s", (query) =>
    expect(() => parse(query)).toThrow(
      expect.objectContaining({ code: "INVALID_HISTORY_QUERY" }),
    ),
  );
  it("supports pinned historical accounting codes without a fresh catalog", () =>
    expect(parse("accountId=main&currency=CLF").currency).toBe("CLF"));
  it("accepts the largest exact JSON page without overflowing offset arithmetic", () =>
    expect(
      parse("accountId=main&page=9007199254740991&pageSize=100").page,
    ).toBe(Number.MAX_SAFE_INTEGER));
  it.each([
    null,
    [],
    {},
    { accountId: "main", page: "2" },
    { accountId: "main", page: Infinity },
    { accountId: "main", pageSize: 1.5 },
    { accountId: "main", from: undefined },
    { accountId: "main", extra: true },
  ])("validates internal callers too: %j", (value) =>
    expect(() => normalizeHistoryQuery(value)).toThrow(
      expect.objectContaining({ code: "INVALID_HISTORY_QUERY" }),
    ),
  );
  it("requires accountId as the detail endpoint's only query field", () => {
    expect(parseHistoryAccount(new URLSearchParams("accountId=main"))).toBe(
      "main",
    );
    for (const query of [
      "",
      "accountId=main&page=1",
      "accountId=main&accountId=other",
    ])
      expect(() => parseHistoryAccount(new URLSearchParams(query))).toThrow();
  });
  it.each([
    NaN,
    Infinity,
    -Infinity,
    -0,
    0,
    1.5,
    Number.MAX_SAFE_INTEGER + 1,
    "1",
    1n,
  ])("never coerces unsafe numeric pagination %s", (value) =>
    expect(
      integerContract({ minimum: 1, maximum: Number.MAX_SAFE_INTEGER }).is(
        value,
      ),
    ).toBe(false),
  );
});
