import { expect, test, type APIRequestContext } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";

test.beforeEach(({ baseURL }) =>
  test.skip(
    !baseURL?.includes("simulated-wallet-funding-preview"),
    "Use only the disposable monetary server.",
  ),
);
async function main(request: APIRequestContext) {
  const { accounts } = await (await request.get("/api/accounts")).json(),
    account = accounts.find((a: { role: string }) => a.role === "main"),
    { wallets } = await (
      await request.get(`/api/accounts/${account.id}/wallets`)
    ).json();
  return {
    account,
    source: wallets.find((w: { currency: string }) => w.currency === "USD"),
  };
}

test("all four server confirmations and original-key replay really await one second", async ({
  request,
}) => {
  const { source } = await main(request),
    timings: Array<{ operation: string; milliseconds: number }> = [];
  async function submit(path: string, data: unknown, key = randomUUID()) {
    const start = performance.now(),
      response = await request.post(path, {
        headers: { "Idempotency-Key": key },
        data,
      }),
      milliseconds = performance.now() - start;
    expect(response.status()).toBe(200);
    expect(milliseconds).toBeGreaterThanOrEqual(950);
    timings.push({ operation: path, milliseconds });
    return { response, body: await response.json() };
  }
  const key = randomUUID(),
    input = { walletId: source.id, amount: "10.00", provider: "demo_bank" },
    deposit = await submit("/api/deposits", input, key),
    beforeReplay = (await main(request)).source.balanceMinor,
    replay = await submit("/api/deposits", input, key);
  expect(replay.response.headers()["idempotency-replayed"]).toBe("true");
  expect(replay.body).toEqual(deposit.body);
  expect((await main(request)).source.balanceMinor).toBe(beforeReplay);
  await submit("/api/withdrawals", { ...input, amount: "1.00" });
  const quoted = await request.post("/api/quotes", {
    data: {
      operation: "conversion",
      sourceWalletId: source.id,
      amount: "1.00",
      targetCurrency: "GBP",
    },
  });
  expect(quoted.status()).toBe(200);
  const { quote } = await quoted.json();
  await submit("/api/conversions", {
    quoteId: quote.quoteId,
    sourceWalletId: source.id,
    amount: "1.00",
    targetCurrency: "GBP",
  });
  await submit("/api/transfers", {
    sourceWalletId: source.id,
    recipientAccountId: `paced-${randomUUID()}`,
    recipientDefaultCurrency: "USD",
    targetCurrency: "USD",
    amount: "1.00",
  });
  mkdirSync(".impeccable/review/transaction-experience", { recursive: true });
  writeFileSync(
    ".impeccable/review/transaction-experience/server-timings.json",
    JSON.stringify(timings, null, 2),
  );
});

test("search stays in the list; detail hero and real ID-copy fallback retain immutable facts", async ({
  page,
  request,
}) => {
  const funding = await main(request);
  await Promise.all(
    Array.from({ length: 2 }, async () => {
      expect(
        (
          await request.post("/api/deposits", {
            headers: { "Idempotency-Key": randomUUID() },
            data: {
              walletId: funding.source.id,
              amount: "1.00",
              provider: "demo_bank",
            },
          })
        ).status(),
      ).toBe(200);
    }),
  );
  const { account } = await main(request),
    body = await (
      await request.get(
        `/api/transactions?accountId=${account.id}&type=deposit`,
      )
    ).json(),
    record = body.transactions[0];
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          (window as typeof window & { copiedId?: string }).copiedId = value;
        },
      },
    });
  });
  await page.goto("/history");
  await page
    .getByLabel("Transaction ID", { exact: true })
    .fill(record.transactionId);
  await page.getByLabel("Transaction ID", { exact: true }).press("Enter");
  const rows = page
    .getByRole("list", { name: "Full transaction history", exact: true })
    .locator("li");
  await expect(rows).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Transaction details", exact: true }),
  ).toHaveCount(0);
  await rows.locator("button").click();
  await expect(
    page.getByRole("heading", { name: "Transaction details", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "Transaction details", exact: true }),
  ).toHaveCSS("font-size", "22px");
  await expect(page.locator(".wallet-detail-summary")).toContainText(
    `+${record.target.amount} ${record.target.currency}`,
  );
  await expect(page.locator(".wallet-detail-completed").first()).toContainText(
    "Completed",
  );
  await page
    .getByRole("button", { name: "Copy transaction id", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => (window as typeof window & { copiedId?: string }).copiedId,
    ),
  ).toBe(record.transactionId);
  await expect(page.getByRole("status")).toContainText(
    "Transaction ID copied.",
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("clipboard denied");
        },
      },
    });
  });
  await page
    .getByRole("button", { name: "Copy transaction id", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Copy unavailable");
  expect(await page.evaluate(() => getSelection()?.toString())).toBe(
    record.transactionId,
  );
  await page
    .getByRole("button", { name: "Back to results", exact: true })
    .click();
  await expect(rows.locator("button")).toBeFocused();
  await expect(rows).toHaveCount(1);
  await page
    .getByRole("button", { name: "Clear transaction search", exact: true })
    .click();
  await expect(rows).not.toHaveCount(1);
  await page
    .getByLabel("Transaction ID", { exact: true })
    .fill(`missing-${randomUUID()}`);
  await page
    .getByRole("button", { name: "Find transaction", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "No matching completed activity",
      exact: true,
    }),
  ).toBeVisible();
});

for (const timezoneId of ["America/Los_Angeles", "Pacific/Auckland"])
  test(`library range calendar keeps UTC selection, same-day, clear and keyboard focus in ${timezoneId}`, async ({
    browser,
    request,
    baseURL,
  }) => {
    const funding = await main(request);
    expect(
      (
        await request.post("/api/deposits", {
          headers: { "Idempotency-Key": randomUUID() },
          data: {
            walletId: funding.source.id,
            amount: "1.00",
            provider: "demo_bank",
          },
        })
      ).status(),
    ).toBe(200);
    const { account } = await main(request),
      body = await (
        await request.get(
          `/api/transactions?accountId=${account.id}&pageSize=1`,
        )
      ).json(),
      day = body.transactions[0].createdAt.slice(0, 10),
      end = new Date(`${day}T12:00:00Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    const last = end.toISOString().slice(0, 10);
    const context = await browser.newContext({
        baseURL,
        timezoneId,
        viewport: {
          width: timezoneId.startsWith("America") ? 320 : 1440,
          height: 1000,
        },
      }),
      page = await context.newPage(),
      errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    try {
      await page.goto("/history");
      await expect(
        page.getByRole("list", {
          name: "Full transaction history",
          exact: true,
        }),
      ).toBeVisible();
      let reads = 0;
      page.on("request", (r) => {
        if (new URL(r.url()).pathname === "/api/transactions") reads++;
      });
      const trigger = page.getByLabel("Date range (UTC)", { exact: true });
      await trigger.click();
      const popup = page.getByRole("dialog", {
        name: "Choose UTC date range",
        exact: true,
      });
      await expect(popup).toBeVisible();
      await expect(popup.getByRole("grid").first()).toBeVisible();
      await popup.locator(`button[data-day="${day}"]`).first().click();
      if (!(await popup.locator(`button[data-day="${last}"]`).count()))
        await popup.locator(".ui-calendar-button-next").click();
      await popup.locator(`button[data-day="${last}"]`).first().click();
      expect(reads).toBe(0);
      await popup
        .getByRole("button", { name: "Done selecting dates", exact: true })
        .click();
      await expect(trigger).toBeFocused();
      const filtered = page.waitForRequest((r) => {
        const u = new URL(r.url());
        return (
          u.pathname === "/api/transactions" &&
          u.searchParams.get("from") === day &&
          u.searchParams.get("to") === last
        );
      });
      await page
        .getByRole("button", { name: "Apply history filters", exact: true })
        .click();
      await filtered;
      await trigger.click();
      await popup
        .getByRole("button", { name: "Clear dates", exact: true })
        .click();
      await popup.locator(`button[data-day="${day}"]`).first().click();
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
      const same = page.waitForRequest((r) => {
        const u = new URL(r.url());
        return (
          u.pathname === "/api/transactions" &&
          u.searchParams.get("from") === day &&
          u.searchParams.get("to") === day
        );
      });
      await page
        .getByRole("button", { name: "Apply history filters", exact: true })
        .click();
      await same;
      await trigger.click();
      await page.keyboard.press("ArrowRight");
      expect(
        await popup.evaluate((e) => e.contains(document.activeElement)),
      ).toBe(true);
      await popup
        .getByRole("button", { name: "Clear dates", exact: true })
        .click();
      await popup
        .getByRole("button", { name: "Done selecting dates", exact: true })
        .click();
      await expect(trigger).toContainText("All dates");
      expect(
        await page
          .locator("#history")
          .evaluate((e) => e.scrollWidth <= e.clientWidth),
      ).toBe(true);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
