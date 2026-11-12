import { expect, test } from "@playwright/test";
import {
  chooseOption,
  chooseTheme,
  closeMoneyForm,
  openMoneyForm,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Color theme", exact: true }),
  ).toBeEnabled();
});

test("the overview has two columns and no permanent form or conflicting conversion teaser", async ({
  page,
}) => {
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".wallet-dialog-form")).toHaveCount(0);
  await expect(
    page.locator(
      ".wallet-conversion-panel, .wallet-summary-grid, .wallet-account-sheet",
    ),
  ).toHaveCount(0);
  expect(
    await page
      .locator(".wallet-dashboard-grid")
      .evaluate(
        (element) =>
          getComputedStyle(element).gridTemplateColumns.split(" ").length,
      ),
  ).toBe(2);
  await expect(page.locator(".wallet-preview-notice")).toHaveCount(0);
  await expect(page.locator(".wallet-prototype-note")).toHaveText(
    "Prototype · Local ledger only. No real funds move.",
  );
  await expect(
    page.getByRole("heading", { name: "Currency wallets", exact: true }),
  ).toBeVisible();
});

for (const [action, title] of [
  ["Deposit", "Deposit money"],
  ["Withdraw", "Withdraw money"],
  ["Convert", "Convert money"],
  ["Send money", "Send money"],
] as const) {
  test(`${action} opens a named shadcn dialog and returns focus to its trigger`, async ({
    page,
  }) => {
    const trigger = page
      .locator(".wallet-quick-actions")
      .getByRole("button", { name: action, exact: true });
    await trigger.click();
    await expect(
      page.getByRole("dialog", { name: title, exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveAttribute(
      "data-slot",
      "dialog-content",
    );
    await expect(page.getByRole("alert")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}

test("the desktop Send money rail has a real tooltip, focus trap, and Escape recovery", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const trigger = page
    .getByRole("navigation", { name: "Wallet navigation" })
    .getByRole("button", { name: "Send money", exact: true });
  await trigger.focus();
  await expect(page.locator('[data-slot="tooltip-content"]')).toContainText(
    "Send money",
  );
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Send money", exact: true });
  const recipient = page.getByLabel("Simulated recipient account ID", {
    exact: true,
  });
  await expect(recipient).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Close dialog", exact: true }),
  ).toBeFocused();
  for (let index = 0; index < 10; index += 1) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(errors).toEqual([]);
});

test("reviews a deposit without submitting money or losing draft input", async ({
  page,
}) => {
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/") && request.method() !== "GET")
      mutations.push(request.url());
  });
  await openMoneyForm(page, "Deposit");
  await chooseOption(page, "Fictional provider", "Community Bank");
  await page.getByLabel("You add", { exact: true }).fill("25.00");
  await page
    .getByRole("button", { name: "Review deposit", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review deposit", exact: true }),
  ).toBeFocused();
  await expect(page.getByRole("dialog")).toContainText("25.00 USD");
  await expect(page.getByRole("dialog")).toContainText("Community Bank");
  await expect(
    page.getByRole("button", {
      name: "Confirm simulated deposit",
      exact: true,
    }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Edit details", exact: true }).click();
  await expect(page.getByLabel("You add", { exact: true })).toBeFocused();
  await closeMoneyForm(page);
  await openMoneyForm(page, "Withdraw");
  await page.getByLabel("You withdraw", { exact: true }).fill("3.00");
  await closeMoneyForm(page);
  await openMoneyForm(page, "Deposit");
  await expect(page.getByLabel("You add", { exact: true })).toHaveValue(
    "25.00",
  );
  await expect(
    page.getByRole("combobox", { name: "Fictional provider", exact: true }),
  ).toContainText("Community Bank");
  await closeMoneyForm(page);
  await expect(page.locator(".wallet-total-value")).toHaveText("$0.00");
  expect(mutations).toEqual([]);
});

test("missing, zero and precision errors are specific, focused and preserve text", async ({
  page,
}) => {
  await openMoneyForm(page, "Deposit");
  const amount = page.getByLabel("You add", { exact: true });
  const review = page.getByRole("button", {
    name: "Review deposit",
    exact: true,
  });
  await review.click();
  await expect(page.getByRole("alert")).toHaveText("Enter an amount.");
  await expect(amount).toBeFocused();
  await amount.fill("0.00");
  await review.click();
  await expect(page.getByRole("alert")).toHaveText(
    "Enter an amount greater than 0.",
  );
  await amount.fill("1.005");
  await review.click();
  await expect(amount).toHaveAttribute("aria-invalid", "true");
  await expect(amount).toBeFocused();
  await expect(amount).toHaveValue("1.005");
  const error = page.getByRole("alert");
  await expect(error).toHaveText("Use no more than 2 decimal places for USD.");
  expect((await amount.getAttribute("aria-describedby"))?.split(" ")).toContain(
    await error.getAttribute("id"),
  );
  await expect(
    page.getByRole("dialog").locator('[data-slot="field"]'),
  ).not.toHaveCount(0);
});

test("conversion prevents identical currencies and clears dependent errors on source changes", async ({
  page,
}) => {
  await openMoneyForm(page, "Convert");
  const target = page.getByRole("combobox", {
    name: "Receive currency",
    exact: true,
  });
  await target.click();
  await expect(
    page.getByRole("option", { name: "USD", exact: true }),
  ).toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("Escape");
  await expect(target).toBeFocused();
  await chooseOption(page, "Source currency", "EUR");
  await expect(target).toContainText("Choose a receiving currency");
  await page.getByLabel("You convert", { exact: true }).fill("1.00");
  await page
    .getByRole("button", { name: "Review conversion", exact: true })
    .click();
  await expect(
    page.getByText("Choose a receiving currency.", { exact: true }),
  ).toBeVisible();
  await chooseOption(page, "Source currency", "GBP");
  await expect(
    page.getByText("Choose a receiving currency.", { exact: true }),
  ).toHaveCount(0);
  await expect(target).toHaveAttribute("aria-invalid", "false");
  await chooseOption(page, "Receive currency", "EUR");
  await expect(page.getByLabel("You convert", { exact: true })).toHaveValue(
    "1.00",
  );
  await closeMoneyForm(page);
  await openMoneyForm(page, "Convert");
  await expect(
    page.getByRole("combobox", { name: "Source currency", exact: true }),
  ).toContainText("GBP");
  await expect(target).toContainText("EUR");
});

test("zero balances cannot be withdrawn or converted and service guidance precedes entry", async ({
  page,
}) => {
  for (const [action, label, review] of [
    ["Withdraw", "You withdraw", "Review withdrawal"],
    ["Convert", "You convert", "Review conversion"],
  ] as const) {
    await openMoneyForm(page, action);
    await expect(
      page.getByRole("dialog").locator('[data-slot="dialog-description"]'),
    ).toContainText(
      /not connected|simulated wallet operation|simulated conversion/,
    );
    await page.getByLabel(label, { exact: true }).fill("1.00");
    await page.getByRole("button", { name: review, exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("Insufficient funds");
    await expect(
      page.getByRole("heading", { name: review, exact: true }),
    ).toHaveCount(0);
    await closeMoneyForm(page);
  }
});

test("self-transfer is rejected without creating a destination or claiming success", async ({
  page,
  request,
}) => {
  const { accounts } = await (await request.get("/api/accounts")).json();
  await openMoneyForm(page, "Send money");
  await page
    .getByLabel("Simulated recipient account ID", { exact: true })
    .fill(
      accounts.find((account: { role: string }) => account.role === "main").id,
    );
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
  await closeMoneyForm(page);
  await page
    .getByRole("button", { name: "Account being inspected", exact: true })
    .click();
  await expect(page.getByRole("menuitemradio")).toHaveCount(1);
});

test("privacy hides amounts in the overview and reopened drafts without credential fields", async ({
  page,
}) => {
  await openMoneyForm(page, "Deposit");
  await page.getByLabel("You add", { exact: true }).fill("25.00");
  await closeMoneyForm(page);
  const privacy = page.getByRole("button", {
    name: "Hide monetary amounts",
    exact: true,
  });
  await privacy.click();
  await expect(privacy).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".wallet-total-value")).not.toContainText("0.00");
  for (const balance of await page.locator(".wallet-currency-amount").all())
    await expect(balance).not.toContainText("0.00");
  await openMoneyForm(page, "Deposit");
  const amount = page.getByLabel("You add", { exact: true });
  await expect(amount).toHaveValue("");
  await expect(amount).toHaveAttribute("readonly", "");
  await expect(amount).toHaveAttribute("type", "text");
  await closeMoneyForm(page);
  await privacy.click();
  await openMoneyForm(page, "Deposit");
  await expect(amount).toHaveValue("25.00");
});

test("history filters use shadcn Select and have a useful reset", async ({
  page,
}) => {
  const filter = page.getByRole("combobox", {
    name: "Filter transactions",
    exact: true,
  });
  await expect(filter).toHaveAttribute("data-slot", "select-trigger");
  await chooseOption(page, "Filter transactions", "Deposits");
  await expect(
    page.getByRole("heading", {
      name: "No matching completed activity",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filter", exact: true }).click();
  await expect(filter).toContainText("All activity");
  await expect(
    page.getByRole("heading", {
      name: "No matching completed activity",
      exact: true,
    }),
  ).toBeVisible();
});

test("clipboard failure offers a selectable ID inside the shadcn account menu", async ({
  page,
  request,
}) => {
  const { accounts } = await (await request.get("/api/accounts")).json();
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("Clipboard blocked");
        },
      },
    }),
  );
  await page
    .getByRole("button", { name: "Account being inspected", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Copy account ID", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("copy it manually");
  await expect(page.locator(".wallet-account-id")).toHaveText(
    accounts.find((account: { role: string }) => account.role === "main").id,
  );
  await expect(
    page.locator('[data-slot="dropdown-menu-content"]'),
  ).toBeVisible();
});

test("mobile labelled Actions opens Send money and restores focus to its stable menu trigger", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const trigger = page.getByRole("button", {
    name: "Money actions",
    exact: true,
  });
  await trigger.click();
  await page.getByRole("menuitem", { name: "Send money", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Send money", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Simulated recipient account ID", { exact: true })
    .fill("demo-recipient");
  await closeMoneyForm(page);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole("menuitem", { name: "Send money", exact: true }).click();
  await expect(
    page.getByLabel("Simulated recipient account ID", { exact: true }),
  ).toHaveValue("demo-recipient");
});

test("popup currency selection is keyboard-operable and stays above the dialog", async ({
  page,
}) => {
  await openMoneyForm(page, "Send money");
  const source = page.getByRole("combobox", {
    name: "Source currency",
    exact: true,
  });
  await source.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("g");
  // Radix schedules typeahead focus; select the matched option after it lands.
  await expect(
    page.getByRole("option", { name: "GBP", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(source).toContainText("GBP");
  await expect(source).toBeFocused();
  const amount = page.getByLabel("You send", { exact: true });
  await expect(amount).toHaveAttribute("data-slot", "input");
  expect(
    await amount.evaluate((element) => element.getBoundingClientRect().height),
  ).toBe(56);
});

test("menus and dialogs fit narrow viewports in both themes", async ({
  page,
}) => {
  for (const [width, theme] of [
    [320, "Light"],
    [390, "Dark"],
    [1440, "Light"],
  ] as const) {
    await page.setViewportSize({ width, height: 844 });
    await chooseTheme(page, theme);
    await openMoneyForm(page, "Deposit");
    await page
      .getByRole("combobox", { name: "Fictional provider", exact: true })
      .click();
    const menu = page.getByRole("listbox");
    await expect(menu).toBeVisible();
    const box = await menu.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeVisible();
    const dialogBox = await page.getByRole("dialog").boundingBox();
    expect(dialogBox!.x).toBeGreaterThanOrEqual(0);
    expect(dialogBox!.y).toBeGreaterThanOrEqual(0);
    expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(844);
    await closeMoneyForm(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
