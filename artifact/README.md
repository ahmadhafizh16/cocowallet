# Digital wallet planning

These documents distinguish decisions, proposals, and implemented work. The **platform, money/journal core, and interface-preview shell exist**: Docker/Node 26, health/readiness, accounting, and the approved frosted UI with skeleton/empty/error/review states. Wallet APIs, full idempotency, account seeding, rates/quotes, and Swagger remain future work; preview controls cannot move money. Consult the kanban rather than assuming a draft PRD describes completed features.

- [Main PRD](PRD.md): product scope and links to the smaller feature PRDs.
- [Decision register](DECISIONS.md): stable `D-###` decisions and `O-###` open questions.
- [Kanban](KANBAN.md): the current status of planning and implementation tasks.
- [Implementation plan](PLAN.md): milestones, dependency order, and completion criteria.
- [Readiness checklist](READINESS.md): what to settle or verify before each implementation stage.
- [Shared tooling](TOOLING.md): restore and verify the excluded design engine.
- [Dependency notes](DEPENDENCIES.md): verified versions, compatibility decisions, and development-tool advisories.
- [Exact money](MONEY.md): bounds, parsing, rational FX rounding, and serialization.
- [Currency metadata](CURRENCY_METADATA.md): pinned accounting precision, source/license, and update rules.
- [Journal implementation](JOURNAL.md): storage, snapshot reads, serialized writes, tests, and integration boundaries.
- [Interface foundation](UI_FOUNDATION.md): shell, skeletons, safeguards, verification, and unconnected services.
- [Design review](DESIGN_REVIEW.md): evidence, one corrected mobile-navigation finding, verdict scope, and limitations.
- [Built design system](../DESIGN.md): actual visual tokens and reusable interface rules; `.impeccable/design.json` carries component-preview extensions.
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
