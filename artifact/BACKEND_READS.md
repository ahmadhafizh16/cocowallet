# Persistent accounts and read integration

**Historical milestone boundary:** This record describes the completed read
slice. [FUNDING.md](FUNDING.md) subsequently connects simulated deposit/withdrawal
confirmation, durable retries and receipts; its evidence supersedes the disabled-
funding statements below, not this checkpoint's verification.

**Status:** Implemented and verified under [T03-01](tasks/TASKS-03.md#t03-01) and
[D-029](DECISIONS.md#d-029). The user paused further UI refinement and asked to
start backend implementation/integration. This is the first connected slice,
not completion of money operations, FX, history, idempotency or Swagger UI.

## Scope and contract

- `npm run db:migrate`, then `npm run db:seed`, explicitly initialize storage.
  Seeding is one top-level synchronous immediate transaction. Create only missing
  startup currency metadata, one main account with initial USD default, and missing
  USD/EUR/GBP wallets. Existing IDs, balances, defaults and destinations survive.
  Precision comes from pinned accounting metadata and conflicts fail closed.
  No journal entry or completed transaction is seeded. GET requests never seed.
- `GET /api/accounts`: `{ accounts: AccountRecord[] }`, main first, then stable
  creation/ID ordering. Records expose ID, role, default currency, creation time
  and an explicit inspect-only flag.
- `GET /api/accounts/{accountId}/wallets`: `{ account, wallets }`. Each wallet
  exposes ID, account ID, currency, name, accounting exponent and exact nonnegative
  `balanceMinor` **string**. All metadata and balances share one read snapshot;
  existing streamed bigint journal aggregation remains authoritative. No SQL
  `SUM()`/`TOTAL()`, float money, cached user data or omitted foreign balances.
- Missing accounts return safe 404 Problem Details. Invalid empty/null-character
  path IDs return 400. Missing initialization, corrupt/incompatible data or storage
  failures return 503; no internal errors, paths or stack traces escape. Every
  wallet response has `Cache-Control: no-store`. No POST/PATCH financial handler
  is introduced, and no CORS/public-access policy is broadened.
- `GET /api/openapi` describes implemented read and operational routes only.
  The specification is hand-maintained with response-contract tests; the future
  write-schema generator and Swagger UI are not claimed as implemented.
- Unsupported methods retain Next.js's 405 behavior without a mutation handler;
  no custom error-body contract is claimed for that framework response.

## Application integration

The root page becomes a dynamic Node server render from the same read services,
not an internal HTTP round trip or build-time DB access. Account IDs and balances
come from SQLite, not `createPreviewOverview`; that helper remains test-only.
The initial UI still supports USD/EUR/GBP. If storage contains another currency,
the read API can represent pinned precision, but the current overview fails
closed rather than dropping it or inventing a flag. Currency-management UI and
catalog eligibility remain T03-02/T06-01 work.

The overview is labelled **Balances connected**. Main USD totals are available
without FX only when every non-USD balance is zero; otherwise the total is
unavailable while individual balances remain visible. Destination valuation
policy remains O-004, so no destination total is supplied as available. History
remains explicitly disconnected—unknown history is not labelled “no activity.”
Stored snapshots do not claim to be continuously refreshed; reload reads again.

Money dialogs remain always mounted, retain local drafts and disabled final
submission, and label their supplied balances as journal-derived. No quotes,
funding API, transfers, recipient creation or recorded balance-history series
are fabricated. Only factual connection copy changes; visual UI feedback is
deferred and layout, styling, branding and motion stay fixed.

## Acceptance

Verify blank/repeated/concurrent/reopened seeding, preserved data/defaults,
atomic rollback, precision conflicts, inspect-only enforcement, exact/max-bound
journal reads, unknown IDs, snapshot isolation, safe HTTP errors/JSON contracts,
no GET mutations, dynamic rendering, account identity across reloads, and all
existing browser flows. Back up the persistent database before its first seed;
tests must use explicit isolated databases. Repeat Docker checks/build and
production Chromium tests, restore stable development, and commit locally.

## Remaining stages

Resolve the write-specific O-003/O-006 questions before HTTP money movement;
then implement durable idempotency, deposits/withdrawals, FX/quotes, conversions/
transfers, completed history, full valuation and Swagger in dependency order.
Neither partial read helpers nor this document closes T03-02/T03-03/T10-01–03.

## Verification and operational checkpoint

- Full Docker check/build passes **723 Jest tests**; **43 production Chromium
  checks** pass after the final review correction. The root route is dynamic,
  and no build-time database seeding/reading is introduced.
- Account tests cover concurrent initialization, late-failure rollback, reopen
  persistence, preserved defaults/IDs/funds, precision/metadata corruption,
  inspect-only destinations, exact/max-bound balances and cross-connection WAL
  snapshots. API/spec/adapter tests cover safe statuses, decimal-string contracts,
  and rate-free versus unavailable totals. Browser checks bind the rendered ID
  to the API across reloads and verify no mutation route is exposed.
- The independent read-only review found two P2 issues: special account-ID keys
  in a plain totals dictionary, and outdated fresh-install instructions. Totals
  now use `Object.fromEntries`; regressions cover `__proto__`, `constructor` and
  `toString` as own data keys with a normal prototype/JSON round trip. Setup now
  explicitly orders migrate → seed → start. The reviewer marked both resolved;
  the parent repeated full verification afterward. This is a bounded read-slice
  review, not a completed-backend or security certification.
- Before real initialization, SQLite's backup API created
  `/app/data/wallet.sqlite.pre-account-integration-1794410597278.bak`. The source
  database had zero accounts/wallets/transactions/entries, integrity `ok`, no FK
  violations. Migrations and two explicit seed runs preserved the same new main
  identity. Fresh production containers read **1 account / 3 wallets / 0
  transactions / 0 journal entries**; integrity and FK checks still pass.
  A restore drill remains unperformed under O-005.
- Development resumed with generated cache retained at
  `.next/dev.pre-account-reads-1794411067932`. A real browser verified connected
  identity, account menu and draft interaction, 300 stable frames, and zero extra
  reloads, page errors or console errors. No persistent data was removed.
- Artifact validation passes **50 documents / 36 tasks**. No package dependency,
  accounting schema/core, CSS, branding or motion changes were made in this slice.
