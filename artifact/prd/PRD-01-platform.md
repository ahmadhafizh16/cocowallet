# PRD-01 — Application platform and persistence

**Status:** Draft; no app or container exists.  
**Decisions:** [D-001](../DECISIONS.md#d-001), [D-002](../DECISIONS.md#d-002), [D-015](../DECISIONS.md#d-015), [D-016](../DECISIONS.md#d-016), [D-020](../DECISIONS.md#d-020), [D-021](../DECISIONS.md#d-021), [D-022](../DECISIONS.md#d-022).  
**Tasks:** [T00-01–T00-02](../tasks/TASKS-00.md), [T01-01–T01-03](../tasks/TASKS-01.md).  
**Diagram:** [System and Docker boundary](../DIAGRAMS.md#system-and-docker-boundary).

## Outcome and user story

As the local operator, I can start, stop, test, and restart the simulated wallet consistently with Docker, without installing Node 26 on the host or losing the SQLite database during ordinary container recreation.

## Requirements

1. Run Next.js App Router/TypeScript and npm on Node.js 26 in the application container. Use Drizzle and `better-sqlite3` with a tested, compatible native build.
2. Persist the SQLite file in a named Docker volume; the database is embedded in the app, not an extra database server. Document its path, initialization, migration, backup, and restore process once implemented.
3. Provide a development workflow with source changes reflected in the container. Avoid overwriting container-built native dependencies with host `node_modules`.
4. Configure strict TypeScript, ESLint, Prettier defaults, Jest, and Playwright with documented Docker-based commands. Exact dependency and base-image versions must be verified, not assumed.
5. Bind the no-auth application to an appropriate local host boundary. No real payment credentials, authentication, remote deployment, or KYC are required.
6. Preserve the existing `artifact/` and `.opencode/` contents during scaffolding; apply the agreed one-intention-per-commit Git convention without staging unrelated files.
7. Initialize Git locally when implementation starts; exclude the installed Impeccable engine binary from commits, retain it locally, and document/verify restoration. No remote or push is automatic.

## Acceptance criteria

- Given Docker is available, the documented workflow starts the app with Node 26 and a working SQLite driver.
- Given a persisted wallet transaction, stopping and recreating the container without removing the volume retains the transaction and its balance.
- Given an empty volume, the documented migrations/seed run creates the single main account and starter wallets without duplicating them on a repeat run.
- Given a source change, the development workflow reflects it; dependency installation, lint, format check, type check, tests, and build are runnable through documented container commands.
- No application database or credentials are committed, and no destructive volume deletion is included in normal startup or shutdown instructions.

## Risks, tests, and open items

- Test native driver installation/build on the chosen Node 26 image and verify SQLite locking and volume permissions.
- Host npm networking timed out during Impeccable setup; independently verify container DNS/registry access instead of assuming it works.
- Test restart and volume persistence. Define safe backup/restore and operational details in [O-005](../DECISIONS.md#o-005); do not use destructive volume commands as a test shortcut.
