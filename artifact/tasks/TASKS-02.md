# Tasks 02 — Journal and money

**Feature PRD:** [PRD-02](../prd/PRD-02-journal.md).  
**Related diagrams:** [Logical data relationships](../DIAGRAMS.md#logical-data-relationships), [money-operation code flow](../DIAGRAMS.md#code-flow-for-a-completed-money-operation).  
Status is mirrored in [KANBAN.md](../KANBAN.md).

### T02-01

**Exact money types, currency precision, and rounding**  
**Status:** To do; final precision source and bounds require [O-002](../DECISIONS.md#o-002).  
**Decisions:** [D-004](../DECISIONS.md#d-004), [D-018](../DECISIONS.md#d-018).  
**Depends on:** [T01-02](TASKS-01.md#t01-02).  
**Implementation:** Choose authoritative fiat minor-unit metadata and a decimal-safe calculation approach; parse input as decimal text; represent journal amounts as integer minor units; round FX results half up to target precision. Specify supported bounds, API serialization, overflow behavior, and a strategy safe for long journal aggregations.

**Acceptance and tests:** Currency examples with zero, two, and three decimal places parse correctly; `1.005 USD` rounds to `1.01 USD`; invalid precision, nonpositive amounts, and overflow are rejected without floating-point drift. Test JavaScript safe-integer boundaries, SQLite signed 64-bit limits, and aggregate intermediate overflow.

### T02-02

**Journal schema and derived balance reads**  
**Status:** To do.  
**Decisions:** [D-003](../DECISIONS.md#d-003), [D-004](../DECISIONS.md#d-004), [D-012](../DECISIONS.md#d-012), [D-018](../DECISIONS.md#d-018).  
**Depends on:** [T01-03](TASKS-01.md#t01-03), [T02-01](#t02-01).  
**Implementation:** Design and migrate the minimal account, wallet, completed-transaction, and signed journal-entry structures, including wallet/currency uniqueness, foreign keys, and indexes. Implement exact balance reads derived from one wallet's entries; do not add a second authoritative stored balance. Coordinate main-account seeding with T03-01.

**Acceptance and tests:** Entries for two wallets or currencies cannot mix in a balance. A new wallet reads zero, correct signed entries produce an exact balance, and invalid references/duplicate account-currency wallets are rejected. Test migrations and overflow-safe aggregation in isolated databases.

### T02-03

**Atomic write boundary and concurrent spending**  
**Status:** To do.  
**Decisions:** [D-006](../DECISIONS.md#d-006), [D-018](../DECISIONS.md#d-018), [D-019](../DECISIONS.md#d-019).  
**Depends on:** [T02-02](#t02-02).  
**Implementation:** Provide reusable server-side write orchestration that serializes competing SQLite writers before reading journal-derived funds; insert completed transaction, debit/credit entries, and any new account/wallet atomically. Keep remote rate requests outside the write lock. Integrate successful idempotency recording with T10-02 without deciding failed-request policy.

**Acceptance and tests:** Two independent connections cannot overspend one balance; an injected failure after any intermediate insert rolls back every change; no partially created account/wallet survives a failed operation. Verify safe restart and duplicate-success behavior with isolated file-backed databases.
