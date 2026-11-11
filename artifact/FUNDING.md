# Simulated funding and durable recovery

**Status:** Implemented and verified. [D-030](DECISIONS.md#d-030)
authorizes retry/recovery defaults; visual feedback remains deferred. This stage
connects simulated deposits/withdrawals only, not banking, FX, conversions,
transfers, full transaction APIs, Swagger UI or balance-history valuations.

## Server boundary

`POST /api/deposits` and `POST /api/withdrawals` accept exactly
`{ walletId, amount, provider }` string fields and a UUID `Idempotency-Key`.
Fictional providers remain Demo Bank, Community Bank and Crypto Gateway. Amounts
are plain decimal text; no fees, provider calls or real funds exist. The shared
service is `src/features/funding/service.ts`; the thin HTTP boundary is
`src/server/http/funding-handler.ts`. [IDEMPOTENCY.md](IDEMPOTENCY.md) fixes exact
acceptance, canonicalization, replay/error and concurrency semantics.

Migration `0003_funding_results` adds immutable `funding_attempts`, with a unique
key, original canonical request, status/body, optional unique completed transaction
reference and creation time. Triggers prevent update/delete; there is no pruning.
Drizzle's generated schema snapshot is committed with the custom trigger SQL.
Rejected attempts live here, never in completed transaction history.

The existing `withJournalWrite` remains the sole top-level synchronous immediate
boundary. Its callback performs replay lookup and business validation before
using its journal scope; known failures can be recorded without invoking a failed
scope. Any journal/storage exception escapes and rolls back all work. A failed
outcome insert cannot leave a credit/debit behind. Failure to confirm persistence
is a safe nondefinitive 503, never a promise that nothing committed.

HTTP bodies are bounded to 16 KiB while streaming, not just by Content-Length.
JSON and custom key headers are required; explicit cross-origin browser writes
are rejected. Every response is no-store. This is a localhost no-auth simulation,
not a public authentication/security boundary. Unexpected details are redacted.
The hand-maintained `/api/openapi` document describes implemented funding schemas,
headers, receipt/problem fields and statuses; generated financial schemas and
Swagger UI remain T10-03 work.

## Existing interface integration

- The same always-mounted forms retain per-operation drafts. Review is not a
  submission; the final button explicitly says **Confirm simulated deposit** or
  **Confirm simulated withdrawal**. Hide amounts disables confirmation until the
  user can review them. Conversion and transfer final actions remain disabled.
- Before sending, save and verify only the immutable unresolved intent in
  `sessionStorage` under `cocowallet.pending-funding.v1`. No ordinary drafts or
  history are persisted. Denied/unreadable/conflicting storage blocks new writes.
- Pending, unknown and confirmed outcomes have separate states. A 15-second client
  timeout is uncertainty, not failure. Closing a dialog never discards that intent.
  A visible recovery notice opens its immutable context; reload never auto-sends.
  **Retry original submission** reuses the same key and input.
  This is per-tab recovery only: closing the tab or manually deleting storage
  can lose client context. It is not a cross-device or user-account recovery system.
- Only a validated, matching receipt/definitive problem clears recovery context.
  Wrong/malformed responses retain uncertainty. If cleanup fails after confirmation,
  show the known result but block new attempts; reloading can safely replay it.
- Confirmed results refresh server snapshots without remounting the workspace.
  Receipts label their original post-operation balance, not a continuously fresh
  balance. An explicit new-operation/edit action crosses into a new attempt.
- Recent transactions shows the latest **50 completed funding receipts** from
  durable storage, scoped to the inspected account and filtered by operation.
  It is labelled partial funding visibility, not a completed history product.
  Rejected attempts are excluded. Privacy removes financial records/timestamps
  from the DOM, and recovery/receipt amounts are hidden immediately.
- The approved layout, flags, gradient, typography, branding and motion remain.
  No CSS, real payment integration or invented valuation graph is introduced.

## Verification and safety

Unit/integration tests use isolated databases. Independent worker connections
race duplicate credits and competing withdrawals; busy storage stays nondefinitive.
Tests cover original error replay after later funding, changed input/kind, restart,
int64 bounds, precision, inspect-only restrictions, insertion rollback, retention,
HTTP redaction/origin/size validation and actual response/spec agreement.
Client tests cover storage/read/write/cleanup failure, malformed responses,
duplicate clicks, timeout, reload recovery and explicit new-attempt boundaries.

Final full Docker check/build passes **786 Jest tests** in 34 suites; all
**51 production Chromium checks** pass against the disposable server (the prior
43 checks plus eight funding journeys/theme/viewport cases). Checks include the
lost committed response followed by reload and original-key replay, a stale
withdrawal review rejected by the server, storage-blocked submission, persisted
completed receipts, privacy and keyboard/focus recovery. Receipt captures at
320px/1440px in both themes were inspected; long IDs wrap without horizontal
overflow. The one changed-target mechanical scan returned `[]`; it is not a
security, accessibility or performance certification. This pass used in-thread
source/behavior review, not an independent review agent.

The first browser run caught secure-context-only `crypto.randomUUID` missing on
the local container hostname. The corrected helper uses native UUID generation
or CSPRNG `crypto.getRandomValues`, with proper v4/version bits and no weak random
fallback; absent secure randomness blocks sending. The boundary also compares
Origin against the direct Host authority rather than Next's internal bind URL.
Those cases have regressions. A refresh callback cannot relabel an already-known
outcome as uncertain; confirmation remains separate from presentation refresh.

Monetary browser tests must never target the user's wallet. The disposable server
script refuses any database path other than `/tmp/opencode/funding-e2e.sqlite`
and requires `WALLET_E2E_ISOLATED=1`. The monetary test file skips outside that
named server; the full production suite runs there with no wallet volume writes:

```sh
docker compose stop app
docker compose run --rm app npm run check
docker compose run --rm --service-ports --name simulated-wallet-funding-preview -e DATABASE_PATH=/tmp/opencode/funding-e2e.sqlite -e WALLET_E2E_ISOLATED=1 app node --import tsx scripts/start-funding-e2e.ts
# In another terminal:
docker compose --profile test run --rm --no-deps -e BASE_URL=http://simulated-wallet-funding-preview:3000 browser-tests
```

Stop the disposable server before restoring development. Back up the persistent
SQLite database using its backup API before applying migration 0003. Migrate
without making test deposits into that database, then verify integrity/FKs and
unchanged monetary rows. No backup restore drill is claimed.

Completed operational checkpoint: backup
`/app/data/wallet.sqlite.pre-funding-1794415716427.bak` was created before two
successful migration runs. The runtime database remains **1 account / 3 wallets /
0 transactions / 0 journal entries / 0 funding attempts**, integrity `ok`, zero
FK violations and both retention triggers present. Generated development cache
was retained at `.next/dev.pre-funding-1794415843825`; interactive development
resumed with 300 stable frames, zero extra reloads/page errors/console errors,
and an enabled reviewed confirmation without issuing any financial request.
Artifact validation covers **51 documents / 36 tasks**. Changes are committed
locally by intention; no remote or push is performed.
Implementation commits: `781240f` (durable funding/API) and `b63debe`
(reviewed UI/recovery and isolated browser journeys).

## Deliberate remaining work

T04-02/T05-02's Swagger acceptance remains pending T10-03 even when their funding
journeys work. T10-01 retains FX/quote validations; T10-02 is implemented for the
current funding contracts, not speculative future payloads. Full history APIs,
currency/date filters/pagination, historical valuation, FX/catalog/default
management and transfers/conversions retain their own tasks and open decisions.
