# Journal persistence and atomic writes

Implements [PRD-02 requirements 1–4](prd/PRD-02-journal.md#requirements),
[T02-02](tasks/TASKS-02.md#t02-02), and [T02-03](tasks/TASKS-02.md#t02-03).
Related decisions: [D-018](DECISIONS.md#d-018), [D-023](DECISIONS.md#d-023),
[D-024](DECISIONS.md#d-024). Funding idempotency is implemented under
[D-030](DECISIONS.md#d-030); quote integration follows [D-032](DECISIONS.md#d-032).

## Storage and reads

`src/server/db/schema.ts` and migrations `0001`/`0002` add explicit currency
precision, main/destination accounts, unique account/currency wallets, completed
transactions, and signed journal entries. There is no authoritative balance column.
Foreign keys, checks, unique indexes, and triggers enforce integer nonzero deltas,
correct journal direction, immutable history/identities, and frozen used precision.
This is not a claim that arbitrary direct SQL can never create incomplete history;
the application write boundary supplies transaction/entry cardinality and funds checks.

`src/features/journal/balances.ts` streams each wallet's entries through bigint
aggregation. Wallet existence, account wallet metadata, and balances are read in a
single transaction snapshot. Only final aggregates are bounded `0..M`; large
intermediate totals do not overflow or round. See [MONEY.md](MONEY.md).

## Synchronous write contract

`withJournalWrite(database, callback)` in `src/features/journal/write.ts`:

1. Rejects an existing outer SQLite transaction, even a deferred one.
2. Acquires a top-level `BEGIN IMMEDIATE` writer reservation **before** callback
   execution, so independent connections serialize their funds checks and writes.
3. Gives the callback a scoped `createDestination`, `createWallet`, and `record`
   API. Technical result recording can join the same transaction through the
    explicit database connection; it must propagate any failure. `record` also
    accepts a synchronous after-record callback without changing its receipt.
4. Validates operation amounts, main-only actions, conversion/transfer ownership,
   source funds, and destination balance bounds. Same-currency transfers credit
   the exact debit amount; FX credits are recomputed exactly from stored precision
   and prepared applied-rate text. All successful entries match one completed
   transaction.
5. Commits destination/account/wallet creation, transaction, debit, credit, and
   any caller-recorded technical success together. Exceptions roll everything back.
   A failure in a scope method poisons the entire boundary even if the callback
   catches it, preventing partial operations from being committed accidentally.
6. Closes the scope on return or failure; escaped scope methods cannot write later.
   Promise/thenable returns are rejected at runtime as well as by the TypeScript
    callback signature. Never fetch rates or perform other asynchronous work here.

`withJournalAfterRecord` lets a technical extension join that same failure latch
only while the matching transaction's after-record hook is active. It rejects
async/thenable returns and closes with the hook. Quote consumption runs through
this capability, so a registration failure caught **inside** the hook still
forces rollback, just like a caught `record` error. The optional hook's own result
must be `undefined`; the existing `{ transactionId }` receipt is unchanged.

SQLite has a five-second connection busy timeout. Lock/storage failures propagate
to the future service/HTTP error layer; the boundary does not retry automatically
or claim a durable result when commit outcome is unknown.

## Intended integration

The future conversion/transfer feature service must obtain a server-owned quote
outside the write lock, then use the implemented confirmation validator to
recheck ownership, exact terms, current funds and expiry inside the boundary.
`AppliedRate` is an **internal prepared input**, not permission to trust a client
rate. [QUOTES.md](QUOTES.md) documents persisted terms and the internal
after-record consumption seam; conversion/transfer HTTP submission is not enabled.

Durable idempotency must check/replay the stored definitive result before
new external work and recheck under this reservation. Record technical success
in the same transaction as accounting. Tests demonstrate this seam using a
**test-only** result table: reopening and replaying the same success inserts no new
entries; failure to save technical success rolls accounting back. This is **not**
the final key schema, fingerprinting, stable error replay, or recovery policy.
Funding supplies those guarantees through [FUNDING.md](FUNDING.md). T07-01 also
implements internal atomic conversion, including missing currency/wallet creation,
quote use and retained original outcomes; see [CONVERSIONS.md](CONVERSIONS.md).
T07-02 now connects conversion submission/recovery UI; transfers remain T08.

## Verification

`src/features/journal/write.test.ts` exercises deposits, withdrawals, conversions,
same/cross-currency transfers, a missing destination/wallet, retained exact rates,
main-only policy, insufficient funds, rounded zero, and target overflow. Failure
injection after each account/wallet/transaction/debit/credit insert leaves only the
prior committed state. Additional cases cover swallowed scope errors, asynchronous
misuse, technical success failure/replay, and reopen persistence.

Two real worker threads open independent native SQLite connections to the same
isolated file. One test proves the reservation exists before the callback reads or
inserts anything; another races two `80`-minor-unit withdrawals against `100` and
observes exactly one success, one insufficient-funds error, and a final balance of
`20`. No test uses the configured runtime DB.

Quote tests additionally race successful use across independent writers and prove
money/use metadata commit together. Hook tests cover closed/wrong capabilities,
async rejection and errors caught both outside and inside the hook. Failure
injection cannot leave a debit without its successful-use record.
