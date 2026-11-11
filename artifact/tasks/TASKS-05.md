# Tasks 05 — Simulated withdrawals

**Feature PRD:** [PRD-05](../prd/PRD-05-withdrawals.md).  
**Related diagram:** [Money-operation code flow](../DIAGRAMS.md#code-flow-for-a-completed-money-operation).  
Status is mirrored in [KANBAN.md](../KANBAN.md).

### T05-01

**Withdrawal service and protected debit**  
**Status:** Done.
**Decisions:** [D-003](../DECISIONS.md#d-003), [D-005](../DECISIONS.md#d-005), [D-006](../DECISIONS.md#d-006), [D-018](../DECISIONS.md#d-018), [D-019](../DECISIONS.md#d-019).  
**Depends on:** [T02-03](TASKS-02.md#t02-03), [T03-01](TASKS-03.md#t03-01), [T10-02](TASKS-10.md#t10-02).  
**Implementation:** Validate the main account, provider, amount, currency precision, bounds, and key. Under the serialized write boundary, re-read the journal-derived balance; if funds suffice, atomically insert the completed withdrawal and one negative journal entry. No fee or external provider call is allowed.

**Acceptance and tests:** From `100.00 USD`, a `25.50 USD` withdrawal leaves `74.50 USD`. Insufficient funds and invalid/destination-account requests create no entries/history. Independent concurrent withdrawals cannot overspend; duplicate success and injected insertion failure preserve exact balances.

**Implementation:** D-030 and [FUNDING.md](../FUNDING.md) connect protected debits
with durable original-result storage under one writer reservation. Independent
connection races, rejected-attempt separation and stable error replay after later
funding have isolated tests. No provider call or fee exists.

### T05-02

**Withdrawal HTTP flow and interface**  
**Status:** In progress.
**Decisions:** [D-005](../DECISIONS.md#d-005), [D-006](../DECISIONS.md#d-006), [D-013](../DECISIONS.md#d-013), [D-017](../DECISIONS.md#d-017), [D-019](../DECISIONS.md#d-019).  
**Depends on:** [T05-01](#t05-01), [T10-01](TASKS-10.md#t10-01), [T11-02](TASKS-11.md#t11-02).  
**Implementation:** Add the documented endpoint and an accessible withdrawal form with selected wallet, exact amount, and fictional provider. Clearly identify the simulation and present insufficient-funds, invalid, loading, and success states.

**Acceptance and tests:** Swagger reflects the implemented request and errors. A browser test deposits funds, withdraws an affordable amount, and inspects the provider/transaction; an unaffordable attempt produces an error with no history entry. Exact route/payload naming follows [O-003](../DECISIONS.md#o-003).

**Current boundary:** `/api/withdrawals` and reviewed confirmation/recovery are
implemented; the server revalidates funds even after a stale client review.
OpenAPI reflects exact amounts/problems; Swagger UI acceptance remains pending
T10-03. The form retains drafts after rejection and requires an explicit new attempt.
