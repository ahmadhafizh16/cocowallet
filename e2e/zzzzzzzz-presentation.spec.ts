import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { randomUUID } from "node:crypto";
import { chooseRecipient } from "./helpers";
import { mkdirSync } from "node:fs";
import { convertMinorUnits } from "../src/features/money/money";

test.beforeEach(({ baseURL }) =>
  test.skip(
    !baseURL?.includes("simulated-wallet-funding-preview"),
    "Presentation money fixtures require the disposable database, never the user's wallet.",
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
    wallets,
    usd: wallets.find((w: { currency: string }) => w.currency === "USD"),
  };
}
async function funding(
  request: APIRequestContext,
  walletId: string,
  amount: string,
  withdraw = false,
) {
  const response = await request.post(
    withdraw ? "/api/withdrawals" : "/api/deposits",
    {
      headers: { "Idempotency-Key": randomUUID() },
      data: { walletId, amount, provider: "demo_bank" },
    },
  );
  expect(response.status()).toBe(200);
  return response.json();
}
async function portfolio(request: APIRequestContext, accountId: string) {
  const response = await request.get(
    `/api/portfolio?${new URLSearchParams({ accountId })}`,
  );
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");
  return response.json();
}
async function capture(page: Page, name: string) {
  mkdirSync(".impeccable/review/presentation", { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `.impeccable/review/presentation/${name}.png`,
    fullPage: !name.endsWith("-success"),
    scale: "css",
    animations: "disabled",
  });
}

test("Frankfurter-backed totals sum every wallet exactly and record observations without replay/reload duplicates", async ({
  request,
}) => {
  const { account, usd } = await main(request);
  const before = await portfolio(request, account.id);
  expect(before.total.status).toBe("available");
  let sum = 0n;
  for (const w of before.balances) {
    const minor = BigInt(w.balanceMinor);
    if (w.currency === "USD") sum += minor;
    else if (minor !== 0n) {
      const rate = before.total.rates.find(
        (r: { base: string; quote: string }) =>
          r.base === w.currency && r.quote === "USD",
      );
      expect(rate.provider).toBe("frankfurter");
      sum += convertMinorUnits({
        sourceMinor: minor,
        sourceExponent: w.exponent,
        targetExponent: 2,
        rate: rate.rate,
      });
    }
  }
  expect(before.total.balanceMinor).toBe(sum.toString());
  const key = randomUUID(),
    input = { walletId: usd.id, amount: "0.02", provider: "demo_bank" };
  const first = await request.post("/api/deposits", {
    headers: { "Idempotency-Key": key },
    data: input,
  });
  expect(first.status()).toBe(200);
  const original = await first.json();
  const changed = await portfolio(request, account.id);
  expect(changed.total.balanceMinor).toBe((sum + 2n).toString());
  expect(changed.history.points.at(-1).balanceMinor).toBe(
    (sum + 2n).toString(),
  );
  const replay = await request.post("/api/deposits", {
    headers: { "Idempotency-Key": key },
    data: input,
  });
  expect(replay.headers()["idempotency-replayed"]).toBe("true");
  expect(await replay.json()).toEqual(original);
  const again = await portfolio(request, account.id);
  expect(again.history).toEqual(changed.history);
});

test("History is a real menu page; account/privacy persist and reopening resets ordinary money amounts", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Browse full history", exact: true }),
  ).toHaveCount(0);
  await page
    .locator(".wallet-quick-actions")
    .getByRole("button", { name: "Deposit", exact: true })
    .click();
  await page.getByLabel("You add", { exact: true }).fill("12.3400");
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "History", exact: true }).click();
  await expect(page).toHaveURL(/\/history$/u);
  await expect(
    page.getByRole("link", { name: "History", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("heading", {
      name: "Completed transactions",
      exact: true,
    }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Hide monetary amounts", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "History hidden", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(page.locator(".wallet-total-value")).toContainText("••••");
  await page
    .getByRole("button", { name: "Hide monetary amounts", exact: true })
    .click();
  await page
    .locator(".wallet-quick-actions")
    .getByRole("button", { name: "Deposit", exact: true })
    .click();
  await expect(page.getByLabel("You add", { exact: true })).toHaveValue("0");
});

test("success is a focused green-check summary without technical keys; incoming totals remain read-only", async ({
  page,
  request,
}) => {
  const { usd } = await main(request);
  await funding(request, usd.id, "2.00");
  await page.goto("/");
  await page
    .locator(".wallet-quick-actions")
    .getByRole("button", { name: "Deposit", exact: true })
    .click();
  await page.getByLabel("You add", { exact: true }).fill("0.10");
  await page
    .getByRole("button", { name: "Review deposit", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm deposit", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    page.getByRole("heading", { name: "Deposit complete", exact: true }),
  ).toBeFocused();
  await expect(dialog).toContainText("Added 0.10 USD to your USD wallet.");
  await expect(dialog.locator(".wallet-success-check")).toBeVisible();
  await expect(dialog.locator("dl,time")).toHaveCount(0);
  await expect(dialog).not.toContainText("Retry key");
  await capture(page, "deposit-success");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  const recipient = `presentation-${randomUUID()}`;
  await page
    .locator(".wallet-quick-actions")
    .getByRole("button", { name: "Send money", exact: true })
    .click();
  await chooseRecipient(page, recipient);
  await page.getByLabel("You send", { exact: true }).fill("0.10");
  await page
    .getByRole("button", { name: "Review transfer", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm transfer", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Transfer complete", exact: true }),
  ).toBeFocused();
  await expect(dialog).toContainText(`Sent 0.10 USD to ${recipient}.`);
  await expect(dialog.locator("dl,time")).toHaveCount(0);
  await capture(page, "transfer-success");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Review submission", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Account being inspected", exact: true })
    .click();
  await page
    .getByRole("menuitemradio", {
      name: `Destination ${recipient.slice(0, 8)}`,
    })
    .click();
  await expect(page.locator(".wallet-total-value")).toHaveText("$0.10");
  for (const button of await page.locator(".wallet-quick-actions button").all())
    await expect(button).toBeDisabled();
  const view = await portfolio(request, recipient);
  expect(view.history.accountId).toBe(recipient);
  expect(view.total.balanceMinor).toBe("10");
});

test("unavailable or mismatched valuation never becomes a partial total and leaves individual balances visible", async ({
  page,
  request,
}) => {
  const { account } = await main(request);
  const view = await portfolio(request, account.id);
  await page.route("**/api/portfolio?**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...view, total: { status: "unavailable" } }),
    }),
  );
  await page.goto("/");
  await expect(page.locator(".wallet-total-value")).toHaveText("Unavailable");
  await expect(page.locator(".wallet-currency-row")).not.toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Retry USD total", exact: true }),
  ).toBeVisible();
  await capture(page, "valuation-unavailable");
  await page.unroute("**/api/portfolio?**");
  await page
    .getByRole("button", { name: "Retry USD total", exact: true })
    .click();
  await expect(page.locator(".wallet-total-value")).not.toHaveText(
    "Unavailable",
  );
});

for (const width of [320, 820, 1440])
  for (const theme of ["light", "dark"] as const)
    test(`compact balance and signed recent rows fit ${width}px ${theme}`, async ({
      page,
      request,
    }) => {
      const { account, usd } = await main(request);
      await portfolio(request, account.id);
      const credit = await funding(request, usd.id, "3.00");
      await portfolio(request, account.id);
      const debit = await funding(request, usd.id, "1.00", true);
      await portfolio(request, account.id);
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/");
      await expect(
        page.locator(".wallet-balance-history-compact"),
      ).toHaveAttribute("data-state", "ready");
      await expect(
        page.locator(".wallet-sparkline .wallet-balance-history-line"),
      ).toBeVisible();
      const rows = page.getByRole("list", {
        name: "Recent completed activity",
        exact: true,
      });
      await expect(rows.locator("li")).toHaveCount(5);
      const creditRow = rows.getByRole("button", {
          name: new RegExp(credit.transactionId),
        }),
        debitRow = rows.getByRole("button", {
          name: new RegExp(debit.transactionId),
        });
      await expect(creditRow.locator(".wallet-credit")).toHaveText("+3.00 USD");
      await expect(debitRow.locator(".wallet-debit")).toHaveText("−1.00 USD");
      await expect(
        creditRow.locator(".wallet-transaction-status"),
      ).toBeVisible();
      await expect(
        creditRow.locator(".wallet-transaction-status svg"),
      ).toBeVisible();
      await expect(creditRow).toHaveAccessibleName(/Completed/u);
      expect(
        await creditRow
          .locator(".wallet-credit")
          .evaluate((e) => getComputedStyle(e).color),
      ).not.toBe(
        await debitRow
          .locator(".wallet-debit")
          .evaluate((e) => getComputedStyle(e).color),
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      const rowHeight = await page
        .locator(".wallet-currency-row")
        .first()
        .evaluate((e) => e.getBoundingClientRect().height);
      expect(rowHeight).toBeLessThan(100);
      await expect(page.locator(".wallet-preview-notice")).toHaveCount(0);
      await capture(page, `overview-${width}-${theme}`);
      await page
        .getByRole("button", {
          name: "View recorded USD balance history",
          exact: true,
        })
        .click();
      const plot = page.locator(
        ".wallet-history-dialog .wallet-balance-history-plot",
      );
      await expect(plot).toHaveCSS("height", "112px");
      await expect(plot.locator(".wallet-balance-history-line")).toBeVisible();
      const count = (await portfolio(request, account.id)).history.points
        .length;
      await expect(plot.locator("circle")).toHaveCount(count > 24 ? 2 : count);
      await page.getByText("View recorded balances", { exact: true }).focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("table")).toBeVisible();
      await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(
        Math.min(6, count),
      );
      await page
        .getByRole("button", { name: "Close dialog", exact: true })
        .click();
      await creditRow.click();
      await expect(page).toHaveURL(/\/history$/u);
      await expect(page.locator("#history")).toContainText(
        credit.transactionId,
      );
      await capture(page, `history-${width}-${theme}`);
      await page
        .getByRole("button", { name: "Back to results", exact: true })
        .click();
      await expect(
        page.getByRole("form", { name: "History filters", exact: true }),
      ).toBeVisible();
      await capture(page, `history-results-${width}-${theme}`);
    });
