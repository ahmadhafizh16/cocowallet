# Completed history queries and API

**Status:** T09-01's read-only backend is implemented and verified with the full
Docker check/build and production regressions.
The existing interface still shows its latest 50 funding/conversion receipts;
T09-02's full history UI and T08-02's transfer submission/inspection flow are not
enabled here. No visual, dependency, migration or real-money integration changes.

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

Next is T08-02's reviewed transfer endpoint/UI/recovery and destination inspection,
which can now depend on these history GETs. T09-02 still owns full history list/
detail UI. Preserve the existing visual identity, exact accounting, account
isolation, privacy and original-key recovery; this backend alone enables neither.
