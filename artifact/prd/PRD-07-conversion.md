# PRD-07 — Main-account currency conversion

**Status:** T07-01's atomic service and T07-02's documented endpoint, reviewed quote/confirmation/recovery UI and bounded completed-conversion visibility are implemented; see [CONVERSIONS.md](../CONVERSIONS.md). Full history/pagination/valuation remain T09 and related tasks.
**Decisions:** [D-004](../DECISIONS.md#d-004), [D-007](../DECISIONS.md#d-007), [D-008](../DECISIONS.md#d-008), [D-009](../DECISIONS.md#d-009), [D-018](../DECISIONS.md#d-018), [D-019](../DECISIONS.md#d-019).  
**Tasks:** [T07-01–T07-02](../tasks/TASKS-07.md).  
**Diagrams:** [Rate and quote sequence](../DIAGRAMS.md#rate-cache-and-quote-sequence) and [money-operation code flow](../DIAGRAMS.md#code-flow-for-a-completed-money-operation).

## Outcome and user story

As the user, I can convert funds between fiat currencies in my main account, see the exact preview and reference-rate details, and inspect the completed conversion later.

## Requirements

1. Select a main-account source wallet, target currency, and positive amount. Obtain a server-owned quote and show the source amount, target amount, rate, source date, cached/fresh status, and expiry before confirmation.
2. Confirm only with the same eligible quote and operation parameters within one minute. Use decimal-safe arithmetic and target-currency half-up rounding.
3. Under a serialized SQLite write transaction, revalidate the quote and source balance; create a missing target wallet if necessary; record one completed conversion and source debit/target credit journal entries atomically.
4. Use idempotency keys for money-moving confirmations. Do not accept requests operating from destination accounts; no fee is applied.
5. Show the completed conversion in main-account history with both amounts/currencies and applied rate metadata.

## Acceptance criteria

- Given sufficient USD funds and a valid USD→GBP quote, confirmation decreases the USD journal-derived balance and increases the GBP balance by the displayed rounded amount; one completed conversion records the same rate and date.
- Given no GBP wallet, a successful conversion creates it; a failure after wallet creation rolls back the wallet and all conversion records.
- Given insufficient funds, an expired or mismatched quote, unavailable rate, or invalid amount, no debit or credit is committed.
- Replaying a successful confirmation with the same key and input returns the original result without duplicating either entry.
- The displayed balance and history remain correct after restarting the container.

## Tests and open items

Depends on [PRD-02](PRD-02-journal.md), [PRD-03](PRD-03-accounts.md), and [PRD-06](PRD-06-rates.md). Tests cover exact/tie rounding, target creation, expiry, cache fallback, rollback, parallel spending, stable success/error replay and reviewed confirmation/recovery. [CONVERSIONS.md](../CONVERSIONS.md) fixes this service/HTTP/UI slice of O-003. Full history/pagination, valuation and Swagger retain their tasks and unresolved decisions.
