# Idempotency: failed-retry decision

**Status:** The user selected **B: replay the original definitive result**. Implementation and retention details remain open.  
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
4. **Retention:** If a completed key/result is deleted, later retries can no longer be guaranteed safe. A retention policy has not been chosen; retaining successful keys alongside transaction history is a proposal, not an agreed rule.
5. **No history clutter:** Whether technical failed-request metadata is stored or not, failed attempts must not be shown as completed user transactions.
6. **Unknown outcome:** A timeout, connection loss, or failure to durably record an outcome is not proof that nothing committed. Retry or reconcile with the **same** key; generating a new key at that point could duplicate a successful operation.
7. **Error persistence:** For an accepted key with a definitive failure, persist enough separate technical metadata to replay it without adding a completed transaction to history. The server must not claim a durable result if it cannot store one; exact handling of unavailable storage, pre-key validation, and in-progress requests is [O-006](DECISIONS.md#o-006).

## Selected policy

**B is selected:** one accepted key represents one attempt with one stable definitive result. Once the client has received a definite failure, the interface creates a new key for an explicitly new attempt. When the outcome is unknown, it must reuse the old key until the result is known. The key-retention and recovery mechanics remain [O-006](DECISIONS.md#o-006).
