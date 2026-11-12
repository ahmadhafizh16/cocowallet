import { expect, test } from "@playwright/test";

test("the overview uses persistent account IDs and journal-derived API balances across reloads", async ({
  page,
  request,
}) => {
  const response = await request.get("/api/accounts");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");
  const { accounts } = await response.json();
  const main = accounts.find(
    (account: { role: string }) => account.role === "main",
  );
  expect(main.inspectOnly).toBe(false);
  expect(typeof main.id).toBe("string");
  expect(main.id.length).toBeGreaterThan(0);
  const balanceResponse = await request.get(
    `/api/accounts/${encodeURIComponent(main.id)}/wallets`,
  );
  expect(balanceResponse.status()).toBe(200);
  expect(balanceResponse.headers()["cache-control"]).toBe("no-store");
  const stored = await balanceResponse.json();
  expect(
    stored.wallets
      .map((wallet: { currency: string }) => wallet.currency)
      .sort(),
  ).toEqual(["EUR", "GBP", "USD"]);
  expect(
    stored.wallets.every(
      (wallet: { balanceMinor: unknown }) =>
        typeof wallet.balanceMinor === "string",
    ),
  ).toBe(true);
  await page.goto("/");
  await expect(page.locator(".wallet-preview-notice")).toHaveCount(0);
  await expect(page.locator(".wallet-total-note")).toContainText(
    "USD balances · No FX needed",
  );
  await page
    .getByRole("button", { name: "Account being inspected", exact: true })
    .click();
  await expect(page.locator(".wallet-account-id")).toHaveText(main.id);
  await page.reload();
  await page
    .getByRole("button", { name: "Account being inspected", exact: true })
    .click();
  await expect(page.locator(".wallet-account-id")).toHaveText(main.id);
  expect(
    await (await request.get(`/api/accounts/${main.id}/wallets`)).json(),
  ).toEqual(stored);
});

test("read APIs document exact amounts, return safe errors and expose no mutation handler", async ({
  request,
}) => {
  const missing = await request.get("/api/accounts/unknown-account/wallets");
  expect(missing.status()).toBe(404);
  expect(missing.headers()["content-type"]).toBe("application/problem+json");
  expect(await missing.json()).toMatchObject({
    code: "ACCOUNT_NOT_FOUND",
    status: 404,
  });
  const spec = await (await request.get("/api/openapi")).json();
  expect(spec.openapi).toBe("3.1.0");
  expect(spec.components.schemas.Wallet.properties.balanceMinor.type).toBe(
    "string",
  );
  expect(spec.paths["/api/deposits"].post.parameters[0].name).toBe(
    "Idempotency-Key",
  );
  const unsupported = await request.post("/api/accounts", {
    data: { id: "not-created", role: "destination" },
  });
  expect(unsupported.status()).toBe(405);
  const { accounts } = await (await request.get("/api/accounts")).json();
  expect(
    accounts.some((account: { id: string }) => account.id === "not-created"),
  ).toBe(false);
});
