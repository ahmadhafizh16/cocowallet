# PRD-09 — Transaction history and details

**Status:** Draft; no history code exists.  
**Decisions:** [D-003](../DECISIONS.md#d-003), [D-006](../DECISIONS.md#d-006), [D-012](../DECISIONS.md#d-012), [D-017](../DECISIONS.md#d-017), [D-018](../DECISIONS.md#d-018).  
**Tasks:** [T09-01–T09-02](../tasks/TASKS-09.md).  
**Diagrams:** [Logical data relationships](../DIAGRAMS.md#logical-data-relationships) and [business operations](../DIAGRAMS.md#business-operations-and-history).

## Outcome and user story

As the user, I can review completed activity for the selected account, narrow it by type/currency/date, and inspect the details of a particular transaction.

## Requirements

1. List completed deposits, withdrawals, conversions, and transfers newest first. Show a useful empty state; rejected requests are not history records.
2. Filter by type, currency, and date. Ensure a cross-currency transaction can be found using either affected currency; precise filter/date semantics and pagination are open.
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

Test ordering, cross-currency filtering, exact historical values, incoming/outgoing views, missing IDs, persistence, and empty/error states. [O-003](../DECISIONS.md#o-003) covers API/filter and pagination contracts; [O-004](../DECISIONS.md#o-004) covers date-filter time-zone boundaries.
