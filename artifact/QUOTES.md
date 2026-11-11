# Server-owned one-minute quotes

**Status:** T06-02 implemented and verified under [D-032](DECISIONS.md#d-032).
This is the backend quote/validation prerequisite, not conversion/transfer
submission or its UI. Existing money actions and visual design are unchanged.

## Fixed preview contract

`POST /api/quotes` accepts JSON, at most 16 KiB, with exactly:

```json
{
  "operation": "conversion",
  "sourceWalletId": "stored-main-wallet-id",
  "amount": "100.00",
  "targetCurrency": "GBP"
}
```

Cross-currency transfer previews use `operation: "transfer"` plus
`recipientAccountId` and, for an unknown recipient, `recipientDefaultCurrency`.
Existing recipients keep their recorded default; a supplied different default
is rejected. IDs are exact nonblank/NUL-free strings within the bounded request,
not normalized or restricted to the older prototype's recipient regex. The main
account cannot be its own recipient. Same-currency transfers need no FX quote;
they are rejected here without fetching rates. Extra body fields, including
client rate/expiry/receive amount, are never accepted as trusted terms.

Creation returns 200 `{ quote, state: "active" }`. The quote includes version,
UUID ID, operation, source/target account and currency context, exact decimal and
minor-unit amount strings, pinned exponents, fictional destination context where
applicable, provider rate/source date/fetch time/fresh-or-cached provenance,
issuedAt and expiresAt. A preview does not create a recipient/wallet, debit,
reserve funds, record a completed operation or promise confirmation will succeed.
Creation retries may create another independent quote; no money key is required.

`GET /api/quotes/{quoteId}` reads the immutable snapshot without any provider
request, labelled active, expired or consumed. Active means time-valid and unused,
not reserved/guaranteed funds. It does not refresh or extend terms. Unknown UUIDs
return 404; malformed input is 400; funds/role/context/expiry/use conflicts are
409; missing eligible rates, storage or corrupt stored data are safe 503 problems.
Responses are no-store and POST origin/JSON/body guards match local-only policy.

## Timing, persistence and confirmation rules

- Fetch reference metadata before a writer transaction. Validate the source and
  destination again under a short immediate reservation before persisting terms.
  Current funds and final target bounds must suffice; no funds are reserved.
  A missing target wallet requires eligible catalog metadata at issuance, even
  when its currency already exists in storage; exact-pair fallback alone does not
  authorize creating a wallet. Confirmation uses the pinned terms, never network.
- Recheck cached-rate eligibility **at issuance**, including after any writer
  wait. Only then start the 60-second hold. Expiry is strict: `now >= expiresAt`
  is expired. At confirmation, do not re-fetch or shorten the issued hold because
  cache age subsequently crosses 24 hours. Future/rolled-back clocks fail closed.
- Quotes and successful-use records are immutable, retained technical metadata,
  separate from completed history. No automatic pruning is introduced. A failed
  operation rolls back its consumption; a new intentional attempt may use that
  still-valid quote. Never generate a replacement money key after uncertainty.
- Internal confirmation validation compares exact canonical original input,
  rechecks wallet ownership/precision, recipient default and current funds/target
  bounds, and returns only server-owned exact terms. Changed input cannot retain
  an old rate. A newly appearing recipient is acceptable only with the same
  destination role/default that was reviewed; no default is silently overwritten.
- Successful use must reference a matching completed transaction with the exact
  source/target entries and stored rate provenance. A scoped synchronous
  after-record hook latches consumption failures so even a swallowed exception
  cannot commit partial accounting. Unique quote and transaction use prevents
  successful reuse. Future financial services must look up durable idempotent
  results **before** expiry/use checks and commit their result in that boundary.

## Scope and verification

Tests must use isolated databases and mocked Frankfurter/clock dependencies.
Cover exact/tie/zero/overflow accounting, ownership/recipient binding, slow fetch
and writer wait, strict expiry and cache-at-issuance boundaries, immutable restart
readback, tampering, consumption races, late-insert rollback and no funds moved by
preview. Browser regressions retain the disposable funding database. Back up the
runtime database before explicit migration, compare existing rows and restore
stable development. No runtime test funding or quote seeding is permitted.

The UI wiring and actual conversion/transfer HTTP flows remain T07/T08; full
history, valuation and Swagger retain their tasks. Quote HTTP contract details
here resolve only this slice of O-003, not those unrelated pending contracts.

### Verified checkpoint

- Full Docker check/build passes **926 Jest tests in 41 suites**; all **53
  production Chromium checks** pass on the disposable database, including the two
  quote checks. Deterministic fixtures supply the provider response; no live
  provider result is claimed for this stage. The existing 51 browser regressions
  protect funding, isolation, privacy, drafts, themes, layout and motion.
- Late quote-use insert failures caught either outside **or inside** the
  after-record hook roll accounting back. Independent worker connections prove
  exactly one successful use. Immutable restart readback, strict expiry,
  no-reservation competing previews, changed input, malformed stored arithmetic,
  cache-at-issuance and full-minute boundary cases are covered.
- Reproduce with development stopped:

  ```sh
  docker compose stop app
  docker compose run --rm --no-deps app npm run check
  docker compose run --rm --no-deps -d --name simulated-wallet-funding-preview -e WALLET_E2E_ISOLATED=1 -e DATABASE_PATH=/tmp/opencode/funding-e2e.sqlite app npx tsx scripts/start-funding-e2e.ts
  docker compose --profile test run --rm --no-deps -e BASE_URL=http://simulated-wallet-funding-preview:3000 browser-tests
  docker stop simulated-wallet-funding-preview
  ```

  The preview server refuses the normal database and runs in a disposable
  container-local SQLite path. Its guarded provider preload is not installed in
  the ordinary wallet process. Never redirect monetary tests to normal development.
- SQLite backup `/app/data/wallet.sqlite.pre-quotes-1794419402981.bak` was verified
  against the stopped source before migration 0005. Two migration runs succeeded;
  bigint-safe row comparison shows every existing non-migration table unchanged.
  Runtime remains **1 account / 3 wallets / 0 transactions / 0 journal entries /
  0 funding attempts**, with both reference caches and both quote tables empty.
  All four quote retention triggers exist; integrity is `ok`, FK violations zero.
  No runtime test funding or quote seeding and no restore drill are claimed.
- Development resumed with `.next/dev.pre-quotes-1794419551364` retained. A real
  browser verified enabled funding review, 300 stable frames, zero additional
  navigations/page/console errors and zero financial/reference/quote requests.
  A first ad-hoc probe used the wrong field label; rerunning with the existing
  `You add` label passed without changing application source.
- Bounded in-thread Verify review used the graph and exact source. The graph
  reports partial SQL parsing at migration lines 24–32/34–42; all four triggers
  were read directly and exercised in isolated SQLite tests. No independent-agent
  review, exhaustive security certification or performance claim is implied.

T07-01 now implements the atomic conversion service, including durable replay
before quote checks and atomic missing-wallet creation; see
[CONVERSIONS.md](CONVERSIONS.md). Next is **T07-02**: it
must finish reviewed confirmation/expiry UI before enabling conversion submission;
T08 retains the corresponding simulated-transfer work. No push is authorized.
