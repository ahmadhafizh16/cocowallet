# Digital wallet planning

These documents distinguish agreed decisions, proposals, and implemented work. The **Git/platform foundation is implemented**: Docker/Node 26, Next.js health/readiness routes, SQLite metadata migrations, and foundation tests. Wallet operations, journal/account tables, Swagger, and the wallet interface are not implemented yet; consult the kanban rather than assuming a draft PRD describes completed features.

- [Main PRD](PRD.md): product scope and links to the smaller feature PRDs.
- [Decision register](DECISIONS.md): stable `D-###` decisions and `O-###` open questions.
- [Kanban](KANBAN.md): the current status of planning and implementation tasks.
- [Implementation plan](PLAN.md): milestones, dependency order, and completion criteria.
- [Readiness checklist](READINESS.md): what to settle or verify before each implementation stage.
- [Shared tooling](TOOLING.md): restore and verify the excluded design engine.
- [Dependency notes](DEPENDENCIES.md): verified versions, compatibility decisions, and development-tool advisories.
- [Diagrams](DIAGRAMS.md): proposed architecture, data relationships, business flows, and code flow.
- [API design](API_DESIGN.md): proposed HTTP contract, sequence diagram, and OpenAPI/Swagger approach.
- [Idempotency discussion](IDEMPOTENCY.md): the selected failed-retry policy, alternatives, and examples.
- [Coding guide](CODING_GUIDE.md): agreed constraints and proposed coding practices.
- [Handover](HANDOVER.md): environment status, caveats, and implementation guidance.
- [`prd/`](prd/): small, traceable feature PRDs, indexed in the [main PRD](PRD.md).
- [`tasks/`](tasks/): detailed feature task breakdowns, indexed in the [kanban](KANBAN.md).

## Traceability and status

Each feature has a `PRD-##` ID. Each task has a `T##-##` ID, names its source feature PRD and relevant `D-###` decisions, and links to dependencies. The kanban links to the individual task headings. `O-###` identifies a tracked question, which may be open or explicitly marked resolved; do not present an open question or candidate endpoint as an agreed fact.

The Angular-style, one-intention-per-commit rule in [D-021](DECISIONS.md#d-021) and local Git workflow in [D-022](DECISIONS.md#d-022) apply to all implementation and documentation tasks, in addition to the decisions listed on each task.

When work starts or finishes, update the task status and move its link on the kanban in the same change. When a decision changes, update the affected PRDs, tasks, diagrams, and API design; record actual code paths and operational commands in the handover only after they exist.
