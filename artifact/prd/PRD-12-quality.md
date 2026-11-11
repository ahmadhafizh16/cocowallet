# PRD-12 — Verification and handover

**Status:** Draft; no application tests or release workflow exist.  
**Decisions:** [D-002](../DECISIONS.md#d-002), [D-015](../DECISIONS.md#d-015), [D-016](../DECISIONS.md#d-016), [D-018](../DECISIONS.md#d-018), [D-020](../DECISIONS.md#d-020).  
**Tasks:** [T12-01–T12-03](../tasks/TASKS-12.md).  
**Diagrams:** [System boundary](../DIAGRAMS.md#system-and-docker-boundary) and [money-operation code flow](../DIAGRAMS.md#code-flow-for-a-completed-money-operation).

## Outcome and user story

As the user or next developer, I can verify the critical wallet flows locally and understand how to run, test, back up, and continue the project without losing simulated transaction data.

## Requirements

1. Use Jest/`next/jest` for focused unit and integration tests, with feature tests close to their code and isolated temporary SQLite databases. Use temporary file-backed databases and independent connections for concurrency tests.
2. Mock Frankfurter and clock behavior in routine tests. A real-network smoke test, if offered, is optional and clearly separated from deterministic tests.
3. Use Playwright for key user journeys, including deposit, withdrawal, conversion, transfer, destination inspection, transaction details, error states, and quote expiry.
4. Run lint, formatting check, strict type check, tests, and production build through documented Docker-based commands. Focus on critical cases; no initial percentage coverage threshold or required CI.
5. Update handover with actual modules, commands, database path/backup procedure, known limitations, and task status. Do not invent commands or code paths before they exist.

## Acceptance criteria

- Money parsing, rounding, currency precision, journal consistency, rollback, concurrent spending, completed idempotent replay, cache failure, and quote expiry have deterministic automated coverage.
- Browser tests verify the major flows against isolated data and do not depend on the real Frankfurter service.
- Re-running checks does not mutate the developer's persistent wallet data.
- A documented fresh install, migration, normal restart, and restore workflow is verified without deleting existing user data.
- The kanban, PRDs, decisions, diagrams, Swagger, and handover reflect actual completion and identify any remaining open decisions.

## Open items

[O-006](../DECISIONS.md#o-006) covers idempotency storage/recovery details, [O-002](../DECISIONS.md#o-002) affects precision/overflow tests, and [O-005](../DECISIONS.md#o-005) covers the backup/restore procedure.
