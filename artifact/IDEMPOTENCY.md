# Idempotency: failed-retry decision

**Status:** Policy B and D-030 funding defaults are implemented: immutable retained outcomes, atomic success, stable recorded failures and same-key recovery. See [FUNDING.md](FUNDING.md) for evidence and limits.
**Decision:** [D-019](DECISIONS.md#d-019).  
**Resolution:** [O-001](DECISIONS.md#o-001); implementation details: [O-006](DECISIONS.md#o-006).  
**Affected feature and task:** [PRD-10](prd/PRD-10-api.md), [T10-02](tasks/TASKS-10.md#t10-02).

## The part already agreed

Every deposit, withdrawal, conversion confirmation, and transfer carries an `Idempotency-Key`.

- If an operation **commits**, retrying the same key and same request must return the original result without moving funds again.
- If an accepted key has a **definitive recorded error**, retrying the same key and request returns that error. A deliberate new attempt after receiving that error uses a new key.
- Reusing the same key for different request input is rejected.
- The successful result/key and journal transaction must be recorded atomically. If the server commits but its response is lost, a retry must find the committed result.
- Rejected requests do not appear in the user's completed transaction history. Technical key/failure metadata may be stored separately if the chosen design needs it.

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB as SQLite
    Client->>API: Withdraw 25.00 with key K
    API->>DB: Atomically save transaction, debit and K result
    DB-->>API: Commit succeeds
    Note over API,Client: Response is lost
    Client->>API: Retry same request with key K
    API->>DB: Look up K and request fingerprint
    DB-->>API: Original committed result
    API-->>Client: Return original result; no second debit
```

## The resolved case

Example: key `K` requests a `100.00 USD` withdrawal when the wallet has only `30.00 USD`. The server rejects it. Later the user deposits funds and retries the **same request and key**.

| Policy | Second attempt with same key and input | Advantage | Tradeoff |
| --- | --- | --- | --- |
| **A. Re-evaluate failures** | Re-check the current balance; the withdrawal may now succeed. | Convenient for retries after a temporary condition changes. | The same key can produce a different result over time; if different payloads must always be rejected, the key/fingerprint must be remembered even when the first attempt failed. Concurrent retries need careful coordination. |
| **B. Replay the original failure — selected** | Return the original insufficient-funds error while that key is retained. A new intended attempt requires a new key. | Each accepted key has a stable result, which is easier to reason about and document. | Retrying after a transient problem requires a new key, and clients must distinguish a retry of the same intent from a new attempt. |
| **C. Mixed policy** | Replay selected deterministic errors but allow selected transient failures to be retried. | Can balance stable business errors and transient recovery. | Requires an explicit, testable classification of every error; behavior is more complex. |

Neither A nor B changes the agreed rule for a **successful** commit: replaying the same key/input cannot create a second debit or credit.

## Important edge cases

1. **Different input:** Both policies reject changing the amount, wallet, destination, or quote while reusing a registered key. Decide when the server first registers a key for malformed or invalid requests.
2. **Expired quote:** A previously expired quote cannot be made valid by retrying it. The user must obtain and confirm a new quote; because the request changes, the new intended operation needs a new key.
3. **Concurrent submissions:** Two identical requests using the same key must not both commit. The implementation needs an explicit in-progress/wait/conflict behavior and concurrency tests.
4. **Retention:** Definitive results are retained indefinitely. Deleting/restoring an older database can destroy duplicate protection; never silently prune these records.
5. **No history clutter:** Whether technical failed-request metadata is stored or not, failed attempts must not be shown as completed user transactions.
6. **Unknown outcome:** A timeout, connection loss, or failure to durably record an outcome is not proof that nothing committed. Retry or reconcile with the **same** key; generating a new key at that point could duplicate a successful operation.
7. **Error persistence:** For an accepted key with a definitive failure, persist enough separate technical metadata to replay it without adding a completed transaction to history. The server must not claim a durable result if it cannot store one; exact handling of unavailable storage, pre-key validation, and in-progress requests is [O-006](DECISIONS.md#o-006).

## Selected policy

**B is selected:** one accepted key represents one attempt with one stable definitive result. An explicitly new attempt after a definite error uses a new key. Unknown outcomes must reuse the original key until resolved.

## Approved funding contract (D-030)

- `POST /api/deposits` and `POST /api/withdrawals` require JSON
  `{ walletId, amount, provider }` (exactly three string fields) and UUID
  `Idempotency-Key` (versions 1–8, standard variant, case-normalized). Requests
  are bounded to 16 KiB; no credentials/provider network calls exist.
- Canonical JSON stores kind plus the exact three strings. Property ordering is
  irrelevant; changing decimal spelling, provider, wallet or kind is different
  input. Keys are global across both funding endpoints.
- Invalid JSON/type/fields/key/provider, blank/NUL wallet or malformed decimal
  syntax is rejected before accepting a key. Well-shaped requests reach one
  top-level `BEGIN IMMEDIATE`: replay/conflict lookup happens before current
  business validation. Missing wallet (404), inspect-only account (409), amount
  precision/range (400), insufficient funds/overflow (409) become immutable
  recorded problems. They create no completed transaction or journal entry.
- Success is HTTP 200 with an exact string receipt: requestKey, transactionId,
  type/status, accountId/walletId, currency/exponent, amountMinor/balanceMinor,
  fictional provider and createdAt. Balance is the original post-operation
  snapshot, not a fresh balance on replay. Success/key/journal commit together.
- Problem Details uses stable `code`, `definitive`, and (when valid) requestKey.
  Only stored outcomes or known pre-acceptance rejection are definitive. Key
  mismatch is nondefinitive about the original request. Unexpected/storage/busy
  errors are safe 503, never claimed recorded; retry the identical key/request.
  `Idempotency-Replayed` distinguishes original/replayed results without changing
  their body/status. All responses are `no-store`; browser cross-origin writes
  are rejected, with no new CORS permission.
- No durable pending row is needed: SQLite holds the writer reservation through
  validation, journal and result recording. A crash before commit rolls all back;
  a crash after commit replays. Lock timeout is unknown/retry, never a new intent.
- The tab stores only unresolved intent before sending, verifies that write,
  and never automatically submits on reload. A recovery action resends immutable
  original input/key. Missing/blocked/corrupt recovery storage blocks new writes.
  Clear known context; ordinary drafts/history are not persisted. Hiding balances
  also hides recovery/receipt amounts. Closing a dialog never forgets uncertainty.

## Conversion extension

[CONVERSIONS.md](CONVERSIONS.md) applies the same retained-original-result policy
to the server-only T07-01 service. Canonical input includes conversion, normalized
quote UUID and exact source-wallet/amount/target strings. Funding and conversion
now share key ownership, enforced by both services and mutual insert triggers;
existing funding results are unchanged. Replay precedes quote/current-funds/clock
checks, and receipt/key/journal/quote use commit atomically. Unknown outcomes keep
the same key and quote. T07-02 now exposes the service through
`POST /api/conversions`, with explicit quote review/expiry/reconfirmation and
shared funding/conversion recovery. The existing per-tab storage key is retained
for compatibility; its version-1 discriminant may now be `conversion`. Ordinary
drafts/quotes are not saved. A conversion recovery attempt uses the original quote
even after expiry so committed success replays before quote validation. No
automatic new key, replacement quote or reload submission is allowed.

## Internal transfer extension

[TRANSFERS.md](TRANSFERS.md) extends indefinite original-result retention and
global key ownership to T08-01. Canonical input includes transfer, exact source/
recipient/amount and optional target/default/normalized quote ID; omission and an
explicit default are different accepted input. Preflight replay precedes optional
metadata work; serialized replay precedes quote/funds/clock validation. Recipient,
wallet, metadata, exact journal, any quote use and success commit together.
Known pre-write failures are retained outside completed history; storage/lock/
post-creation failures are nondefinitive and require the same input/key/quote.
Same-currency transfers have no quote. Mutual service checks/insert triggers now
cover funding, conversion and transfers without rewriting old outcomes. Transfer
T08-02 now connects HTTP submission/browser recovery using that unchanged policy
and historical per-tab recovery slot; see [TRANSFERS.md](TRANSFERS.md).
