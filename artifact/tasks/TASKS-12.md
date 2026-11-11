# Tasks 12 — Verification and handover

**Feature PRD:** [PRD-12](../prd/PRD-12-quality.md).  
**Related diagrams:** [System boundary](../DIAGRAMS.md#system-and-docker-boundary), [money-operation code flow](../DIAGRAMS.md#code-flow-for-a-completed-money-operation).  
Status is mirrored in [KANBAN.md](../KANBAN.md).

### T12-01

**Critical Jest unit and integration coverage**  
**Status:** To do.  
**Decisions:** [D-015](../DECISIONS.md#d-015), [D-016](../DECISIONS.md#d-016), [D-018](../DECISIONS.md#d-018), [D-019](../DECISIONS.md#d-019).  
**Depends on:** [T04-01](TASKS-04.md#t04-01), [T05-01](TASKS-05.md#t05-01), [T06-02](TASKS-06.md#t06-02), [T07-01](TASKS-07.md#t07-01), [T08-01](TASKS-08.md#t08-01), [T10-02](TASKS-10.md#t10-02).  
**Implementation:** Consolidate feature-local tests for exact monetary parsing/rounding, journal aggregation/overflow, serialized spending, atomic rollback, successful duplicate replay, quote expiry, cache failures, and API validation. Use mocked rates/clocks and temporary file-backed SQLite for independent-connection concurrency tests.

**Acceptance and tests:** The suite runs deterministically in Docker, exercises the critical rules and agreed error cases, and never writes to the persistent user database. Verify stable replay of both successful and definitive failed results, plus unknown-outcome recovery. No percentage threshold is required.

### T12-02

**Playwright end-to-end journeys**  
**Status:** To do.  
**Decisions:** [D-003](../DECISIONS.md#d-003), [D-008](../DECISIONS.md#d-008), [D-012](../DECISIONS.md#d-012), [D-013](../DECISIONS.md#d-013), [D-016](../DECISIONS.md#d-016).  
**Depends on:** [T04-02](TASKS-04.md#t04-02), [T05-02](TASKS-05.md#t05-02), [T07-02](TASKS-07.md#t07-02), [T08-02](TASKS-08.md#t08-02), [T09-02](TASKS-09.md#t09-02), [T10-03](TASKS-10.md#t10-03), [T11-03](TASKS-11.md#t11-03).  
**Implementation:** Create browser journeys using an isolated database and mocked Frankfurter responses: deposit, withdrawal, preview/convert, cross-currency transfer to a random ID, account switching, history/details, and errors/expiry. Include representative keyboard, theme, and narrow-screen checks.

**Acceptance and tests:** Journeys run locally through the documented Docker workflow without real payment providers or live FX dependency. They verify one completed transaction per action, destination read-only behavior, and unchanged balances after rejected operations.

### T12-03

**Operational verification and complete handover**  
**Status:** To do.  
**Decisions:** [D-002](../DECISIONS.md#d-002), [D-016](../DECISIONS.md#d-016), [D-020](../DECISIONS.md#d-020), [D-021](../DECISIONS.md#d-021).  
**Depends on:** [T01-03](TASKS-01.md#t01-03), [T10-03](TASKS-10.md#t10-03), [T11-03](TASKS-11.md#t11-03), [T12-01](#t12-01), [T12-02](#t12-02).  
**Implementation:** Verify documented startup, migrations, local checks, build, ordinary restart, persisted volume, and a safe backup/restore procedure. Update PRDs, diagrams, API contract, decision register, kanban, and handover with actual code locations, commands, test results, and remaining limitations.

**Acceptance and tests:** A fresh local run and non-destructive restart work from documentation; backup and restore are verified on isolated data after [O-005](../DECISIONS.md#o-005) is resolved. No actual SQLite data, secrets, or generated runtime state is committed accidentally. The board accurately reflects completed and blocked work.
