# PRD-05 — Simulated withdrawals

**Status:** Protected simulated debits, HTTP confirmation and durable retry/recovery are implemented under D-030; verification is recorded in [FUNDING.md](../FUNDING.md). Swagger UI remains a separate incomplete acceptance item.
**Decisions:** [D-003](../DECISIONS.md#d-003), [D-005](../DECISIONS.md#d-005), [D-006](../DECISIONS.md#d-006), [D-018](../DECISIONS.md#d-018), [D-019](../DECISIONS.md#d-019).  
**Tasks:** [T05-01–T05-02](../tasks/TASKS-05.md).  
**Diagram:** [Money-operation code flow](../DIAGRAMS.md#code-flow-for-a-completed-money-operation).

## Outcome and user story

As the user, I can withdraw simulated funds from a main-account wallet to a fictional provider and see the reduced balance and completed transaction.

## Requirements

1. Offer Demo Bank, Community Bank, and Crypto Gateway as fictional destinations; do not collect real account credentials or call a payment/network service.
2. Accept a positive, currency-precision-safe amount and validate provider, account, wallet, amount, and idempotency key on the server.
3. Under a serialized write transaction, derive the current balance from the wallet journal, reject an unaffordable amount, and atomically record a completed withdrawal plus one negative journal entry.
4. Apply no fees and complete valid withdrawals immediately. The transaction history records provider, amount, currency, status, timestamp, and ID; no history is created on rejection.
5. Reject a direct request to withdraw from an inspect-only destination account.

## Acceptance criteria

- Given a `100.00 USD` balance, a `25.50 USD` withdrawal yields a `-2550` minor-unit entry, `74.50 USD` balance, and one completed withdrawal record.
- Given insufficient funds, an invalid/overly precise amount, invalid provider, or destination account, return an appropriate error without changing any balance or history.
- Two concurrent withdrawals cannot both consume the same funds. A committed request retried with the same key and input cannot debit twice.
- A failure during persistence rolls back the withdrawal and its entry together.

## Tests and dependencies

Depends on [PRD-02](PRD-02-journal.md) and [PRD-03](PRD-03-accounts.md). Test exact-balance withdrawals, fractional precision, concurrency with independent SQLite connections, rollback, stable success/error replay, provider labels, and the browser flow. Idempotency storage/recovery details remain [O-006](../DECISIONS.md#o-006).
