import { randomUUID } from "node:crypto";
import { expect, test, type APIRequestContext } from "@playwright/test";

async function context(request: APIRequestContext) {
  const { accounts } = await (await request.get("/api/accounts")).json();
  const accountId = accounts.find(
    (value: { role: string }) => value.role === "main",
  ).id;
  const { wallets } = await (
    await request.get(`/api/accounts/${accountId}/wallets`)
  ).json();
  return {
    accountId,
    wallet: wallets.find(
      (value: { currency: string }) => value.currency === "USD",
    ),
  };
}
async function fund(request: APIRequestContext, walletId: string) {
  const response = await request.post("/api/deposits", {
    headers: { "Idempotency-Key": randomUUID() },
    data: { walletId, amount: "5.00", provider: "demo_bank" },
  });
  expect(response.status()).toBe(200);
  return response.json();
}
test.beforeEach(({ baseURL }) => {
  test.skip(
    !baseURL?.includes("simulated-wallet-funding-preview"),
    "History monetary fixtures require the guarded disposable server, never the persistent wallet.",
  );
});

test("account-scoped history preserves exact confirmed facts and either-side UTC-day filtering", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const { accountId, wallet } = await context(request);
  await fund(request, wallet.id);
  const quoteResponse = await request.post("/api/quotes", {
    data: {
      operation: "conversion",
      sourceWalletId: wallet.id,
      amount: "1.00",
      targetCurrency: "GBP",
    },
  });
  expect(quoteResponse.status()).toBe(200);
  const { quote } = await quoteResponse.json(),
    confirmed = await request.post("/api/conversions", {
      headers: { "Idempotency-Key": randomUUID() },
      data: {
        quoteId: quote.quoteId,
        sourceWalletId: wallet.id,
        amount: "1.00",
        targetCurrency: "GBP",
      },
    });
  expect(confirmed.status()).toBe(200);
  const receipt = await confirmed.json(),
    day = receipt.createdAt.slice(0, 10);
  for (const currency of ["USD", "GBP"]) {
    const query = new URLSearchParams({
      accountId,
      type: "conversion",
      currency,
      from: day,
      to: day,
      page: "1",
      pageSize: "100",
    });
    const response = await page.request.get(`/api/transactions?${query}`);
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toBe("no-store");
    expect(response.headers()["idempotency-replayed"]).toBeUndefined();
    const body = await response.json(),
      record = body.transactions.find(
        (value: { transactionId: string }) =>
          value.transactionId === receipt.transactionId,
      );
    expect(record).toMatchObject({
      transactionId: receipt.transactionId,
      type: "conversion",
      direction: "internal",
      status: "completed",
      source: { amountMinor: "100" },
      target: { amountMinor: receipt.target.amountMinor },
      rate: {
        value: receipt.rate.value,
        date: receipt.rate.date,
        fetchedAt: receipt.rate.fetchedAt,
        source: receipt.rate.source,
      },
    });
    expect(body.pagination).toMatchObject({ page: 1, pageSize: 100 });
  }
  const detail = await page.request.get(
      `/api/transactions/${receipt.transactionId}?${new URLSearchParams({ accountId })}`,
    ),
    body = await detail.json();
  expect(detail.status()).toBe(200);
  expect(body.account.id).toBe(accountId);
  expect(body.transaction.source.amount).toBe("1.00");
  expect(JSON.stringify(body)).not.toMatch(/requestKey|balanceMinor|quoteId/u);
});

test("numbered history pages, errors and documented GET-only contracts never mutate the wallet", async ({
  request,
}) => {
  const { accountId, wallet } = await context(request),
    receipt = await fund(request, wallet.id);
  await fund(request, wallet.id);
  const balances = await (
    await request.get(`/api/accounts/${accountId}/wallets`)
  ).json();
  const query = new URLSearchParams({
      accountId,
      type: "deposit",
      page: "1",
      pageSize: "1",
    }),
    first = await (await request.get(`/api/transactions?${query}`)).json();
  query.set("page", "2");
  const second = await (await request.get(`/api/transactions?${query}`)).json();
  expect(first.transactions).toHaveLength(1);
  expect(second.transactions).toHaveLength(1);
  expect(first.transactions[0].transactionId).not.toBe(
    second.transactions[0].transactionId,
  );
  expect(first.pagination.totalItems).toBe(second.pagination.totalItems);
  query.set("page", String(first.pagination.totalPages + 1));
  expect(
    await (await request.get(`/api/transactions?${query}`)).json(),
  ).toMatchObject({
    transactions: [],
    pagination: { totalItems: first.pagination.totalItems },
  });
  const invalid = await request.get(
    `/api/transactions?accountId=${accountId}&page=0`,
  );
  expect(invalid.status()).toBe(400);
  expect(invalid.headers()["content-type"]).toBe("application/problem+json");
  expect(
    (
      await request.get(
        `/api/transactions/${receipt.transactionId}?accountId=${randomUUID()}`,
      )
    ).status(),
  ).toBe(404);
  expect(
    (
      await request.get(
        `/api/transactions/${randomUUID()}?accountId=${accountId}`,
      )
    ).status(),
  ).toBe(404);
  expect(
    (await request.post("/api/transactions", { data: { accountId } })).status(),
  ).toBe(405);
  const spec = await (await request.get("/api/openapi")).json();
  expect(Object.keys(spec.paths["/api/transactions"])).toEqual(["get"]);
  expect(Object.keys(spec.paths["/api/transactions/{transactionId}"])).toEqual([
    "get",
  ]);
  expect(spec.paths["/api/transfers"]).toBeUndefined();
  expect(
    await (await request.get(`/api/accounts/${accountId}/wallets`)).json(),
  ).toEqual(balances);
});
