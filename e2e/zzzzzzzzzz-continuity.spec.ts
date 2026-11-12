import {
  expect,
  test,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { chooseRecipient } from "./helpers";

test.beforeEach(({ baseURL }) =>
  test.skip(
    !baseURL?.includes("simulated-wallet-funding-preview"),
    "Disposable monetary database required.",
  ),
);
async function fund(request: APIRequestContext) {
  const { accounts } = await (await request.get("/api/accounts")).json();
  const main = accounts.find((a: { role: string }) => a.role === "main");
  const { wallets } = await (
    await request.get(`/api/accounts/${main.id}/wallets`)
  ).json();
  const usd = wallets.find((w: { currency: string }) => w.currency === "USD");
  expect(
    (
      await request.post("/api/deposits", {
        headers: { "Idempotency-Key": randomUUID() },
        data: { walletId: usd.id, amount: "100.00", provider: "demo_bank" },
      })
    ).status(),
  ).toBe(200);
}
async function open(page: Page, label: string) {
  await page
    .locator(".wallet-quick-actions")
    .getByRole("button", { name: label, exact: true })
    .click();
}
async function close(page: Page) {
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-slot="dialog-content"]')).toHaveCount(0);
}
async function shot(page: Page, name: string) {
  mkdirSync(".impeccable/review/continuity", { recursive: true });
  await page.screenshot({
    path: `.impeccable/review/continuity/${name}.png`,
    scale: "css",
    animations: "disabled",
  });
}

test("all four operations reset ordinary/review/completed amounts on reopen, while Edit keeps exact masked input", async ({
  page,
  request,
}) => {
  await fund(request);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  for (const [label, field, noun, complete] of [
    ["Deposit", "You add", "deposit", "Deposit"],
    ["Withdraw", "You withdraw", "withdrawal", "Withdrawal"],
    ["Convert", "You convert", "conversion", "Conversion"],
    ["Send money", "You send", "transfer", "Transfer"],
  ] as const) {
    await open(page, label);
    const amount = page.getByLabel(field, { exact: true });
    await expect(amount).toHaveValue("0");
    if (label === "Send money")
      await chooseRecipient(page, `continuity-${randomUUID()}`);
    await amount.fill("12.34");
    await page
      .getByRole("button", { name: `Review ${noun}`, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: `Review ${noun}`, exact: true }),
    ).toBeFocused();
    await expect(page.locator(".wallet-operation-stage")).toHaveCSS(
      "animation-name",
      "wallet-review-in",
    );
    await page
      .getByRole("button", { name: "Edit details", exact: true })
      .click();
    await expect(amount).toHaveValue("12.34");
    await close(page);
    await open(page, label);
    await expect(amount).toHaveValue("0");
    await amount.fill("1.00");
    await page
      .getByRole("button", { name: `Review ${noun}`, exact: true })
      .click();
    await page.mouse.click(5, 5);
    await expect(page.locator('[data-slot="dialog-content"]')).toHaveCount(0);
    await open(page, label);
    await expect(amount).toHaveValue("0");
    await expect(
      page.getByRole("button", { name: `Confirm ${noun}`, exact: true }),
    ).toHaveCount(0);
    await amount.fill("1.00");
    await page
      .getByRole("button", { name: `Review ${noun}`, exact: true })
      .click();
    await page
      .getByRole("button", { name: `Confirm ${noun}`, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: `${complete} complete`, exact: true }),
    ).toBeVisible();
    await expect(page.locator(".wallet-operation-stage")).toHaveCSS(
      "animation-name",
      "wallet-complete-in",
    );
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await open(page, label);
    await expect(amount).toHaveValue("0");
    await close(page);
  }
});

test("pending dismissal and blocked confirmed cleanup retain original recovery rather than a zero draft", async ({
  page,
  request,
}) => {
  await fund(request);
  await page.goto("/");
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    "**/api/deposits",
    async (route) => {
      await held;
      await route.continue();
    },
    { times: 1 },
  );
  await open(page, "Deposit");
  await page.getByLabel("You add", { exact: true }).fill("1.25");
  await page
    .getByRole("button", { name: "Review deposit", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm deposit", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Confirming submission…", exact: true }),
  ).toBeVisible();
  const original = await page.evaluate(() =>
    sessionStorage.getItem("cocowallet.pending-funding.v1"),
  );
  await close(page);
  await open(page, "Convert");
  await expect(page.getByRole("dialog")).toContainText("1.25");
  await expect(page.getByLabel("You convert", { exact: true })).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("cocowallet.pending-funding.v1"),
    ),
  ).toBe(original);
  await page.evaluate(() => {
    const remove = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function (key: string) {
      if (key === "cocowallet.pending-funding.v1")
        throw new Error("cleanup blocked");
      return remove.call(this, key);
    };
  });
  release();
  await expect(
    page.getByRole("heading", { name: "Deposit complete", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText(
    "recovery context could not be cleared",
  );
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await open(page, "Withdraw");
  await expect(
    page.getByRole("heading", { name: "Deposit complete", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("1.25 USD");
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("cocowallet.pending-funding.v1"),
    ),
  ).toBe(original);
});

for (const width of [320, 820, 1440])
  for (const theme of ["light", "dark"] as const)
    test(`step continuity is bounded, interruptible and reduced-motion safe at ${width}px ${theme}`, async ({
      page,
      request,
    }) => {
      await fund(request);
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({
        colorScheme: theme,
        reducedMotion: "no-preference",
      });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto("/");
      await page.evaluate(() => {
        (
          window as typeof window & { stepAnimations: string[] }
        ).stepAnimations = [];
        document.addEventListener("animationstart", (e) => {
          (
            window as typeof window & { stepAnimations: string[] }
          ).stepAnimations.push(e.animationName);
        });
      });
      await open(page, "Deposit");
      await page.getByLabel("You add", { exact: true }).fill("1.00");
      await shot(page, `input-${width}-${theme}`);
      await page
        .getByRole("button", { name: "Review deposit", exact: true })
        .click();
      const dialog = page.getByRole("dialog");
      await expect(page.locator(".wallet-operation-stage")).toHaveAttribute(
        "data-step",
        "review",
      );
      await expect(page.locator(".wallet-operation-stage")).toHaveCSS(
        "animation-name",
        "wallet-review-in",
      );
      await shot(page, `review-${width}-${theme}`);
      await page
        .getByRole("button", { name: "Edit details", exact: true })
        .click();
      await expect(page.getByLabel("You add", { exact: true })).toBeFocused();
      await expect(page.getByLabel("You add", { exact: true })).toHaveValue(
        "1.00",
      );
      await page
        .getByRole("button", { name: "Review deposit", exact: true })
        .click();
      await expect
        .poll(() =>
          dialog.evaluate((e) =>
            e.getAnimations().some((a) => a.id === "wallet-step-resize"),
          ),
        )
        .toBe(true);
      const resizing = await dialog.evaluate((e) =>
        e
          .getAnimations()
          .filter((a) => a.id === "wallet-step-resize")
          .map((a) => ({
            duration: a.effect!.getTiming().duration,
            frames: (a.effect as KeyframeEffect)
              .getKeyframes()
              .map((k) => k.height),
          })),
      );
      expect(resizing[0]!.duration).toBe(240);
      await page
        .getByRole("button", { name: "Confirm deposit", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Deposit complete", exact: true }),
      ).toBeFocused();
      await expect(page.locator(".wallet-operation-stage")).toHaveCSS(
        "animation-name",
        "wallet-complete-in",
      );
      await shot(page, `done-${width}-${theme}`);
      await page.getByRole("button", { name: "Done", exact: true }).click();
      await open(page, "Deposit");
      await expect(page.getByLabel("You add", { exact: true })).toHaveValue(
        "0",
      );
      await shot(page, `reset-${width}-${theme}`);
      await page.getByLabel("You add", { exact: true }).fill("1.00");
      await page
        .getByRole("button", { name: "Review deposit", exact: true })
        .click();
      await close(page);
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              document.getAnimations().filter((a) => a.playState === "running")
                .length,
          ),
        )
        .toBe(0);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await open(page, "Deposit");
      await page.getByLabel("You add", { exact: true }).fill("1.00");
      await page
        .getByRole("button", { name: "Review deposit", exact: true })
        .click();
      await expect(page.locator(".wallet-operation-stage")).toHaveCSS(
        "animation-name",
        "none",
      );
      expect(
        await dialog.evaluate(
          (e) =>
            e.getAnimations().filter((a) => a.id === "wallet-step-resize")
              .length,
        ),
      ).toBe(0);
      await page
        .getByRole("button", { name: "Confirm deposit", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Deposit complete", exact: true }),
      ).toBeFocused();
      await expect(page.locator(".wallet-operation-stage")).toHaveCSS(
        "animation-name",
        "none",
      );
      expect(await dialog.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(
        true,
      );
      expect(errors).toEqual([]);
      const events = await page.evaluate(
        () =>
          (window as typeof window & { stepAnimations: string[] })
            .stepAnimations,
      );
      expect(events).toEqual(
        expect.arrayContaining([
          "wallet-review-in",
          "wallet-edit-in",
          "wallet-complete-in",
        ]),
      );
      writeFileSync(
        `.impeccable/review/continuity/motion-${width}-${theme}.json`,
        JSON.stringify({ resizing, events, errors }, null, 2),
      );
    });
