import { expect, test } from "@playwright/test";

test("History removes auxiliary controls and centers the exact bold empty guidance; modal titles have decorative purpose icons", async ({
  page,
}) => {
  await page.goto("/history");
  await expect(
    page.getByRole("button", { name: "Apply Filter", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reset Filter", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("About these results", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Hide monetary amounts", exact: true }),
  ).toHaveCount(0);
  await page
    .getByLabel("Transaction ID", { exact: true })
    .fill("missing-navigation-polish-record");
  await page
    .getByRole("button", { name: "Find transaction", exact: true })
    .click();
  const empty = page.locator(".wallet-history-filter-empty");
  await expect(
    empty.getByRole("heading", {
      name: "No matching completed activity",
      exact: true,
    }),
  ).toBeVisible();
  await expect(empty.locator("p strong")).toHaveText(
    "Try clearing the search or filters. Your completed transactions will appear here.",
  );
  await expect(empty).toHaveCSS("align-items", "center");
  await expect(empty).toHaveCSS("justify-content", "center");
  await expect(empty).toHaveCSS("text-align", "center");
  await expect(empty.locator("svg")).toHaveCSS("width", "32px");
  await expect(empty.locator("strong")).toHaveCSS("font-weight", "600");
  await page.getByRole("button", { name: "Reset Filter", exact: true }).click();
  await expect(page.getByLabel("Transaction ID", { exact: true })).toHaveValue(
    "",
  );
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  for (const [operation, icon] of [
    ["Deposit", "lucide-plus"],
    ["Withdraw", "lucide-arrow-up-right"],
    ["Convert", "lucide-arrow-right-left"],
    ["Send money", "lucide-send"],
  ]) {
    await page
      .locator(".wallet-quick-actions")
      .getByRole("button", { name: operation, exact: true })
      .click();
    await expect(page.locator('[data-slot="dialog-title"] > svg')).toHaveClass(
      new RegExp(icon!),
    );
    await expect(
      page.locator('[data-slot="dialog-title"] > svg'),
    ).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator('[data-slot="dialog-title"]')).toHaveCSS(
      "display",
      "flex",
    );
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-slot="dialog-content"]')).toHaveCount(0);
  }
});

test("content navigation is bidirectional, bounded and interruption-safe without moving the shell or retaining old content", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const state = {
      animations: [] as Animation[],
      frames: [] as Keyframe[][],
      options: [] as KeyframeAnimationOptions[],
      hold: false,
      main: null as HTMLElement | null,
    };
    (window as typeof window & { routeMotion: typeof state }).routeMotion =
      state;
    const original = HTMLElement.prototype.animate;
    HTMLElement.prototype.animate = function (frames, options) {
      const result = original.call(this, frames, options);
      if (this.id === "main-content") {
        state.animations.push(result);
        state.frames.push(frames as Keyframe[]);
        state.options.push(options as KeyframeAnimationOptions);
        if (state.hold) {
          result.pause();
          result.currentTime = 120;
        }
      }
      return result;
    };
  });
  await page.goto("/");
  const read = () =>
    page.evaluate(() => {
      const s = (
        window as typeof window & {
          routeMotion: {
            animations: Animation[];
            frames: Keyframe[][];
            options: KeyframeAnimationOptions[];
          };
        }
      ).routeMotion;
      return {
        count: s.animations.length,
        frames: s.frames,
        options: s.options,
        states: s.animations.map((a) => a.playState),
      };
    });
  expect((await read()).count).toBe(0);
  await page.evaluate(() => {
    const s = (
      window as typeof window & { routeMotion: { main: HTMLElement | null } }
    ).routeMotion;
    s.main = document.querySelector("#main-content");
  });
  await page.getByRole("link", { name: "History", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Completed transactions", exact: true }),
  ).toBeFocused();
  await expect.poll(async () => (await read()).count).toBe(1);
  let report = await read();
  expect(report.frames[0]![0]!.transform).toBe("translateX(10px)");
  expect(report.options[0]!.duration).toBe(240);
  await expect.poll(async () => (await read()).states[0]).toBe("idle");
  await page.getByRole("button", { name: "Apply Filter", exact: true }).click();
  await page.getByRole("link", { name: "History", exact: true }).click();
  expect((await read()).count).toBe(1);
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(page.locator("#overview")).toBeFocused();
  await expect.poll(async () => (await read()).count).toBe(2);
  report = await read();
  expect(report.frames[1]![0]!.transform).toBe("translateX(-10px)");
  await expect.poll(async () => (await read()).states[1]).toBe("idle");
  await page.evaluate(() => {
    (
      window as typeof window & { routeMotion: { hold: boolean } }
    ).routeMotion.hold = true;
  });
  await page.getByRole("link", { name: "History", exact: true }).click();
  await expect.poll(async () => (await read()).count).toBe(3);
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect.poll(async () => (await read()).count).toBe(4);
  expect((await read()).states[2]).toBe("idle");
  expect(
    await page.evaluate(
      () =>
        document.querySelector("#main-content") ===
        (
          window as typeof window & {
            routeMotion: { main: HTMLElement | null };
          }
        ).routeMotion.main,
    ),
  ).toBe(true);
  await expect(page.locator("#main-content")).toHaveCount(1);
  await expect(page.locator(".wallet-topbar")).toHaveCSS("transform", "none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(async () => (await read()).states[3]).toBe("idle");
  await page.getByRole("link", { name: "History", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Completed transactions", exact: true }),
  ).toBeFocused();
  expect((await read()).count).toBe(4);
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await page
    .getByRole("button", { name: "Hide monetary amounts", exact: true })
    .click();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("link", { name: "History", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "History hidden", exact: true }),
  ).toBeVisible();
  expect((await read()).count).toBe(4);
  await expect(
    page.getByRole("button", { name: "Hide monetary amounts", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Back to overview", exact: true })
    .click();
  await expect(page.locator(".wallet-total-value")).toContainText("••••");
});
