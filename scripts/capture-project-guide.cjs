/* Capture only against the explicitly isolated documentation server. */
const { mkdirSync } = require("node:fs");
const { chromium, expect } = require("@playwright/test");

const baseURL = process.env.BASE_URL;
if (
  process.env.GUIDE_CAPTURE_ISOLATED !== "1" ||
  baseURL !== "http://localhost:3107"
) {
  throw new Error(
    "Capture requires GUIDE_CAPTURE_ISOLATED=1 and the disposable server at http://localhost:3107; never use the ordinary wallet.",
  );
}

async function main() {
  const directory = "artifact/guide-screenshots";
  const balanceHistoryOnly = process.argv.includes("--balance-history-only");
  const destinationOnly = process.argv.includes("--destination-only");
  if (balanceHistoryOnly && destinationOnly) {
    throw new Error("Choose only one focused capture mode.");
  }
  mkdirSync(directory, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 1440, height: 900 },
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "UTC",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const capture = async (name, fullPage = false) => {
    if (balanceHistoryOnly && name !== "12-balance-history") return;
    if (
      destinationOnly &&
      name !== "13-account-menu" &&
      name !== "14-destination-overview"
    )
      return;
    await page.screenshot({
      path: `${directory}/${name}.png`,
      fullPage,
      animations: "disabled",
      scale: "css",
    });
    console.log(`Captured ${name}`);
  };
  const open = async (name) => {
    await page
      .locator(".wallet-quick-actions")
      .getByRole("button", { name, exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
  };
  const captureDestination = async () => {
    await open("Send money");
    await page
      .getByRole("combobox", { name: "Recipient", exact: true })
      .click();
    await page
      .getByRole("option", { name: "Create new address", exact: true })
      .click();
    await page
      .getByLabel("New address", { exact: true })
      .fill("sample-recipient");
    await page.getByLabel("You send", { exact: true }).fill("25.00");
    await page.getByRole("button", { name: "Review transfer" }).click();
    await page.getByRole("button", { name: "Confirm transfer" }).click();
    await expect(
      page.getByRole("heading", { name: "Transfer complete" }),
    ).toBeVisible({ timeout: 30000 });
    await page.getByRole("button", { name: "Done", exact: true }).click();

    await page
      .getByRole("button", { name: "Account being inspected", exact: true })
      .click();
    const destination = page.getByRole("menuitemradio", {
      name: "Destination sample-r",
    });
    await expect(destination).toBeVisible();
    await capture("13-account-menu");
    await destination.click();
    await expect(page.locator(".wallet-total-value")).toHaveText("$25.00", {
      timeout: 30000,
    });
    await expect(
      page.getByText("Money actions are available from the main account only."),
    ).toBeVisible();
    await expect(
      page.getByRole("list", { name: "Recent completed activity" }),
    ).toContainText("+25.00 USD", { timeout: 30000 });
    await expect(
      page.locator(".wallet-quick-actions button").first(),
    ).toBeDisabled();
    await capture("14-destination-overview", true);
  };
  try {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 90000 });
    await expect(page.locator(".wallet-quick-actions")).toBeVisible({
      timeout: 90000,
    });
    await expect(
      page
        .locator(".wallet-quick-actions")
        .getByRole("button", { name: "Deposit", exact: true }),
    ).toBeEnabled({ timeout: 90000 });
    await expect(page.getByText("No matching completed activity")).toBeVisible({
      timeout: 30000,
    });
    await expect(
      page.getByText("Updating USD total", { exact: false }),
    ).toHaveCount(0, { timeout: 30000 });
    await capture("01-overview", true);

    await open("Deposit");
    await page.getByLabel("You add", { exact: true }).fill("1250.00");
    await capture("02-deposit-entry");
    await page.getByRole("button", { name: "Review deposit" }).click();
    await expect(
      page.getByRole("button", { name: "Confirm deposit" }),
    ).toBeVisible();
    await capture("03-deposit-review");
    await page.getByRole("button", { name: "Confirm deposit" }).click();
    await expect(
      page.getByRole("heading", { name: "Deposit complete" }),
    ).toBeVisible({
      timeout: 30000,
    });
    await capture("04-deposit-success");
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("list", { name: "Recent completed activity" }),
    ).toContainText("1250.00", { timeout: 30000 });
    await expect(
      page.getByText("Updating USD total", { exact: false }),
    ).toHaveCount(0, { timeout: 30000 });
    await capture("05-funded-overview", true);

    await page
      .getByRole("button", { name: "View recorded USD balance history" })
      .click({ timeout: 30000 });
    await expect(
      page.getByRole("heading", { name: "USD balance history" }),
    ).toBeVisible();
    await page.getByText("View recorded balances", { exact: true }).click();
    await expect(
      page.getByRole("table", { name: "Recorded balance snapshots in USD" }),
    ).toBeVisible();
    await capture("12-balance-history");
    if (balanceHistoryOnly) return;
    await page.getByRole("button", { name: "Close dialog" }).click();
    if (destinationOnly) {
      await captureDestination();
      return;
    }

    await open("Withdraw");
    await page.getByLabel("You withdraw", { exact: true }).fill("100.00");
    await capture("06-withdraw-entry");
    await page.getByRole("button", { name: "Close dialog" }).click();

    await open("Convert");
    await page.getByLabel("You convert", { exact: true }).fill("100.00");
    await page.getByLabel("Receive currency", { exact: true }).click();
    await page.getByRole("option", { name: "GBP", exact: true }).click();
    await page.getByRole("button", { name: "Review conversion" }).click();
    await expect(
      page.getByRole("button", { name: "Confirm conversion" }),
    ).toBeEnabled({ timeout: 30000 });
    await capture("07-conversion-review");
    await page.getByRole("button", { name: "Close dialog" }).click();

    await open("Send money");
    await page
      .getByRole("combobox", { name: "Recipient", exact: true })
      .click();
    await page
      .getByRole("option", { name: "Create new address", exact: true })
      .click();
    await page
      .getByLabel("New address", { exact: true })
      .fill("sample-recipient");
    await page.getByLabel("You send", { exact: true }).fill("25.00");
    await capture("08-transfer-entry");
    await page.getByRole("button", { name: "Close dialog" }).click();

    await page.getByRole("link", { name: "History", exact: true }).click();
    await expect(
      page.getByRole("list", { name: "Full transaction history" }),
    ).toBeVisible({ timeout: 30000 });
    await capture("09-history", true);
    await page
      .getByRole("list", { name: "Full transaction history" })
      .locator("li button")
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Transaction details" }),
    ).toBeVisible();
    await expect(page.locator(".wallet-detail-fact").first()).toBeVisible({
      timeout: 30000,
    });
    await capture("10-transaction-detail", true);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("list", { name: "Recent completed activity" }),
    ).toBeVisible({ timeout: 30000 });
    await expect(
      page.getByText("Updating USD total", { exact: false }),
    ).toHaveCount(0, { timeout: 30000 });
    await capture("11-mobile-overview", true);
    await page.setViewportSize({ width: 1440, height: 900 });
    await captureDestination();
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
