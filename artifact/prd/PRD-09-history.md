# PRD-09 — Transaction history and details

**Status:** T09-01's read-only queries/detail API are implemented and verified. The user selected inclusive UTC days and numbered pages under D-033. T08-02 connects bounded incoming recent activity for inspect-only destinations. T09-02's full-history browsing remains separate work. See [HISTORY.md](../HISTORY.md) and [TRANSFERS.md](../TRANSFERS.md).
**Decisions:** [D-003](../DECISIONS.md#d-003), [D-006](../DECISIONS.md#d-006), [D-012](../DECISIONS.md#d-012), [D-017](../DECISIONS.md#d-017), [D-018](../DECISIONS.md#d-018), [D-033](../DECISIONS.md#d-033).
**Tasks:** [T09-01–T09-02](../tasks/TASKS-09.md).  
**Diagrams:** [Logical data relationships](../DIAGRAMS.md#logical-data-relationships) and [business operations](../DIAGRAMS.md#business-operations-and-history).

## Outcome and user story

As the user, I can review completed activity for the selected account, narrow it by type/currency/date, and inspect the details of a particular transaction.

## Requirements

1. List completed deposits, withdrawals, conversions, and transfers newest first. Show a useful empty state; rejected requests are not history records.
2. Filter by type, either affected currency and inclusive UTC `from`/`to` calendar days. Use numbered pages (default 1, 50 records, maximum pageSize 100), newest first with an ID tie-breaker. A single response shares one snapshot, but new activity between requests may shift page boundaries; no cursor guarantee is implied.
3. Detail view includes ID, time, type, status, source/target amounts and currencies as applicable, provider or destination as applicable, and the applied FX rate and source date where applicable.
4. Show one transfer record as outgoing on the main account and incoming on the destination account. An inspected destination remains read-only.
5. Represent monetary values exactly in API results and format them according to their currencies in the UI. Do not recompute historical amounts from today's FX rate.

## Acceptance criteria

- A completed deposit, withdrawal, conversion, or transfer appears once in the relevant account history, with correct direction and details.
- A rejected withdrawal or expired quote does not appear as a completed transaction.
- The selected filters restrict results correctly; clearing them restores the list. A currency filter can find either side of a cross-currency operation.
- Looking up a nonexistent transaction returns a 404 Problem Details response; no fabricated details are shown.
- History and applied rate metadata remain unchanged after application restart or later Frankfurter rate updates.

## Tests and open items

Test ordering, cross-currency filtering, exact historical values, incoming/outgoing views, missing IDs, persistence, and empty/error states. [D-033](../DECISIONS.md#d-033) resolves this slice of [O-003](../DECISIONS.md#o-003)/[O-004](../DECISIONS.md#o-004). Backend contract and verification scope are in [HISTORY.md](../HISTORY.md); interface acceptance remains T09-02/T08-02.
