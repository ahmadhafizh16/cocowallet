import { expect, test } from "@playwright/test";

test.beforeEach(async ({ baseURL }) => {
  test.skip(
    !baseURL?.includes("simulated-wallet-funding-preview"),
    "Requires the disposable database and explicit reference fixtures, never the ordinary wallet.",
  );
});

test("browser-created server quotes bind exact terms without moving or reserving funds", async ({
  page,
  request,
}) => {
  const { accounts } = await (await request.get("/api/accounts")).json();
  const account = accounts.find((a: { role: string }) => a.role === "main");
  const { wallets } = await (
    await request.get(`/api/accounts/${account.id}/wallets`)
  ).json();
  const source = wallets.find(
    (w: { currency: string }) => w.currency === "USD",
  );
  expect(
    (
      await request.post("/api/deposits", {
        headers: { "Idempotency-Key": crypto.randomUUID() },
        data: { walletId: source.id, amount: "2.00", provider: "demo_bank" },
      })
    ).status(),
  ).toBe(200);
  const before = await (
    await request.get(`/api/accounts/${account.id}/wallets`)
  ).json();
  await page.goto("/");
  const result = await page.evaluate(async (walletId) => {
    const response = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "conversion",
        sourceWalletId: walletId,
        amount: "1.00",
        targetCurrency: "GBP",
      }),
    });
    return {
      status: response.status,
      cache: response.headers.get("cache-control"),
      body: await response.json(),
    };
  }, source.id);
  expect(result.status).toBe(200);
  expect(result.cache).toBe("no-store");
  expect(result.body).toMatchObject({
    state: "active",
    quote: {
      source: { amount: "1.00", amountMinor: "100", walletId: source.id },
      target: { amount: "0.80", amountMinor: "80", currency: "GBP" },
      rate: { value: "0.8", source: "fresh" },
    },
  });
  const quote = result.body.quote;
  expect(Date.parse(quote.expiresAt) - Date.parse(quote.issuedAt)).toBe(60000);
  expect(
    await (await request.get(`/api/quotes/${quote.quoteId}`)).json(),
  ).toEqual(result.body);
  expect(
    await (await request.get(`/api/accounts/${account.id}/wallets`)).json(),
  ).toEqual(before);
  const document = await (await request.get("/api/openapi")).json();
  expect(document.paths["/api/quotes"].post).toBeDefined();
  expect(document.paths["/api/conversions"].post).toBeDefined();
  expect(document.paths["/api/transfers"].post).toBeDefined();
  await page
    .locator(".wallet-quick-actions")
    .getByRole("button", { name: "Convert", exact: true })
    .click();
  await page.getByLabel("You convert", { exact: true }).fill("1.00");
  await page.getByLabel("Receive currency", { exact: true }).click();
  await page.getByRole("option", { name: "GBP", exact: true }).click();
  await page
    .getByRole("button", { name: "Review conversion", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Confirm simulated conversion",
      exact: true,
    }),
  ).toBeEnabled();
});

test("transfer previews do not create recipients and cannot accept client rate or expiry overrides", async ({
  request,
}) => {
  const before = await (await request.get("/api/accounts")).json();
  const main = before.accounts.find((a: { role: string }) => a.role === "main");
  const { wallets } = await (
    await request.get(`/api/accounts/${main.id}/wallets`)
  ).json();
  const source = wallets.find(
    (w: { currency: string }) => w.currency === "USD",
  );
  const input = {
    operation: "transfer",
    sourceWalletId: source.id,
    amount: "0.01",
    targetCurrency: "GBP",
    recipientAccountId: "uncreated-quote-recipient",
    recipientDefaultCurrency: "EUR",
  };
  const response = await request.post("/api/quotes", { data: input });
  expect(response.status()).toBe(200);
  const first = await response.json();
  expect(first.quote.recipient).toMatchObject({
    accountId: input.recipientAccountId,
    existed: false,
    defaultCurrency: "EUR",
  });
  const repeated = await (
    await request.post("/api/quotes", { data: input })
  ).json();
  expect(repeated.quote.quoteId).not.toBe(first.quote.quoteId);
  expect(
    await (await request.get(`/api/quotes/${first.quote.quoteId}`)).json(),
  ).toEqual(first);
  expect(await (await request.get("/api/accounts")).json()).toEqual(before);
  expect(
    (
      await request.post("/api/quotes", {
        data: { ...input, rate: "99", expiresAt: "2099-01-01T00:00:00.000Z" },
      })
    ).status(),
  ).toBe(400);
});
