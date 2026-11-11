# Tasks 09 — Transaction history

**Feature PRD:** [PRD-09](../prd/PRD-09-history.md).  
**Related diagrams:** [Logical data relationships](../DIAGRAMS.md#logical-data-relationships), [business operations](../DIAGRAMS.md#business-operations-and-history).  
Status is mirrored in [KANBAN.md](../KANBAN.md).

### T09-01

**History queries, filters, and detail API**  
**Status:** Done.
**Decisions:** [D-003](../DECISIONS.md#d-003), [D-006](../DECISIONS.md#d-006), [D-012](../DECISIONS.md#d-012), [D-017](../DECISIONS.md#d-017), [D-018](../DECISIONS.md#d-018), [D-033](../DECISIONS.md#d-033).
**Depends on:** [T02-02](TASKS-02.md#t02-02), [T03-01](TASKS-03.md#t03-01), [T10-01](TASKS-10.md#t10-01).  
**Implementation:** Query completed transactions for the selected account, order newest first, support type/either-currency/inclusive-UTC-day filters and user-selected numbered pages, and retrieve an account-scoped individual record. Present transfers as outgoing/incoming by account and preserve stored historical amounts/rates. D-033 resolves this slice of O-003/O-004; count/metadata/rows share one read snapshot, with documented shifts between numbered-page requests.

**Acceptance and tests:** Feature tests verify all types, both currencies of cross-currency operations, incoming/outgoing transfer views, empty results, filter combinations, stable ordering, and 404 for unknown IDs. Historical details do not change when current FX rates change.

**Contract/evidence:** [D-033](../DECISIONS.md#d-033) fixes inclusive UTC days and
the user-selected numbered pages, required account context and foreign-record 404.
[HISTORY.md](../HISTORY.md) documents the actual GETs, exact stored facts, snapshot
counts/pages and technical bounds. Full Docker check/build passes 1,353 Jest tests
in 55 suites and all 65 production Chromium checks pass. Every runtime table is
unchanged from the verified backup; restored development is stable for 300 frames
and the actual history GET returns an empty runtime page without seeding. No
history UI or transfer submission is enabled.

### T09-02

**History list and transaction detail interface**  
**Status:** To do.  
**Decisions:** [D-003](../DECISIONS.md#d-003), [D-012](../DECISIONS.md#d-012), [D-013](../DECISIONS.md#d-013), [D-017](../DECISIONS.md#d-017).  
**Depends on:** [T09-01](#t09-01), [T11-02](TASKS-11.md#t11-02).  
**Implementation:** Render account-aware transaction lists, type/currency/date filters, and an individual detail view with provider/destination and stored FX metadata where applicable. Provide empty, loading, missing-record, and error states with accessible controls.

**Acceptance and tests:** Browser tests inspect a completed operation, filter and clear results, switch to a destination's incoming history, and handle empty/missing records. Rejected operations never appear as completed history.
