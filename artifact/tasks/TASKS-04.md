# Tasks 04 — Simulated deposits

**Feature PRD:** [PRD-04](../prd/PRD-04-deposits.md).  
**Related diagrams:** [Business operations](../DIAGRAMS.md#business-operations-and-history), [money-operation code flow](../DIAGRAMS.md#code-flow-for-a-completed-money-operation).  
Status is mirrored in [KANBAN.md](../KANBAN.md).

### T04-01

**Deposit service and journal write**  
**Status:** To do.  
**Decisions:** [D-003](../DECISIONS.md#d-003), [D-005](../DECISIONS.md#d-005), [D-006](../DECISIONS.md#d-006), [D-018](../DECISIONS.md#d-018), [D-019](../DECISIONS.md#d-019).  
**Depends on:** [T02-03](TASKS-02.md#t02-03), [T03-01](TASKS-03.md#t03-01), [T10-02](TASKS-10.md#t10-02).  
**Implementation:** Validate the main-account wallet, provider label, positive decimal input, precision, bounds, and idempotency key. In one write transaction, record a completed deposit and positive minor-unit journal entry; retain the selected provider as simulated metadata.

**Acceptance and tests:** `100.00 USD` adds exactly `10000` minor units and one completed history record. Reject invalid provider/amount/read-only wallet; rollback all changes on insertion failure. Replay a committed key without a second credit. Tests use isolated SQLite data and no payment network.

### T04-02

**Deposit HTTP flow and interface**  
**Status:** To do.  
**Decisions:** [D-005](../DECISIONS.md#d-005), [D-006](../DECISIONS.md#d-006), [D-013](../DECISIONS.md#d-013), [D-017](../DECISIONS.md#d-017), [D-019](../DECISIONS.md#d-019).  
**Depends on:** [T04-01](#t04-01), [T10-01](TASKS-10.md#t10-01), [T11-02](TASKS-11.md#t11-02).  
**Implementation:** Add the documented HTTP boundary and an accessible form for wallet, amount, and Demo Bank/Community Bank/Crypto Gateway. Clearly label the action as a simulation; render loading, error, success, and updated balance/history states. Avoid collecting real account information.

**Acceptance and tests:** Swagger describes the eventual deposit request and errors. A browser test completes a deposit and can inspect its provider/amount; invalid input and repeated submissions do not create extra completed operations. Exact route/payload naming follows [O-003](../DECISIONS.md#o-003).
