# Project kanban

**Last updated:** T09-02 is complete: user-approved in-panel full-history filters, numbered pages, scoped exact details/back navigation, privacy and safe read-only recovery. Final Docker check/build passes 1,455 Jest / 89 production Chromium checks. The independent review's sole accessible-summary fix is resolved. All 14 runtime tables remain unchanged; restored development is stable for 300 frames with actual empty browsing and no errors or financial/reference requests. Existing visual design and original-key recovery are preserved. Wallet/default management, valuation and Swagger remain separate work.

**Scope:** 36 implementation tasks: **7 to do**, **2 in progress**, **0 blocked**, **27 done**. Planning activities completed below do not count as implemented features.

Each task links to its detailed description, source PRD, decision IDs, dependencies, and acceptance tests. The Angular-style, one-intention-per-commit rule and local Git workflow in [D-021](DECISIONS.md#d-021) and [D-022](DECISIONS.md#d-022) apply to every task. A task moves to **Done** only when its acceptance criteria are verified and the PRD, decisions, diagrams, API documentation, and handover are updated as needed.

## To do

### Git setup — [PRD-01](prd/PRD-01-platform.md)

See the In progress and Done sections for Git setup.

### Platform — [PRD-01](prd/PRD-01-platform.md)

See Done for the verified platform foundation.

### Journal and money — [PRD-02](prd/PRD-02-journal.md)

See Done for the verified money/journal core.

### Accounts and wallets — [PRD-03](prd/PRD-03-accounts.md)

- [ ] [T03-02](tasks/TASKS-03.md#t03-02) — Fiat wallets and default-currency management.
- [ ] [T03-03](tasks/TASKS-03.md#t03-03) — Balance views and approximate USD total.

### Deposits — [PRD-04](prd/PRD-04-deposits.md)

See Done for the service and In progress for the connected flow's remaining Swagger acceptance.

### Withdrawals — [PRD-05](prd/PRD-05-withdrawals.md)

See Done for the protected service and In progress for remaining Swagger acceptance.

### FX rates and quotes — [PRD-06](prd/PRD-06-rates.md)

See Done for reference metadata and the verified server-owned quote backend.

### Conversion — [PRD-07](prd/PRD-07-conversion.md)


### Transfers — [PRD-08](prd/PRD-08-transfers.md)


### History — [PRD-09](prd/PRD-09-history.md)


### HTTP API — [PRD-10](prd/PRD-10-api.md)

- [ ] [T10-03](tasks/TASKS-10.md#t10-03) — OpenAPI generation, Swagger UI, and contract tests.

### Interface — [PRD-11](prd/PRD-11-interface.md)

See Done for the approved direction and verified interface-preview foundation.

- [ ] [T11-03](tasks/TASKS-11.md#t11-03) — Accessibility, motion, and design review.

### Verification and handover — [PRD-12](prd/PRD-12-quality.md)

- [ ] [T12-01](tasks/TASKS-12.md#t12-01) — Critical Jest unit and integration coverage.
- [ ] [T12-02](tasks/TASKS-12.md#t12-02) — Playwright end-to-end journeys.
- [ ] [T12-03](tasks/TASKS-12.md#t12-03) — Operational verification and complete handover.

## In progress

- [ ] [T04-02](tasks/TASKS-04.md#t04-02) — Deposit confirmation/recovery journey implemented; Swagger UI acceptance remains pending T10-03.
- [ ] [T05-02](tasks/TASKS-05.md#t05-02) — Withdrawal confirmation/recovery journey implemented; Swagger UI acceptance remains pending T10-03.

## Blocked

_No task is currently blocked by an explicit unresolved decision or external blocker._

## Done — implementation tasks

- [x] [T00-01](tasks/TASKS-00.md#t00-01) — Local Git initialized on `main`; targeted ignores verified.
- [x] [T00-02](tasks/TASKS-00.md#t00-02) — Baseline separated by intention; checksum-verified skill restoration and corruption rejection tested.
- [x] [T01-01](tasks/TASKS-01.md#t01-01) — Node 26/non-root Compose image, npm access, and all named volumes verified across recreation.
- [x] [T01-02](tasks/TASKS-01.md#t01-02) — Verified Next.js scaffold, component tooling, local checks, Jest/Playwright smoke tests, clean install, and build.
- [x] [T01-03](tasks/TASKS-01.md#t01-03) — SQLite connection, repeatable metadata migration, isolated tests, rollback, and service-recreation persistence verified.
- [x] [T02-01](tasks/TASKS-02.md#t02-01) — Exact bigint parsing/formatting, bounded rational half-up FX, pinned accounting precision, and 437 regression tests.
- [x] [T02-02](tasks/TASKS-02.md#t02-02) — Immutable journal schema, exact streamed bigint balances, wallet isolation, and consistent account snapshots.
- [x] [T02-03](tasks/TASKS-02.md#t02-03) — Immediate serialized writes, atomic account/wallet/accounting rollback, independent-connection spending tests, and technical-success integration seam.
- [x] [T11-01](tasks/TASKS-11.md#t11-01) — User-confirmed product context, code-first workflow, and approved reference-led frosted wallet direction.
- [x] [T11-02](tasks/TASKS-11.md#t11-02) — Frosted responsive preview shell, registry-derived money-form inputs/selects, themes, skeleton/state coverage, and extracted design system; 557 Jest and 24 production Chromium tests pass.
- [x] [T11-04](tasks/TASKS-11.md#t11-04) — Two-column overview, draft-preserving popup workflows, icon tooltips, consistent shadcn utilities, critique corrections, refreshed design system, and scoped review; 562 Jest / 33 production Chromium checks pass.
- [x] [T11-05](tasks/TASKS-11.md#t11-05) — CocoWallet full/inverse/icon SVG assets; self-contained vectors, XML/browser checks, and light/dark/small-size inspection. No automatic app integration.
- [x] [T11-06](tasks/TASKS-11.md#t11-06) — Applied CocoWallet branding and continuous, reduced-motion-aware interaction transitions; 572 Jest / 38 production Chromium tests, scoped fix verdict, and current design notes.
- [x] [T11-07](tasks/TASKS-11.md#t11-07) — Currency flags, gradient balance/history card and larger icon-led headings; 648 Jest / 41 production Chromium tests, scoped ship verdict and warning-free development.
- [x] [T03-01](tasks/TASKS-03.md#t03-01) — Persistent main-account setup, account/wallet read APIs and journal-backed overview; 723 Jest / 43 production Chromium checks, review fixes verified, backup and repeatable seed confirmed.
- [x] [T10-02](tasks/TASKS-10.md#t10-02) — Durable UUID retry outcomes, indefinite retention, atomic success, stable business errors, concurrency and same-key recovery for implemented funding contracts; see [FUNDING.md](FUNDING.md).
- [x] [T04-01](tasks/TASKS-04.md#t04-01) — Exact simulated deposit service, main-only credit, atomic result/journal writes and rollback/duplicate tests.
- [x] [T05-01](tasks/TASKS-05.md#t05-01) — Protected simulated debit, serialized funds check, no overspend and definitive error replay outside history.
- [x] [T06-01](tasks/TASKS-06.md#t06-01) — Fresh-first eligible fiat catalog, exact CSV rates and persistent bounded fallback; 867 Jest / 51 production Chromium checks, isolated live smoke and unchanged runtime records verified.
- [x] [T06-02](tasks/TASKS-06.md#t06-02) — Immutable full-minute quote previews/readback, exact binding and internal atomic single-success use; 926 Jest / 53 production Chromium checks, repeated backed-up migration and stable development verified. Submission/UI remain T07/T08.
- [x] [T07-01](tasks/TASKS-07.md#t07-01) — Internal atomic conversion, target creation, exact quote use and retained original-result replay/global money-key ownership; 968 Jest / 53 production Chromium checks, repeated backed-up migration and stable development verified. Submission/UI remain T07-02.
- [x] [T07-02](tasks/TASKS-07.md#t07-02) — Documented conversion endpoint, reviewed quote/expiry/reconfirmation, shared original-key recovery, exact receipts and refreshed balances/bounded history; 995 Jest / 63 production Chromium checks. Visual design/runtime data preserved; transfers remain disabled.
- [x] [T08-01](tasks/TASKS-08.md#t08-01) — Internal atomic same/FX transfers, recipient/wallet creation and globally retained original receipts/errors; 1,114 Jest / 63 production Chromium checks, repeated backed-up migration 0007 and stable development verified. No transfer endpoint/UI submission.
- [x] [T10-01](tasks/TASKS-10.md#t10-01) — Shared runtime/schema contracts, exact JSON/Problem Details, bounded direct-origin write policy and thin monetary adapters; 1,228 Jest / 63 production Chromium checks, unchanged runtime and stable development verified. Generator/Swagger and future endpoints remain separate tasks.
- [x] [T09-01](tasks/TASKS-09.md#t09-01) — Account-scoped completed history/detail GETs, either-side currency/UTC-day filters, numbered pages and snapshot counts, exact facts without balances/keys; 1,353 Jest / 65 production Chromium checks. Runtime unchanged and development stable; no transfer submission or full-history UI wiring.
- [x] [T08-02](tasks/TASKS-08.md#t08-02) — Reviewed transfer POST/UI, exact arbitrary IDs/defaults/target overrides, no-FX or expiring FX terms, shared legacy-slot recovery and inspect-only incoming recent activity; 1,416 Jest / 78 production Chromium checks. Visual identity/runtime data preserved, stable development and bounded ship review verified.
- [x] [T09-02](tasks/TASKS-09.md#t09-02) — User-approved in-panel full history, explicit UTC/type/either-currency filters, numbered pages, exact scoped details/back focus, privacy and read-only recovery; 1,455 Jest / 89 production Chromium checks. Accessible-summary review fix resolved, visual identity/runtime data preserved and development stable.

## Done — planning only

- [x] **PL-01:** Captured the agreed stack and product decisions in the [decision register](DECISIONS.md) ([D-001](DECISIONS.md#d-001)–[D-022](DECISIONS.md#d-022)).
- [x] **PL-02:** Installed and verified Impeccable project-locally, without automatic hooks ([D-014](DECISIONS.md#d-014)). Product/direction confirmation and shell implementation are tracked separately under [T11-01](tasks/TASKS-11.md#t11-01) and [T11-02](tasks/TASKS-11.md#t11-02).
- [x] **PL-03:** Moved planning documentation to `artifact/` and drafted feature PRDs, traceable tasks, diagrams, and this board ([D-020](DECISIONS.md#d-020)). These drafts do not count as completed app functionality.

## Board maintenance

Move a task's link between sections and update its `Status` in the detailed task file in the same change. Record evidence and actual test commands when closing it. Update the counts above and the [handover](HANDOVER.md). Unstarted prerequisite tasks may remain in **To do**; **Blocked** is reserved for an explicit unresolved decision or external blocker.
