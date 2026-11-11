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

test("a real browser can reach the technical scaffold", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  expect(await response?.json()).toMatchObject({ milestone: "foundation" });
});
