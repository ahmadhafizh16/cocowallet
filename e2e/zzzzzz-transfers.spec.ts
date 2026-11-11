import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";

test.beforeEach(({ baseURL }) =>
  test.skip(
    !baseURL?.includes("simulated-wallet-funding-preview"),
    "Transfer funds/recipients require the guarded disposable server, never the normal wallet.",
  ),
);
async function main(request: APIRequestContext) {
  const { accounts } = await (await request.get("/api/accounts")).json();
  const account = accounts.find((a: { role: string }) => a.role === "main");
  const { wallets } = await (
    await request.get(`/api/accounts/${account.id}/wallets`)
  ).json();
  return {
    account,
    accounts,
    wallets,
    source: wallets.find((w: { currency: string }) => w.currency === "USD"),
  };
}
async function prepare(page: Page, request: APIRequestContext) {
  const { source } = await main(request);
  expect(
    (
      await request.post("/api/deposits", {
        headers: { "Idempotency-Key": randomUUID() },
        data: { walletId: source.id, amount: "10.00", provider: "demo_bank" },
      })
    ).status(),
  ).toBe(200);
  await page.goto("/");
  return main(request);
}
async function open(page: Page) {
  await page
    .locator(".wallet-quick-actions")
    .getByRole("button", { name: "Send money", exact: true })
    .click();
}
async function enter(
  page: Page,
  id: string,
  defaultCurrency?: string,
  target?: string,
) {
  await open(page);
  await page
    .getByLabel("Simulated recipient account ID", { exact: true })
    .fill(id);
  if (defaultCurrency) {
    await page
      .getByLabel("New destination default currency", { exact: true })
      .click();
    await page
      .getByRole("option", { name: defaultCurrency, exact: true })
      .click();
  }
  await page.getByLabel("You send", { exact: true }).fill("1.00");
  if (target) {
    await page.getByLabel("Receive currency", { exact: true }).click();
    await page.getByRole("option", { name: target, exact: true }).click();
  }
}
async function review(
  page: Page,
  id: string,
  defaultCurrency?: string,
  target?: string,
) {
  await enter(page, id, defaultCurrency, target);
  await page
    .getByRole("button", { name: "Review transfer", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Confirm simulated transfer",
      exact: true,
    }),
  ).toBeEnabled();
}
async function confirm(page: Page) {
  await page
    .getByRole("button", { name: "Confirm simulated transfer", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Simulated transfer completed",
      exact: true,
    }),
  ).toBeFocused();
}
async function inspect(page: Page, id: string) {
  await page
    .getByRole("button", { name: "Account being inspected", exact: true })
    .click();
  await page
    .getByRole("menuitemradio", { name: `Destination ${id.slice(0, 8)}` })
    .click();
}
const recipient = () => `dst-${randomUUID()}-وجهة-🌍`;

test("reviewed USD→GBP creates a destination once, refreshes balances and exposes only its incoming history", async ({
  page,
  request,
}) => {
  const before = await prepare(page, request),
    id = recipient();
  let submissions = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/transfers")) submissions++;
  });
  await review(page, id, "GBP");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("0.80 GBP");
  await expect(dialog).toContainText("New destination");
  expect((await main(request)).wallets).toEqual(before.wallets);
  expect(
    (await main(request)).accounts.some((a: { id: string }) => a.id === id),
  ).toBe(false);
  expect(submissions).toBe(0);
  await page
    .getByRole("button", { name: "Confirm simulated transfer", exact: true })
    .evaluate((button) => {
      (button as HTMLButtonElement).click();
      (button as HTMLButtonElement).click();
    });
  await expect(
    page.getByRole("heading", {
      name: "Simulated transfer completed",
      exact: true,
    }),
  ).toBeFocused();
  expect(submissions).toBe(1);
  await expect
    .poll(async () => BigInt((await main(request)).source.balanceMinor))
    .toBe(BigInt(before.source.balanceMinor) - 100n);
  await page
    .getByRole("button", { name: "Back to overview", exact: true })
    .click();
  await inspect(page, id);
  await expect(
    page.locator(".wallet-currency-row").filter({ hasText: "GBP" }),
  ).toContainText("0.80");
  await expect(
    page.getByRole("list", { name: "Completed simulated activity" }),
  ).toContainText("Incoming transfer · 1.00 USD → 0.80 GBP");
  await expect(
    page.getByRole("list", { name: "Completed simulated activity" }),
  ).not.toContainText("Deposit");
  for (const action of await page.locator(".wallet-quick-actions button").all())
    await expect(action).toBeDisabled();
  await expect(
    page.getByText("Money actions are available from the main account only.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .locator("summary")
    .filter({ hasText: "Incoming transfer" })
    .click();
  await expect(
    page.getByRole("list", { name: "Completed simulated activity" }),
  ).toContainText("1 USD = 0.8 GBP");
  await expect(page.locator(".wallet-total-value")).toHaveText("Unavailable");
  await page
    .getByRole("button", { name: "Hide monetary amounts", exact: true })
    .click();
  await expect(
    page.getByRole("list", { name: "Completed simulated activity" }),
  ).toHaveCount(0);
  await expect(page.locator("#history time")).toHaveCount(0);
  await expect(page.locator("#history")).not.toContainText("0.80 GBP");
});

test("same-currency review sends identical minor units without quotes or rates and preserves exact IDs", async ({
  page,
  request,
}) => {
  const before = await prepare(page, request),
    id = ` exact ${randomUUID()} `;
  const fx: string[] = [];
  page.on("request", (r) => {
    if (/\/api\/(quotes|rates)(?:\?|$)/u.test(r.url())) fx.push(r.url());
  });
  await review(page, id, "USD");
  await expect(page.getByRole("dialog")).toContainText("Same currency");
  await expect(page.getByRole("dialog")).toContainText("1.00 USD");
  await confirm(page);
  expect(fx).toEqual([]);
  expect(BigInt((await main(request)).source.balanceMinor)).toBe(
    BigInt(before.source.balanceMinor) - 100n,
  );
  const { wallets, account } = await (
    await request.get(`/api/accounts/${encodeURIComponent(id)}/wallets`)
  ).json();
  expect(account.id).toBe(id);
  expect(wallets).toEqual([
    expect.objectContaining({ currency: "USD", balanceMinor: "100" }),
  ]);
});

test("existing destination defaults stay immutable while an explicit target override creates a missing wallet", async ({
  page,
  request,
}) => {
  const { source } = await prepare(page, request),
    id = recipient();
  expect(
    (
      await request.post("/api/transfers", {
        headers: { "Idempotency-Key": randomUUID() },
        data: {
          sourceWalletId: source.id,
          recipientAccountId: id,
          recipientDefaultCurrency: "GBP",
          targetCurrency: "USD",
          amount: "1.00",
        },
      })
    ).status(),
  ).toBe(200);
  await page.reload();
  await enter(page, id, undefined, "USD");
  await expect(page.getByLabel("New destination default currency")).toHaveCount(
    0,
  );
  await expect(page.getByRole("dialog")).toContainText("default GBP");
  await page
    .getByRole("button", { name: "Review transfer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Same currency");
  await confirm(page);
  const snapshot = await (
    await request.get(`/api/accounts/${encodeURIComponent(id)}/wallets`)
  ).json();
  expect(snapshot.account.defaultCurrency).toBe("GBP");
  expect(snapshot.wallets).toEqual([
    expect.objectContaining({ currency: "USD", balanceMinor: "200" }),
  ]);
  const own = await request.post("/api/transfers", {
    headers: { "Idempotency-Key": randomUUID() },
    data: {
      sourceWalletId: snapshot.wallets[0].id,
      recipientAccountId: recipient(),
      recipientDefaultCurrency: "USD",
      amount: "0.01",
    },
  });
  expect(own.status()).toBe(409);
  expect(await own.json()).toMatchObject({ code: "INSPECT_ONLY" });
  await page
    .getByRole("button", { name: "Back to overview", exact: true })
    .click();
  await page.reload();
  await review(page, id);
  await expect(page.getByRole("dialog")).toContainText("0.80 GBP");
  await confirm(page);
  const after = await (
    await request.get(`/api/accounts/${encodeURIComponent(id)}/wallets`)
  ).json();
  expect(after.account.defaultCurrency).toBe("GBP");
  expect(
    after.wallets.find((w: { currency: string }) => w.currency === "GBP")
      .balanceMinor,
  ).toBe("80");
});

test("lost committed transfer survives reload and blocks funding/conversion replacements while replaying original key and quote", async ({
  page,
  request,
}) => {
  const before = await prepare(page, request),
    id = recipient();
  let calls = 0,
    quotes = 0,
    originalKey: string | undefined,
    originalBody: unknown;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/quotes")) quotes++;
  });
  await page.route("**/api/transfers", async (route) => {
    calls++;
    const key = route.request().headers()["idempotency-key"],
      body = route.request().postDataJSON(),
      response = await route.fetch();
    if (calls === 1) {
      originalKey = key;
      originalBody = body;
      expect(response.status()).toBe(200);
      await route.abort();
    } else {
      expect(key).toBe(originalKey);
      expect(body).toEqual(originalBody);
      expect(response.headers()["idempotency-replayed"]).toBe("true");
      await route.fulfill({ response });
    }
  });
  await review(page, id, "GBP");
  await page
    .getByRole("button", { name: "Confirm simulated transfer", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Submission needs recovery",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  expect(calls).toBe(1);
  await page
    .locator(".wallet-quick-actions")
    .getByRole("button", { name: "Convert", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Review conversion", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("dialog")).toContainText(id);
  await page
    .getByRole("button", { name: "Retry original submission", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Simulated transfer completed",
      exact: true,
    }),
  ).toBeVisible();
  expect(calls).toBe(2);
  expect(quotes).toBe(1);
  expect(BigInt((await main(request)).source.balanceMinor)).toBe(
    BigInt(before.source.balanceMinor) - 100n,
  );
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("cocowallet.pending-funding.v1"),
    ),
  ).toBeNull();
});

test("blocked recovery storage prevents any transfer and retains the input draft", async ({
  page,
  request,
}) => {
  const before = await prepare(page, request),
    id = recipient();
  let calls = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/transfers")) calls++;
  });
  await review(page, id, "USD");
  await page.evaluate(() =>
    Object.defineProperty(Storage.prototype, "setItem", {
      configurable: true,
      value: () => {
        throw new Error("blocked");
      },
    }),
  );
  await page
    .getByRole("button", { name: "Confirm simulated transfer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Nothing new was sent");
  expect(calls).toBe(0);
  expect((await main(request)).wallets).toEqual(before.wallets);
});

test("expired FX terms require an explicit fresh quote and a separate confirmation", async ({
  page,
  request,
}) => {
  await prepare(page, request);
  await page.clock.install({ time: new Date() });
  let calls = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/transfers")) calls++;
  });
  await review(page, recipient(), "GBP");
  await page.clock.fastForward(61000);
  await expect(
    page.getByRole("button", {
      name: "Confirm simulated transfer",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(page.getByRole("dialog")).toContainText("expired");
  expect(calls).toBe(0);
  await page.clock.setSystemTime(new Date(Date.now() + 2000));
  await page
    .getByRole("button", { name: "Request fresh quote", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Confirm simulated transfer",
      exact: true,
    }),
  ).toBeEnabled();
  expect(calls).toBe(0);
});

test("self-ID validation and unavailable quotes preserve drafts without creating destinations", async ({
  page,
  request,
}) => {
  const { account } = await prepare(page, request);
  await enter(page, account.id, "USD");
  await page
    .getByRole("button", { name: "Review transfer", exact: true })
    .click();
  await expect(
    page.getByLabel("Simulated recipient account ID", { exact: true }),
  ).toBeFocused();
  await expect(page.getByRole("dialog")).toContainText(
    "not this account’s own ID",
  );
  await page.keyboard.press("Escape");
  const id = recipient();
  await page.route("**/api/quotes", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/problem+json",
      body: JSON.stringify({ code: "QUOTE_RATE_UNAVAILABLE" }),
    }),
  );
  await enter(page, id, "GBP");
  await page
    .getByRole("button", { name: "Review transfer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "A valid quote is unavailable",
  );
  await expect(
    page.getByRole("button", {
      name: "Confirm simulated transfer",
      exact: true,
    }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Edit details", exact: true }).click();
  await expect(
    page.getByLabel("Simulated recipient account ID", { exact: true }),
  ).toHaveValue(id);
  await expect(page.getByLabel("You send", { exact: true })).toHaveValue(
    "1.00",
  );
  expect(
    (await main(request)).accounts.some((a: { id: string }) => a.id === id),
  ).toBe(false);
});

test("stale funded review is definitively rejected without creating a destination", async ({
  page,
  request,
}) => {
  const before = await prepare(page, request),
    id = recipient();
  await review(page, id, "USD");
  const minor = BigInt(before.source.balanceMinor),
    amount = `${minor / 100n}.${(minor % 100n).toString().padStart(2, "0")}`;
  expect(
    (
      await request.post("/api/withdrawals", {
        headers: { "Idempotency-Key": randomUUID() },
        data: { walletId: before.source.id, amount, provider: "demo_bank" },
      })
    ).status(),
  ).toBe(200);
  await page
    .getByRole("button", { name: "Confirm simulated transfer", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Submission not completed",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("insufficient funds");
  expect(
    (await main(request)).accounts.some((a: { id: string }) => a.id === id),
  ).toBe(false);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("cocowallet.pending-funding.v1"),
    ),
  ).toBeNull();
  await page
    .getByRole("button", { name: "Edit for a new attempt", exact: true })
    .click();
  await expect(
    page.getByLabel("Simulated recipient account ID", { exact: true }),
  ).toHaveValue(id);
});

test("privacy blocks hidden transfer review and removes monetary receipt details without losing the draft", async ({
  page,
  request,
}) => {
  await prepare(page, request);
  await review(page, recipient(), "USD");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Hide monetary amounts", exact: true })
    .click();
  await open(page);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Show amounts before confirming");
  await expect(dialog).not.toContainText("1.00 USD");
  await expect(
    page.getByRole("button", {
      name: "Confirm simulated transfer",
      exact: true,
    }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Hide monetary amounts", exact: true })
    .click();
  await open(page);
  await expect(dialog).toContainText("1.00 USD");
  await confirm(page);
  await page
    .getByRole("button", { name: "Back to overview", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Hide monetary amounts", exact: true })
    .click();
  await open(page);
  await expect(dialog).toContainText("Amount hidden");
  await expect(dialog).not.toContainText("1.00 USD");
  await expect(dialog.locator("time")).toHaveCount(0);
});

for (const width of [320, 1440])
  for (const theme of ["light", "dark"] as const)
    test(`transfer form/review/receipt and incoming inspection fit ${width}px ${theme} with keyboard focus and privacy`, async ({
      page,
      request,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme: theme });
      await prepare(page, request);
      const id = `${recipient()}-${"長い識別子".repeat(12)}`;
      await enter(page, id, "GBP");
      mkdirSync(".impeccable/review/transfer-flow", { recursive: true });
      await page.screenshot({
        path: `.impeccable/review/transfer-flow/form-${width}-${theme}.png`,
      });
      await page
        .getByRole("button", { name: "Review transfer", exact: true })
        .click();
      await expect(
        page.getByRole("button", {
          name: "Confirm simulated transfer",
          exact: true,
        }),
      ).toBeEnabled();
      const dialog = page.getByRole("dialog"),
        bounds = await dialog.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      expect(
        await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth),
      ).toBe(true);
      await page.screenshot({
        path: `.impeccable/review/transfer-flow/review-${width}-${theme}.png`,
      });
      await page
        .getByRole("button", {
          name: "Confirm simulated transfer",
          exact: true,
        })
        .focus();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("heading", {
          name: "Simulated transfer completed",
          exact: true,
        }),
      ).toBeFocused();
      await page.screenshot({
        path: `.impeccable/review/transfer-flow/receipt-${width}-${theme}.png`,
      });
      await page
        .getByRole("button", { name: "Back to overview", exact: true })
        .click();
      await expect(
        page
          .locator(".wallet-quick-actions")
          .getByRole("button", { name: "Send money", exact: true }),
      ).toBeFocused();
      await inspect(page, id);
      await expect(
        page.getByRole("list", { name: "Completed simulated activity" }),
      ).toContainText("Incoming transfer");
      await page.screenshot({
        path: `.impeccable/review/transfer-flow/incoming-${width}-${theme}.png`,
        fullPage: true,
      });
      await page
        .getByRole("button", { name: "Hide monetary amounts", exact: true })
        .click();
      await expect(page.locator("#history")).not.toContainText("0.80 GBP");
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
    });
