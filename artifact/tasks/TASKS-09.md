# Tasks 09 — Transaction history

**Feature PRD:** [PRD-09](../prd/PRD-09-history.md).  
**Related diagrams:** [Logical data relationships](../DIAGRAMS.md#logical-data-relationships), [business operations](../DIAGRAMS.md#business-operations-and-history).  
Status is mirrored in [KANBAN.md](../KANBAN.md).

### T09-01

**History queries, filters, and detail API**  
**Status:** To do.  
**Decisions:** [D-003](../DECISIONS.md#d-003), [D-006](../DECISIONS.md#d-006), [D-012](../DECISIONS.md#d-012), [D-017](../DECISIONS.md#d-017), [D-018](../DECISIONS.md#d-018).  
**Depends on:** [T02-02](TASKS-02.md#t02-02), [T03-01](TASKS-03.md#t03-01), [T10-01](TASKS-10.md#t10-01).  
**Implementation:** Query completed transactions for the selected account, order newest first, support type/currency/date filters, and retrieve an individual record. Present transfers as outgoing/incoming by account and preserve stored historical amounts/rates. Finalize filter time zone, pagination, and response contracts under [O-003](../DECISIONS.md#o-003)/[O-004](../DECISIONS.md#o-004).

**Acceptance and tests:** Feature tests verify all types, both currencies of cross-currency operations, incoming/outgoing transfer views, empty results, filter combinations, stable ordering, and 404 for unknown IDs. Historical details do not change when current FX rates change.

### T09-02

**History list and transaction detail interface**  
**Status:** To do.  
**Decisions:** [D-003](../DECISIONS.md#d-003), [D-012](../DECISIONS.md#d-012), [D-013](../DECISIONS.md#d-013), [D-017](../DECISIONS.md#d-017).  
**Depends on:** [T09-01](#t09-01), [T11-02](TASKS-11.md#t11-02).  
**Implementation:** Render account-aware transaction lists, type/currency/date filters, and an individual detail view with provider/destination and stored FX metadata where applicable. Provide empty, loading, missing-record, and error states with accessible controls.

**Acceptance and tests:** Browser tests inspect a completed operation, filter and clear results, switch to a destination's incoming history, and handle empty/missing records. Rejected operations never appear as completed history.
