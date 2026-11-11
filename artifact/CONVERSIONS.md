# Atomic conversion backend

**Status:** T07-01's atomic service and T07-02's documented endpoint, reviewed
quote/confirmation/recovery UI and bounded receipt visibility are implemented.
The existing layout, branding, flags, typography and motion are preserved.
T08-02 now connects transfers through the same recovery slot; see [TRANSFERS.md](TRANSFERS.md).
Full-history browsing/valuation and Swagger retain their tasks. Historical
conversion-only checkpoints below do not describe the later transfer milestone.

## Internal contract

`submitConversion(database, key, input, { now? })` accepts a UUID retry key and
exactly `{ quoteId, sourceWalletId, amount, targetCurrency }`. UUID keys and quote
IDs are case-normalized; the source ID, amount spelling and target code are exact.
Canonical input also includes the conversion operation. Extra fields, client
rate/receive terms, malformed UUIDs and malformed decimal syntax are rejected
before key acceptance. A well-shaped request is bounded to 16 KiB.

The original [server-owned quote](QUOTES.md) supplies ownership, exponents,
amounts, names and provenance. A transfer quote cannot confirm a conversion.
Missing target currency metadata and the main account's target wallet are created
only on successful confirmation, using the reviewed quote metadata; existing
metadata must match pinned precision. Quotes for a missing target wallet now
require an eligible catalog at issuance even if the currency is already stored.
Reference-pair fallback alone does not authorize a new wallet. Supported services
do not delete wallets; arbitrary direct SQL is not an application workflow.

The service returns `{ status, body, replayed }`. Success has status 200 and an
immutable receipt containing requestKey, transactionId, type/status, quoteId,
source/target account/wallet/currency/name/exponent, canonical amount strings,
minor-unit strings, original post-operation balance strings, rate provenance,
quote issuedAt/expiresAt and transaction createdAt. No floating-point monetary
value, fee or real provider integration is introduced.

T07-02 exposes these same fields through `POST /api/conversions` and maintained
OpenAPI schemas, with reviewed confirmation and original-key recovery. The
connected-flow contract below supersedes the earlier backend-only boundary.

## Single atomic boundary and retry rules

1. Validate structural input before accepting a key. One top-level synchronous
   `BEGIN IMMEDIATE` reservation covers all subsequent work.
2. Replay the retained result or reject different input **before** quote reads,
   expiry/use checks, current funds or the clock. Receipt validation checks its
   immutable arithmetic/bindings/provenance without refreshing terms or balances.
3. Funding and conversion share global retry-key ownership. Feature tables remain
   separate; services return the existing key-reuse conflict across features and
   mutual SQLite insert triggers enforce exclusivity. Existing funding outcomes
   and receipts are not rewritten. Retention is indefinite.
4. Validate the quote's exact original input, main-account ownership, recipient-free
   conversion context, strict minute expiry, source funds and final target bounds.
   Known pre-write quote/resource/funds conflicts are retained original definitive
   problems, outside completed history. Funds are not reserved by preview.
5. Only then create missing metadata/wallet, write the completed transaction and
   exact debit/credit entries, and consume the quote through the scoped journal
   hook. Recheck expiry at use. Receipt validation and result persistence stay
   inside the same outer boundary. **Any** error after creation begins escapes;
   it cannot be converted to a committed business rejection.
6. Commit wallet/currency creation, both entries, transaction, quote use and
   original success together. Insert/lock/storage/corruption failures return safe
   nondefinitive 503 `CONVERSION_OUTCOME_UNKNOWN`; never retry automatically or
   assume nothing committed. Use the same key, input and quote until reconciled.

Known recorded failures include missing quote/source (404), input/context mismatch,
inspect-only source, expired/used quote, insufficient funds and target overflow
(409). Structural invalid input is pre-acceptance 400. A new intentional attempt
after a definitive failure uses a new key; an unknown result never does. Changing
the quote reference is different input and needs a new reviewed intention.

Migration `0006_conversion_results` adds retained conversion outcomes, immutable
update/delete triggers and mutual funding/conversion key exclusivity. It does not
copy, seed or modify financial records. Back up the stopped runtime with SQLite's
backup API before applying it, repeat the migration, compare all prior table rows,
and verify integrity/FKs. Automated money tests must use isolated databases.

## Verification scope

Deterministic clock/provider fixtures cover exact ties, zero-decimal source and
target, the int64-compatible limit, missing currency/wallet creation, target bounds,
full-minute cached-rate hold, malformed/mismatched input, stable original success
and rejection replay, restart and replay without reading quotes or the clock.
Failure injection at currency/wallet/transaction/debit/credit/use/result inserts
must leave no partial creation, consumption or debit. Failed error persistence
cannot claim a definitive recorded result. Corrupt stored arithmetic/results fail
closed, without a new operation.

Independent native SQLite workers race the same key, the same quote under different
keys, competing quotes, concurrent funding spending and cross-feature key ownership.
The existing production browser suite protects the UI and disabled submissions;
it does not claim a conversion confirmation journey before T07-02 exists.

### Backend checkpoint

- Full Docker `npm run check` passes **968 Jest tests in 43 suites**, plus lint,
  formatting, type checks, artifact checks and the production build. The service
  has no provider call, HTTP route or browser persistence integration.
- All **53 production Chromium regressions** pass on the disposable database,
  preserving funding/recovery, exact reads, quote previews and disabled conversion
  submission. This is regression evidence, not an enabled conversion UI journey.
- Reproduce deterministic money tests with:
  `docker compose run --rm --no-deps app npm test -- --runTestsByPath src/features/conversions/service.test.ts src/features/conversions/concurrency.test.ts`.
  Full production regression commands use the disposable server documented in
  [QUOTES.md](QUOTES.md), never the normal wallet.
- SQLite backup `/app/data/wallet.sqlite.pre-conversions-1794420848193.bak` was
  compared to the stopped source before migration 0006. Two migration runs pass;
  every prior non-migration table is bigint-safely row-identical to the backup.
  Runtime remains **1 account / 3 wallets / 0 transactions / 0 journal entries /
  0 funding attempts**, with empty rate caches, quotes/uses and conversion results.
  Integrity is `ok`, FK violations zero, and all four new retention/exclusivity
  triggers exist. No runtime test funding/conversion/quote seeding or restore drill
  is claimed.
- Bounded in-thread Verify review used graph relationships, exact service/receipt
  source and all migration triggers. Recorded SQL parse gaps at lines 15–23/25–35
  were read directly and exercised with isolated SQLite tests. This is not an
  independent-agent security audit or an exhaustive correctness certification.
- Development resumed with `.next/dev.pre-conversions-1794420993302` retained. A
  real browser verified enabled funding review, 300 stable frames, zero additional
  navigations/page/console errors and zero financial/reference/quote requests.
  Artifact checks verify **54 documents / 36 tasks**. No dependency or UI source
  change, live provider test or remote push was introduced.

The checkpoint above records the historical T07-01 backend boundary. T07-02 adds
the connected flow below; T08 still owns transfer submission.

## T07-02 connected flow

`POST /api/conversions` now accepts the fixed internal request fields above with
JSON, a UUID `Idempotency-Key`, same-origin browser guards and a 16 KiB body limit.
It returns the original service status/body with `Cache-Control: no-store` and
`Idempotency-Replayed: true|false`. Structural/foreign-body failures are 400 before
database access. Safe 404/409 retained problems and nondefinitive 503 keep their
existing meaning. The maintained OpenAPI document includes the actual endpoint,
strict request/receipt/problems and response-contract tests. Swagger generation/UI
remain T10-03, not implied by the published document.

The existing Convert dialog now fetches eligible currency choices on opening.
If that list is unavailable, existing wallet choices remain usable only if a
server quote validates them. Review explicitly requests an immutable quote; the
browser validates account/input binding, exponents, exact arithmetic and time
provenance before exposing confirmation. It shows both amounts, the exact rate,
source date, fetch time, fresh/cached status and expiry. No funds are reserved.
Editing cancels/invalidates pending terms; late responses cannot restore an old
quote. Closing/reopening retains the ordinary in-memory draft/quote, not a stored
financial draft. Expiry, rolled-back/device clocks and focus/visibility changes
fail closed; confirmation rechecks the actual time even between timer updates.
Fresh terms require an explicit request and a separate confirmation, never an
automatic new operation or quote refresh during recovery.

Funding and conversion now share `src/features/submissions/` and one recovery slot.
The historical key `cocowallet.pending-funding.v1` is deliberately retained so an
unresolved funding request survives this upgrade. Its discriminated version-1
record may now contain `kind: conversion`, the original UUID key and exact original
quote/request. Nothing is saved before explicit confirmation. Save/read-back must
succeed before sending; corrupt, blocked or conflicting storage blocks new money
submissions. An unresolved conversion blocks new funding too. Reload never sends
automatically. Recovery retries the original key/input/quote even after expiry,
because an already committed success must replay first. Unknown/mismatched
responses retain uncertainty; only validated definitive results clear context.
A known result with failed cleanup is visible, but further attempts stay blocked.
Cleanup cannot erase a different recovery record installed during the request.

Receipt and balance refresh reuse the existing dialog/fact-list design. The
overview combines the latest **50 completed funding/conversion receipts**, with
existing type filtering, not the full paginated/history/valuation service. New
supported fiat wallets remain visible with pinned precision and a neutral Lucide
currency marker where no approved local flag exists; USD/EUR/GBP flags are
unchanged. Nonzero foreign totals remain unavailable until valuation is connected.
Privacy removes quoted/receipt/history monetary details and timestamps from the
DOM; ordinary drafts still clear on reload. Transfers remain disabled.

No migration or dependency change is required: schema 0006 already supplies the
atomic service and retained outcomes. Runtime data is backed up before checks;
successful browser money operations use only the guarded disposable server.

### Verified connected-flow checkpoint

- Final full Docker check/build passes **995 Jest tests in 45 suites** and all
  **63 production Chromium checks** pass against a fresh disposable server.
  Ordinary funding/recovery, account isolation, privacy, themes, layout and motion
  regressions remain green. Ten new checks cover no-money review, exact confirmed
  balances/history, missing JPY wallet creation, expiry/reconfirmation, unavailable
  quotes, lost committed response/reload recovery, blocked storage and four
  light/dark 320px/1440px keyboard/focus/privacy review/receipt cases.
- The first browser run found two obsolete assertions for disconnected/preview
  copy; both were updated to the truthful connected wording. The complete suite
  was repeated on fresh disposable databases. A final hardening change replaces
  recurring quote polling with one expiry deadline plus focus/visibility checks;
  its no-recurring-timer test, full build and entire browser suite were repeated.
- Representative production captures under
  `.impeccable/review/conversion-flow/` were inspected in both themes at 320px and
  1440px. These are non-shipping screenshots of the actual guarded disposable
  app, with deterministic Frankfurter fixtures and isolated simulated funds,
  generated by `e2e/zzzz-conversions.spec.ts`; they are not user-wallet or live-rate
  evidence. Reproduction uses the production commands in [QUOTES.md](QUOTES.md).
- The one changed-UI detector scan returned `[]`. The later deadline-only hook
  correction did not alter those scanned JSX files; the detector was not rerun to
  manufacture another result. Bounded in-thread source/graph/browser/render review
  returns **`ship` at this connected-conversion scope**; no independent-agent
  security review, WCAG certification, physical-device or performance claim is made.
- SQLite backup `/app/data/wallet.sqlite.pre-conversion-flow-1794423439298.bak`
  was verified before checks. Every runtime table, including migration metadata,
  remains bigint-safely row-identical: **1 account / 3 wallets / 0 transactions /
  0 journal entries / 0 funding attempts / 0 conversion attempts**, with empty
  reference caches and quote/use tables. Integrity is `ok`, FK violations zero.
  No migration/dependency change, runtime monetary/quote test seed, live-provider
  check, restore drill or remote push was introduced.
- Development resumed with `.next/dev.pre-conversion-flow-1794424055123` retained.
  A browser verified enabled funding review, documented conversion API, absent
  transfer API and 300 stable frames, with zero extra navigations/page/console
  errors or financial/reference/quote requests. No runtime money was used to
  demonstrate the feature. Artifact checks cover **54 documents / 36 tasks**.

T08-01 now adds the [internal atomic transfer service](TRANSFERS.md), extending
global key ownership across funding/conversion/transfers. Migrate through 0007
before these services resume. T09-01's history queries/API is the next dependency
before T08-02's reviewed transfer UI. Do not enable transfer submission merely
because its service/quote preview exists. Preserve exact accounting, inspect-only
destinations, original-key recovery, privacy and the current visual identity.
