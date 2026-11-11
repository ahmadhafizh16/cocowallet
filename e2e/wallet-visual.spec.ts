import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "@playwright/test";
import Loading from "../src/app/loading";
import WalletError from "../src/app/error";
import { closeMoneyForm, openMoneyForm } from "./helpers";

const reviewDirectory = resolve(".impeccable/review");

test("captures the rendered overview at its shipping sizes and themes", async ({
  page,
}) => {
  mkdirSync(reviewDirectory, { recursive: true });
  for (const [name, width, height, colorScheme] of [
    ["desktop", 1440, 1000, "light"],
    ["mobile", 390, 844, "light"],
    ["dark", 1440, 1000, "dark"],
    ["tablet", 820, 1180, "light"],
    ["tablet-dark", 820, 1180, "dark"],
    ["mobile-dark", 390, 844, "dark"],
    ["narrow", 320, 844, "light"],
    ["user-1688", 1688, 1000, "light"],
    ["user-1769", 1769, 1000, "dark"],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ colorScheme });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Your wallet, at a glance." }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      colorScheme,
    );
    await page.screenshot({
      path: resolve(reviewDirectory, `${name}.png`),
      fullPage: true,
      animations: "disabled",
    });
    if (name === "mobile") {
      await page.screenshot({
        path: resolve(reviewDirectory, "mobile-viewport.png"),
        animations: "disabled",
      });
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  const capture = (name: string) =>
    page.screenshot({
      path: resolve(reviewDirectory, `${name}.png`),
      fullPage: true,
      animations: "disabled",
    });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await openMoneyForm(page, "Deposit");
  await capture("deposit");
  await page.getByLabel("You add", { exact: true }).fill("25.00");
  await page
    .getByRole("button", { name: "Review deposit", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review deposit", exact: true }),
  ).toBeFocused();
  await capture("deposit-review");
  await closeMoneyForm(page);
  await page
    .getByRole("button", { name: "Account being inspected", exact: true })
    .click();
  await capture("account-menu");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Color theme", exact: true }).click();
  await capture("theme-menu");
  await page.keyboard.press("Escape");
  await page
    .getByRole("combobox", { name: "Filter transactions", exact: true })
    .click();
  await capture("history-menu");
  await page.keyboard.press("Escape");
  await page.emulateMedia({ colorScheme: "dark" });
  await openMoneyForm(page, "Convert");
  await page.getByLabel("You convert", { exact: true }).fill("1.005");
  await page
    .getByRole("button", { name: "Review conversion", exact: true })
    .click();
  await expect(page.getByRole("alert")).toBeVisible();
  await capture("convert-invalid-dark");
  await page
    .getByRole("combobox", { name: "Source currency", exact: true })
    .click();
  await capture("currency-menu-dark");
  await page.keyboard.press("Escape");
  await closeMoneyForm(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Money actions", exact: true })
    .click();
  await capture("mobile-actions-dark");
  await page.getByRole("menuitem", { name: "Send money", exact: true }).click();
  await expect(
    page.getByLabel("Simulated recipient account ID", { exact: true }),
  ).toBeFocused();
  await capture("send-mobile-dark");
  await closeMoneyForm(page);
});

test("captures the actual loading and error components without artificial application delays", async ({
  page,
}) => {
  mkdirSync(reviewDirectory, { recursive: true });
  // Use the browser's compiled CSS, including shadcn's Tailwind utilities.
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Color theme", exact: true }),
  ).toBeEnabled();
  const css = await page.evaluate(() =>
    Array.from(document.styleSheets)
      .map((sheet) =>
        Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n"),
      )
      .join("\n"),
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  const render = (markup: string) =>
    page.setContent(
      `<!doctype html><html lang="en" data-theme="light"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>${markup}</body></html>`,
    );
  await render(renderToStaticMarkup(createElement(Loading)));
  await expect(page.locator('[aria-busy="true"]')).toBeVisible();
  expect(await page.locator(".ui-skeleton").count()).toBeGreaterThan(10);
  await expect(
    page.getByText("Loading wallet overview", { exact: false }),
  ).toBeAttached();
  await page.screenshot({
    path: resolve(reviewDirectory, "loading.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: resolve(reviewDirectory, "loading-mobile.png"),
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await render(
    renderToStaticMarkup(
      createElement(WalletError, {
        error: new Error("private details"),
        reset: () => undefined,
      }),
    ),
  );
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByText("private details")).toHaveCount(0);
  await page.screenshot({
    path: resolve(reviewDirectory, "error-mobile.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: resolve(reviewDirectory, "error.png"),
    fullPage: true,
    animations: "disabled",
  });
  await render(renderToStaticMarkup(createElement(Loading)));
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.classList.add("dark");
  });
  await page.screenshot({
    path: resolve(reviewDirectory, "loading-dark.png"),
    fullPage: true,
    animations: "disabled",
  });
});
