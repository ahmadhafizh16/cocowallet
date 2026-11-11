# Tasks 07 — Currency conversion

**Feature PRD:** [PRD-07](../prd/PRD-07-conversion.md).  
**Related diagrams:** [Rate and quote sequence](../DIAGRAMS.md#rate-cache-and-quote-sequence), [money-operation code flow](../DIAGRAMS.md#code-flow-for-a-completed-money-operation).  
Status is mirrored in [KANBAN.md](../KANBAN.md).

### T07-01

**Atomic conversion service**  
**Status:** Done.
**Decisions:** [D-003](../DECISIONS.md#d-003), [D-008](../DECISIONS.md#d-008), [D-009](../DECISIONS.md#d-009), [D-018](../DECISIONS.md#d-018), [D-019](../DECISIONS.md#d-019), [D-032](../DECISIONS.md#d-032).
**Depends on:** [T02-03](TASKS-02.md#t02-03), [T03-01](TASKS-03.md#t03-01), [T06-02](TASKS-06.md#t06-02), [T10-02](TASKS-10.md#t10-02).  
**Implementation:** Confirm a server-owned quote for the main account, serialize the balance check, validate quote expiry/inputs, create a missing target wallet if needed, and write one completed transaction plus source debit and target credit entries. Record exact applied rate and provenance; use currency-specific half-up rounding and no unapproved fee.

**Acceptance and tests:** The credited amount matches the confirmed quote. Insufficient funds, quote tampering/expiry, an insert error, or duplicate successful submission cannot create a partial/duplicate conversion or target wallet. Test zero-decimal currencies, ties, numeric bounds, concurrent spending, and persistence.

**Verified slice:** Server-only exact quote-bound conversion, atomic missing
currency/wallet creation, both journal entries, quote use and retained original
success/error results. Replay precedes quote/current-funds/clock checks; global
funding/conversion key ownership is enforced by services and SQLite triggers.
Insert-stage rollback, target bounds, ties/zero decimals/int64 limits, restart,
cached-minute hold and independent-writer races pass. Full Docker check/build:
**968 Jest tests / 53 production Chromium regressions**. Backed-up repeated
migration, unchanged runtime rows and stable restored development are verified in
[CONVERSIONS.md](../CONVERSIONS.md). No submission endpoint, confirmation UI,
browser recovery, full history or transfer operation was enabled by this task.

### T07-02

**Conversion preview, confirmation, and HTTP flow**  
**Status:** To do.  
**Decisions:** [D-007](../DECISIONS.md#d-007), [D-008](../DECISIONS.md#d-008), [D-009](../DECISIONS.md#d-009), [D-013](../DECISIONS.md#d-013), [D-017](../DECISIONS.md#d-017).  
**Depends on:** [T07-01](#t07-01), [T11-02](TASKS-11.md#t11-02).  
**Implementation:** Provide documented quote/confirmation endpoints and an accessible conversion form. Show source and target amounts, reference rate/date, cache indication, and quote expiry; on expiry obtain a new preview and require reconfirmation.

**Acceptance and tests:** A browser test deposits funds, previews and confirms a mocked conversion, and verifies both balances and history. Simulate expired quotes and unavailable rates; no source balance changes until a valid confirmation. API request/response shapes remain [O-003](../DECISIONS.md#o-003).
