import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifact = join(root, "artifact");
const args = process.argv.slice(2);
const option = (name) => {
  const position = args.indexOf(name);
  if (position < 0) return undefined;
  if (!args[position + 1] || args[position + 1].startsWith("--")) {
    throw new Error(`Missing value for ${name}`);
  }
  return resolve(args[position + 1]);
};
const jestPath = option("--jest");
const playwrightPath = option("--playwright");
if (Boolean(jestPath) !== Boolean(playwrightPath)) {
  throw new Error("Supply both --jest and --playwright reports, or neither.");
}

const guideFiles = [
  "artifact/index.html",
  "artifact/project-guide.css",
  "artifact/project-guide.js",
  "artifact/project-guide-data.js",
  "artifact/PROJECT_STRUCTURE.md",
  "artifact/TEST_CASES.md",
  "artifact/USER_GUIDE.md",
  "scripts/capture-project-guide.cjs",
  "scripts/update-project-guide.mjs",
  "e2e/project-guide.spec.ts",
];
const screenshotDir = join(artifact, "guide-screenshots");
if (existsSync(screenshotDir)) {
  guideFiles.push(
    ...readdirSync(screenshotDir)
      .filter((file) => file.endsWith(".png"))
      .map((file) => `artifact/guide-screenshots/${file}`),
  );
}
const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root })
  .toString("utf8")
  .split("\0")
  .filter(Boolean);
const files = [...new Set([...tracked, ...guideFiles])].sort((a, b) =>
  a.localeCompare(b, "en"),
);

const labels = {
  ".dockerignore":
    "Excludes local or generated files from the Docker build context.",
  ".env.example": "Example environment variables; not a live secrets file.",
  ".gitignore":
    "Excludes dependencies, build output, local databases, secrets, and design-tool runtime files.",
  ".npmrc": "npm installation and engine settings.",
  ".prettierignore": "Paths excluded from Prettier formatting.",
  "README.md": "Project setup, operation, verification, and safety notes.",
  "PRODUCT.md":
    "Product purpose, audience, capabilities, and confirmed constraints.",
  "DESIGN.md":
    "CocoWallet's visual system, components, behavior, and design guidance.",
  Dockerfile: "Node development and Playwright browser-test container images.",
  "compose.yaml":
    "Local app, test service, networking, and persistent volumes.",
  "components.json": "shadcn/ui component generator configuration.",
  "drizzle.config.ts": "Drizzle schema and SQLite migration configuration.",
  "eslint.config.mjs": "ESLint rules and project lint configuration.",
  "jest.config.cjs":
    "Jest setup, test matching, environment, and module aliases.",
  "next.config.ts":
    "Next.js configuration and allowed local development origin.",
  "package.json":
    "Application dependencies, Node requirements, and npm scripts.",
  "package-lock.json":
    "Exact locked npm dependency tree for reproducible installs.",
  "playwright.config.ts":
    "Playwright test directory, browser, base URL, and reporters.",
  "postcss.config.mjs": "PostCSS and Tailwind CSS processing configuration.",
  "tsconfig.json": "TypeScript compiler settings and path aliases.",
  ".impeccable/config.json": "Shared Impeccable design-tool settings.",
  ".impeccable/design.json":
    "Machine-readable design tokens and component examples.",
  ".impeccable/surfaces/src-app-page-tsx.md":
    "Wallet surface design brief and current interaction decisions.",
  "artifact/index.html":
    "Local documentation site entry point and navigation shell.",
  "artifact/project-guide.css":
    "Responsive styling for the local documentation site.",
  "artifact/project-guide.js":
    "Renders the Markdown documents, tree, test search, and navigation.",
  "artifact/project-guide-data.js":
    "Generated Markdown snapshot used when opening the HTML directly from disk.",
  "artifact/PROJECT_STRUCTURE.md":
    "Generated project-file tree with one description per file.",
  "artifact/TEST_CASES.md":
    "Generated catalogue of individual Jest and Playwright cases.",
  "artifact/USER_GUIDE.md":
    "Illustrated operating instructions and application workflow.",
  "scripts/capture-project-guide.cjs":
    "Playwright capture script guarded for the disposable documentation server.",
  "scripts/update-project-guide.mjs":
    "Regenerates the file inventory, optional test catalogue, and offline Markdown bundle.",
  "scripts/check-artifacts.mjs":
    "Checks consistency and links in project planning artifacts.",
  "scripts/e2e-reference-provider.mjs":
    "Provides deterministic reference-rate responses to the isolated browser server.",
  "scripts/migrate.ts":
    "Applies reviewed SQLite migrations to the configured database.",
  "scripts/seed.ts":
    "Creates the initial main account and currency wallets without funding them.",
  "scripts/setup-impeccable.sh":
    "Restores the checksum-verified Impeccable tooling.",
  "scripts/smoke-portfolio.ts": "Opt-in, isolated live portfolio diagnostic.",
  "scripts/smoke-rates.ts": "Opt-in, isolated live reference-rate diagnostic.",
  "scripts/start-funding-e2e.ts":
    "Starts the guarded disposable monetary browser-test server.",
  "src/app/globals.css":
    "Global theme tokens, base styles, and shared motion rules.",
  "src/app/icon.svg": "CocoWallet favicon artwork.",
  "src/app/layout.tsx": "Root Next.js document layout and metadata.",
  "src/app/loading.tsx": "Wallet loading boundary and skeleton.",
  "src/app/error.tsx": "Application error boundary and retry presentation.",
  "src/app/not-found.tsx": "Branded not-found page.",
  "src/app/(wallet)/layout.tsx":
    "Persistent wallet shell shared by overview and history routes.",
  "src/app/(wallet)/page.tsx": "Overview route entry point.",
  "src/app/(wallet)/history/page.tsx": "Transaction history route entry point.",
  "src/components/ui/LICENSE.shadcn":
    "License notice for the copied shadcn/ui foundations.",
  "src/features/money/LICENSE.currency-precision.txt":
    "License notice for the pinned currency precision data.",
  "src/features/money/currency-precision.json":
    "Pinned currency minor-unit precision metadata.",
  "src/features/wallet/wallet.css":
    "Wallet-specific layout, component, theme, and responsive styles.",
  "src/server/db/schema.ts":
    "Drizzle definitions for the persistent SQLite schema.",
  "src/server/db/test-fixture.ts":
    "Creates and cleans isolated SQLite fixtures for tests.",
  "src/features/history/test-fixture.ts":
    "Shared fixture data for history tests.",
  "src/test/json-contract.ts":
    "Shared assertions for exact JSON contract tests.",
  "src/components/brand/cocowallet-logo.tsx":
    "Reusable inline CocoWallet logo and wordmark SVG.",
  "src/features/accounts/seed.ts":
    "Creates the main account and initial currency wallets without adding funds.",
  "src/features/conversions/service.ts":
    "Executes quote-bound currency conversions atomically and retains retry results.",
  "src/features/conversions/quote-details.tsx":
    "Displays the rate, provenance, and expiry of conversion quote terms.",
  "src/features/conversions/quote-review.tsx":
    "Renders conversion review and confirmation using server-owned quotes.",
  "src/features/funding/service.ts":
    "Executes simulated deposits and withdrawals with atomic journal writes and retry protection.",
  "src/features/funding/recent-funding.tsx":
    "Presents recent simulated funding activity.",
  "src/features/funding/request-key.ts":
    "Handles identifiers for safe funding request retries.",
  "src/features/history/date-range.tsx":
    "Accessible inclusive UTC date-range picker for history filters.",
  "src/features/history/recent-transactions.tsx":
    "Renders recent completed transactions for the selected account.",
  "src/features/history/transaction-facts.tsx":
    "Displays immutable transaction details and copyable identifiers.",
  "src/features/history/workspace.tsx":
    "History page filters, transaction list, paging, and detail navigation.",
  "src/features/journal/balances.ts":
    "Calculates wallet balances from journal entries.",
  "src/features/journal/write.ts":
    "Serializes and commits atomic journal writes.",
  "src/features/money/currency-precision.ts":
    "Looks up the pinned accounting precision for supported currencies.",
  "src/features/money/money.ts":
    "Parses, validates, converts, and formats exact monetary amounts.",
  "src/features/portfolio/service.ts":
    "Calculates account portfolio totals and records eligible observations.",
  "src/features/portfolio/usd-value.ts":
    "Values wallet balances in USD using exact reference-rate arithmetic.",
  "src/features/quotes/service.ts":
    "Creates and validates immutable, expiring reference-rate quotes.",
  "src/features/rates/frankfurter.ts":
    "Fetches reference currency and rate data from Frankfurter.",
  "src/features/rates/service.ts":
    "Coordinates fresh reference rates and bounded cached fallback.",
  "src/features/submissions/submission-panel.tsx":
    "Shows pending, confirmed, failed, and recovery states for money submissions.",
  "src/features/submissions/use-submission.ts":
    "Coordinates monetary submissions and original-request recovery.",
  "src/features/theme/theme-menu.tsx":
    "Provides the System, Light, and Dark theme menu.",
  "src/features/theme/theme.ts":
    "Applies and persists the user's theme preference.",
  "src/features/transfers/service.ts":
    "Atomically transfers simulated funds to a destination with durable retry protection.",
  "src/features/transfers/transfer-review.tsx":
    "Displays recipient, amount, and applicable quote terms before a transfer.",
  "src/features/wallet/amount-entry.ts":
    "Handles exact decimal-text entry, grouping, and caret behavior.",
  "src/features/wallet/balance-history.tsx":
    "Displays recorded USD balance observations as a chart and paged table.",
  "src/features/wallet/currency-flag.tsx":
    "Renders decorative currency flags and a fallback currency marker.",
  "src/features/wallet/dashboard-skeleton.tsx":
    "Loading skeleton that reserves the wallet dashboard layout.",
  "src/features/wallet/dashboard.tsx":
    "Wallet shell and overview: accounts, balances, actions, privacy, and recent activity.",
  "src/features/wallet/money-amount-input.tsx":
    "Accessible decimal-text amount field for money operations.",
  "src/features/wallet/money-review.tsx":
    "Shared amount-first review layout and confirmation actions.",
  "src/features/wallet/operation-model.ts":
    "Defines money-operation drafts, validation, and presentation state.",
  "src/features/wallet/operation-workspace.tsx":
    "Connects the four money-operation dialogs to forms, review, and recovery.",
  "src/features/wallet/presentation.ts":
    "Formats wallet amounts, labels, and other display values.",
  "src/server/db/connection.ts":
    "Opens and configures SQLite connections for the application.",
  "src/server/db/migrate.ts":
    "Applies the project's reviewed Drizzle migrations.",
  "src/server/db/runtime.ts":
    "Provides the configured runtime database connection.",
  "src/server/http/confirmation-delay.ts":
    "Applies the approved asynchronous pause before valid money confirmations.",
  "src/server/http/request-input.ts":
    "Validates local HTTP request origins, content types, and bounded JSON bodies.",
  "src/server/http/responses.ts":
    "Builds shared no-store JSON responses and safe HTTP errors.",
  "src/server/http/openapi.ts":
    "Assembles the wallet's published OpenAPI document.",
  "src/server/portfolio-observation.ts":
    "Coordinates post-operation portfolio observation recording.",
  "src/server/wallet-overview.ts":
    "Combines account and journal data into the server-rendered wallet overview.",
};
const folderLabels = {
  ".impeccable": "Shared design context and surface decisions.",
  ".opencode": "Project-local design skill, commands, and supporting tools.",
  artifact: "Product records, feature documents, and this documentation site.",
  "artifact/prd": "Feature-specific product requirements.",
  "artifact/tasks": "Task breakdowns grouped by milestone.",
  "artifact/guide-screenshots":
    "Playwright screenshots from an isolated simulated wallet.",
  drizzle: "Reviewed SQLite migrations and Drizzle metadata.",
  "drizzle/meta": "Generated Drizzle schema snapshots and migration journal.",
  e2e: "Playwright browser and API end-to-end tests.",
  public: "Static assets served by Next.js.",
  "public/brand": "CocoWallet vector logo assets.",
  scripts: "Setup, verification, diagnostic, and documentation scripts.",
  src: "Application source and colocated Jest tests.",
  "src/app": "Next.js routes, layouts, global styles, and API endpoints.",
  "src/app/(wallet)": "Shared wallet shell, overview, and history pages.",
  "src/app/api": "HTTP route handlers for the local wallet API.",
  "src/components": "Shared visual components and branding.",
  "src/components/ui": "Reusable shadcn/Radix UI primitives.",
  "src/components/brand": "CocoWallet brand components.",
  "src/features": "Domain logic, user-interface features, and their tests.",
  "src/lib": "Shared contracts, presentation utilities, and React hooks.",
  "src/server": "Server-side database, HTTP, and overview integration.",
  "src/server/db": "SQLite connection, migrations, schema, and fixtures.",
  "src/server/http":
    "HTTP validation, handlers, responses, and OpenAPI schemas.",
  "src/test": "Shared test utilities and contract checks.",
};
const words = (value) =>
  value.replace(/\.(test|spec)$/, "").replace(/[-_]/g, " ");
const firstHeading = (path) => {
  try {
    return readFileSync(join(root, path), "utf8").match(/^#\s+(.+)$/m)?.[1];
  } catch {
    return undefined;
  }
};
const componentPurpose = {
  badge: "Pill-style status and metadata component.",
  button: "Shared button variants, sizes, and loading states.",
  calendar: "Accessible calendar component for selecting dates.",
  card: "Composable card layout primitives.",
  dialog: "Accessible modal dialog primitives.",
  "dropdown-menu": "Accessible dropdown menu primitives.",
  field: "Field labels, descriptions, and error presentation.",
  input: "Shared styled input control.",
  label: "Accessible form label primitive.",
  popover: "Accessible anchored popover primitives.",
  select: "Accessible selection controls and options.",
  separator: "Visual and semantic divider component.",
  skeleton: "Placeholder used during loading.",
  tooltip: "Accessible tooltip primitives.",
};
const common = {
  contracts: "Shared data types and validation contracts",
  context: "Operation context and binding rules",
  errors: "Domain-specific error definitions",
  service: "Business logic and domain operations",
  read: "Read-side queries and data retrieval",
  write: "Persistent write operations",
  preview: "Preview data and presentation helpers",
  receipt: "Confirmed operation receipt handling",
  recovery: "Unresolved submission recovery logic",
  storage: "Persistent storage and retrieval logic",
  validation: "Input and stored-data validation rules",
  types: "Shared types and data shapes",
};
function describe(path) {
  if (labels[path]) return labels[path];
  const basename = path.split("/").at(-1);
  const stem = basename.replace(
    /\.(tsx?|mjs|cjs|js|json|sql|svg|png|md|txt|sh)$/,
    "",
  );
  if (path.startsWith("artifact/guide-screenshots/")) {
    return `Playwright capture: ${words(stem.replace(/^\d+-/, ""))}, using disposable example data.`;
  }
  if (path.startsWith("artifact/") && path.endsWith(".md")) {
    return `Project documentation: ${firstHeading(path) ?? words(stem)}.`;
  }
  if (path.startsWith(".opencode/skills/impeccable/reference/")) {
    return `Impeccable design-tool reference: ${firstHeading(path) ?? words(stem)}.`;
  }
  if (path === ".opencode/skills/impeccable/LICENSE")
    return "License for the bundled Impeccable design skill.";
  if (path === ".opencode/skills/impeccable/SKILL.md")
    return "Instructions for the project-local Impeccable design skill.";
  if (path.startsWith(".opencode/commands/"))
    return "OpenCode command definition for the Impeccable design skill.";
  if (path.startsWith(".opencode/skills/impeccable/scripts/data/"))
    return `Design-tool data: ${words(stem)}.`;
  if (path.startsWith(".opencode/skills/impeccable/scripts/"))
    return `Impeccable tool support file: ${words(stem)}.`;
  if (path.startsWith("drizzle/meta/"))
    return basename === "_journal.json"
      ? "Drizzle's ordered migration journal."
      : `Drizzle schema snapshot for migration ${stem.replace("_snapshot", "")}.`;
  if (path.startsWith("drizzle/") && path.endsWith(".sql"))
    return `Reviewed SQLite migration: ${words(stem.replace(/^\d+_/, ""))}.`;
  if (path.startsWith("public/brand/"))
    return `CocoWallet vector asset: ${words(stem)}.`;
  if (path === "e2e/helpers.ts")
    return "Shared Playwright helpers for themes, forms, recipient selection, and dialog controls.";
  if (path.startsWith("e2e/") && path.includes(".spec."))
    return `Playwright end-to-end cases covering ${words(stem.replace(/^z+-/, ""))}.`;
  if (path.endsWith(".test.ts") || path.endsWith(".test.tsx")) {
    const area = path.split("/").slice(1, -1).join(" / ");
    return `Jest cases for ${words(stem)} in ${area}.`;
  }
  if (path.startsWith("src/components/ui/") && componentPurpose[stem])
    return componentPurpose[stem];
  if (path.startsWith("src/app/api/") && basename === "route.ts") {
    const route = `/${path.slice("src/app/".length, -"/route.ts".length).replace(/\[([^\]]+)\]/g, "{$1}")}`;
    const source = readFileSync(join(root, path), "utf8");
    const methods = [
      ...new Set(
        [...source.matchAll(/\b(?:GET|POST|PUT|PATCH|DELETE)\b/g)].map(
          (match) => match[0],
        ),
      ),
    ];
    return `${methods.length ? methods.join(" / ") : "HTTP"} handler for ${route}.`;
  }
  if (path.startsWith("src/features/")) {
    const feature = path.split("/")[2];
    if (common[stem]) return `${common[stem]} for ${words(feature)}.`;
    if (stem.startsWith("use-"))
      return `React hook for ${words(stem.slice(4))} in ${words(feature)}.`;
    return `${words(stem)} implementation for the ${words(feature)} feature.`;
  }
  if (path.startsWith("src/server/http/")) {
    if (stem.endsWith("-openapi"))
      return `OpenAPI schema definitions for ${words(stem.replace(/-openapi$/, ""))} endpoints.`;
    if (stem.endsWith("-handler"))
      return `HTTP request handler for ${words(stem.replace(/-handler$/, ""))} operations.`;
    if (stem.endsWith("-responses"))
      return `HTTP response construction for ${words(stem.replace(/-responses$/, ""))}.`;
    return `Server HTTP ${words(stem)} implementation.`;
  }
  if (path.startsWith("src/server/db/"))
    return `Database ${words(stem)} implementation.`;
  if (path.startsWith("src/server/"))
    return `Server-side ${words(stem)} integration.`;
  if (path.startsWith("src/lib/"))
    return `Shared ${words(stem)} utility${stem.startsWith("use-") ? " / React hook" : ""}.`;
  return `${words(stem)} project file.`;
}

function makeTree(paths) {
  const rootNode = { children: new Map() };
  for (const path of paths) {
    let node = rootNode;
    const parts = path.split("/");
    parts.forEach((name, index) => {
      if (!node.children.has(name))
        node.children.set(name, {
          name,
          path: parts.slice(0, index + 1).join("/"),
          children: new Map(),
        });
      node = node.children.get(name);
    });
  }
  const lines = [];
  const walk = (node, depth) => {
    const sorted = [...node.children.values()].sort((a, b) => {
      const difference =
        Number(b.children.size > 0) - Number(a.children.size > 0);
      return difference || a.name.localeCompare(b.name, "en");
    });
    for (const child of sorted) {
      const folder = child.children.size > 0;
      const description = folder
        ? (folderLabels[child.path] ??
          (child.path.startsWith("src/features/")
            ? `${words(child.name)} feature code and tests.`
            : `${words(child.name)} files.`))
        : describe(child.path);
      lines.push(
        `${"  ".repeat(depth)}- \`${child.name}${folder ? "/" : ""}\` — ${description}`,
      );
      if (folder) walk(child, depth + 1);
    }
  };
  walk(rootNode, 0);
  return lines.join("\n");
}

const structure = `# Project file structure\n\nThis snapshot covers ${files.length} tracked project files and guide assets. Dependencies, local data, secrets, build output, and other ignored files are excluded. Run \`node scripts/update-project-guide.mjs\` to refresh the tree and offline bundle; see \`TEST_CASES.md\` to refresh test cases.\n\n## File tree\n\n${makeTree(files)}\n`;
writeFileSync(join(artifact, "PROJECT_STRUCTURE.md"), structure);

if (jestPath && playwrightPath) {
  const jest = JSON.parse(readFileSync(jestPath, "utf8"));
  const playwright = JSON.parse(readFileSync(playwrightPath, "utf8"));
  const lines = [
    "# Test case catalogue",
    "",
    `This snapshot lists ${jest.numTotalTests} individual Jest cases in ${jest.numTotalTestSuites} suites, plus Playwright cases discovered by its test runner. Jest results below are from the isolated run used to build this catalogue; Playwright entries are discovered cases, not a claim that they were executed.`,
    "",
    "Repeated Jest names may represent separate parameterized executions whose inputs are not included in the runner's displayed name.",
    "",
    "Jest uses temporary test databases. Monetary and quote browser tests must only target the guarded disposable funding-e2e server described in `artifact/QUOTES.md`; never run them against the persistent wallet.",
    "",
    "## Jest cases",
  ];
  for (const suite of [...jest.testResults].sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const path = suite.name.replace(/^\/app\//, "").replace(`${root}/`, "");
    lines.push("", `### \`${path}\``, "");
    for (const test of suite.assertionResults) {
      lines.push(
        `- [${test.status}] ${test.fullName.replace(/\s+/g, " ").trim()}`,
      );
    }
  }
  lines.push("", "## Playwright cases", "");
  let playwrightCount = 0;
  const gather = (suite, parents = []) => {
    const title = suite.title?.endsWith(".spec.ts")
      ? []
      : [...parents, suite.title].filter(Boolean);
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        playwrightCount += 1;
        const group = spec.file ?? suite.file;
        if (!browserGroups.has(group)) browserGroups.set(group, []);
        browserGroups
          .get(group)
          .push(
            `${[...title, spec.title].join(" › ")} (${test.projectName || "default"})`,
          );
      }
    }
    for (const child of suite.suites ?? []) gather(child, title);
  };
  const browserGroups = new Map();
  for (const suite of playwright.suites ?? []) gather(suite);
  for (const [file, cases] of [...browserGroups].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    lines.push(
      `### \`e2e/${file}\``,
      "",
      ...cases.map((name) => `- ${name.replace(/\s+/g, " ").trim()}`),
      "",
    );
  }
  lines.push(
    "## Refresh this catalogue",
    "",
    `Playwright discovery found ${playwrightCount} cases. On a Node 26 environment with the project dependencies installed, run the following from the project root. Jest executes the tests; Playwright only discovers cases. Use temporary paths, and never target the ordinary wallet with monetary browser tests.`,
    "",
    "```sh",
    "mkdir -p /tmp/opencode",
    "DATABASE_PATH=/tmp/opencode/guide-jest-unused.sqlite npm test -- --json --outputFile=/tmp/opencode/guide-jest.json",
    "npx playwright test --list --reporter=json > /tmp/opencode/guide-playwright.json",
    "node scripts/update-project-guide.mjs --jest /tmp/opencode/guide-jest.json --playwright /tmp/opencode/guide-playwright.json",
    "```",
    "",
  );
  writeFileSync(join(artifact, "TEST_CASES.md"), lines.join("\n"));
}

const names = ["PROJECT_STRUCTURE.md", "TEST_CASES.md", "USER_GUIDE.md"];
for (const name of names) {
  if (!existsSync(join(artifact, name)))
    throw new Error(`Missing ${name}; supply test reports on the first run.`);
}
const payload = Object.fromEntries(
  names.map((name) => [name, readFileSync(join(artifact, name), "utf8")]),
);
writeFileSync(
  join(artifact, "project-guide-data.js"),
  `// Generated by scripts/update-project-guide.mjs. Edit the Markdown, not this file.\nwindow.COCO_GUIDE_DATA = ${JSON.stringify(payload)};\n`,
);
console.log(
  `Updated guide: ${files.length} files; ${relative(root, join(artifact, "project-guide-data.js"))} bundled.`,
);
