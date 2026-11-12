import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

async function wallet(request: APIRequestContext) {
  const { accounts } = await (await request.get("/api/accounts")).json();
  const id = accounts.find((a: { role: string }) => a.role === "main").id;
  const { wallets } = await (
    await request.get(`/api/accounts/${id}/wallets`)
  ).json();
  return wallets.find((w: { currency: string }) => w.currency === "USD");
}
async function review(
  page: Page,
  operation: "Deposit" | "Withdraw",
  amount: string,
) {
  await page
    .locator(".wallet-quick-actions")
    .getByRole("button", { name: operation, exact: true })
    .click();
  await page
    .getByLabel(operation === "Deposit" ? "You add" : "You withdraw", {
      exact: true,
    })
    .fill(amount);
  await page
    .getByRole("button", {
      name: operation === "Deposit" ? "Review deposit" : "Review withdrawal",
      exact: true,
    })
    .click();
}

test.beforeEach(async ({ page, baseURL }) => {
  // Fail closed if someone runs monetary browser tests against the user's wallet.
  test.skip(
    !baseURL?.includes("simulated-wallet-funding-preview"),
    "Requires the disposable funding-e2e server, never the persistent wallet.",
  );
  await page.goto("/");
});

test("explicit deposit/withdrawal confirmations update balances and show persistent completed receipts", async ({
  page,
  request,
}) => {
  const before = await wallet(request);
  await review(page, "Deposit", "100.00");
  await page
    .getByRole("button", { name: "Confirm simulated deposit", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Deposit complete",
      exact: true,
    }),
  ).toBeFocused();
  await expect(page.getByRole("dialog")).toContainText(
    "Added 100.00 USD to your USD wallet.",
  );
  await expect(page.getByRole("dialog")).not.toContainText("Retry key");
  await expect
    .poll(async () => (await wallet(request)).balanceMinor)
    .toBe((BigInt(before.balanceMinor) + 10000n).toString());
  await expect(
    page.evaluate(() =>
      sessionStorage.getItem("cocowallet.pending-funding.v1"),
    ),
  ).resolves.toBeNull();
  await page
    .getByRole("button", { name: "Start another operation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Back to overview", exact: true })
    .click();
  await review(page, "Withdraw", "25.50");
  await page
    .getByRole("button", { name: "Confirm simulated withdrawal", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Withdrawal complete",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("list", { name: "Recent completed activity" }),
  ).toContainText("25.50 USD");
  await expect(
    page.getByRole("list", { name: "Recent completed activity" }),
  ).toContainText("100.00 USD");
  expect((await wallet(request)).balanceMinor).toBe(
    (BigInt(before.balanceMinor) + 7450n).toString(),
  );
});

test("lost committed response survives reload; explicit recovery reuses original key without a second credit", async ({
  page,
  request,
}) => {
  const before = await wallet(request);
  let originalKey: string | undefined;
  await page.route(
    "**/api/deposits",
    async (route) => {
      originalKey = route.request().headers()["idempotency-key"];
      await route.fetch();
      await route.abort("failed");
    },
    { times: 1 },
  );
  await review(page, "Deposit", "7.25");
  await page
    .getByRole("button", { name: "Confirm simulated deposit", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Retry original submission",
      exact: true,
    }),
  ).toBeEnabled();
  await expect
    .poll(async () => (await wallet(request)).balanceMinor)
    .toBe((BigInt(before.balanceMinor) + 725n).toString());
  await page.reload();
  await expect(
    page.getByText("An unresolved submission needs confirmation.", {
      exact: false,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Review submission", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(originalKey!);
  const response = page.waitForResponse(
    (r) => r.url().endsWith("/api/deposits") && r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Retry original submission", exact: true })
    .click();
  expect((await response).headers()["idempotency-replayed"]).toBe("true");
  await expect(
    page.getByRole("heading", {
      name: "Deposit complete",
      exact: true,
    }),
  ).toBeVisible();
  expect((await wallet(request)).balanceMinor).toBe(
    (BigInt(before.balanceMinor) + 725n).toString(),
  );
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .getByRole("button", { name: "Hide monetary amounts", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Review submission", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toContainText("7.25");
  await expect(page.getByRole("dialog").locator("time")).toHaveCount(0);
  await expect(
    page.getByRole("list", { name: "Recent completed activity" }),
  ).toHaveCount(0);
});

test("blocked recovery storage prevents any submission and keeps the draft", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === "cocowallet.pending-funding.v1") throw new Error("blocked");
      Object.defineProperty(this, key, { value, configurable: true });
    };
  });
  await page.reload();
  let writes = 0;
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().endsWith("/api/deposits")) writes++;
  });
  await review(page, "Deposit", "3.50");
  await page
    .getByRole("button", { name: "Confirm simulated deposit", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Nothing new was sent");
  expect(writes).toBe(0);
});

test("a stale withdrawal review receives a definitive server rejection without a completed transaction", async ({
  page,
  request,
}) => {
  const stored = await wallet(request);
  expect(
    (
      await request.post("/api/deposits", {
        headers: { "Idempotency-Key": crypto.randomUUID() },
        data: { walletId: stored.id, amount: "2.00", provider: "demo_bank" },
      })
    ).status(),
  ).toBe(200);
  await page.reload();
  const funded = await wallet(request);
  await review(page, "Withdraw", "1.00");
  const drain = await request.post("/api/withdrawals", {
    headers: { "Idempotency-Key": crypto.randomUUID() },
    data: {
      walletId: stored.id,
      amount: `${BigInt(funded.balanceMinor) / 100n}.${(BigInt(funded.balanceMinor) % 100n).toString().padStart(2, "0")}`,
      provider: "demo_bank",
    },
  });
  expect(drain.status()).toBe(200);
  await page
    .getByRole("button", { name: "Confirm simulated withdrawal", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Submission not completed",
      exact: true,
    }),
  ).toBeFocused();
  await expect(page.getByRole("dialog")).toContainText("insufficient funds");
  expect((await wallet(request)).balanceMinor).toBe("0");
  await page
    .getByRole("button", { name: "Edit for a new attempt", exact: true })
    .click();
  await expect(page.getByLabel("You withdraw", { exact: true })).toHaveValue(
    "1.00",
  );
});

for (const theme of ["light", "dark"] as const) {
  for (const width of [320, 1440]) {
    test(`funding receipts fit ${width}px in ${theme} with keyboard confirmation and focus recovery`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(
        (value) => localStorage.setItem("wallet-theme", value),
        theme,
      );
      await page.emulateMedia({ colorScheme: theme });
      await page.reload();
      await review(page, "Deposit", "0.01");
      await page
        .getByRole("button", { name: "Confirm simulated deposit", exact: true })
        .focus();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("heading", {
          name: "Deposit complete",
          exact: true,
        }),
      ).toBeFocused();
      const dialog = page.getByRole("dialog");
      const box = await dialog.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      expect(await dialog.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: `.impeccable/review/funding-${theme}-${width}.png`,
        fullPage: true,
      });
      await page.getByRole("button", { name: "Done", exact: true }).click();
      await expect(
        page
          .locator(".wallet-quick-actions")
          .getByRole("button", { name: "Deposit", exact: true }),
      ).toBeFocused();
    });
  }
}
