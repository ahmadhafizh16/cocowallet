import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "@playwright/test";
import Loading from "../src/app/loading";
import WalletError from "../src/app/error";

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
});

test("captures the actual loading and error components without artificial application delays", async ({
  page,
}) => {
  mkdirSync(reviewDirectory, { recursive: true });
  const css = ["src/app/globals.css", "src/features/wallet/wallet.css"]
    .map((file) =>
      readFileSync(resolve(file), "utf8").replace(/^@import[^;]+;/gm, ""),
    )
    .join("\n");
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
});
