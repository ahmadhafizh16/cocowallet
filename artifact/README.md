# Digital wallet planning

These documents distinguish decisions, proposals, and implemented work. The platform, exact journal core, persistent reads, durable funding, fresh-first metadata and reviewed quote-bound conversion flow exist. Conversion includes explicit expiry/reconfirmation and shared same-key recovery. The internal atomic transfer service has isolated tests; transfer HTTP/UI, full history/valuation and Swagger remain future work. Quote previews move/reserve no funds. Consult the kanban rather than assuming a draft PRD describes completed features.

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
- [Redesign brief](WALLET_REDESIGN.md): approved two-column layout, popup money forms, and shadcn-control acceptance.
- [Design review](DESIGN_REVIEW.md): current and historical evidence, verdict scopes, and limitations.
- [Built design system](../DESIGN.md): actual visual tokens and reusable interface rules; `.impeccable/design.json` carries component-preview extensions.
- [CocoWallet logo](BRANDING.md): standalone SVG assets, usage, provenance and checks.
- [Interaction motion](MOTION.md): applied branding, bounded animation thesis, reduced motion and verification.
- [Balance card](BALANCE_CARD.md): currency flags, theme-independent gradient and truthful recorded-history presentation.
- [Backend read integration](BACKEND_READS.md): persistent account initialization, exact read APIs and the connected read-only overview.
- [Simulated funding](FUNDING.md): durable retry protection, deposit/withdrawal confirmation, narrow per-tab recovery and isolated monetary tests.
- [Reference metadata](RATES.md): fresh-first Frankfurter fiat catalog and exact decimal rates with bounded persistent fallback.
- [Server-owned quotes](QUOTES.md): immutable full-minute previews/readback, exact binding, no reservation and internal single-success safeguards.
- [Reviewed conversions](CONVERSIONS.md): exact quote-bound accounting, target creation, documented endpoint, expiry/reconfirmation and original-key recovery.
- [Atomic simulated transfers](TRANSFERS.md): internal same/FX transfer service, recipient/wallet creation and globally retained original results; no transfer HTTP/UI submission.
- [Shared HTTP contracts](HTTP.md): reusable request guards/schema definitions, exact JSON, safe Problem Details and common write boundaries; no new endpoint or Swagger UI.
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
