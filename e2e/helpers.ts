import { expect, type Page } from "@playwright/test";

export async function chooseRecipient(page: Page, id: string) {
  await page.getByRole("combobox", { name: "Recipient", exact: true }).click();
  const saved = page.getByRole("option", { name: id, exact: true });
  if (await saved.count()) await saved.click();
  else {
    await page
      .getByRole("option", { name: "Create new address", exact: true })
      .click();
    await page.getByLabel("New address", { exact: true }).fill(id);
  }
  await expect(page.locator('[data-slot="select-content"]')).toHaveCount(0);
}

export async function chooseTheme(
  page: Page,
  theme: "System" | "Light" | "Dark",
) {
  await page.getByRole("button", { name: "Color theme", exact: true }).click();
  await page.getByRole("menuitemradio", { name: theme, exact: true }).click();
  await expect(page.locator('[data-slot="dropdown-menu-content"]')).toHaveCount(
    0,
  );
}

export async function openMoneyForm(
  page: Page,
  action: "Deposit" | "Withdraw" | "Convert" | "Send money",
) {
  await page
    .locator(".wallet-quick-actions")
    .getByRole("button", { name: action, exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

export async function closeMoneyForm(page: Page) {
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator('[data-slot="dialog-content"]')).toHaveCount(0);
}

export async function chooseOption(page: Page, label: string, value: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: value, exact: true }).click();
  await expect(page.locator('[data-slot="select-content"]')).toHaveCount(0);
}
