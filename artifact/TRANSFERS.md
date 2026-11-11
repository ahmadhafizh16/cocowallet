# Atomic simulated-transfer backend

**Status:** T08-01's internal service is implemented and verified. Transfer
HTTP submission, browser confirmation/recovery and incoming history remain
disabled/unimplemented. T08-02 depends on T09-01's history queries/API. No visual,
dependency, real-money, banking or payment-provider integration is introduced.

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

The service returns `{ status, body, replayed }`; these are internal status values,
not an advertised transfer endpoint. Success contains request/transaction IDs,
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
