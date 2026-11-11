import { expect, test, type Page } from "@playwright/test";
import { chooseTheme, openMoneyForm } from "./helpers";

async function recordMotion(page: Page) {
  await page.addInitScript(() => {
    const events: string[] = [];
    Object.defineProperty(window, "walletMotionEvents", { value: events });
    document.addEventListener("animationstart", (event) => {
      if (
        event instanceof AnimationEvent &&
        event.animationName.startsWith("wallet-")
      ) {
        events.push(event.animationName);
      }
    });
  });
}

async function expectMotion(page: Page, name: string) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { walletMotionEvents: string[] })
            .walletMotionEvents,
      ),
    )
    .toContain(name);
}

test("applies the approved CocoWallet vectors, title and favicon at narrow widths and explicit themes", async ({
  page,
  request,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page).toHaveTitle("CocoWallet · Multi-currency simulation");
  const brand = page.getByRole("link", {
    name: "CocoWallet overview",
    exact: true,
  });
  const logo = brand.locator('[data-slot="brand-logo"]');
  await expect(logo).toHaveAttribute("viewBox", "0 0 360 72");
  await expect(logo).toHaveAttribute("aria-hidden", "true");
  await expect(logo.locator("text, image")).toHaveCount(0);
  for (const [theme, stroke] of [
    ["Light", "rgb(34, 51, 73)"],
    ["Dark", "rgb(237, 243, 251)"],
  ] as const) {
    await chooseTheme(page, theme);
    await expect
      .poll(() =>
        logo
          .locator("g")
          .evaluate((element) => getComputedStyle(element).stroke),
      )
      .toBe(stroke);
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const logoBox = await logo.boundingBox();
      const controlsBox = await page.locator(".wallet-top-meta").boundingBox();
      expect(logoBox!.width).toBeGreaterThanOrEqual(150);
      expect(logoBox!.x + logoBox!.width).toBeLessThanOrEqual(controlsBox!.x);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
  const iconPath = await page
    .locator('link[rel="icon"][type="image/svg+xml"]')
    .getAttribute("href");
  const response = await request.get(iconPath!);
  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain(
    "M50 22H34C24.6 22 18 27.6 18 36S24.6 50 34 50H50",
  );
  await page.goto("/a-missing-page");
  await expect(
    page.getByRole("img", { name: "CocoWallet", exact: true }),
  ).toBeVisible();
});

test("real dialog, review, edit, menu and select motion completes without retaining animation work", async ({
  page,
}) => {
  await recordMotion(page);
  await page.goto("/");
  await openMoneyForm(page, "Deposit");
  const dialog = page.getByRole("dialog", {
    name: "Deposit money",
    exact: true,
  });
  await expectMotion(page, "wallet-dialog-in");
  await expectMotion(page, "wallet-scrim-in");
  expect(
    await dialog.evaluate(
      (element) => getComputedStyle(element).animationDuration,
    ),
  ).toBe("0.24s");
  await dialog.evaluate((element) =>
    Promise.all(element.getAnimations().map((animation) => animation.finished)),
  );
  await expect(dialog).toHaveCSS("opacity", "1");
  await page.getByLabel("You add", { exact: true }).fill("25.00");
  await page
    .getByRole("button", { name: "Review deposit", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review deposit", exact: true }),
  ).toBeFocused();
  await expectMotion(page, "wallet-review-in");
  await page.getByRole("button", { name: "Edit details", exact: true }).click();
  await expectMotion(page, "wallet-edit-in");
  await expect(page.getByLabel("You add", { exact: true })).toHaveValue(
    "25.00",
  );
  await page
    .getByRole("combobox", { name: "Fictional provider", exact: true })
    .click();
  await expectMotion(page, "wallet-menu-in");
  await page
    .getByRole("option", { name: "Community Bank", exact: true })
    .click();
  await expect(page.locator('[data-slot="select-content"]')).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expectMotion(page, "wallet-dialog-out");
  await expect(
    page
      .locator(".wallet-quick-actions")
      .getByRole("button", { name: "Deposit", exact: true }),
  ).toBeFocused();
  await chooseTheme(page, "Dark");
  await expectMotion(page, "wallet-menu-out");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter((animation) => animation.playState === "running").length,
      ),
    )
    .toBe(0);
});

test("interrupted arrivals and mobile menu-to-dialog handoffs preserve focus and drafts", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page
    .locator(".wallet-quick-actions")
    .getByRole("button", { name: "Send money", exact: true });
  for (let repeat = 0; repeat < 3; repeat += 1) {
    await trigger.click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const actions = page.getByRole("button", {
    name: "Money actions",
    exact: true,
  });
  for (let repeat = 0; repeat < 2; repeat += 1) {
    await actions.click();
    await page
      .getByRole("menuitem", { name: "Send money", exact: true })
      .click();
    await expect(
      page.getByLabel("Simulated recipient account ID", { exact: true }),
    ).toBeFocused();
    await page
      .getByLabel("Simulated recipient account ID", { exact: true })
      .fill("demo-recipient");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(actions).toBeFocused();
  }
  await trigger.click();
  await expect(
    page.getByLabel("Simulated recipient account ID", { exact: true }),
  ).toHaveValue("demo-recipient");
});

test("reduced motion removes spatial choreography while forms, menus and focus remain usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Color theme", exact: true }).click();
  await expect(page.getByRole("menu")).toHaveCSS("animation-name", "none");
  await page.getByRole("menuitemradio", { name: "Dark", exact: true }).click();
  await expect(page.locator("body")).toHaveCSS("transition-duration", "0s");
  await openMoneyForm(page, "Deposit");
  await expect(page.getByRole("dialog")).toHaveCSS("animation-name", "none");
  await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCSS(
    "animation-name",
    "none",
  );
  const amount = page.getByLabel("You add", { exact: true });
  await expect(amount).toBeFocused();
  await amount.fill("25.00");
  await page
    .getByRole("button", { name: "Review deposit", exact: true })
    .click();
  await expect(page.locator(".wallet-dialog-review")).toHaveCSS(
    "animation-name",
    "none",
  );
  await page.getByRole("button", { name: "Edit details", exact: true }).click();
  await expect(amount).toHaveValue("25.00");
  await expect(amount).toBeFocused();
  await expect(page.locator(".wallet-dialog-form")).toHaveCSS(
    "animation-name",
    "none",
  );
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});
