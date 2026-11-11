import { mkdirSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "@playwright/test";
import { BalanceHistory } from "../src/features/wallet/balance-history";
import type { BalanceHistorySeries } from "../src/features/wallet/types";
import { chooseTheme } from "./helpers";

function luminance(hex: string) {
  const channels = hex
    .replace("#", "")
    .match(/../g)!
    .map((part) => {
      const value = Number.parseInt(part, 16) / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}

function contrast(first: string, second: string) {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test("currency flags and the gradient retain contrast, hierarchy and honest history across themes and sizes", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  await page.goto("/");
  const card = page.locator(".wallet-total-panel");
  for (const theme of ["Light", "Dark"] as const) {
    await chooseTheme(page, theme);
    for (const width of [1440, 1024, 820, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const title of [
        "Approximate total",
        "Currency wallets",
        "Recent transactions",
      ]) {
        const heading = page.getByRole("heading", { name: title, exact: true });
        await expect(heading).toHaveCSS(
          "font-size",
          width <= 420 ? "20px" : "22px",
        );
        await expect(heading).toHaveCSS("font-weight", "600");
        await expect(heading.locator("svg")).toHaveAttribute(
          "aria-hidden",
          "true",
        );
        await expect(heading.locator("svg")).toHaveCSS(
          "width",
          width <= 420 ? "20px" : "24px",
        );
      }
      await expect(card).toHaveCSS("color", "rgb(244, 248, 255)");
      expect(
        await card.evaluate(
          (element) => getComputedStyle(element).backgroundImage,
        ),
      ).toContain("linear-gradient(118deg");
      await expect(
        card.getByText("History not connected", { exact: true }),
      ).toBeVisible();
      await expect(
        card.locator(
          ".wallet-balance-history svg, .wallet-balance-history table",
        ),
      ).toHaveCount(0);
      for (const currency of ["USD", "EUR", "GBP"]) {
        const flag = page.locator(
          `.wallet-currency-flag[data-currency="${currency}"]`,
        );
        await expect(flag).toHaveAttribute("aria-hidden", "true");
        await expect(flag).toBeVisible();
        const box = await flag.boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(30);
        expect(box!.height).toBeGreaterThanOrEqual(30);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    const roles = await card.evaluate((element) => {
      const style = getComputedStyle(element);
      return Object.fromEntries(
        [
          "start",
          "mid",
          "end",
          "ink",
          "muted",
          "edge",
          "chart",
          "action",
          "action-ink",
          "action-hover",
          "hover",
        ].map((key) => [
          key,
          style.getPropertyValue(`--balance-${key}`).trim(),
        ]),
      );
    });
    // All gradient stops bound the lightest background in this RGB gradient.
    for (const surface of [
      roles.start!,
      roles.mid!,
      roles.end!,
      roles.hover!,
    ]) {
      expect(contrast(roles.ink!, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(roles.muted!, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(roles.edge!, surface)).toBeGreaterThanOrEqual(3);
      expect(contrast(roles.chart!, surface)).toBeGreaterThanOrEqual(3);
    }
    for (const surface of [roles.action!, roles["action-hover"]!]) {
      expect(contrast(roles["action-ink"]!, surface)).toBeGreaterThanOrEqual(
        4.5,
      );
    }
    const deposit = card.getByRole("button", { name: "Deposit", exact: true });
    await deposit.hover();
    await expect(deposit).toHaveCSS("background-color", "rgb(210, 243, 237)");
    await page.keyboard.press("Tab");
    const privacy = card.getByRole("button", {
      name: "Hide monetary amounts",
      exact: true,
    });
    await privacy.focus();
    await expect(privacy).toHaveCSS("outline-color", "rgb(121, 223, 207)");
    await privacy.click();
    await expect(
      card.getByText("Balance history hidden", { exact: true }),
    ).toBeVisible();
    await expect(
      card.locator(
        ".wallet-balance-history svg, .wallet-balance-history table",
      ),
    ).toHaveCount(0);
    await privacy.click();
  }
  expect(browserErrors).toEqual([]);
});

test("recorded-history fixtures render an accessible chart, never become preview data, and hide all records", async ({
  page,
}) => {
  await page.goto("/");
  const css = await page.evaluate(() =>
    Array.from(document.styleSheets)
      .map((sheet) =>
        Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n"),
      )
      .join("\n"),
  );
  const series: BalanceHistorySeries = {
    accountId: "fixture-account",
    currency: "USD",
    exponent: 2,
    points: [
      { recordedAt: "2026-10-01T09:00:00.000Z", balanceMinor: "23456" },
      { recordedAt: "2026-10-01T10:00:00.000Z", balanceMinor: "45000" },
      { recordedAt: "2026-10-03T09:00:00.000Z", balanceMinor: "30100" },
      { recordedAt: "2026-10-07T09:00:00.000Z", balanceMinor: "57850" },
    ],
  };
  const render = async (
    theme: string,
    supplied: BalanceHistorySeries | undefined,
    hidden = false,
  ) => {
    const markup = renderToStaticMarkup(
      createElement(BalanceHistory, {
        series: supplied,
        accountId: "fixture-account",
        hidden,
      }),
    );
    await page.setContent(
      `<!doctype html><html lang="en" data-theme="${theme}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><main class="wallet-app" style="padding:24px;max-width:700px;margin:auto"><h1 style="margin-bottom:16px">Test-only supplied history fixture</h1><section class="wallet-panel wallet-total-panel">${markup}</section></main></body></html>`,
    );
  };
  mkdirSync(".impeccable/review", { recursive: true });
  for (const [theme, width] of [
    ["light", 700],
    ["dark", 390],
  ] as const) {
    await page.setViewportSize({ width, height: 1000 });
    await render(theme, series);
    await expect(
      page.getByRole("img", {
        name: "Recorded balance history in USD",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator(".wallet-balance-history-point")).toHaveCount(4);
    const plot = await page
      .locator(".wallet-balance-history-plot")
      .boundingBox();
    expect(plot!.width).toBeGreaterThan(250);
    expect(plot!.height).toBe(112);
    const disclosure = page.locator("summary");
    await disclosure.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByRole("table")).toContainText("578.50");
    await expect(page.getByRole("table")).toContainText(
      "2026-10-07T09:00:00.000Z",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.impeccable/review/balance-fixture-${theme}.png`,
      animations: "disabled",
      fullPage: true,
    });
    await render(theme, series, true);
    await expect(
      page.getByText("Balance history hidden", { exact: true }),
    ).toBeVisible();
    expect(await page.locator("body").innerHTML()).not.toMatch(
      /578\.50|2026-10|<svg|<table|<details/,
    );
    await render(theme, { ...series, points: [] });
    await expect(page.locator(".wallet-balance-history")).toHaveAttribute(
      "data-state",
      "empty",
    );
    await expect(page.locator("svg")).toHaveCount(0);
    await render(theme, {
      ...series,
      points: [{ ...series.points[0]!, balanceMinor: "NaN" }],
    });
    await expect(page.locator(".wallet-balance-history")).toHaveAttribute(
      "data-state",
      "invalid",
    );
    await expect(page.locator("svg")).toHaveCount(0);
  }
  await page.goto("/");
  await expect(
    page.getByText("History not connected", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".wallet-balance-history svg")).toHaveCount(0);
});

test("forced colors preserves balance labels, focus and currency markers without a gradient", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".wallet-total-panel")).toHaveCSS(
    "background-image",
    "none",
  );
  await expect(
    page.getByText("History not connected", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".wallet-currency-flag")).toHaveCount(3);
  await expect(page.locator(".wallet-currency-flag").first()).toHaveCSS(
    "forced-color-adjust",
    "none",
  );
  await page.keyboard.press("Tab");
  await page
    .getByRole("button", { name: "Hide monetary amounts", exact: true })
    .focus();
  await expect(
    page.getByRole("button", { name: "Hide monetary amounts", exact: true }),
  ).toHaveCSS("outline-style", "solid");
});
