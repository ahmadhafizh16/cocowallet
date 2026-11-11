# Tasks 08 — Transfers

**Feature PRD:** [PRD-08](../prd/PRD-08-transfers.md).  
**Related diagram:** [Cross-currency transfer sequence](../DIAGRAMS.md#cross-currency-transfer-sequence).  
Status is mirrored in [KANBAN.md](../KANBAN.md).

### T08-01

**Simulated destination and atomic transfer service**  
**Status:** To do.  
**Decisions:** [D-003](../DECISIONS.md#d-003), [D-008](../DECISIONS.md#d-008), [D-010](../DECISIONS.md#d-010), [D-012](../DECISIONS.md#d-012), [D-018](../DECISIONS.md#d-018), [D-019](../DECISIONS.md#d-019).  
**Depends on:** [T02-03](TASKS-02.md#t02-03), [T03-01](TASKS-03.md#t03-01), [T06-02](TASKS-06.md#t06-02), [T10-02](TASKS-10.md#t10-02).  
**Implementation:** Resolve or create a simulated destination by entered ID, honor its default or selected currency, reject the main account's own ID, and use a server-owned quote only when currencies differ. Under a serialized write transaction, revalidate funds/quote, create any destination/account wallet, record the transfer, and append debit/credit entries atomically.

**Acceptance and tests:** A new GBP-default destination receives the displayed GBP amount from a USD transfer; same-currency transfers do not call FX. Test existing IDs, optional target currencies, missing wallets, rollback of new destinations, duplicate successes, concurrent debit attempts, self-ID rejection, and rate metadata.

### T08-02

**Transfer interface and destination inspection**  
**Status:** To do.  
**Decisions:** [D-003](../DECISIONS.md#d-003), [D-008](../DECISIONS.md#d-008), [D-010](../DECISIONS.md#d-010), [D-012](../DECISIONS.md#d-012), [D-013](../DECISIONS.md#d-013), [D-017](../DECISIONS.md#d-017).  
**Depends on:** [T08-01](#t08-01), [T09-01](TASKS-09.md#t09-01), [T11-02](TASKS-11.md#t11-02).  
**Implementation:** Add a documented transfer endpoint and accessible flow for entering an arbitrary ID, choosing a new recipient's default, accepting/overriding the target currency, previewing FX if needed, and confirming. Make simulation and inspect-only destination status obvious in the account switcher.

**Acceptance and tests:** Browser tests transfer from a funded USD wallet to a new GBP destination, switch accounts, and inspect the credited balance/incoming transaction. Cover existing destinations, same-currency flow, expired quote, insufficient funds, self-ID rejection, keyboard use, and destination read-only enforcement.
