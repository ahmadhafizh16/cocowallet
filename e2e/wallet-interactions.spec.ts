import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("Color theme")).toBeEnabled();
});

test("reviews a deposit without submitting money or losing draft input", async ({
  page,
}) => {
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/") && request.method() !== "GET")
      mutations.push(request.url());
  });
  await page.getByRole("button", { name: "Deposit", exact: true }).click();
  await page
    .getByLabel("Fictional provider", { exact: true })
    .selectOption("community_bank");
  await page.getByLabel("You add", { exact: true }).fill("25.00");
  await page
    .getByRole("button", { name: "Review deposit", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review deposit", exact: true }),
  ).toBeFocused();
  await expect(page.locator(".wallet-review")).toContainText("25.00 USD");
  await expect(page.locator(".wallet-review")).toContainText("Community Bank");
  await expect(
    page.getByRole("button", { name: "Deposit unavailable", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Edit details", exact: true }).click();
  await expect(page.getByLabel("You add", { exact: true })).toHaveValue(
    "25.00",
  );
  await expect(page.getByLabel("You add", { exact: true })).toBeFocused();
  await expect(page.locator(".wallet-total-value")).toHaveText("$0.00");
  expect(mutations).toEqual([]);
});

test("precision errors are linked to the field, focused, and preserve text", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Deposit", exact: true }).click();
  const amount = page.getByLabel("You add", { exact: true });
  await amount.fill("1.005");
  await page
    .getByRole("button", { name: "Review deposit", exact: true })
    .click();
  await expect(amount).toHaveAttribute("aria-invalid", "true");
  await expect(amount).toBeFocused();
  await expect(amount).toHaveValue("1.005");
  const errorId = await page
    .getByText("Use no more than 2 decimal places for USD.", { exact: true })
    .getAttribute("id");
  expect((await amount.getAttribute("aria-describedby"))?.split(" ")).toContain(
    errorId,
  );
  await expect(page.locator(".wallet-review")).toHaveCount(0);
});

test("a zero preview balance cannot be withdrawn or converted", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Withdraw", exact: true }).click();
  await page.getByLabel("You withdraw", { exact: true }).fill("1.00");
  await page
    .getByRole("button", { name: "Review withdraw", exact: true })
    .click();
  await expect(page.getByText(/Insufficient preview balance/)).toBeVisible();
  await expect(page.locator(".wallet-review")).toHaveCount(0);
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  await page.getByLabel("You convert", { exact: true }).fill("1.00");
  await page
    .getByRole("button", { name: "Review convert", exact: true })
    .click();
  await expect(page.getByText(/Insufficient preview balance/)).toBeVisible();
  await expect(
    page.getByText("No quote available", { exact: true }),
  ).toBeVisible();
});

test("rejects self-transfers without creating a destination or claiming success", async ({
  page,
}) => {
  await page
    .getByLabel("Simulated recipient account ID", { exact: true })
    .fill("main-account");
  await page.getByLabel("You send", { exact: true }).fill("1.00");
  await page
    .getByRole("button", { name: "Review transfer", exact: true })
    .click();
  await expect(
    page.getByText(
      "Enter a different simulated account ID, not this account’s own ID.",
    ),
  ).toBeVisible();
  await expect(
    page.getByLabel("Simulated recipient account ID", { exact: true }),
  ).toBeFocused();
  await expect(
    page.getByLabel("Account being inspected").locator("option"),
  ).toHaveCount(1);
  await expect(page.locator(".wallet-review")).toHaveCount(0);
});

test("privacy hides all monetary values without turning amount fields into credentials", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Deposit", exact: true }).click();
  const amount = page.getByLabel("You add", { exact: true });
  await amount.fill("25.00");
  const privacy = page.getByRole("button", {
    name: "Hide monetary amounts",
    exact: true,
  });
  await privacy.click();
  await expect(privacy).toHaveAttribute("aria-pressed", "true");
  await expect(amount).toHaveValue("");
  await expect(amount).toHaveAttribute("readonly", "");
  await expect(amount).toHaveAttribute("type", "text");
  await expect(page.locator(".wallet-total-value")).not.toContainText("0.00");
  for (const balance of await page.locator(".wallet-currency-amount").all())
    await expect(balance).not.toContainText("0.00");
  await privacy.click();
  await expect(amount).toHaveValue("25.00");
  await expect(amount).not.toHaveAttribute("readonly");
});

test("empty history filters have a working reset", async ({ page }) => {
  await page.getByLabel("Filter transactions").selectOption("deposit");
  await expect(
    page.getByRole("heading", { name: "No deposits to show." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filter", exact: true }).click();
  await expect(page.getByLabel("Filter transactions")).toHaveValue("all");
  await expect(
    page.getByRole("heading", { name: "A fresh start." }),
  ).toBeVisible();
});

test("clipboard failure gives a useful fallback and preserves the account ID", async ({
  page,
}) => {
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("Clipboard blocked");
        },
      },
    });
  });
  await page.getByRole("button", { name: "Copy ID", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("copy it manually");
  await expect(page.locator(".wallet-account-id")).toHaveText("main-account");
});

test("mobile Actions navigation reflects every workflow and preserves the chosen draft", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const actionsLink = page
    .getByRole("navigation", { name: "Wallet navigation" })
    .getByRole("link", { name: "Actions", exact: true });
  await page.getByRole("button", { name: "Deposit", exact: true }).click();
  await page.getByLabel("You add", { exact: true }).fill("25.00");
  await expect(actionsLink).toHaveAttribute("aria-current", "location");
  await actionsLink.click();
  await expect(
    page.getByRole("heading", { name: "Deposit money", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("You add", { exact: true })).toHaveValue(
    "25.00",
  );
  for (const [button, title] of [
    ["Withdraw", "Withdraw money"],
    ["Convert", "Convert money"],
    ["Transfer", "Send money"],
  ]) {
    await page.getByRole("button", { name: button, exact: true }).click();
    await expect(actionsLink).toHaveAttribute("aria-current", "location");
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeFocused();
  }
});
