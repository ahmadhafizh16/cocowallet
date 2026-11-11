# PRD-02 — Journal, money, and atomicity

**Status:** Core implemented and tested: exact money, immutable journal schema, snapshot balances, and serialized atomic writes. Requirement 5 and end-to-end replay acceptance still require the future T10-02 idempotency layer; its technical success seam is tested, not a complete HTTP protocol. No money-moving HTTP API exists yet.

**Decisions:** [D-006](../DECISIONS.md#d-006), [D-018](../DECISIONS.md#d-018), [D-019](../DECISIONS.md#d-019).  
**Tasks:** [T02-01–T02-03](../tasks/TASKS-02.md).  
**Diagrams:** [Logical data relationships](../DIAGRAMS.md#logical-data-relationships) and [money-operation code flow](../DIAGRAMS.md#code-flow-for-a-completed-money-operation).

## Outcome and user story

As the user, I can trust every simulated balance to reflect its recorded debit and credit entries, even if a request fails, is retried, or races with another request.

## Requirements

1. Each completed operation creates a transaction and signed journal entry or entries linked to the affected wallet(s). Derive each wallet balance from only its own entries; do not maintain a separate authoritative balance.
2. Store entry amounts as integer minor units using the wallet's fiat currency precision. Parse inputs as decimal text; calculate FX with decimal-safe arithmetic and positive half-up rounding to the target currency's minor unit.
3. Reject zero, negative, overly precise, out-of-range, or insufficient-funds requests. Validate on the server. A rounded conversion/transfer that would credit zero must not silently destroy source value; final error wording is open.
4. Under a serialized SQLite write transaction, check current funds, create any required wallets/accounts, record the completed transaction and all entries, and commit together. Roll back everything on any failure; do not hold the write transaction during a Frankfurter request.
5. Protect money-moving operations under [D-019](../DECISIONS.md#d-019): an accepted key replays the original definitive success or error for matching input; reject different input. Technical failed-result metadata must not appear as completed transaction history.

## Acceptance criteria

- Given deposits, withdrawals, conversions, and transfers, the displayed balance equals the exact sum of the appropriate wallet's entries; entries from different currencies are never added together.
- Given two concurrent withdrawals whose combined amount exceeds available funds, at most one can succeed and the balance cannot become negative.
- Given a failure after a debit would otherwise be written, no transaction, entry, or newly created destination/wallet remains committed.
- Given a replay of a successful operation with the same idempotency key and payload, no additional entry appears.
- Given a target amount of `1.005 USD` before rounding, the credited result is `1.01 USD`; currencies with other minor-unit exponents use their own rules.

## Tests and open items

- Unit-test exact parsing and rounding, zero-decimal/three-decimal currency examples, limits, large values, and a long journal whose intermediate aggregation might overflow.
- Integration-test rollback, independent SQLite connections, concurrency, idempotent success, and schema constraints on temporary databases.
- [O-002](../DECISIONS.md#o-002) is resolved by [D-023](../DECISIONS.md#d-023); see the exact [money contract](../MONEY.md) and [currency metadata provenance](../CURRENCY_METADATA.md).
- [D-024](../DECISIONS.md#d-024) fixes write serialization; see the implemented boundary, integration limits, and test evidence in [JOURNAL.md](../JOURNAL.md).
