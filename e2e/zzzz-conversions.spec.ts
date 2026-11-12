import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { mkdirSync } from "node:fs";

test.beforeEach(async ({ baseURL }) => {
  test.skip(
    !baseURL?.includes("simulated-wallet-funding-preview"),
    "Successful money tests require the disposable database, never the persistent wallet.",
  );
});
async function main(request: APIRequestContext) {
  const { accounts } = await (await request.get("/api/accounts")).json();
  const account = accounts.find((a: { role: string }) => a.role === "main");
  const body = await (
    await request.get(`/api/accounts/${account.id}/wallets`)
  ).json();
  return {
    account,
    wallets: body.wallets,
    source: body.wallets.find(
      (w: { currency: string }) => w.currency === "USD",
    ),
  };
}
async function prepare(page: Page, request: APIRequestContext) {
  const { source } = await main(request);
  expect(
    (
      await request.post("/api/deposits", {
        headers: { "Idempotency-Key": crypto.randomUUID() },
        data: { walletId: source.id, amount: "10.00", provider: "demo_bank" },
      })
    ).status(),
  ).toBe(200);
  await page.goto("/");
  return main(request);
}
async function review(page: Page, target = "GBP", amount = "1.00") {
  await page
    .locator(".wallet-quick-actions")
    .getByRole("button", { name: "Convert", exact: true })
    .click();
  await page.getByLabel("You convert", { exact: true }).fill(amount);
  await page.getByLabel("Receive currency", { exact: true }).click();
  await page.getByRole("option", { name: target, exact: true }).click();
  await page
    .getByRole("button", { name: "Review conversion", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Confirm simulated conversion",
      exact: true,
    }),
  ).toBeEnabled();
}

test("review moves no funds; explicit confirmation records exact balances and persistent conversion history once", async ({
  page,
  request,
}) => {
  const before = await prepare(page, request);
  let submissions = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/conversions")) submissions++;
  });
  await review(page);
  await expect(page.getByRole("dialog")).toContainText("1.00 USD");
  await expect(page.getByRole("dialog")).toContainText("0.80 GBP");
  await expect(page.getByRole("dialog")).toContainText("Rate source date");
  await expect(page.getByRole("dialog")).toContainText(
    "Quote expires at (UTC)",
  );
  expect((await main(request)).wallets).toEqual(before.wallets);
  expect(submissions).toBe(0);
  await page
    .getByRole("button", { name: "Confirm simulated conversion", exact: true })
    .evaluate((button) => {
      (button as HTMLButtonElement).click();
      (button as HTMLButtonElement).click();
    });
  await expect(
    page.getByRole("heading", {
      name: "Conversion complete",
      exact: true,
    }),
  ).toBeFocused();
  expect(submissions).toBe(1);
  await expect
    .poll(async () => BigInt((await main(request)).source.balanceMinor))
    .toBe(BigInt(before.source.balanceMinor) - 100n);
  const targetBefore = before.wallets.find(
    (w: { currency: string }) => w.currency === "GBP",
  );
  expect(
    BigInt(
      (await main(request)).wallets.find(
        (w: { currency: string }) => w.currency === "GBP",
      ).balanceMinor,
    ),
  ).toBe(BigInt(targetBefore.balanceMinor) + 80n);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.reload();
  await page
    .getByRole("combobox", { name: "Filter transactions", exact: true })
    .click();
  await page.getByRole("option", { name: "Conversions", exact: true }).click();
  await expect(
    page.getByRole("list", { name: "Recent completed activity" }),
  ).toContainText("−1.00 USD+0.80 GBP");
});

test("an eligible missing currency wallet appears only after successful reviewed conversion", async ({
  page,
  request,
}) => {
  const before = await prepare(page, request);
  expect(
    before.wallets.find((w: { currency: string }) => w.currency === "JPY"),
  ).toBeUndefined();
  await review(page, "JPY");
  expect(
    (await main(request)).wallets.find(
      (w: { currency: string }) => w.currency === "JPY",
    ),
  ).toBeUndefined();
  await page
    .getByRole("button", { name: "Confirm simulated conversion", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Conversion complete" }),
  ).toBeVisible();
  expect(
    (await main(request)).wallets.find(
      (w: { currency: string }) => w.currency === "JPY",
    ),
  ).toMatchObject({ balanceMinor: "150", exponent: 0 });
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.reload();
  await expect(
    page.locator(".wallet-currency-row").filter({ hasText: "JPY" }),
  ).toContainText("150");
  await expect(page.locator('[data-currency="JPY"]')).toHaveClass(/lucide/);
});

test("expiry never auto-submits: fresh terms need an explicit request and a separate confirmation", async ({
  page,
  request,
}) => {
  await prepare(page, request);
  await page.clock.install({ time: new Date() });
  let submissions = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/conversions")) submissions++;
  });
  const firstResponse = page.waitForResponse(
    (r) => r.url().endsWith("/api/quotes") && r.request().method() === "POST",
  );
  await page
    .locator(".wallet-quick-actions")
    .getByRole("button", { name: "Convert", exact: true })
    .click();
  await page.getByLabel("You convert", { exact: true }).fill("1.00");
  await page
    .getByRole("button", { name: "Review conversion", exact: true })
    .click();
  const first = await (await firstResponse).json();
  // Anchor controlled time to actual server terms, not the runner's earlier clock.
  await page.clock.setSystemTime(
    new Date(Date.parse(first.quote.issuedAt) + 1),
  );
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByRole("button", {
      name: "Confirm simulated conversion",
      exact: true,
    }),
  ).toBeEnabled();
  await page.clock.fastForward(61000);
  await expect(
    page.getByRole("button", {
      name: "Confirm simulated conversion",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(page.getByRole("dialog")).toContainText("expired");
  expect(submissions).toBe(0);
  const nextResponse = page.waitForResponse(
    (r) => r.url().endsWith("/api/quotes") && r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Request fresh quote", exact: true })
    .click();
  const next = await (await nextResponse).json();
  await page.clock.setSystemTime(new Date(Date.parse(next.quote.issuedAt) + 1));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  expect(next.quote.quoteId).not.toBe(first.quote.quoteId);
  await expect(
    page.getByRole("button", {
      name: "Confirm simulated conversion",
      exact: true,
    }),
  ).toBeEnabled();
  expect(submissions).toBe(0);
});

test("unavailable quote cannot move money and editing preserves the exact draft", async ({
  page,
  request,
}) => {
  const before = await prepare(page, request);
  await page.route("**/api/quotes", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/problem+json",
      body: JSON.stringify({ code: "QUOTE_RATE_UNAVAILABLE" }),
    }),
  );
  await page
    .locator(".wallet-quick-actions")
    .getByRole("button", { name: "Convert", exact: true })
    .click();
  await page.getByLabel("You convert", { exact: true }).fill("1.00");
  await page
    .getByRole("button", { name: "Review conversion", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "A valid quote is unavailable",
  );
  await expect(
    page.getByRole("button", {
      name: "Confirm simulated conversion",
      exact: true,
    }),
  ).toBeDisabled();
  expect((await main(request)).wallets).toEqual(before.wallets);
  await page.getByRole("button", { name: "Edit details", exact: true }).click();
  await expect(page.getByLabel("You convert", { exact: true })).toHaveValue(
    "1.00",
  );
});

test("lost committed conversion survives reload, blocks new funding and recovers the identical original key/quote", async ({
  page,
  request,
}) => {
  const before = await prepare(page, request);
  let firstKey: string | undefined,
    firstBody: unknown,
    calls = 0,
    quoteCalls = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/quotes")) quoteCalls++;
  });
  await page.route("**/api/conversions", async (route) => {
    calls++;
    const key = route.request().headers()["idempotency-key"],
      body = route.request().postDataJSON();
    const response = await route.fetch();
    if (calls === 1) {
      firstKey = key;
      firstBody = body;
      expect(response.status()).toBe(200);
      await route.abort();
    } else {
      expect(key).toBe(firstKey);
      expect(body).toEqual(firstBody);
      expect(response.headers()["idempotency-replayed"]).toBe("true");
      await route.fulfill({ response });
    }
  });
  await review(page);
  await page
    .getByRole("button", { name: "Confirm simulated conversion", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Submission needs recovery",
      exact: true,
    }),
  ).toBeVisible();
  expect(calls).toBe(1);
  expect(quoteCalls).toBe(1);
  await page.reload();
  expect(calls).toBe(1);
  await page
    .locator(".wallet-quick-actions")
    .getByRole("button", { name: "Deposit", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Review deposit", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Retry original submission", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Conversion complete",
      exact: true,
    }),
  ).toBeVisible();
  expect(calls).toBe(2);
  expect(quoteCalls).toBe(1);
  expect(BigInt((await main(request)).source.balanceMinor)).toBe(
    BigInt(before.source.balanceMinor) - 100n,
  );
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("cocowallet.pending-funding.v1"),
    ),
  ).toBeNull();
});

test("blocked recovery storage sends no conversion and keeps the draft", async ({
  page,
  request,
}) => {
  await prepare(page, request);
  await page.evaluate(() => {
    Object.defineProperty(Storage.prototype, "setItem", {
      configurable: true,
      value: () => {
        throw new Error("blocked");
      },
    });
  });
  let submissions = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/conversions")) submissions++;
  });
  await review(page);
  await page
    .getByRole("button", { name: "Confirm simulated conversion", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Nothing new was sent");
  expect(submissions).toBe(0);
});

for (const width of [320, 1440])
  for (const theme of ["light", "dark"] as const) {
    test(`conversion review/receipt fit ${width}px in ${theme}, support keyboard focus and privacy`, async ({
      page,
      request,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme: theme });
      await prepare(page, request);
      await review(page);
      const dialog = page.getByRole("dialog"),
        bounds = await dialog.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      mkdirSync(".impeccable/review/conversion-flow", { recursive: true });
      await page.screenshot({
        path: `.impeccable/review/conversion-flow/review-${width}-${theme}.png`,
      });
      await page
        .getByRole("button", {
          name: "Confirm simulated conversion",
          exact: true,
        })
        .focus();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("heading", {
          name: "Conversion complete",
          exact: true,
        }),
      ).toBeFocused();
      await page.screenshot({
        path: `.impeccable/review/conversion-flow/receipt-${width}-${theme}.png`,
      });
      await page
        .getByRole("button", { name: "Close dialog", exact: true })
        .click();
      await expect(
        page
          .locator(".wallet-quick-actions")
          .getByRole("button", { name: "Convert", exact: true }),
      ).toBeFocused();
      await page
        .getByRole("button", { name: "Hide monetary amounts", exact: true })
        .click();
      await page
        .locator(".wallet-quick-actions")
        .getByRole("button", { name: "Convert", exact: true })
        .click();
      await expect(dialog).toContainText(
        "Show amounts to view the confirmation",
      );
      await expect(
        page.getByRole("heading", { name: "Conversion complete", exact: true }),
      ).toBeVisible();
      await expect(dialog).not.toContainText("0.80 GBP");
      await expect(dialog.locator("time")).toHaveCount(0);
    });
  }
