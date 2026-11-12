# Completed history queries, API and interface

**Status:** Scoped completed-history APIs, explicit filters, numbered pages and
exact detail/back navigation are connected. D-035 supersedes T09-02's original
in-panel placement: History now lives at `/history` via existing navigation,
within a shared shell preserving account, privacy and monetary drafts/recovery.
Five signed recent rows can open their scoped detail there. Transaction-history
contracts remain unchanged and do not fetch rates. Recorded USD-total observations
are a separate [portfolio service](PRESENTATION_REFINEMENT.md). The historical
checkpoints below retain their original scope/evidence, not current placement.

## Approved contract — D-033

The user chose **inclusive UTC calendar days and numbered pages**, not cursors.

| Method | Endpoint | Query |
| --- | --- | --- |
| GET | `/api/transactions` | Required `accountId`; optional `type`, `currency`, `from`, `to`, `page`, `pageSize`. |
| GET | `/api/transactions/{transactionId}` | Required `accountId` only. |

All query parameters may occur at most once. Unknown fields (including `cursor`),
missing/blank/NUL account IDs, malformed filters and reversed date ranges are 400
before database access. IDs are exact, case-preserving, nonblank/NUL-free and
bounded by the shared identifier contract; transaction IDs are not restricted to
UUIDs, so valid older internal journal records remain inspectable. No main-account
fallback or unscoped detail lookup exists.

- `type`: one of `deposit`, `withdrawal`, `conversion`, `transfer`.
- `currency`: uppercase code with known pinned accounting precision. It matches
  **either affected side**, within the selected account's records. Historical
  stored units such as four-decimal CLF are not hidden because today's provider
  catalog excludes them. No catalog/rate request is made.
- `from` and `to`: canonical valid `YYYY-MM-DD` UTC calendar days, independently
  optional and both inclusive. The SQL bounds are `00:00:00.000Z` and
  `23:59:59.999Z`; browser/process timezone and daylight saving do not change them.
  Malformed/normalized-away dates (for example February 30) are rejected, not fixed.
- `page`: positive safe integer, default **1**. `pageSize`: **1–100**, default **50**.
  Wire values are plain positive integers, not fractions, exponents, signs or
  zero-padded spellings. Exact bigint offset/ceiling arithmetic avoids unsafe
  multiplication/division. Pagination metadata is safe JSON integer data, never
  monetary amounts. Unrepresentable metadata fails closed rather than rounding.
- Order: `created_at DESC, id DESC` (SQLite binary text ID tie-breaker). One
  operation appears once, even when both currencies match a filter. A page beyond
  the end is an empty 200; an empty filter/account has `totalPages: 0`.
- Account metadata, matching count, page rows and entries share **one read
  snapshot**. New activity **between requests can shift numbered-page boundaries**
  and repeat/skip a record across pages. This is the selected numbered-page tradeoff,
  not an undocumented cursor or snapshot-token guarantee.

## Exact response facts

List returns `{ account, transactions, pagination }`, with pagination fields
`page`, `pageSize`, `totalItems`, `totalPages`. Detail returns
`{ account, transaction }`. `account` is the existing selected-account metadata
shape, including `inspectOnly`, not its current balances.

Each transaction contains:

- `transactionId`, `type`, `status: completed`, canonical UTC `createdAt`;
- `direction`: deposit `incoming`, withdrawal `outgoing`, conversion `internal`,
  transfer `outgoing` for its main source or `incoming` for its destination;
- `source`/`target`: accountId, walletId, currency, stored name, pinned exponent,
  canonical `amount` and exact `amountMinor` **strings**. Amounts are positive
  magnitudes; direction/source/target express the debit/credit, not a floating
  or signed cross-currency total. Missing source/target is explicitly `null`;
- `provider`: original fictional funding code, otherwise `null`;
- `rate`: original stored `{ value, date, fetchedAt, source }`, otherwise `null`.
  Same-currency transfers have no FX terms. Incoming views keep the original
  source→target rate direction; no reciprocal is invented. A provider name that
  was not stored on the transaction is not fabricated.

No retry key, quote payload/ID, original post-operation balance, current balance,
USD valuation or unrelated-account activity is exposed. A valid selected account's
unrelated transaction ID has the **same 404 body** as a nonexistent transaction.
The local no-auth simulation is still not a security boundary or public service.

## Storage and consistency

`src/features/history/read.ts` reads completed `transactions` and their own
`journal_entries`, not retained attempt tables. Successful low-level/older journal
records remain visible; definitive failed attempts do not become history. The
reader never seeds, writes a cache, contacts a provider or changes accounting.

Source/target wallet/account/currency references, roles, pinned precision, entry
count/signs, positive bounded minor units, transaction shape/provider, timestamps
and stored rate provenance/arithmetic are validated. Missing counterpart metadata
is surfaced by LEFT JOINs, not silently dropped. Exact half-up arithmetic using
the **recorded** rate checks the stored credit; it never replaces a journal amount
or uses today's rate. Cache age, current funds, quote expiry/use and the current
clock are irrelevant to immutable completed facts. Source/target names come from
stored currency metadata; account metadata is current within the read snapshot,
not an invented historical profile snapshot.

`readAccountMetadata` reuses the existing validated account mapper and checks main
initialization without scanning every destination or aggregating balances. Existing
account/overview read behavior is preserved. Page queries are bounded to 100
records; exact matching counts/offset pagination may scan history. No large-scale
performance benchmark or global journal/corruption audit is claimed. Validation
is task-directed to selected facts, not proof of every unselected row's integrity.

There is **no migration**: existing transaction time/ID and wallet indexes suffice
for this slice. No balances, outcome retention or previous result bodies change.

## HTTP and verification

Thin routes delegate to `src/server/http/history-handler.ts`, reusing
[HTTP.md](HTTP.md)'s strict definitions, lossless JSON and public Problem Details.
All responses are `no-store`; GETs have no money key/replay header. Known malformed
query/ID is 400; missing account or missing/unrelated transaction is 404; missing
initialization or unavailable/invalid stored data is safe 503. No exception message,
storage path or stack is returned. Unsupported methods retain Next's 405; only GET
is exported/documented. OpenAPI includes strict operation-discriminated response
schemas, explicit nulls and the actual numbered-page/UTC/filter contract. Full
generation and Swagger UI still belong to T10-03.

Isolated tests cover every operation, low-level and actual monetary-service output,
arbitrary IDs, exact int64/zero/three/four-decimal values, either-side filtering,
destination isolation/direction, UTC boundaries and timezone independence, stable
ties, empty/beyond-end pages, numbered-page shifts, matching count/page snapshots
with a concurrent WAL writer, restart/cache refresh without changed facts, no
attempt/quote/cache dependency, no writes on query-only connections and selected
corruption failures without fabricated data. HTTP tests validate actual schemas,
pre-storage rejection, same missing/foreign 404, initialization/storage errors and
redaction. The test-only schema assertion adds explicit `null` support; it is not
a new production schema engine.

Two production API regressions in `e2e/zzzzz-history.spec.ts` prepare funds/quotes
**only on the guarded disposable server**, then check exact confirmed facts,
both conversion currencies, UTC-day filters, numbered pages, errors, GET-only
documentation and unchanged balances after reads. They do not claim an incoming
transfer browser journey or a connected full-history UI. Never seed or fund the
normal wallet for history tests; production commands are in [QUOTES.md](QUOTES.md).

### Verified backend checkpoint

- Full Docker check/build passes **1,353 Jest tests in 55 suites**, formatting,
  lint, TypeScript and artifact checks (**57 documents / 36 tasks**).
- All **65 production Chromium checks** pass on a fresh guarded disposable
  server, including both new history API checks. Existing funding/conversion,
  isolation, privacy, drafts, themes, layout and motion regressions remain green.
  This is not a connected full-history or incoming-transfer browser UI journey.
- SQLite backup `/app/data/wallet.sqlite.pre-history-1794429710767.bak` was verified
  before checks. All **14 runtime tables including migration metadata** remain
  bigint-safely row-identical. Integrity is `ok`, FK violations zero. Runtime is
  **1 account / 3 wallets / 0 transactions / 0 journal entries / 0 funding attempts /
  0 conversion attempts / 0 transfer attempts**, with empty reference caches and
  quote/use tables. No migration, dependency or runtime fixture data was introduced.
- Development resumed with `.next/dev.pre-history-1794430024699` retained. A real
  browser verified enabled funding review, documented history GETs, an actual
  empty runtime history page and absent transfer submission; **300 stable frames**
  had zero additional navigations/page/console errors or financial/reference
  requests. No wallet money was used to demonstrate the API.
- Bounded in-thread Verify review checks graph relationships, current path
  coverage and exact contracts, account metadata, query/DTO/HTTP/schema source.
  The old journal-trigger SQL parse gaps at 2–15/20–52/57–62 were read directly
  and used only in isolated corruption tests; no migration changed. Clean graph
  coverage is not completeness proof. No independent-agent audit, global ledger
  certification, large-scale performance, new UI-detector or render-review claim
  is made. No live-provider test, restore drill or remote push was introduced.

T08-02 subsequently connects reviewed transfers/recovery and scoped incoming
recent activity through these GETs. T09-02 still owns full history list/detail
browsing. The original backend checkpoint alone did not enable either interface;
see [TRANSFERS.md](TRANSFERS.md) for the connected boundary and its verification.

## T09-02 — inline full-history browsing

The user confirmed **Expand existing panel** rather than a separate page (D-034).
The existing recent panel remains compact; **Browse full history** opens filters,
numbered pages and transaction detail in that same card. It introduces no new
route, overlay, permanent column, identity, token/CSS change or valuation.

- Type, either-side currency and inclusive UTC-day filters apply **explicitly**.
  Editing controls alone makes no request; invalid/noncanonical days and reversed
  ranges retain text, focus the invalid control and leave applied results unchanged.
  Dates use exact YYYY-MM-DD text, not browser-local timestamp conversion. Applied
  filters are stated separately from staged input. Clear resets filters/page 1;
  reapplying unchanged filters is an intentional read refresh.
- Currency choices come from known pinned accounting precision, including historical
  units such as CLF—not today's fiat/provider catalog. No catalog/rate/quote is
  fetched by browsing. Historical source/target facts remain exact decimal strings.
- Numbered pages use the approved **50 records** per UI page. Previous/next, first
  page and direct positive safe-integer page entry use the existing API contract.
  Counts share the server snapshot; activity between requests may shift boundaries.
  Empty filters, empty accounts and pages beyond the end are distinct truthful states.
- A named row button opens a **separate scoped detail GET**, not a row-derived
  fabricated detail. Provider, source/target accounts/wallets/currencies/amounts,
  status/time and recorded rate/source/fetch/cache metadata are shown as applicable.
  Same-currency transfers explicitly have no FX. Incoming rates retain original
  source→target direction. No retry key, quote, original balance or current valuation
  is invented/exposed. Optional exact transaction-ID lookup makes missing-record
  inspection reachable without requiring a list entry.
- Back preserves applied filters/page and restores the originating row when it is
  still present; otherwise it focuses the browse heading. Filter/page actions focus
  the results context after completion. Closing full browsing restores its trigger.
  Account switches remount the workspace, clearing filters/details/lookup instead
  of reusing another account's context. Destination money actions stay disabled.
- Loading uses the existing decorative Skeleton and a status announcement. Missing
  details, failed reads and malformed/unmatched data have safe read-only retries,
  never previous-page/foreign-account/row-fact fallbacks. Query/revision/account
  changes, privacy and unmount cancel reads; late responses are ignored. Requests
  time out after 15 seconds without an automatic retry or minimum loading delay.
- Privacy removes filters, records, counts and timestamps from the DOM and pauses
  history reads. Showing amounts resumes the in-memory context. Ordinary browsing
  is not persisted to URL/browser storage and clears on reload; it never reads,
  clears or overwrites the shared unresolved monetary recovery record.
- Shared client guards now validate recent/full pages and detail context, role/
  direction, precision/arithmetic, filter membership, counts/offsets and order.
  Pagination uses exact bigint offsets; historical Unicode ID ties follow SQLite's
  UTF-8/code-point order, not JavaScript's UTF-16 surrogate order. Server query and
  monetary contracts remain unchanged.

### Interface verification

Final Docker `npm run check` passes **1,455 Jest tests in 61 suites**, formatting,
lint, TypeScript, artifact checks (**57 documents / 36 tasks**) and production build.
All **89 production Chromium checks** pass on a freshly recreated guarded server,
including **11 history journeys**. Isolated tests cover exact amounts, context/
role/filter bindings, numbered-page edges, old Unicode IDs, late responses, privacy,
retry/timeout and informative row names. Browsers cover all operations, >50-record
paging, explicit filters in a non-UTC zone, detail/back focus, incoming inspection,
missing/error/malformed states, privacy/reload and unchanged monetary recovery.

The earlier conversion expiry failure was a test-clock lag behind server quote
issuance. Both expiry simulations now anchor to the returned `issuedAt + 1ms` and
dispatch focus; production expiry/clock safeguards were not relaxed. Both targeted
expiry checks and the final full suite pass.

The actual 320/1440 light/dark list/detail matrix and six reachable states are
captured from document top at CSS-pixel scale in `.impeccable/review/history-flow/`,
with region metadata and original-pixel panel crops. The single changed-target
detector returned `[]`. A fresh independent review requested one accessible-row
summary correction. Exact amounts/currencies and UTC time now accompany type/ID;
static and browser assertions plus the production accessibility tree verify it.
The reviewer scored **1/1 fixes resolved**, `disposition: ship` at that fix scope.
See [DESIGN_REVIEW.md](DESIGN_REVIEW.md); no global WCAG/security/performance claim.

Verified backup `/app/data/wallet.sqlite.pre-history-ui-1794433924150.bak`
preceded checks. After development restoration and actual empty-runtime browsing,
all **14 runtime tables including migration metadata** remain bigint-safely
row-identical: **1 account / 3 wallets / 0 transactions / 0 journal entries /
0 funding attempts / 0 conversion attempts / 0 transfer attempts**, with empty
reference caches and quote/use tables. Integrity `ok`; FK violations zero.
Development retained `.next/dev.pre-history-ui-1794435466636` and passed **300 stable
frames**, empty full-history/privacy/back focus and enabled funding review, with
zero extra document navigations, page/console errors or financial/reference requests.
The initial same-document Next.js bootstrap history event is not a reload.
No normal-wallet funding, migration, dependency, live-provider check, restore drill
or remote push was introduced.
