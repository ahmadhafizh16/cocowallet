# Atomic simulated-transfer backend

**Status:** T08-01's atomic service is verified. T08-02 now connects a documented
transfer endpoint, reviewed same/FX confirmation, shared original-key recovery and
inspect-only destination balances/incoming recent history, verified under T08-02.
The existing visual system is preserved. T09-02 subsequently adds full-history
browsing through the scoped GETs; valuation, wallet management and Swagger remain
separate work. No dependency,
migration, real-money, banking or payment-provider integration is introduced.

## Internal contract

`submitTransfer(database, key, input, { now?, client? })` is asynchronous and
accepts a UUID key and exactly:

```ts
{
  sourceWalletId: string;
  recipientAccountId: string;
  amount: string;
  targetCurrency?: string;
  recipientDefaultCurrency?: string;
  quoteId?: string;
}
```

Keys and quote UUIDs are case-normalized. Other strings are exact: arbitrary
nonblank recipient IDs are not trimmed, lowercased or restricted to UUIDs. IDs
are bounded and NUL-free. The source must belong to the main account; its own
account ID is rejected. Destination accounts remain inspect-only.

An unknown recipient requires `recipientDefaultCurrency`. An existing recipient
keeps its recorded default; a supplied different default conflicts. An omitted
target resolves to that default. A selected nondefault target is allowed; only
the credited wallet need be created, not an unused default wallet. Creation is
part of successful confirmation, never quote preview or a rejected attempt.

Canonical input stores operation, source, recipient, exact decimal spelling and
optional target/default/normalized quote ID (absent fields become `null`). Omitted
and explicitly supplied defaults are different accepted input. Structural,
unknown-field, malformed UUID/decimal and oversized (>16 KiB) requests are
rejected before key acceptance. Client rate/receive overrides are forbidden.

Same-currency transfers move identical bigint minor units and never request an
FX rate. Existing pinned metadata requires no network request. Only a genuinely
missing new-recipient default may require the fresh-first catalog outside the
writer. Failed requests may fall back to validated data less than 24 hours old;
eligibility is checked again under the writer, without a quote-like hold.
Unavailable/expired/corrupt catalog data leaves the result nondefinitive and
creates no monetary outcome or recipient. Technical catalog cache writes are
separate from accounting.

Cross-currency transfers require an existing reviewed server-owned quote bound
to exact source, amount, recipient, resolved target and supplied default context.
They do not fetch new rates or catalog data at confirmation. The immutable quote
supplies amounts, precision, names and provenance, including metadata for new
currencies. Strict expiry, at-most-one successful use, current funds and target
bounds are revalidated. Failed operations do not consume the quote; issued quotes
keep their full minute across the rate-cache boundary. See [QUOTES.md](QUOTES.md).

## Atomicity and retries

1. Copy input before any await. Reject caller-owned transactions. Preflight replay
   precedes optional catalog work, quote reads, current funds and the clock.
2. Acquire one top-level synchronous `BEGIN IMMEDIATE`; recheck global key
   ownership and original result before all business validation. A delayed catalog
   failure cannot hide another connection's committed same-key result.
3. Retain known pre-write resource, amount, recipient, quote, funds or capacity
   errors as original definitive problems, outside completed transaction history.
4. Create missing currency metadata, simulated destination and selected wallet;
   write one completed transfer and exact debit/credit entries; consume any quote
   through the scoped journal hook; validate and retain the original receipt.
   These changes commit together. Every exception after creation starts escapes
   and rolls all changes back, including late quote expiry/use/result failures.
5. Replay the original success/error indefinitely for identical key/input,
   without current balances, quotes, provider data or clock reads. Changed input
   or another money feature's key returns a nondefinitive key-reuse conflict.
   Storage, lock or corruption failures return safe 503
   `TRANSFER_OUTCOME_UNKNOWN`; retain the identical original key/input/quote.
   Never infer that a timeout means nothing committed or generate a replacement.

The service returns `{ status, body, replayed }`; the HTTP adapter sends `body` at
`status` and maps `replayed` to the response header, not a nested envelope.
Success contains request/transaction IDs,
type/status, exact source/target account/wallet/currency/name/exponent, canonical
decimal/minor-unit amounts, original post-operation balances, recipient default
metadata/creation flag and transaction creation time. Same-currency quote/rate/
issuance/expiry fields are explicitly `null`; FX receipts retain their exact
quote ID, provenance and issuance/expiry. Replay validates stored bindings and
arithmetic, failing closed on damage rather than inventing a receipt.

Migration `0007_transfer_results` adds immutable, indefinitely retained outcomes
and six retention/global-key triggers. Funding, conversion and transfer services
and SQLite triggers enforce mutual key ownership. Existing funding/conversion
results are not rewritten. Back up stopped SQLite before applying migration 0007;
repeat it, compare prior rows, verify integrity/FKs and empty transfer results.
Existing installations must migrate before funding/conversion resume.

## Verification

Feature-local tests cover arbitrary IDs, defaults/overrides, missing metadata/
account/wallet creation, zero-decimal source/target and exact half-up FX, int64
bounds, no-rate same-currency sends, fresh-first fallback/24-hour metadata boundary,
unavailable/corrupt catalogs, input copying, current-context races, durable original
success/error replay, caller-owned transactions, late expiry and every insertion
stage rollback. Receipt mutation tests reject damaged bindings/arithmetic/
provenance/times. Independent native SQLite workers race same/changed keys,
quote reuse, competing quotes, compatible/conflicting recipient creation and
funding/conversion spending/key ownership.

Reproduce with development stopped:

```sh
docker compose run --rm --no-deps app npm test -- --runTestsByPath src/features/transfers/service.test.ts src/features/transfers/receipt.test.ts src/features/transfers/concurrency.test.ts
docker compose run --rm --no-deps app npm run check
```

Production regression commands use the guarded disposable server documented in
[QUOTES.md](QUOTES.md), never the normal wallet. Browser regressions protect the
existing interface, funding/conversion and disabled transfer submission; they do
not claim an enabled transfer journey.

### Backend checkpoint

- Full Docker check/build passes **1,114 Jest tests in 48 suites**, including
  **119 transfer service/receipt/concurrency tests**, plus formatting, lint,
  TypeScript and artifact checks (**55 documents / 36 tasks**).
- Verified SQLite backup
  `/app/data/wallet.sqlite.pre-transfers-1794425889020.bak` preceded two successful
  migration 0007 runs. Every prior non-migration table is bigint-safely row-identical
  to the backup; all seven prior migration rows remain and exactly one was added.
  The new outcome table is empty and all six new retention/exclusivity triggers
  exist. Integrity is `ok`, FK violations zero.
- Runtime remains **1 account / 3 wallets / 0 transactions / 0 journal entries /
  0 funding attempts / 0 conversion attempts / 0 transfer attempts**, with empty
  reference caches and quote/use tables. No runtime test recipient, funds, quote
  or provider data was seeded. No live-provider check or restore drill is claimed.
- Bounded in-thread Verify review checks graph relationships and exact service,
  context, receipt, journal/quote seams and migration source. All six trigger bodies
  (including reported SQL parse gaps at lines 15–23/25–47) were read directly and
  exercised by isolated SQLite tests. This is not an independent-agent audit,
  exhaustive correctness/security certification or performance claim.
- All **63 production Chromium regressions** pass against a fresh guarded
  disposable production database. The existing interface, funding/conversion,
  privacy, account isolation, drafts, layout, themes and motion remain protected;
  this is not a transfer confirmation/inspection browser journey.
- Development resumed with `.next/dev.pre-transfers-1794426161873` retained. A
  browser verified enabled funding review, documented conversion API, absent
  transfer API and **300 stable frames**, with zero extra navigations/page/console
  errors or financial/reference requests. No frontend source or visual tokens
  changed; no new UI-detector/render-review claim is made.
- T08-02 remains To do and depends on T09-01 history/API (with T10-01 shared HTTP
  prerequisite, now verified in [HTTP.md](HTTP.md)). No transfer HTTP endpoint, browser recovery or history UI is
  implied by this service. Checked work is committed locally; no push is authorized.

## Connected T08-02 contract and flow

The checkpoint above records T08-01 only. **`POST /api/transfers`** now uses a thin
adapter over the same service, reusing [HTTP.md](HTTP.md)'s same-origin JSON,
UUID header, 16 KiB bounded body and lossless response safeguards. Structural
rejection is 400 `INVALID_TRANSFER_REQUEST`, before database acquisition. Accepted
business failures/successes use the service's durable retention/replay; unexpected
failure is safe 503 `TRANSFER_OUTCOME_UNKNOWN`, `definitive: false`. Responses are
`no-store` and carry `Idempotency-Replayed`. OpenAPI registers POST with the shared
strict request schema, same-currency-null/FX receipt alternatives and Problem
Details. No new accounting implementation or retry-key ownership policy is added.

The existing always-mounted Send money dialog and shadcn controls are retained:

- IDs use the backend's arbitrary exact nonblank/NUL-free contract (8,192 UTF-16
  code units), not the old ASCII/128-character restriction. No trimming, case
  folding, UUID-only rule or real-identity verification. The 16 KiB UTF-8 body
  bound still applies, even for an ID within its individual character bound.
- The server overview supplies known destinations/defaults. New IDs require a
  validated eligible default; known defaults are shown, never editable. The target
  initially resolves to the destination default and may be explicitly overridden,
  including to the source currency. Changing recipient clears dependent choices;
  changing a transfer source does not inherit conversion's same-currency ban.
- Snapshot context is not a write lock or real recipient verification. The service
  rechecks it and rejects mismatches without overwriting existing defaults. Reload
  and review current context after a definitive rejection. Entry/review never
  creates a recipient/wallet or reserves funds.
- Same-currency review displays identical exact amounts and explicitly no rate or
  quote. It requests neither; a currency catalog request is not an FX rate request.
  A genuinely missing default's metadata can still require a catalog at confirmation.
  FX review validates operation/source/recipient/default/target, pinned precision,
  exact arithmetic, provenance and full-minute lifecycle. Expiry/clock rollback
  disables confirmation; fresh terms need an explicit request and a separate
  confirmation. Editing invalidates previews and discards late replies. No automatic
  money retry, quote replacement, fee or invented reciprocal is added.
- Funding/conversions/transfers share **the unchanged historical recovery key**
  `cocowallet.pending-funding.v1`; older unresolved records remain parseable. Only
  unresolved original key/input/quote uses verified per-tab storage. The bounded
  recovery envelope is separate from the HTTP body. Read/write/read-back failure
  blocks network submission. Reload never submits automatically; any feature action
  opens original recovery instead of a replacement. Mismatched/malformed receipts,
  unknown outcomes and key conflicts preserve uncertainty. Cleanup failure blocks
  new attempts. Rapid confirmation is single-flight.
- Validated receipts show exact source/target amounts, original post-operation
  balances, creation/default context and applied FX when present. Known results
  refresh the overview without relabeling a presentation-refresh failure as monetary
  uncertainty. Ordinary drafts persist in memory through close/edit; reload clears
  ordinary drafts/quotes.
- New destinations appear in the existing account switcher after refresh with
  inspect-only badges. Every destination money action stays disabled and the server
  still rejects destination-owned sources. Destination USD valuation stays
  unavailable; no combined value or rate is invented.
- The existing recent panel now GETs the selected account's **first 50 matching
  completed operations** using T09-01's history API, rather than global retained
  receipts. Account/filter/revision changes cancel stale work and cannot flash a
  prior account's records. Untrusted pages validate context, direction, precision,
  amounts and recorded-rate arithmetic. Failure offers a read-only retry, never
  another account's fallback. Incoming facts retain original source→target rate
  direction. This bounded panel/inline facts is not T09-02's full-history paging,
  date filters or detail navigation.
- Privacy removes amount inputs, review facts, receipt amounts/rates, history
  records and time elements, and blocks hidden confirmation. Keyboard focus return,
  responsive dialog scrolling, themes and reduced motion use existing controls;
  transfer IDs wrap with bidi isolation in facts. No visual identity/token change.

### Verified T08-02 checkpoint

Isolated tests cover strict HTTP guards/schema alignment, arbitrary IDs, same/FX
receipts, original replay after expiry/later spending, retained rejection without
debit/destination creation, source ownership and safe uncertainty. Shared quote/
recovery tests cover recipient tampering, same-currency null terms, legacy-slot
compatibility, reload/original-key routing across features and blocked storage.
Recent-history tests cover foreign/malformed data, late aborted responses, refresh,
empty, retry and privacy. Existing atomic service tests remain authoritative for
concurrency/rollback.

- The final full Docker check/build passes **1,416 Jest tests in 57 suites**,
  formatting, lint, TypeScript and artifact checks (**57 documents / 36 tasks**).
- All **78 production Chromium checks** pass on a fresh guarded disposable server,
  including **13 transfer checks**: reviewed USD→GBP/new destination/incoming
  inspection, exact same-currency IDs without quotes/rates, stored defaults and
  target overrides/missing wallets, server read-only enforcement, lost committed
  response/reload/original-key-and-quote recovery across feature actions, blocked
  storage, expiry/reconfirmation, self-ID/unavailable quote/draft retention, stale
  funds rejection, hidden review/receipt and four 320/1440 light/dark keyboard/
  focus/privacy capture paths. Two historical copy assertions were updated or their
  old message preserved; the complete suite was rerun, not just failed cases.
- Before/after captures and the bounded **ship** verdict are recorded in
  [DESIGN_REVIEW.md](DESIGN_REVIEW.md). A separate 820px reduced-motion check covers
  missing-default validation focus, Escape/focus return and zero page errors.
  The one six-file JSX detector scan was regex-only with no findings; parsed
  contrast/tiny-text rules did not run. No second scan, independent-agent audit,
  physical-device/screen-reader test, WCAG certification or performance claim.
- Verified backup `/app/data/wallet.sqlite.pre-transfer-ui-1794431364277.bak`
  preceded full checks. All **14 runtime tables including migration metadata**
  remain bigint-safely row-identical after tests and restored development. Runtime
  remains **1 account / 3 wallets / 0 transactions / 0 journal entries / 0 funding
  attempts / 0 conversion attempts / 0 transfer attempts**, with empty reference
  caches and quote/use tables. Integrity `ok`; foreign-key violations zero. No new
  migration, dependency, runtime recipient/funds/quote seed, live-provider test or
  restore drill was introduced.
- Development resumed with `.next/dev.pre-transfer-ui-1794432201317` retained.
  A browser verifies enabled funding review, documented transfer POST, actual empty
  scoped recent history and **300 stable frames**: zero extra navigations/page/
  console errors or financial/reference requests. Checked work is committed locally;
  no remote push is authorized.
- Bounded in-thread Verify review uses current graph/path coverage, material call
  directions and exact source for HTTP, preview/recovery, confirmation and scoped
  recent facts. No recorded coverage gap is not completeness proof; no exhaustive
  ledger/security audit is claimed. The previously verified atomic service/migration
  remains unchanged apart from its obsolete internal-only comment.

Next is T09-02's full-history list/detail interface. It must retain D-033's inclusive
UTC calendar days/numbered pages and explicit account isolation. Destination USD
valuation/default-wallet policy, wallet management and Swagger remain separate.
