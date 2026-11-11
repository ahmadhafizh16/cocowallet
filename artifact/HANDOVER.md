# Handover

**Status:** Eighteen of 36 tasks are closed: persistent reads, durable funding
idempotency and protected deposit/withdrawal services are implemented. Reviewed
simulated confirmations, receipts, recovery and refreshed balances are connected.
The board has 16 To do, 2 In progress (their remaining Swagger acceptance), and
18 Done. Visual feedback remains deferred. FX, conversion/transfer, full history/
valuation and Swagger UI remain separate work. See [FUNDING.md](FUNDING.md).

## Implemented modules and commands

| Path | Responsibility |
| --- | --- |
| `Dockerfile`, `compose.yaml` | Digest-pinned Node 26.13.0, non-root app, native-build tools, localhost port, named volumes, optional Chromium test image. |
| `src/app/api/health/route.ts` | Uncached liveness response. |
| `src/app/api/ready/route.ts` | SQLite/migrated-schema readiness; safe 503 Problem Details on failure. |
| `src/server/db/connection.ts` | Explicit SQLite/Drizzle connection, bigint integer reads, foreign keys, WAL, full synchronous writes, five-second busy timeout. |
| `src/server/db/runtime.ts` | Lazy server-only app connection, deliberately refused under Jest. |
| `src/server/db/migrate.ts`, `scripts/migrate.ts`, `drizzle/` | Versioned operational metadata and account/wallet/transaction/journal migrations. |
| `src/server/db/schema.ts`, `columns.ts` | Unique account/currency wallets, main-account uniqueness, references, bounded integer storage, and immutable accounting identities/history. |
| `src/server/db/test-fixture.ts`, `schema.test.ts` | Isolated journal fixtures and constraint regression tests; fixtures refuse non-test use. |
| `src/features/money/money.ts` | Bounded exact bigint amount parsing/formatting and rational positive half-up FX; [contract](MONEY.md). |
| `src/features/money/currency-precision.*` | Pinned, attributed accounting exponents; unknown/unspecified codes fail closed. [Provenance](CURRENCY_METADATA.md). |
| `src/features/journal/balances.ts` | Stream exact per-wallet bigint balances; account reads share one snapshot and validate final bounds. |
| `src/features/journal/write.ts` | Top-level synchronous immediate-write boundary; main-only accounting, exact credits, funds checks, atomic creation/entries, and a technical-success integration seam. [Contract](JOURNAL.md). |
| `src/features/accounts/`, `scripts/seed.ts` | Explicit repeatable atomic account/startup-wallet initialization; account metadata and exact snapshot balance reads; no seeded journal entries. |
| `src/app/api/accounts/`, `src/server/http/`, `src/app/api/openapi/` | Uncached reads plus shared funding HTTP boundary, safe problems and maintained OpenAPI contracts. Swagger UI remains unimplemented. |
| `src/features/funding/`, `src/app/api/deposits/`, `src/app/api/withdrawals/` | Exact simulated funding, immutable durable original results, same-key retries, per-tab recovery, receipts and bounded completed-funding visibility. |
| `drizzle/0003_funding_results.sql` | Retained technical outcome table and immutable update/delete triggers; no seeded funds or transactions. |
| `scripts/start-funding-e2e.ts`, `e2e/zz-funding.spec.ts` | Refuse ordinary runtime target; successful monetary browser writes use only the disposable isolated server/database. |
| `src/server/wallet-overview.ts` | Dynamic-page adapter, prototype-safe account totals, exact rate-free main USD totals, unavailable FX/destination valuation, no dropped unsupported currencies. |
| `components.json`, `postcss.config.mjs`, `src/lib/utils.ts` | shadcn/Lucide/Tailwind configuration and tested class helper used by the local UI components. |
| `src/components/ui/` | Registry-derived shadcn Button/Card/Dialog/DropdownMenu/Tooltip/Field/Label/Badge/Separator/Input/Select/Skeleton with frosted semantic tokens, keyboard/focus handling, and retained upstream MIT notice. |
| `src/components/brand/`, `public/brand/`, `src/app/icon.svg` | Approved CocoWallet inline vector logo, theme-aware wordmark, unchanged downloadable variants, and matching favicon. |
| `src/features/theme/`, `src/app/globals.css` | Approved frosted tokens, light/dark/system preference, pre-paint theme bootstrap, storage fallback, and reduced-motion styles. |
| `src/app/page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` | Dynamic Node stored-balance overview, styles/metadata, skip link, loading/error boundaries and branded 404. No build-time DB read/seed. |
| `src/features/wallet/` | Existing overview, account snapshots, always-mounted local drafts, reviewed simulated funding, privacy and matching skeleton. Conversion/transfer final actions remain disabled. Preview factory is test-only. |
| `src/features/wallet/balance-history.tsx`, `currency-flag.tsx` | Validated account-scoped recorded-USD chart and exact-value disclosure; honest disconnected/private states; deterministic local currency vectors. No history source or valuation service is connected. |
| `DESIGN.md`, `.impeccable/design.json` | Extracted light/dark visual tokens, canonical design guidance, and version-2 component-preview extensions; actual application styles remain in source CSS. |
| `scripts/check-artifacts.mjs` | Checks Markdown links, decision/task references, board status alignment, and task dependency cycles. |

Fresh local setup and checks:

```sh
docker compose build app
docker compose run --rm app npm ci
docker compose run --rm app npm run db:migrate
docker compose run --rm app npm run db:seed
docker compose up -d app
docker compose --profile test build browser-tests
docker compose --profile test run --rm browser-tests
```

Stop the dev compiler before `docker compose run --rm app npm run check`, then use `docker compose up -d app` to resume. The check command runs artifact validation, Prettier check, lint, type check, Jest, and production build. A clean install was repeated after adding Python/Make/G++ and using the supported node-gyp header setting; relying on an incremental native install initially concealed that requirement.

Application DB: `/app/data/wallet.sqlite` in Compose's `wallet-data` volume. Tests use isolated temporary SQLite files. Normal shutdown is `docker compose down` without deleting volumes. Before applying journal migrations, the stopped app's database was backed up with SQLite's backup API to `/app/data/wallet.sqlite.pre-journal-1794390597589.bak`. Backup creation is verified; a full restore drill is not claimed.

Current funding verification and commands are in [FUNDING.md](FUNDING.md). The
full Docker check/build passes **786 Jest tests** and all **51 production
Chromium checks** pass on the final build. Funding receipts fit 320px/1440px in
both themes with keyboard confirmation, focus recovery and privacy checks. The
production browser suite uses a disposable SQLite database, never the configured
wallet. A SQLite backup at `/app/data/wallet.sqlite.pre-funding-1794415716427.bak`
preceded two successful migration runs. Persistent counts remain 1 account /
3 wallets / 0 transactions / 0 journal entries / 0 funding attempts; integrity
is `ok`, FK violations are zero, both retention triggers exist. No restore drill
or real provider call is claimed.

Development was restored after retaining `.next/dev.pre-funding-1794415843825`.
A real browser verified 300 stable frames, zero extra reloads/page errors/console
errors, and an enabled funding review with **zero financial requests**. No user
wallet funding was used to demonstrate success. T04-02/T05-02 stay in progress
for the unimplemented Swagger UI, rather than silently dropping their criteria.

Historical backend-read checkpoint: **723 Jest tests**, production build and
**43 Chromium checks** passed. See [BACKEND_READS.md](BACKEND_READS.md). Subsequent
funding verification supersedes its disconnected-write boundary, not its evidence.
The last production npm audit was clean; 23 low/moderate development-tool findings
remain in [DEPENDENCIES.md](DEPENDENCIES.md); no new dependency was installed.

Artifact validation verifies **51 documents / 36 tasks**. The previous
T11-02 design-extraction counts and verdict are historical, not certification of
T11-04. Current production captures include desktop light/dark, 1688/1769px,
tablet, mobile, dialogs/menus, validation/review, loading and errors. Independent
review found no demonstrated material visual gap, then scored its provenance and
documentation fixes resolved with `ship` at fix-list scope. The user-selected
Refresh records 38 source-matched theme colors, 20 component-token entries and
10 standalone previews; YAML/JSON, references, syntax and source checks pass.
The manual detector returned 22 advisory inventory mismatches against the old
document, with no non-advisory findings; it was not rerun to manufacture a clean
count. The pre-correction T11-06 detector returned 23 advisory local token-inventory findings,
with no non-advisory finding; the separate branding-only pass returned `[]`.
Neither is WCAG certification or a performance benchmark. App source is unchanged
since the verified production build; development-cache recovery is recorded below.

The subsequent logo request supplies the name **CocoWallet**. Full/inverse/icon
SVG assets live at `public/brand/` and are documented in [BRANDING.md](BRANDING.md).
XML structure, font/raster independence, Chromium decoding and light/dark/small
render checks pass. The later “okay apply it” approval applies the logo to the
header/loading/error/404 surfaces, favicon and metadata. The wordmark follows
explicit theme ink. CSS motion covers protected dialogs, menus, local review/edit,
theme settling and press feedback; reduced motion remains immediate. Actual CSS
timeline captures at 16/80/240ms show opacity/translation/scale settling with
constant blur; they are not frame-rate measurements.
Its bounded reviewer required one interrupted-arrival continuity correction;
the same reviewer then scored that issue resolved with `ship` at fix-list scope.
Six controller unit cases and targeted production frame comparisons support the
fix. Design notes now match source timing and snapshot behavior; palette/primitive
values remain unchanged and source/schema/reference checks pass.

T11-07 adds locally authored US/EU/UK markers, a shared-theme opaque navy-gradient
card and larger 22px semibold/icon-led headings (20px compact). Optional validated
recorded USD snapshots feed a chart and exact-value disclosure; the actual preview
supplies none and says “History not connected.” Seventy chart cases, five flag
cases and expanded dashboard/browser tests protect exactness, privacy and account
isolation. A bounded reviewer returned `ship` and confirmed a later fixed-vector
EU hydration correction preserves that verdict. Final build/captures were repeated.
The changed-target detector records 19 advisory type/radius inventory findings
before that coordinate-only fix, no non-advisory finding. The design sidecar now
records local card roles without changing 38 global colors or 20 primitives.

The exact money/precision checkpoint passes 437 feature-local Jest tests, targeted lint, formatting, and strict TypeScript checks. It adds no runtime package dependency; the precision extract retains its source MIT notice and checksums.

The balance checkpoint passes 28 combined schema/connection/balance tests, including a 2,049-entry journal with overflowing intermediate subtotals. A test commits through a second WAL connection during an account read and verifies both wallet balances retain the original snapshot; a subsequent read observes the commit. Aggregation permits arbitrary-precision intermediate subtotals but rejects negative/overflowing final balances.

The atomic-write checkpoint passes 16 feature-local integration tests, including independent worker-thread connections for actual lock contention and competing withdrawals. Injected failures after every insert stage, swallowed scope errors, asynchronous misuse, technical success recording/reopen replay, and failure to store success are covered. A read-only review found no concrete correctness issues; full HTTP idempotency and server-owned quote checks remain future integration, not implied guarantees.

## Current environment

- The workspace was empty before the draft documents were added.
- The available host `node` command reports v24.22.1; the application will run on Node.js 26 in Docker, avoiding a requirement to install Node 26 on the host.
- The `sqlite3` CLI was not found. It is optional if the selected application driver manages the SQLite file.
- Docker and Compose run the application at `http://localhost:3000`; `/` renders the stored-balance read-only overview. Health/readiness remain separate JSON endpoints. Financial submissions, FX and history remain disconnected.
- T03-01 changes `/` to the dynamic journal-backed read-only overview. Startup
  now requires explicit `db:migrate` then `db:seed`; GET and build never seed.
  Before initialization, SQLite's backup API saved
  `/app/data/wallet.sqlite.pre-account-integration-1794410597278.bak`. The source
  was empty and integrity/FK checks passed. Two seed runs and fresh production
  containers preserve one identity and 1 account / 3 wallets / 0 transactions /
  0 journal entries. No restore drill is claimed.
- After returning from the production preview, a stale Turbopack development
  cache produced continuous Fast Refresh reloads despite HTTP 200 and a healthy
  health endpoint. Recovery stopped only `app`, renamed `.next/dev` to
  `.next/dev.pre-reload-loop-1794403311952` inside the generated-output volume,
  and restarted development. No DB or source was removed. A real browser then
  hydrated, remained stable for 300 animation frames with no further navigation
  or page errors, and opened/edited Send money. Existing tabs may require one
  hard refresh after generated chunks change. Health alone is not UI readiness.
- T11-06 resumed development with a fresh generated cache, retaining the old one
  at `.next/dev.pre-branding-motion-1794405063925`. A real browser verified the
  CocoWallet header, hydration, 300 stable frames without further navigation or
  page errors, and interactive deposit entry/dismissal. No wallet data was touched.
- After the final continuity correction/build, development was restored the same
  way with `.next/dev.pre-motion-continuity-1794406183800` retained. The final
  browser probe again passed hydration, 300 stable frames with zero additional
  reloads/errors, explicit theme selection, and deposit entry/dismissal.
- T11-07 retained generated caches at `.next/dev.pre-balance-card-1794409503161`
  and, after correcting the EU star hydration warning,
  `.next/dev.pre-flag-hydration-1794409722371`. The final browser probe confirms
  hydration, 300 stable frames, zero additional reloads/page/console errors,
  larger headings, all three flags, honest missing history and working theme/
  deposit controls. No database or source was removed.
- T03-01 development recovery retained `.next/dev.pre-account-reads-1794411067932`
  and verified stored API/menu identity, an interactive draft, 300 stable frames,
  zero additional reloads, page errors or console errors. Persistent data stayed.
- Git is initialized on `main`; baseline commits separate ignore rules, feature requirements, architecture decisions, and vendored design tooling. Automatic Angular-style commits by intention are authorized; no remote or push is automatic.
- Impeccable is installed locally without automatic hooks; its engine reports 4.8.2. Product context and code-first are in [PRODUCT.md](../PRODUCT.md) and `.impeccable/config.json`. The original [reference approval](DESIGN_REFERENCE.md) retains material authority; [D-025](DECISIONS.md#d-025) and [WALLET_REDESIGN.md](WALLET_REDESIGN.md) own the new topology/interactions. [WALLET_SURFACE.md](WALLET_SURFACE.md) and its `.impeccable/surfaces/` counterpart carry the current contract and corrected user-pinned provenance. [DESIGN_REVIEW.md](DESIGN_REVIEW.md) distinguishes historical/current verdicts. DESIGN.md and the version-2 sidecar are refreshed to the built system. Live-picker configuration has not been enabled automatically.
- The approximately 22 MB Impeccable Linux engine is excluded from Git and retained locally. `sh scripts/setup-impeccable.sh` restores the pinned, checksum-verified engine; online restoration and corrupt-source rejection were tested in isolation. See [TOOLING.md](TOOLING.md).
- Host npm/network requests timed out during installation; a direct IPv4-first Node fetch succeeded, but the npm installer still stalled. The skill was installed with the verified cached official CLI and an official locally downloaded bundle. Diagnose Node 26/npm networking inside Docker before relying on dependency installs.
- Icons8 MCP remains removed. Lucide supplies UI cues; the favicon uses the approved CocoWallet SVG. Currency flags are locally authored vectors, not paid or fabricated payment branding.

## Important implemented safeguard

The runtime connection explicitly refuses test access (`src/server/db/runtime.ts`):

```ts
if (process.env.NODE_ENV === "test") {
  throw new Error("Tests must use an explicitly isolated database connection.");
}
```

Tests open their own temporary database through `openDatabase`, apply committed migrations, and close/remove only their own fixtures. The readiness test covers both a migrated schema and a safe unavailable response when the isolated schema is missing.

## Next-stage implementation guidance

- Derive balances from integer-minor-unit journal entries; use decimal-safe arithmetic for rates, half-up conversion rounding, and currency-specific precision and numeric limits. Guard SQLite integer and aggregation overflow as well as JavaScript precision/serialization limits.
- The selected driver is `better-sqlite3`; verify native binary/build compatibility with Node 26 before committing dependency versions. Use Jest/`next/jest` for unit and integration tests and Playwright for browser flows.
- Validate on the server, not only in the UI. Avoid negative balances unless explicitly permitted.
- For each completed money-moving action, save the transaction and journal entries in one SQLite transaction. Serialize writers before checking the journal-derived balance, and plan for concurrent requests and duplicate submissions.
- Expose operations through Next.js Route Handlers and document them with OpenAPI and Swagger UI. Use Problem Details errors and require idempotency keys for money-moving requests. An accepted key replays the original definitive success or error; failed-result metadata is not completed history. The generator, exact contracts, and storage/recovery details remain open; see [API_DESIGN.md](API_DESIGN.md) and [O-006](DECISIONS.md#o-006).
- Fetch Frankfurter rates outside the database write transaction. Hold the displayed quote for one minute, retain the exact applied rate and its source date, and fall back only to an exact-pair rate fetched within the last 24 hours. Label cached rates and block when none is eligible. Do not confuse the source rate date with the cache retrieval time or quote expiry.
- For an unknown destination ID, choose its default currency and create and credit a simulated account. The account switcher permits inspecting destination accounts only; automatically create a missing destination-currency wallet, and convert when source/destination currencies differ. Do not imply a real external wallet received money.
- Enforce the inspect-only rule on the server as well as in the interface, even though this is a local no-authentication simulation.
- Only the main account's default currency is editable. The requested portfolio total is always shown in USD, independently of that default.
- History contains completed operations only; rejected requests return errors without creating transaction records. Show a transfer as outgoing for the main account and incoming for the destination.
- The USD portfolio total is approximate. When a required exchange rate is unavailable, show the total as unavailable while leaving individual balances visible.
- Honor reduced-motion preferences while implementing the requested smooth animations and transitions.
- A persistent SQLite file requires persistent storage and a deployment model compatible with a local database. No-auth operation needs a deliberate access/deployment boundary.
- Store the SQLite database in the agreed persistent Docker volume, build the native SQLite driver inside the Linux container, and keep the app's local-only access boundary. Do not assume removing containers preserves a named volume if the volume is explicitly deleted.

## Next steps

Next are catalog/FX quotes, conversion/transfer, full history/valuation and the
remaining API/Swagger acceptance in dependency order. T03-02/T03-03 and
T10-01/T10-03 retain partial/future work; T04-02/T05-02 remain in progress solely
for their Swagger acceptance. O-006 is resolved for funding by D-030. Preserve the
current UI while visual feedback is deferred; no speculative final actions.
Follow [PLAN.md](PLAN.md), [READINESS.md](READINESS.md), and [KANBAN.md](KANBAN.md).
