import { expect, test } from "@playwright/test";

test("the app exposes a healthy, uncached foundation endpoint", async ({
  request,
}) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(await response.json()).toMatchObject({
    status: "ok",
    milestone: "foundation",
  });
});

test("a real browser can reach the wallet interface", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("main")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your wallet, at a glance." }),
  ).toBeVisible();
});
