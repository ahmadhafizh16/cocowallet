# Transaction details, search, dates and confirmation pacing

**Status:** Complete — T11-12. **Decision:** D-040.

The user requests four follow-ups: use the supplied transaction-detail screenshot;
add a one-second backend sleep when confirming all four money operations; show
transaction-ID search results in the History list rather than opening details;
use a library range calendar like the linked shadcn Calendar.
The user approved refreshing affected DESIGN.md guidance/examples, preserving
the frosted identity and core tokens.

## Pinned detail image

The user's 1024 × 415 dark reference is authoritative; this transcription travels
to reviewers if the inline attachment is unavailable. Keep Transaction history /
Hide / Back to overview at page level. A single rounded, outlined dark sheet has
Back to results, then Transaction details with a green Completed badge and small
direction marker. At top right, a prominent signed amount/currency with the type
underneath. Below, two compact definition-list columns use quiet horizontal
dividers: transaction ID with working copy, type with direction icon, status,
stored amount, currency with decorative flag plus explicit name/code, account and
wallet IDs with copy, provider and recorded UTC time. A divided bottom information
strip says these are recorded facts, not current balances or today's rate.

Adapt the deposit example truthfully for withdrawal, conversion, outgoing/incoming
transfer and arbitrary supported historical currencies. Preserve exact decimals,
both recorded legs where relevant, original rate/provenance, immutable IDs, copy
failure fallback, keyboard/focus, privacy, light/dark and narrow wrapping. The
direction marker is decorative, **not permission to edit an immutable transaction**.
Reference amounts/IDs are not seed data.

## Behavioral contracts

- Search is an explicit **exact transaction-ID filter** on the account-scoped
  history list, including records outside the current page. Combine it with the
  applied type/currency/UTC range; reset to page 1. Matching rows remain selectable
  for details/back. Clear restores normal list browsing; missing/foreign IDs produce
  an honest empty list, not foreign data or a forced detail page. Add the optional
  read-only `transactionId` query to runtime/OpenAPI/client guards.
- Use registry-derived shadcn Calendar on React DayPicker in `mode="range"`, with
  the existing shared controls and Radix Popover. Selection is explicitly UTC,
  inclusive and staged until Apply; clear/unbounded and same-day ranges work.
  Preserve month navigation, keyboard/Escape/focus return, viewport collision and
  usable phone sizing. Standard dense calendar day cells may be 36px on compact
  phones to fit seven columns; surrounding actions/navigation remain at least 44px.
- Valid confirmation submissions for deposit, withdrawal, conversion and transfer
  await **1,000ms on the server before database access/atomic work**. Use an async
  timer, never busy-wait or hold a SQLite transaction across the delay. Malformed
  requests still fail fast; original-key replay and server validation remain intact.
  Quote expiry is checked at actual submission after the pause, never extended.
  This explicit user request supersedes prior no-artificial-request-delay UI notes;
  it remains a local simulation, not evidence of real banking/network processing.
  No fake success, frontend-only pause or minimum success animation is substituted.

## Dependency and source evidence

The official [Calendar documentation](https://ui.shadcn.com/docs/components/base/calendar#range-calendar)
confirms React DayPicker and `mode="range"`; the official registry source supplies
the wrapper pattern. Jina Reader returned 401 twice and the web-reader fallback
was unavailable; the official HTML and registry JSON were read directly through
the prescribed fallback. React DayPicker **10.0.2** is pinned in package/lock files;
reuse the existing Radix/Button/Lucide foundations, not a second UI system.
Production-only `npm audit` reports **zero vulnerabilities**; the install reported
23 development-tree advisories, not authorization for unrelated upgrades.

## Operational baseline and verification

Development stopped before changes. Fresh SQLite backup verified row-for-row over
all 15 tables: `/app/data/wallet.sqlite.pre-details-calendar-1794481464103.bak`.
Integrity `ok`, zero FK violations. Preserve the newest **3 accounts / 5 wallets /
7 funding attempts / 1 conversion attempt / 2 transfer attempts / 10 transactions /
13 journal entries / 11 observations**, plus 5 quotes / 3 uses / 1 catalog cache /
7 rate caches. The user added another deposit after D-039; do not restore an older
baseline or seed the screenshot's example. Financial verification is isolated.

Cover all detail types/copy/failure/privacy, exact list filtering/missing/scoping,
calendar selection/clear/UTC in non-UTC browser zones, pending timing/disabled
confirmation/recovery/quote expiry, source contracts and shipping sizes/themes.
Finish Docker/Jest/browser checks, rendered inspection, independent review,
approved design handoff, data comparison/restored development and local commit;
no migration, normal-wallet money test or push.

### Final verification evidence

- Full Docker check passes **1,547 Jest tests / 74 suites**, artifact/link checks
  (**62 documents / 41 tasks**), formatting, lint, types and production build.
- The focused four-test Chromium run passes all-four real server pacing and
  original-key replay, in-list search/detail/copy and calendar interaction in
  America/Los_Angeles and Pacific/Auckland. The complete fresh-server Chromium
  regression passes **122/122 tests** in 7.5 minutes.
- Final rendered evidence is in `.impeccable/review/transaction-experience/`:
  **50 originals and six contact sheets**, spanning 320/820/1024/1440 light/dark,
  reference-height supplements, all detail directions, copy success/failure,
  privacy, invalid dates, empty search and loading/missing/error details. The
  parent opened all sheets and readable detail/calendar originals. All eight
  branches fit without horizontal overflow, keep copy targets 44 × 44px, bound
  the calendar popup and report zero page errors or API writes. Calendar days
  are 36 × 36px at 320px and 44 × 44px elsewhere.
- The changed-UI detector ran **once**: one warning for the inherited square
  amount editor's bottom focus boundary (not a rounded-card accent), plus 41
  type/radius inventory advisories. No blanket ignore or repeat pass was added;
  the independent reviewer receives the full output and rendered evidence.
- Verify-tier graph handoff refreshed at generation `2026-11-12T11:17:43Z`;
  all 15 relevant source paths have no recorded coverage issue and matching
  freshness metadata. Complete direct traces connect the three HTTP adapters to
  the pause and HistoryWorkspace to the library calendar/detail components.
  Coverage is best-effort evidence, not an exhaustive correctness claim.
- The D-040 read-only comparison probe confirms all **15 normal-wallet tables
  are row-identical** to the current ten-transaction backup before restoration;
  integrity is `ok` with zero foreign-key violations. After development restart,
  all **13 non-cache tables remain identical**; only catalog/rate caches refresh.

### Independent review

A fresh read-only child returned all five finish-review sections with
**`disposition: ship`**, **no material fixes**, at this bounded D-040 scope. All
50 originals and six sheets were opened; source inspection was sampled. The
inline image was represented by the authoritative transcription above. Type,
material, ground, detail hierarchy/facts, correct signed directions, in-list
search, responsive library calendar, states and server pacing were accepted.
No new visual world, comp or raster gate applied. The detector warning concerns
the inherited square amount editor, and inventory advisories do not establish
material defects. This is not exhaustive security/performance/WCAG certification.
Approved affected design guidance/examples are refreshed as recorded below.

### Approved design handoff

The independent documenter refreshed only `DESIGN.md` and `.impeccable/design.json`.
Parent snapshot comparison confirms byte-identical normative YAML frontmatter,
unchanged core tokens, color/typography metadata and ramps, shadows, motion,
balance-card metadata and breakpoints. The two affected presentation extensions
are refreshed and transaction-experience metadata is added. All **13 existing
preview names/keys remain**; **12 previews are unchanged**, with only Completed
History sheet refreshed. Recorded transaction details and UTC range calendar are
added as explicitly synthetic, inert examples (**15 total**).

Parent browser validation covers the three affected previews at 320/1440px in both
themes (**12 variants**): no horizontal document overflow, page errors, scripts or
network requests; manual fields are read-only, copy targets 44 × 44px and calendars
show one/two months. Sample detail/calendar originals were opened. These static
documentation checks do not replace the live application's independent review or
claim working clipboard/library behavior inside an inert preview.

### Development restoration

Both disposable previews are stopped. The old development cache is retained as
`.next/dev.pre-details-calendar-1794483290728`; normal development is healthy.
The new D-040 read-only probe verifies the actual **ten History / five recent
records**, exact displayed available total, in-list exact-ID result before row
selection, correct detail summary, filtered-list/back focus, library calendar,
privacy, soft navigation and zero-on-reopen. **300 frames** retain a stable main
surface and URL, with one document navigation, zero page/console errors and zero
API writes. No normal-wallet seed, monetary test, migration or restore drill ran.

The post-restoration comparison preserves the current **3 accounts / 5 wallets /
7 funding attempts / 1 conversion attempt / 2 transfer attempts / 10 transactions /
13 journal entries / 11 observations**, plus **5 quotes / 3 uses**. All 13 non-cache
tables are row-identical to the current backup. Only `fx_catalog_cache` and
`fx_rate_cache` changed; table counts remain 1 and 7. Integrity is `ok`, with zero
foreign-key violations. Read-only probes/results remain in the D-040 review folder;
the stale nine-record D-039 restore probe was not reused unchanged.
