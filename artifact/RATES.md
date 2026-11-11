# Fresh-first reference metadata

**Status:** T06-01 implemented and verified. D-031 records the user's
clarification: **request fresh data first, cache valid successes, use cache only
after that request fails**, never cache-first. The approved fallback window is
less than 24 hours. This stage does not enable quotes, conversion/transfer,
wallet creation/default editing or historical/portfolio valuation.

## Verified upstream contract

Official [documentation](https://frankfurter.dev/),
[machine-readable guide](https://frankfurter.dev/llms.txt) and
[OpenAPI](https://api.frankfurter.dev/v2/openapi.json) were read on November 12,
2026. The public origin is `https://api.frankfurter.dev/v2/`, without an API key.

- `/currencies` defaults to active currencies, but also includes metals and
  crypto assets. `type: currency` can also identify accounting units. Filter by
  the asset class, pinned known accounting precision, and explicit exclusion of
  indexed/fund/accounting units (BOV/CHE/CHW/CLF/MXV/USN/UYI/UYW/XDR/XSU/XUA).
  Unknown precision is never guessed. Names are provider metadata; precision is
  authoritative from the existing pinned extract, not provider display digits.
- Currency publication coverage dates are not fiat retirement dates or proof
  that a requested pair exists. No rate is inferred from catalog membership.
- `/rates.csv?base=USD&quotes=EUR` returns `date,base,quote,rate` and one requested
  pair. CSV preserves the original decimal rate lexeme, avoiding JSON-number
  rounding. Validate exact pair, row count, positive bounded decimal and canonical
  source date; reject unsupported CSV shapes, notation, wrong pairs and future
  dates. Source dates may precede fetch day and are never rewritten to today.
- Only the blended Frankfurter endpoint is selected. No alternative provider,
  implicit reciprocal, synthetic cross rate or paid service is introduced.

## Implemented services and HTTP contract

`src/features/rates/frankfurter.ts` is server-only, with a fixed origin,
five-second request/body timeout, no redirects/automatic retries/HTTP caching,
UTF-8 validation and bounded responses (1 MiB catalog, 8 KiB single-pair CSV).
Routine tests inject fetch/clock dependencies and never call the real provider.
Only the requested currency codes go upstream; no wallet/account IDs, drafts,
amounts or funding keys are sent to Frankfurter.

`getCurrencyCatalog` tries upstream on every call, validates the complete eligible
list and persists its snapshot. On fetch/validation failure only, it may return
the last valid snapshot with `source: cached` and the **original** `fetchedAt`.
Missing, malformed, future or >=24-hour-old data is unavailable, not an empty
catalog, fabricated selection or reason to disable existing funding/reads.

`getReferenceRate` validates distinct uppercase known fiat codes, refreshes their
catalog eligibility, then requests that exact pair. A fresh catalog removing a
currency blocks it, rather than reviving obsolete eligibility. Catalog failure
can use its eligible fallback; a completely unavailable catalog can only recover
an eligible previously validated **exact-pair rate** already in the cache. Such a
rate cannot independently authorize adding a new wallet. Pair failures use only
an eligible exact-pair fallback, never a reverse/unrelated observation. No eligible
rate means 503. Cache age is checked after failed network work finishes.

Migration `0004_reference_rate_cache` adds separate technical catalog/rate tables.
Short atomic UPSERTs preserve newer fetches when delayed responses race. Network
calls never hold a database transaction; accounting rows and funding outcomes are
untouched. A persistence failure is a safe storage-unavailable result, not a claim
that the fresh observation was cached. These mutable caches do not change the
indefinite retention/immutability of funding outcomes or journals.

| Route | Response |
| --- | --- |
| `GET /api/currencies` | `{ provider: "frankfurter", source: "fresh" | "cached", fetchedAt, currencies: [{ code, name, exponent }] }` |
| `GET /api/rates?base=USD&quote=EUR` | `{ provider: "frankfurter", source, base, quote, rate, date, fetchedAt }`; `rate` is exact decimal **string**, not a binding quote. |

Only one `base` and `quote` is accepted; unknown/duplicate parameters, unsupported
codes and identity pairs are 400. Missing eligible metadata/rates or storage
failure is safe 503 Problem Details. All responses are `Cache-Control: no-store`.
GETs may update **technical caches**, never money/accounts/wallets. OpenAPI
describes the implemented contracts and actual-response tests check agreement.
Swagger generation/UI and quote contracts remain separate work.

## Verification and operations

Mocked tests cover exact long decimals, source/fetch date separation, active fiat
filtering, malformed/media/size/pair/date responses, status failures and timeout,
fresh-first calls, restart persistence, strict 24-hour/future boundaries, age not
extended on fallback, old-response races, no reverse-pair substitution, safe HTTP
problems and unchanged accounting rows. Monetary browser regressions still use
the disposable funding server, never the user's initialized wallet.

Apply migration explicitly after backing up persistent SQLite with its backup
API. Do not seed provider snapshots or make test deposits in that database. An
optional live-provider smoke check must use its own isolated database and remain
separate from deterministic test/build success. No restore drill is claimed.

### Verified checkpoint

- Full Docker check/build: **867 Jest tests** in 37 suites; **51 production
  Chromium regressions** pass on the disposable funding database. Network/clock
  tests are mocked; production regression journeys do not hit the provider.
- A separate optional live smoke check, using only
  `/tmp/opencode/rates-smoke.sqlite`, returned **154 eligible pinned fiat codes**,
  exact USD→EUR text `0.89393`, source date `2026-11-11` and observed fetch time
  `2026-11-11T17:08:58.431Z`. An intentionally offline client then returned that
  identical cached rate/fetch time. These are observed diagnostics, not seeded
  product data, a current-price promise or a perpetual catalog count.
- Reproduce that optional diagnostic with:
  `docker compose run --rm -e DATABASE_PATH=/tmp/opencode/rates-smoke.sqlite -e WALLET_RATES_SMOKE=1 app node --conditions=react-server --import tsx scripts/smoke-rates.ts`.
  The script refuses the ordinary runtime path. Its monetary table stayed empty.
- SQLite backup `/app/data/wallet.sqlite.pre-rates-1794417122922.bak` preceded two
  successful migration runs. A bigint-safe comparison to that backup confirms
  all existing accounts, wallets, currencies, completed transactions, journals
  and funding outcomes are unchanged. Both new caches are initially empty;
  integrity is `ok`, FK violations zero. No test funds or live provider snapshot
  was written into the persistent wallet.
- Development resumed with generated cache retained at
  `.next/dev.pre-rates-1794417237408`. A browser verified an enabled funding
  review, 300 stable frames, zero extra reloads/errors and zero financial or
  reference-metadata requests. The root remains independent of provider outages.
- Graph Verify evidence covered the changed source and migration with no recorded
  coverage gap; exact source and deterministic tests remain the primary safety
  evidence. This was an in-thread bounded review, not an independent-agent
  security/accessibility certification. Artifact validation covers **52 documents
  / 36 tasks**. No dependency, visual UI, journal-writing or monetary arithmetic
  behavior changed; the existing exact rate parser is only exported for reuse.

Implementation is committed locally as `693c098`; no remote or push is performed.

## Next dependency

T06-02 must bind a one-minute server-owned quote to exact operation inputs before
conversion/transfer can be enabled. Wallet management and FX-based portfolio
valuation retain T03-02/T03-03 and their decisions. The root page does not call the
provider in this stage, preserving funding/read availability during upstream
outages and leaving the existing UI unchanged.
