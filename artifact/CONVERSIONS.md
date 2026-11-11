# Atomic conversion backend

**Status:** T07-01 implemented and verified. This is an internal server-only
service, not an enabled conversion HTTP endpoint or connected confirmation UI.
T07-02 owns those later steps. The current layout, branding, drafts, privacy and
disabled conversion/transfer actions are unchanged.

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

These are internal service shapes; T07-02 must document and verify the eventual
HTTP contract, recovery and confirmation/expiry UI before enabling submission.
There is no `POST /api/conversions` handler or OpenAPI path in this stage.

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

Next dependency is **T07-02**: reviewed conversion preview, expiry/reconfirmation,
submission endpoint, recovery and receipt/balance refresh. Transfer submissions
remain disabled for T08. Preserve the existing visual design and draft/privacy
behavior while connecting only the reviewed flow.
