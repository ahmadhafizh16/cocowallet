# Implementation readiness

**Status:** Foundation verified; the remaining questions apply to later feature stages. Items are not additional features unless the linked decision or PRD says so.

## Before the first implementation work

- [x] Local Git is initialized on `main`; commit each completed intention using Angular messages and do not push without approval ([D-021](DECISIONS.md#d-021), [D-022](DECISIONS.md#d-022)).
- [x] Choose to exclude the approximately 22 MB Impeccable engine binary from Git while retaining its local copy ([D-022](DECISIONS.md#d-022)).
- [x] Initialize the local repository, establish targeted ignore rules, and create small baseline commits; see [T00-01–T00-02](tasks/TASKS-00.md).
- [x] Document and verify versioned, integrity-checked restoration of the excluded engine ([TOOLING.md](TOOLING.md)); online restoration and corrupt-source rejection passed without deleting the installed engine.
- [x] Verify Node 26.13.0, npm access, clean `npm ci`, native `better-sqlite3`, Drizzle migration, and persistence **inside Docker** in [T01-01–T01-03](tasks/TASKS-01.md). The image includes native-build tools; no host Node upgrade was required.
- [x] Establish targeted ignore rules for secrets, dependencies, build/test outputs, SQLite files, and platform engines while keeping shared design context.

## Before implementing money movement

- [ ] Resolve [O-002](DECISIONS.md#o-002): trusted per-currency minor-unit metadata, decimal arithmetic configuration, supported numeric bounds, and an overflow-safe journal aggregation strategy.
- [ ] Resolve implementation details in [O-006](DECISIONS.md#o-006): idempotency key format and retention, request fingerprinting, in-progress concurrency, and recovery when a result cannot be durably stored. The **stable definitive success/error replay** policy itself is already agreed in [D-019](DECISIONS.md#d-019).
- [ ] Finish the feature-specific requests, quote binding, and error schemas in [O-003](DECISIONS.md#o-003) and [API_DESIGN.md](API_DESIGN.md) before finalizing HTTP/Swagger endpoints.

## Before visual design and feature completion

- [ ] Run the installed Impeccable initialization workflow with the user and review its product context. Its project-local skill currently expects a project-root `PRODUCT.md`; the main PRD, handover, decisions, tasks, and diagrams remain under `artifact/`.
- [ ] Resolve the display/default-currency questions in [O-004](DECISIONS.md#o-004), including destination USD totals and date-filter boundaries, before finalizing their UI/API acceptance criteria.
- [ ] Define and test the safe SQLite backup/restore and offline currency-catalog behavior in [O-005](DECISIONS.md#o-005). Avoid assuming a live database can be safely copied without accounting for active journal/WAL state.
- [ ] Verify local-only access for the no-auth API/Swagger UI, deterministic mocked FX/clock tests, isolated test data, concurrency, rollback, and restart/volume persistence. These are tracked by the linked feature tasks and [PRD-12](prd/PRD-12-quality.md).
