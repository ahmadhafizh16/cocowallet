# Tasks 01 — Platform and persistence

**Feature PRD:** [PRD-01](../prd/PRD-01-platform.md).  
**Related diagrams:** [System and Docker boundary](../DIAGRAMS.md#system-and-docker-boundary).  
Status is mirrored in [KANBAN.md](../KANBAN.md).

### T01-01

**Docker-first Node 26 workflow**  
**Status:** In progress. Node 26 and npm registry access verified in Docker; Compose configuration is next.  
**Decisions:** [D-001](../DECISIONS.md#d-001), [D-002](../DECISIONS.md#d-002), [D-016](../DECISIONS.md#d-016), [D-022](../DECISIONS.md#d-022).  
**Depends on:** [T00-02](TASKS-00.md#t00-02).  
**Implementation:** Add a Node 26-based Docker/Compose development environment, host-local port boundary, persistent SQLite volume, source mount, and a plan to isolate container-built dependencies. Verify registry/DNS access and document non-destructive startup/shutdown and volume handling. Do not assume an app scaffold already exists.

**Acceptance and tests:** A clean Docker invocation reports Node 26 and npm; the named volume survives normal container recreation; the database directory is writable; host `node_modules` do not replace Linux-native dependencies. Do not delete a pre-existing volume. App startup is verified by T01-02.

### T01-02

**Scaffold Next.js and quality tooling**  
**Status:** To do.  
**Decisions:** [D-001](../DECISIONS.md#d-001), [D-013](../DECISIONS.md#d-013), [D-015](../DECISIONS.md#d-015), [D-016](../DECISIONS.md#d-016), [D-021](../DECISIONS.md#d-021).  
**Depends on:** [T01-01](#t01-01).  
**Implementation:** Create the Next.js App Router TypeScript project with npm and a committed lockfile; configure strict TypeScript, ESLint, Prettier defaults, Jest/`next/jest`, Playwright, shadcn/ui, and Lucide. Preserve the existing `artifact/` and `.opencode/` files. Keep framework entry points thin and leave feature directories ready for the agreed organization. Split commits by intention rather than automatically combining the whole scaffold.

**Acceptance and tests:** The app starts through Docker; lint, formatting check, type check, test runners, and build have documented working commands. Dependency versions and native driver support are verified on Node 26. No external payment, authentication, or Icons8 MCP dependency is introduced.

### T01-03

**SQLite connection, migrations, and volume lifecycle**  
**Status:** To do.  
**Decisions:** [D-001](../DECISIONS.md#d-001), [D-002](../DECISIONS.md#d-002), [D-018](../DECISIONS.md#d-018).  
**Depends on:** [T01-02](#t01-02).  
**Implementation:** Define a single server-side database connection boundary, volume-backed path, Drizzle migration workflow, foreign-key/transaction configuration, and separate temporary test databases. Document backup/restore only after validating the actual approach; account and journal schema are implemented in T02-02.

**Acceptance and tests:** A temporary database can be migrated and reopened; the volume-backed file persists across container recreation; tests cannot write to the developer's wallet DB. Verify native `better-sqlite3` operation and record actual commands and paths in the handover. Backup procedure remains [O-005](../DECISIONS.md#o-005) until agreed and tested.
