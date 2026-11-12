import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { chooseRecipient } from "./helpers";

test.beforeEach(({ baseURL }) =>
  test.skip(
    !baseURL?.includes("simulated-wallet-funding-preview"),
    "Money workflow fixtures require the guarded disposable server.",
  ),
);
async function context(request: APIRequestContext) {
  const { accounts } = await (await request.get("/api/accounts")).json();
  const main = accounts.find((a: { role: string }) => a.role === "main");
  const { wallets } = await (
    await request.get(`/api/accounts/${main.id}/wallets`)
  ).json();
  return {
    main,
    wallets,
    usd: wallets.find((w: { currency: string }) => w.currency === "USD"),
  };
}
async function deposit(request: APIRequestContext, amount = "10.00") {
  const { usd } = await context(request);
  const result = await request.post("/api/deposits", {
    headers: { "Idempotency-Key": randomUUID() },
    data: { walletId: usd.id, provider: "demo_bank", amount },
  });
  expect(result.status()).toBe(200);
}
async function open(page: Page, label: string) {
  await page
    .locator(".wallet-quick-actions")
    .getByRole("button", { name: label, exact: true })
    .click();
}
async function screenshot(page: Page, name: string) {
  mkdirSync(".impeccable/review/workflow", { recursive: true });
  if (name.startsWith("empty-"))
    await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `.impeccable/review/workflow/${name}.png`,
    scale: "css",
    fullPage: name.startsWith("empty-"),
    animations: "disabled",
  });
}

test("Done-only transfer success resets safely on every dismissal and the next action is the intended form", async ({
  page,
  request,
}) => {
  await deposit(request);
  await page.goto("/");
  for (const dismissal of ["outside", "escape", "close", "done"]) {
    await open(page, "Send money");
    await chooseRecipient(page, `workflow-${randomUUID()}`);
    await page.getByLabel("You send", { exact: true }).fill("0.01");
    await page
      .getByRole("button", { name: "Review transfer", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirm transfer", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(
      page.getByRole("heading", { name: "Transfer complete", exact: true }),
    ).toBeFocused();
    await expect(
      dialog.getByRole("button", {
        name: "Start another operation",
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(
      dialog.getByRole("button", { name: "Done", exact: true }),
    ).toHaveCount(1);
    if (dismissal === "outside") await page.mouse.click(5, 5);
    else if (dismissal === "escape") await page.keyboard.press("Escape");
    else
      await dialog
        .getByRole("button", {
          name: dismissal === "done" ? "Done" : "Close dialog",
          exact: true,
        })
        .click();
    await expect(dialog).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Review submission", exact: true }),
    ).toHaveCount(0);
    for (const [label, input] of [
      ["Deposit", "You add"],
      ["Withdraw", "You withdraw"],
      ["Convert", "You convert"],
    ] as const) {
      await open(page, label);
      await expect(page.getByLabel(input, { exact: true })).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Transfer complete", exact: true }),
      ).toHaveCount(0);
      await page.keyboard.press("Escape");
    }
  }
});

test("numeric amounts group exactly, reject invalid edits and submit only ungrouped decimals", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await open(page, "Deposit");
  const amount = page.getByLabel("You add", { exact: true });
  await amount.fill("12000.00");
  await expect(amount).toHaveValue("12,000.00");
  await amount.fill("1e3");
  await expect(amount).toHaveValue("12,000.00");
  await expect(
    page.getByRole("status").filter({ hasText: "Use numbers" }),
  ).toBeVisible();
  await amount.fill("1000");
  await expect(amount).toHaveValue("1,000");
  await amount.press("Home");
  await amount.press("ArrowRight");
  await amount.press("9");
  await expect(amount).toHaveValue("19,000");
  await amount.fill("12000.00");
  await page
    .getByRole("button", { name: "Review deposit", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("$12,000.00 USD");
  const sent = page.waitForRequest(
    (r) =>
      new URL(r.url()).pathname === "/api/deposits" && r.method() === "POST",
  );
  await page
    .getByRole("button", { name: "Confirm deposit", exact: true })
    .click();
  expect((await sent).postDataJSON().amount).toBe("12000.00");
  await expect(
    page.getByRole("heading", { name: "Deposit complete", exact: true }),
  ).toBeVisible();
  expect((await context(request)).usd.balanceMinor).toMatch(/^\d+$/u);
});

test("saved/new addresses constrain both choices without overwriting a legacy default or creating during review", async ({
  page,
  request,
}) => {
  await deposit(request);
  const { usd } = await context(request),
    id = `legacy-${randomUUID()}`;
  const created = await request.post("/api/transfers", {
    headers: { "Idempotency-Key": randomUUID() },
    data: {
      sourceWalletId: usd.id,
      recipientAccountId: id,
      recipientDefaultCurrency: "JPY",
      targetCurrency: "USD",
      amount: "0.01",
    },
  });
  expect(created.status()).toBe(200);
  await page.goto("/");
  await open(page, "Send money");
  await chooseRecipient(page, id);
  await expect(page.getByLabel("New address", { exact: true })).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "Source currency", exact: true })
    .click();
  await expect(page.getByRole("option")).toHaveText(["USD", "GBP", "EUR"]);
  await page.keyboard.press("Escape");
  await page.getByLabel("Receive currency", { exact: true }).click();
  await expect(page.getByRole("option")).toHaveText(["USD", "GBP", "EUR"]);
  await page.keyboard.press("Escape");
  await page.getByLabel("You send", { exact: true }).fill("0.01");
  await page
    .getByRole("button", { name: "Review transfer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Default currency: JPY");
  await page
    .getByRole("button", { name: "Confirm transfer", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Transfer complete", exact: true }),
  ).toBeVisible();
  const saved = await (await request.get(`/api/accounts/${id}/wallets`)).json();
  expect(saved.account.defaultCurrency).toBe("JPY");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  const fresh = `address-${randomUUID()}`;
  await open(page, "Send money");
  await chooseRecipient(page, fresh);
  await page.getByLabel("You send", { exact: true }).fill("0.01");
  await page
    .getByRole("button", { name: "Review transfer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Default currency: USD");
  expect((await request.get(`/api/accounts/${fresh}/wallets`)).status()).toBe(
    404,
  );
});

test("API confirmation has disabled animated loading and unknown outcomes survive dismissal", async ({
  page,
  request,
}) => {
  await deposit(request);
  await page.goto("/");
  let release!: () => void;
  await page.route("**/api/deposits", async (route) => {
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    await route.abort("failed");
  });
  await open(page, "Deposit");
  await page.getByLabel("You add", { exact: true }).fill("1.00");
  await page
    .getByRole("button", { name: "Review deposit", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm deposit", exact: true })
    .click();
  try {
    const pending = page.getByRole("button", {
      name: "Confirming…",
      exact: true,
    });
    await expect(pending).toBeDisabled();
    await expect(pending).toHaveAttribute("aria-busy", "true");
    await expect(pending.locator(".wallet-loading-icon")).toBeVisible();
  } finally {
    release?.();
  }
  await expect(
    page.getByRole("button", {
      name: "Retry original submission",
      exact: true,
    }),
  ).toBeVisible();
  const original = await page.evaluate(() =>
    sessionStorage.getItem("cocowallet.pending-funding.v1"),
  );
  expect(original).not.toBeNull();
  await page.keyboard.press("Escape");
  await open(page, "Withdraw");
  await expect(
    page.getByRole("heading", {
      name: "Submission needs recovery",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("cocowallet.pending-funding.v1"),
    ),
  ).toBe(original);
});

for (const width of [320, 820, 1440])
  for (const theme of ["light", "dark"] as const)
    test(`review, amount entry and centered empty activity fit ${width}px ${theme}`, async ({
      page,
      request,
    }) => {
      await deposit(request, "100.00");
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.route("**/api/transactions?**", async (route) => {
        const response = await route.fetch();
        const body = await response.json();
        await route.fulfill({
          response,
          json: {
            ...body,
            transactions: [],
            pagination: { ...body.pagination, totalItems: 0, totalPages: 0 },
          },
        });
      });
      await page.goto("/");
      await expect(
        page.getByRole("link", { name: "Wallets", exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("heading", {
          name: "No matching completed activity",
          exact: true,
        }),
      ).toBeVisible();
      await page.locator("#history").scrollIntoViewIfNeeded();
      await screenshot(page, `empty-${width}-${theme}`);
      await open(page, "Withdraw");
      await page.getByLabel("You withdraw", { exact: true }).fill("20.00");
      await screenshot(page, `amount-${width}-${theme}`);
      await page
        .getByRole("button", { name: "Review withdrawal", exact: true })
        .click();
      const dialog = page.getByRole("dialog");
      await expect(
        page.getByRole("heading", { name: "Review withdrawal", exact: true }),
      ).toBeFocused();
      await expect(dialog).toContainText("$20.00 USD");
      await expect(
        dialog.getByRole("button", { name: "Confirm withdrawal", exact: true }),
      ).toHaveAttribute("data-variant", "success");
      await expect(dialog).not.toContainText("simulated");
      await expect(
        dialog.getByRole("button", { name: "Back to overview", exact: true }),
      ).toHaveCount(0);
      expect(await dialog.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(
        true,
      );
      await screenshot(page, `withdraw-review-${width}-${theme}`);
    });
