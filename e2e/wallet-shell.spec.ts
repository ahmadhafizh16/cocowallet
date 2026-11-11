import { expect, test } from "@playwright/test";

test("uses system theme, saves an explicit preference, and restores system behavior", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  const theme = page.getByLabel("Color theme");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await theme.selectOption("light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(theme).toHaveValue("light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await theme.selectOption("system");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("keeps theme controls usable when browser storage is blocked", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, "getItem", {
      configurable: true,
      value() {
        throw new Error("Storage is blocked");
      },
    });
    Object.defineProperty(Storage.prototype, "setItem", {
      configurable: true,
      value() {
        throw new Error("Storage is blocked");
      },
    });
  });
  await page.goto("/");
  await page.getByLabel("Color theme").selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page.getByText(
      "Theme applies for this visit; browser storage is unavailable.",
    ),
  ).toBeVisible();
});

test("starts with a keyboard-accessible skip link and no browser errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to wallet content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeInViewport();
  expect(errors).toEqual([]);
});

test("unknown routes offer a working way back to the overview", async ({
  page,
}) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "This page isn’t in your wallet" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to overview" }).click();
  await expect(
    page.getByRole("heading", { name: "Your wallet, at a glance." }),
  ).toBeVisible();
});

for (const width of [320, 390, 820, 1280, 1440]) {
  test(`the wallet shell fits a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Your wallet, at a glance." }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("reduced motion disables skeleton and control animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const styles = await page.getByLabel("Color theme").evaluate((element) => ({
    animation: getComputedStyle(element).animationName,
    transition: getComputedStyle(element).transitionDuration,
    scroll: getComputedStyle(document.documentElement).scrollBehavior,
  }));
  expect(styles).toEqual({
    animation: "none",
    transition: "0s",
    scroll: "auto",
  });
});
