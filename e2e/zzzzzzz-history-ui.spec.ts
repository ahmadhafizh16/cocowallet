import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readableTime } from "../src/lib/date-presentation";
import { mkdirSync, writeFileSync } from "node:fs";

test.use({ timezoneId: "Pacific/Honolulu" });
test.beforeEach(({ baseURL }) =>
  test.skip(
    !baseURL?.includes("simulated-wallet-funding-preview"),
    "History fixtures require the guarded disposable server, never the persistent wallet.",
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
    source: wallets.find((w: { currency: string }) => w.currency === "USD"),
  };
}
async function post(request: APIRequestContext, path: string, data: unknown) {
  const response = await request.post(path, {
    headers: { "Idempotency-Key": randomUUID() },
    data,
  });
  expect(response.status()).toBe(200);
  return response.json();
}
async function facts(request: APIRequestContext) {
  const { account, source } = await main(request),
    recipient = `${randomUUID()}-وجهة-🌍`;
  const deposit = await post(request, "/api/deposits", {
    walletId: source.id,
    amount: "5.00",
    provider: "demo_bank",
  });
  const withdrawal = await post(request, "/api/withdrawals", {
    walletId: source.id,
    amount: "0.01",
    provider: "community_bank",
  });
  const conversionQuote = await request.post("/api/quotes", {
    data: {
      operation: "conversion",
      sourceWalletId: source.id,
      amount: "1.00",
      targetCurrency: "GBP",
    },
  });
  expect(conversionQuote.status()).toBe(200);
  const cq = await conversionQuote.json();
  const conversion = await post(request, "/api/conversions", {
    quoteId: cq.quote.quoteId,
    sourceWalletId: source.id,
    amount: "1.00",
    targetCurrency: "GBP",
  });
  const transferInput = {
    sourceWalletId: source.id,
    recipientAccountId: recipient,
    recipientDefaultCurrency: "GBP",
    amount: "1.00",
    targetCurrency: "GBP",
  };
  const transferQuote = await request.post("/api/quotes", {
    data: { operation: "transfer", ...transferInput },
  });
  expect(transferQuote.status()).toBe(200);
  const tq = await transferQuote.json();
  const transfer = await post(request, "/api/transfers", {
    ...transferInput,
    quoteId: tq.quote.quoteId,
  });
  const same = await post(request, "/api/transfers", {
    sourceWalletId: source.id,
    recipientAccountId: recipient,
    amount: "0.01",
    targetCurrency: "USD",
  });
  return {
    account,
    source,
    recipient,
    deposit,
    withdrawal,
    conversion,
    transfer,
    same,
  };
}
async function browse(page: Page) {
  await page.getByRole("link", { name: "History", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Completed transactions",
      exact: true,
    }),
  ).toBeFocused();
  await expect(
    page.getByRole("list", { name: "Full transaction history", exact: true }),
  ).toBeVisible();
}
async function choose(page: Page, label: string, value: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: value, exact: true }).click();
}
async function lookup(page: Page, id: string) {
  await page.getByLabel("Transaction ID", { exact: true }).fill(id);
  await page
    .getByRole("button", { name: "Find transaction", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Transaction details", exact: true }),
  ).toBeFocused();
}
async function captureState(page: Page, name: string) {
  mkdirSync(".impeccable/review/history-flow", { recursive: true });
  // Element captures scroll a tall panel under fixed mobile navigation and can
  // falsely occlude its middle. Keep actual document/chrome geometry instead.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `.impeccable/review/history-flow/${name}.png`,
    fullPage: true,
    scale: "css",
  });
  const region = await page.locator("#history").boundingBox();
  if (!region) throw new Error("History panel missing from capture.");
  writeFileSync(
    `.impeccable/review/history-flow/${name}.region.json`,
    JSON.stringify({
      source: `${name}.png`,
      viewport: page.viewportSize(),
      region,
    }),
  );
}
function fxHistoryName(
  direction: "incoming" | "outgoing",
  receipt: { transactionId: string; createdAt: string },
) {
  return `View ${direction} transfer ${receipt.transactionId} · 1.00 USD → 0.80 GBP · ${readableTime(receipt.createdAt)}`;
}

test("the supplied History reference has visible lookup, signed completion rows and one responsive paging group", async ({
  page,
  request,
}) => {
  await facts(request);
  await page.goto("/");
  await browse(page);
  const rows = page
    .getByRole("list", { name: "Full transaction history", exact: true })
    .locator("li");
  await expect(
    page.getByLabel("Transaction ID", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Find transaction", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Completed transactions", exact: true }),
  ).toHaveCount(1);
  await expect(page.locator(".wallet-history-footer")).toContainText(
    /Showing \d+ of \d+ transactions/u,
  );
  for (const row of await rows.all()) {
    await expect(row.locator(".wallet-transaction-icon")).toHaveCount(1);
    await expect(row.locator(".wallet-transaction-status")).toContainText(
      "Completed",
    );
    await expect(row.locator(".wallet-history-chevron")).toHaveCount(1);
    await expect(row.locator("time")).toContainText("UTC");
  }
  const transfer = rows
    .filter({
      has: page.locator(".wallet-transaction-title", {
        hasText: "Outgoing transfer",
      }),
    })
    .first();
  await expect(transfer.locator(".wallet-debit")).toContainText("−");
  await expect(transfer.locator(".wallet-credit")).toContainText("+");
  for (const width of [320, 820, 1024, 1440])
    for (const theme of ["light", "dark"] as const) {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme: theme });
      expect(
        await page
          .locator("#history")
          .evaluate((e) => e.scrollWidth <= e.clientWidth),
      ).toBe(true);
      const target = await page
        .getByRole("button", { name: "Find transaction", exact: true })
        .boundingBox();
      expect(target!.width).toBeGreaterThanOrEqual(44);
      expect(target!.height).toBeGreaterThanOrEqual(44);
      if (width >= 1024) {
        const positions = await page
          .locator(".wallet-history-filter-grid [data-slot='field']")
          .evaluateAll((nodes) =>
            nodes.map((e) => e.getBoundingClientRect().top),
          );
        expect(new Set(positions).size).toBe(1);
      }
      await expect(
        page.getByRole("button", { name: "Go to page", exact: true }),
      ).toBeVisible();
    }
  const id = await rows
    .first()
    .locator("button")
    .getAttribute("data-transaction-id");
  await page.getByLabel("Transaction ID", { exact: true }).fill(id!);
  await page.getByLabel("Transaction ID", { exact: true }).press("Enter");
  await expect(
    page.getByRole("heading", { name: "Transaction details", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Back to results", exact: true })
    .click();
  await expect(rows.first().locator("button")).toBeFocused();
});

test("numbered pages and exact detail/back navigation preserve the applied filters and focused row", async ({
  page,
  request,
}) => {
  const { source } = await main(request);
  for (let i = 0; i < 53; i++)
    await post(request, "/api/deposits", {
      walletId: source.id,
      amount: "0.01",
      provider: "demo_bank",
    });
  await page.goto("/");
  await browse(page);
  await choose(page, "History type", "Deposits");
  await page
    .getByRole("button", { name: "Apply history filters", exact: true })
    .click();
  const rows = page.getByRole("list", {
    name: "Full transaction history",
    exact: true,
  });
  await expect(rows.locator("button")).toHaveCount(50);
  const first = await rows
    .locator("button")
    .evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute("data-transaction-id")),
    );
  expect(first).toHaveLength(50);
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(page.locator("#history")).toContainText("Page 2 of");
  await expect(rows).toBeVisible();
  const second = await rows
    .locator("button")
    .evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute("data-transaction-id")),
    );
  expect(second.length).toBeGreaterThan(0);
  expect(second.some((id) => first.includes(id))).toBe(false);
  const id = second[0]!;
  const detailResponse = page.waitForResponse(
    (r) => new URL(r.url()).pathname === `/api/transactions/${id}`,
  );
  await rows.locator("button").first().click();
  const response = await detailResponse;
  expect(response.status()).toBe(200);
  const record = (await response.json()).transaction;
  await expect(page.locator("#history")).toContainText(
    `${record.target.amount} USD`,
  );
  await expect(page.locator("#history")).toContainText("Bank account");
  await expect(page.locator("#history")).toContainText(
    readableTime(record.createdAt),
  );
  await expect(page.locator("#history")).not.toContainText("Retry key");
  await page
    .getByRole("button", { name: "Back to results", exact: true })
    .click();
  await expect(page.locator("#history")).toContainText("Page 2 of");
  const restoredRow = rows.locator(`button[data-transaction-id="${id}"]`);
  await expect(restoredRow).toBeFocused();
  await expect(restoredRow).toHaveAccessibleName(
    `View deposit ${id} · ${record.target.amount} ${record.target.currency} · ${readableTime(record.createdAt)}`,
  );
  await expect(
    page.getByRole("combobox", { name: "History type", exact: true }),
  ).toContainText("Deposits");
  await page.getByLabel("Page number", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Go to page", exact: true }).click();
  await expect(page.getByLabel("Page number", { exact: true })).toBeFocused();
  await expect(page.locator("#history")).toContainText(
    "positive whole page number",
  );
  await page
    .getByLabel("Page number", { exact: true })
    .fill("9007199254740991");
  await page.getByRole("button", { name: "Go to page", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No records on this page", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "First page", exact: true }).click();
  await expect(rows.locator("button")).toHaveCount(50);
});

test("type/either-side currency and inclusive UTC days apply explicitly; validation and clearing preserve honest results", async ({
  page,
  request,
}) => {
  const data = await facts(request);
  await page.goto("/");
  await browse(page);
  let listReads = 0;
  page.on("request", (r) => {
    if (new URL(r.url()).pathname === "/api/transactions") listReads++;
  });
  await choose(page, "History type", "Transfers");
  await choose(page, "History currency", "USD");
  const day = data.transfer.createdAt.slice(0, 10);
  await page.getByLabel("From day (UTC)", { exact: true }).fill(day);
  await page.getByLabel("To day (UTC)", { exact: true }).fill(day);
  expect(listReads).toBe(0);
  await page
    .getByRole("button", { name: "Apply history filters", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: fxHistoryName("outgoing", data.transfer),
      exact: true,
    }),
  ).toBeVisible();
  await choose(page, "History currency", "GBP");
  await page
    .getByRole("button", { name: "Apply history filters", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: fxHistoryName("outgoing", data.transfer),
      exact: true,
    }),
  ).toBeVisible();
  const before = listReads;
  await page.getByLabel("From day (UTC)", { exact: true }).fill("2026-02-30");
  await page
    .getByRole("button", { name: "Apply history filters", exact: true })
    .click();
  await expect(
    page.getByLabel("From day (UTC)", { exact: true }),
  ).toBeFocused();
  await expect(page.locator("#history")).toContainText("Use a valid UTC day");
  await captureState(page, "invalid-day");
  expect(listReads).toBe(before);
  await page.getByLabel("From day (UTC)", { exact: true }).fill("2030-01-01");
  await page.getByLabel("To day (UTC)", { exact: true }).fill("2020-01-01");
  await page
    .getByRole("button", { name: "Apply history filters", exact: true })
    .click();
  await expect(page.getByLabel("To day (UTC)", { exact: true })).toBeFocused();
  expect(listReads).toBe(before);
  await page.getByLabel("From day (UTC)", { exact: true }).fill("2000-01-01");
  await page.getByLabel("To day (UTC)", { exact: true }).fill("2000-01-01");
  await page
    .getByRole("button", { name: "Apply history filters", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "No matching completed activity",
      exact: true,
    }),
  ).toBeVisible();
  await captureState(page, "empty-filter");
  await page
    .getByRole("button", { name: "Clear history filters", exact: true })
    .click();
  await expect(
    page.getByRole("list", { name: "Full transaction history", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("From day (UTC)", { exact: true })).toHaveValue(
    "",
  );
  await expect(
    page.getByRole("combobox", { name: "History type", exact: true }),
  ).toContainText("All activity");
  await expect(
    page.getByRole("combobox", { name: "History currency", exact: true }),
  ).toContainText("All currencies");
});

test("every completed operation has recorded details; rejected attempts never become records", async ({
  page,
  request,
}) => {
  const data = await facts(request),
    failed = await request.post("/api/withdrawals", {
      headers: { "Idempotency-Key": randomUUID() },
      data: {
        walletId: data.source.id,
        amount: "92233720368547758.07",
        provider: "demo_bank",
      },
    });
  expect(failed.status()).toBe(409);
  const error = await failed.json();
  expect(error.transactionId).toBeUndefined();
  await page.goto("/");
  await browse(page);
  let referenceReads = 0;
  page.on("request", (r) => {
    if (/\/api\/(rates|currencies|quotes)(?:\?|$)/u.test(r.url()))
      referenceReads++;
  });
  for (const [receipt, text] of [
    [data.deposit, "Bank account"],
    [data.withdrawal, "Community Bank"],
    [data.conversion, "1 USD = 0.8 GBP"],
    [data.transfer, "Outgoing transfer"],
    [data.same, "Same currency · no FX rate"],
  ]) {
    await lookup(page, receipt.transactionId);
    await expect(page.locator("#history")).toContainText(text);
    await expect(page.locator("#history")).toContainText(
      readableTime(receipt.createdAt),
    );
    await expect(page.locator("#history")).not.toContainText(
      "Balances after this operation",
    );
    await page
      .getByRole("button", { name: "Back to results", exact: true })
      .click();
    await expect(
      page.getByRole("list", { name: "Full transaction history", exact: true }),
    ).toBeVisible();
  }
  expect(referenceReads).toBe(0);
  await lookup(page, error.requestKey);
  await expect(page.locator("#history")).toContainText(
    "Transaction not found in this account",
  );
  await captureState(page, "missing-record");
  await expect(page.locator("#history time")).toHaveCount(0);
});

test("account switches discard open details/filters and show only inspect-only incoming history with the original FX direction", async ({
  page,
  request,
}) => {
  const data = await facts(request);
  await page.goto("/");
  await browse(page);
  await choose(page, "History type", "Withdrawals");
  await page
    .getByRole("button", { name: "Apply history filters", exact: true })
    .click();
  await lookup(page, data.withdrawal.transactionId);
  await expect(page.locator("#history")).toContainText("Community Bank");
  await page
    .getByRole("button", { name: "Account being inspected", exact: true })
    .click();
  await page
    .getByRole("menuitemradio", {
      name: `Destination ${data.recipient.slice(0, 8)}`,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Completed transactions",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Account being inspected", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("combobox", { name: "History type", exact: true }),
  ).toContainText("All activity");
  const rows = page.getByRole("list", {
    name: "Full transaction history",
    exact: true,
  });
  await expect(rows).not.toContainText("Withdrawal");
  await expect(rows).not.toContainText("Deposit");
  await page
    .getByRole("button", {
      name: fxHistoryName("incoming", data.transfer),
      exact: true,
    })
    .click();
  await expect(page.locator("#history")).toContainText("1 USD = 0.8 GBP");
  await expect(page.locator("#history")).toContainText("0.80 GBP");
  await expect(page.locator("#history")).toContainText(data.recipient);
  for (const button of await page.locator(".wallet-quick-actions button").all())
    await expect(button).toBeDisabled();
});

test("missing records, read failures and malformed responses offer safe read-only recovery", async ({
  page,
  request,
}) => {
  const data = await facts(request);
  await page.goto("/");
  await browse(page);
  await lookup(page, randomUUID());
  await expect(page.locator("#history")).toContainText(
    "Transaction not found in this account",
  );
  await page
    .getByRole("button", { name: "Retry transaction details", exact: true })
    .click();
  await expect(page.locator("#history")).toContainText(
    "Transaction not found in this account",
  );
  await page
    .getByRole("button", { name: "Back to results", exact: true })
    .click();
  await expect(
    page.getByRole("list", { name: "Full transaction history", exact: true }),
  ).toBeVisible();
  let fail = true;
  let release!: () => void;
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  let hold = true;
  await page.route("**/api/transactions?**", async (route) => {
    if (hold) await waiting;
    return fail
      ? route.fulfill({
          status: 503,
          contentType: "application/problem+json",
          body: JSON.stringify({ private: "must not appear" }),
        })
      : route.continue();
  });
  await page
    .getByRole("button", { name: "Apply history filters", exact: true })
    .click();
  await expect(page.locator("#history")).toContainText(
    "Loading this account’s history",
  );
  await captureState(page, "loading");
  hold = false;
  release();
  await expect(page.locator("#history")).toContainText(
    "History could not be loaded",
  );
  await expect(
    page.getByRole("list", { name: "Full transaction history", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("#history")).not.toContainText("must not appear");
  await captureState(page, "read-error");
  fail = false;
  await page
    .getByRole("button", { name: "Retry history", exact: true })
    .click();
  await expect(
    page.getByRole("list", { name: "Full transaction history", exact: true }),
  ).toBeVisible();
  await page.route(
    `**/api/transactions/${data.deposit.transactionId}?**`,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          account: { id: "other" },
          transaction: { amount: 9999 },
        }),
      }),
  );
  await lookup(page, data.deposit.transactionId);
  await expect(page.locator("#history")).toContainText(
    "could not be loaded or validated",
  );
  await expect(page.locator("#history")).not.toContainText("9999");
});

test("privacy removes all history records, counts and timestamps; reload clears ordinary browsing", async ({
  page,
  request,
}) => {
  const data = await facts(request);
  await page.goto("/");
  await browse(page);
  await lookup(page, data.transfer.transactionId);
  await expect(page.locator("#history")).toContainText("0.80 GBP");
  await page
    .getByRole("button", { name: "Hide monetary amounts", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "History hidden", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#history time")).toHaveCount(0);
  await expect(page.locator("#history")).not.toContainText("0.80 GBP");
  await expect(page.locator("#history dl")).toHaveCount(0);
  await captureState(page, "hidden");
  await page
    .getByRole("button", { name: "Hide monetary amounts", exact: true })
    .click();
  await expect(page.locator("#history")).toContainText("0.80 GBP");
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Completed transactions",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "History type", exact: true }),
  ).toContainText("All activity");
  await expect(
    page.getByRole("heading", { name: "Transaction details", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("cocowallet.pending-funding.v1"),
    ),
  ).toBeNull();
});

test("history browsing cannot submit money or replace unresolved monetary recovery", async ({
  page,
  request,
}) => {
  const data = await facts(request);
  const intent = {
    version: 1,
    kind: "deposit",
    key: randomUUID(),
    request: {
      walletId: data.source.id,
      amount: "1.00",
      provider: "demo_bank",
    },
  };
  await page.goto("/");
  await page.evaluate(
    (value) =>
      sessionStorage.setItem(
        "cocowallet.pending-funding.v1",
        JSON.stringify(value),
      ),
    intent,
  );
  await page.reload();
  let monetaryPosts = 0;
  page.on("request", (r) => {
    if (
      r.method() === "POST" &&
      /\/api\/(deposits|withdrawals|conversions|transfers|quotes)(?:\?|$)/u.test(
        r.url(),
      )
    )
      monetaryPosts++;
  });
  await browse(page);
  await lookup(page, data.deposit.transactionId);
  await expect(page.locator("#history")).toContainText("5.00 USD");
  expect(
    await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem("cocowallet.pending-funding.v1")!),
    ),
  ).toEqual(intent);
  expect(monetaryPosts).toBe(0);
  await page
    .locator(".wallet-desktop-actions")
    .getByRole("button", { name: "Deposit", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Retry original submission",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Review deposit", exact: true }),
  ).toHaveCount(0);
});

for (const width of [320, 1440])
  for (const theme of ["light", "dark"] as const)
    test(`history filters/list/details fit ${width}px ${theme} and preserve keyboard focus`, async ({
      page,
      request,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      const data = await facts(request);
      await page.goto("/");
      await browse(page);
      await choose(page, "History type", "Transfers");
      await page
        .getByRole("button", { name: "Apply history filters", exact: true })
        .click();
      const card = page.locator("#history");
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      mkdirSync(".impeccable/review/history-flow", { recursive: true });
      await captureState(page, `list-${width}-${theme}`);
      const row = page.getByRole("button", {
        name: fxHistoryName("outgoing", data.transfer),
        exact: true,
      });
      await expect(row).toHaveAccessibleName(
        fxHistoryName("outgoing", data.transfer),
      );
      await row.focus();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("heading", { name: "Transaction details", exact: true }),
      ).toBeFocused();
      await expect(card).toContainText("0.80 GBP");
      expect(
        await card.evaluate((node) => node.scrollWidth <= node.clientWidth),
      ).toBe(true);
      await captureState(page, `detail-${width}-${theme}`);
      await page
        .getByRole("button", { name: "Back to results", exact: true })
        .focus();
      await page.keyboard.press("Enter");
      await expect(row).toBeFocused();
      await page
        .getByRole("button", { name: "Back to overview", exact: true })
        .click();
      await expect(page.locator(".wallet-page-heading")).toBeFocused();
    });
