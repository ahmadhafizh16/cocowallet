import { expect, type Page } from "@playwright/test";

export async function chooseTheme(
  page: Page,
  theme: "System" | "Light" | "Dark",
) {
  await page.getByRole("button", { name: "Color theme", exact: true }).click();
  await page.getByRole("menuitemradio", { name: theme, exact: true }).click();
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
}

export async function chooseOption(page: Page, label: string, value: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: value, exact: true }).click();
}
