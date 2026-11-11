# Tasks 03 — Accounts, wallets, and balances

**Feature PRD:** [PRD-03](../prd/PRD-03-accounts.md).  
**Related diagram:** [Logical data relationships](../DIAGRAMS.md#logical-data-relationships).  
Status is mirrored in [KANBAN.md](../KANBAN.md).

### T03-01

**Main-account seed and account switcher data**  
**Status:** To do.  
**Decisions:** [D-003](../DECISIONS.md#d-003), [D-004](../DECISIONS.md#d-004), [D-012](../DECISIONS.md#d-012).  
**Depends on:** [T02-02](TASKS-02.md#t02-02).  
**Implementation:** Seed one main account with USD default and zero-balance USD/EUR/GBP wallets. Provide account lookup/list data for the switcher and an explicit server-side distinction between the writable main account and inspect-only destinations created by transfers.

**Acceptance and tests:** Repeated seed/migration runs do not duplicate accounts or wallets; generated destinations can be listed and inspected after a transfer; direct attempts to originate operations from a destination fail. Test unknown IDs, restart, and role/ownership validation without adding authentication.

### T03-02

**Fiat wallet and default-currency management**  
**Status:** To do.  
**Decisions:** [D-003](../DECISIONS.md#d-003), [D-004](../DECISIONS.md#d-004), [D-007](../DECISIONS.md#d-007).  
**Depends on:** [T03-01](#t03-01), [T06-01](TASKS-06.md#t06-01).  
**Implementation:** Expose supported fiat currencies and add-wallet behavior for the main account; enforce one wallet per account/currency in storage and server logic. Support changing the main account default and prohibit editing destination defaults. Resolve offline catalog behavior and missing-wallet default changes with [O-004](../DECISIONS.md#o-004) and [O-005](../DECISIONS.md#o-005).

**Acceptance and tests:** A supported fiat wallet can be added once; duplicate requests/races cannot create duplicates; crypto assets do not become wallets through the simulated provider label. Verify missing/unsupported codes and account restrictions without assuming every catalog pair has an FX rate.

### T03-03

**Balance views and approximate USD total**  
**Status:** To do.  
**Decisions:** [D-003](../DECISIONS.md#d-003), [D-007](../DECISIONS.md#d-007), [D-011](../DECISIONS.md#d-011), [D-018](../DECISIONS.md#d-018).  
**Depends on:** [T02-02](TASKS-02.md#t02-02), [T03-01](#t03-01), [T06-01](TASKS-06.md#t06-01).  
**Implementation:** Read individual balances from journal entries; calculate and label an approximate USD total using eligible reference rates without silently dropping any required currency. Provide clear unavailable/loading states and retain individual balances during FX failure. Confirm destination-account total behavior in [O-004](../DECISIONS.md#o-004).

**Acceptance and tests:** Display exact wallet balances; the USD total matches an explicitly controlled set of test rates. If a required rate is unavailable, show the total unavailable while preserving individual balances. Test zero wallets, cache labeling, exact rounding, account switching, and no incorrect cross-account totals.
