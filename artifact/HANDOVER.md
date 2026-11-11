# Handover

**Status:** Nine of 32 tasks are closed: platform/money/journal core plus Impeccable product and direction confirmation. The reference-led frosted wallet sketch is user-approved; production interface implementation is next under T11-02. Money-moving APIs, full idempotency, FX integration, Swagger, account seeding, and application UI remain unimplemented.

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
| `components.json`, `postcss.config.mjs`, `src/lib/utils.ts` | shadcn/Lucide/Tailwind configuration and tested class helper; not an implemented wallet design. |
| `scripts/check-artifacts.mjs` | Checks Markdown links, decision/task references, board status alignment, and task dependency cycles. |

Fresh local setup and checks:

```sh
docker compose build app
docker compose run --rm app npm ci
docker compose run --rm app npm run db:migrate
docker compose up -d app
docker compose --profile test build browser-tests
docker compose --profile test run --rm browser-tests
```

Stop the dev compiler before `docker compose run --rm app npm run check`, then use `docker compose up -d app` to resume. The check command runs artifact validation, Prettier check, lint, type check, Jest, and production build. A clean install was repeated after adding Python/Make/G++ and using the supported node-gyp header setting; relying on an incremental native install initially concealed that requirement.

Application DB: `/app/data/wallet.sqlite` in Compose's `wallet-data` volume. Tests use isolated temporary SQLite files. Normal shutdown is `docker compose down` without deleting volumes. Before applying journal migrations, the stopped app's database was backed up with SQLite's backup API to `/app/data/wallet.sqlite.pre-journal-1794390597589.bak`. Backup creation is verified; a full restore drill is not claimed.

Latest verification: `docker compose run --rm app npm run check` passes artifact validation, formatting, lint, type checks, **486 Jest tests**, and production build. Both Chromium foundation smoke tests pass after restarting the app. All three migrations are applied to the persistent DB and a repeated migration is a no-op; integrity is `ok`, foreign-key violations are empty, and account/transaction counts remain zero. No wallet data is seeded or moved by verification. Earlier foundation verification covered a clean `npm ci` and service-recreation persistence. The last production npm audit was clean; no dependencies changed in this checkpoint, and 23 low/moderate development-tool findings remain documented in [DEPENDENCIES.md](DEPENDENCIES.md).

The exact money/precision checkpoint passes 437 feature-local Jest tests, targeted lint, formatting, and strict TypeScript checks. It adds no runtime package dependency; the precision extract retains its source MIT notice and checksums.

The balance checkpoint passes 28 combined schema/connection/balance tests, including a 2,049-entry journal with overflowing intermediate subtotals. A test commits through a second WAL connection during an account read and verifies both wallet balances retain the original snapshot; a subsequent read observes the commit. Aggregation permits arbitrary-precision intermediate subtotals but rejects negative/overflowing final balances.

The atomic-write checkpoint passes 16 feature-local integration tests, including independent worker-thread connections for actual lock contention and competing withdrawals. Injected failures after every insert stage, swallowed scope errors, asynchronous misuse, technical success recording/reopen replay, and failure to store success are covered. A read-only review found no concrete correctness issues; full HTTP idempotency and server-owned quote checks remain future integration, not implied guarantees.

## Current environment

- The workspace was empty before the draft documents were added.
- The available host `node` command reports v24.22.1; the application will run on Node.js 26 in Docker, avoiding a requirement to install Node 26 on the host.
- The `sqlite3` CLI was not found. It is optional if the selected application driver manages the SQLite file.
- Docker and Compose run the actual application. The development server is reachable at `http://localhost:3000`; `/` is currently JSON rather than a wallet screen. Health and readiness are separate endpoints.
- Git is initialized on `main`; baseline commits separate ignore rules, feature requirements, architecture decisions, and vendored design tooling. Automatic Angular-style commits by intention are authorized; no remote or push is automatic.
- Impeccable is installed and loadable project-locally in `.opencode/skills/impeccable`, with the `/impeccable` command in `.opencode/commands/impeccable.md`; its bundled Linux engine reports version 4.8.2. Product/demo context, existing scope, and code-first are user-confirmed in [PRODUCT.md](../PRODUCT.md) and `.impeccable/config.json`. The user also approved the frosted reference adaptation; [DESIGN_REFERENCE.md](DESIGN_REFERENCE.md) records the brief, local sketch path/hash, and approval boundary. No production UI or final `DESIGN.md` exists. Live-picker configuration waits for a renderable app shell; follow the manual detector and visual-review workflow when building because no automatic hook is active.
- The approximately 22 MB Impeccable Linux engine is excluded from Git and retained locally. `sh scripts/setup-impeccable.sh` restores the pinned, checksum-verified engine; online restoration and corrupt-source rejection were tested in isolation. See [TOOLING.md](TOOLING.md).
- Host npm/network requests timed out during installation; a direct IPv4-first Node fetch succeeded, but the npm installer still stalled. The skill was installed with the verified cached official CLI and an official locally downloaded bundle. Diagnose Node 26/npm networking inside Docker before relying on dependency installs.
- The project-local Icons8 MCP configuration has been removed at the user's request. Lucide React is installed as the selected icon library; no rendered wallet icon components exist yet.

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

Read [README.md](README.md), the [main PRD](PRD.md), [decision register](DECISIONS.md), [readiness checklist](READINESS.md), and [kanban](KANBAN.md). Work from the linked feature PRDs and task acceptance criteria, and resolve remaining implementation details as needed. Update this handover with actual code paths and commands only after implementation exists.
