import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";

const root = resolve(process.cwd());
const guide = pathToFileURL(resolve(root, "artifact/index.html")).href;

test("the guide opens offline and renders the file tree from bundled Markdown", async ({
  page,
}) => {
  await page.goto(guide);
  const navigation = page.getByRole("navigation", {
    name: "Documentation sections",
  });
  await expect(navigation.getByRole("link")).toHaveText([
    "How to use",
    "Project files",
    "Test cases",
  ]);
  await expect(
    page.getByRole("heading", { name: "How to use CocoWallet" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "How to use", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "Project files", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Project files" }),
  ).toBeVisible();
  await expect(page.getByText(/^\d+ files in the inventory/)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Project files" }),
  ).toHaveAttribute("aria-current", "page");
  const documents = await page.evaluate(() => {
    const docs = (
      window as typeof window & { COCO_GUIDE_DATA: Record<string, string> }
    ).COCO_GUIDE_DATA;
    return docs;
  });
  expect(Object.keys(documents).sort()).toEqual([
    "PROJECT_STRUCTURE.md",
    "TEST_CASES.md",
    "USER_GUIDE.md",
  ]);
  for (const [name, markdown] of Object.entries(documents)) {
    expect(markdown).toBe(
      readFileSync(resolve(root, "artifact", name), "utf8"),
    );
  }
  await page
    .getByRole("link", { name: "CocoWallet project guide home" })
    .click();
  await expect(
    page.getByRole("heading", { name: "How to use CocoWallet" }),
  ).toBeVisible();
});

test("file search opens matching folders and identifies individual files", async ({
  page,
}) => {
  await page.goto(`${guide}#files`);
  await page
    .getByRole("searchbox", { name: "Search project files" })
    .fill("currency-precision.json");
  await expect(
    page.getByRole("link", { name: "currency-precision.json" }),
  ).toBeVisible();
  await expect(
    page.getByText("1 matching file", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("searchbox", { name: "Search project files" })
    .fill("no-such-project-file-xyz");
  await expect(
    page.getByText("No files match your search", { exact: false }),
  ).toBeVisible();
});

test("test catalogue searches individual Jest and Playwright cases", async ({
  page,
}) => {
  await page.goto(`${guide}#tests`);
  await expect(page.getByRole("heading", { name: "Test cases" })).toBeVisible();
  await page
    .getByRole("searchbox", { name: "Search test cases" })
    .fill("moves identical minor units to an existing nondefault wallet");
  await expect(
    page.getByText(
      "moves identical minor units to an existing nondefault wallet",
      { exact: false },
    ),
  ).toBeVisible();
  await page
    .getByRole("searchbox", { name: "Search test cases" })
    .fill("the overview uses persistent account IDs");
  await expect(
    page.getByText("the overview uses persistent account IDs", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Playwright cases" }).click();
  await expect(
    page.getByRole("heading", { name: "Playwright cases" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Jest cases" })).toHaveCount(
    0,
  );
});

test("the illustrated guide loads all application screenshots and chapter links", async ({
  page,
}) => {
  await page.goto(`${guide}#guide`);
  await expect(
    page.getByRole("heading", { name: "How to use CocoWallet" }),
  ).toBeVisible();
  const chapters = page
    .getByRole("navigation", { name: "Guide chapters" })
    .getByRole("link");
  await expect(chapters).toHaveCount(12);
  expect(
    (await chapters.allTextContents()).map((text) => Number.parseInt(text, 10)),
  ).toEqual(Array.from({ length: 12 }, (_, index) => index + 1));
  const pictures = page.locator(".reading figure img");
  await expect(pictures).toHaveCount(14);
  for (const picture of await pictures.all()) {
    await picture.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        picture.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  await page
    .getByRole("link", { name: "3. View balance history on Overview" })
    .click();
  await expect(
    page.getByRole("heading", { name: "3. View balance history on Overview" }),
  ).toBeInViewport();
  await expect(
    page.getByText("View recorded balances", { exact: false }).first(),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "8. Switch to a read-only destination account" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "8. Switch to a read-only destination account",
    }),
  ).toBeInViewport();
  await page
    .getByRole("link", { name: "9. Browse and inspect history" })
    .click();
  await expect(
    page.getByRole("heading", { name: "9. Browse and inspect history" }),
  ).toBeInViewport();
});

test("navigation and search remain usable on a narrow screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(guide);
  await page.getByRole("link", { name: "Test cases" }).click();
  await expect(page.getByRole("heading", { name: "Test cases" })).toBeVisible();
  await page
    .getByRole("searchbox", { name: "Search test cases" })
    .fill("atomic simulated transfer service");
  await expect(page.getByText("matching case", { exact: false })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("HTTP rendering prefers the current Markdown over the offline snapshot", async ({
  page,
}) => {
  const server = createServer((request, response) => {
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    if (pathname === "/artifact/PROJECT_STRUCTURE.md") {
      response.writeHead(200, { "content-type": "text/plain" });
      response.end(
        "# Project file structure\n\nHTTP-only source.\n\n## File tree\n\n- `fresh-source.txt` — Current Markdown content.\n",
      );
      return;
    }
    const file = resolve(root, `.${decodeURIComponent(pathname)}`);
    if (!file.startsWith(`${root}${sep}`)) {
      response.writeHead(403).end();
      return;
    }
    try {
      const types: Record<string, string> = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "text/javascript",
        ".svg": "image/svg+xml",
        ".md": "text/plain",
      };
      response.writeHead(200, {
        "content-type": types[extname(file)] ?? "application/octet-stream",
      });
      response.end(readFileSync(file));
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  try {
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("Missing HTTP test port");
    await page.goto(
      `http://127.0.0.1:${address.port}/artifact/index.html#files`,
    );
    await expect(
      page.getByRole("link", { name: "fresh-source.txt" }),
    ).toBeVisible();
    await expect(page.getByText("HTTP-only source.")).toBeVisible();
  } finally {
    await new Promise<void>((done, reject) =>
      server.close((error) => (error ? reject(error) : done())),
    );
  }
});
