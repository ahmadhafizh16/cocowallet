# Tasks 11 — Interface and design workflow

**Feature PRD:** [PRD-11](../prd/PRD-11-interface.md).  
**Related diagram:** [Business operations](../DIAGRAMS.md#business-operations-and-history).  
Status is mirrored in [KANBAN.md](../KANBAN.md).

### T11-01

**Impeccable product context and design direction**  
**Status:** Done. Product context, code-first workflow, and the reference-led frosted wallet direction are user-confirmed. Approval and the bounded design brief are recorded in [DESIGN_REFERENCE.md](../DESIGN_REFERENCE.md); shell implementation is tracked separately under T11-02.

**Decisions:** [D-013](../DECISIONS.md#d-013), [D-014](../DECISIONS.md#d-014), [D-020](../DECISIONS.md#d-020).  
**Depends on:** None; coordinate with [T01-02](TASKS-01.md#t01-02) before UI implementation.  
**Implementation:** Run the skill's initialization workflow with the user, review the resulting `PRODUCT.md`, and develop a suitable operate-mode fintech direction. Preserve all agreed simulation, read-only, theme, and accessibility constraints. Do not assume a pre-existing design system.

**Progress:** Init ran the context launcher once and reviewed repository evidence. The user confirmed local demo/evaluation use, the existing agreed product/interface requirements, and code-first. [PRODUCT.md](../../PRODUCT.md) captures the confirmed record, implementation boundaries, and open questions; `.impeccable/config.json` stores the workflow choice. Initialization itself did not create UI or final design tokens. Live-picker setup has not been enabled automatically.

**Reference approval:** The user supplied a frosted pale-blue banking dashboard, chose to adapt it to our wallet scope rather than lock Atlas, then approved the resulting Impeccable sketch with “yes, this is good”. It shows desktop/mobile and light/dark views, labelled Lucide icons, and illustrative data. See the [approved brief and sketch record](../DESIGN_REFERENCE.md). This was direction approval, not completion of the shell or connected financial flows.

**Acceptance and tests:** The user has reviewed the captured product context and an agreed direction exists before UI coding. Keep any skill-required root context files where the skill discovers them; keep project PRDs/decisions/tasks in `artifact/` per D-020.

**Verification:** Explicit product and direction confirmation; Chromium sketch checks at desktop, tablet, and mobile sizes and both themes; documentation-link/task-status validation and formatting checks. This is planning acceptance, not a production UI/accessibility verdict.

### T11-02

**Responsive app shell, theme, and component foundation**  
**Status:** Done. The approved frosted shell, responsive navigation, themes, shared controls, matching skeletons, and honest empty/error/validation/review states are implemented and verified. The built design system is captured in [DESIGN.md](../../DESIGN.md) and `.impeccable/design.json`. See [the interface record](../UI_FOUNDATION.md) and [review evidence](../DESIGN_REVIEW.md).

**Decisions:** [D-003](../DECISIONS.md#d-003), [D-013](../DECISIONS.md#d-013), [D-014](../DECISIONS.md#d-014), [D-015](../DECISIONS.md#d-015).  
**Depends on:** [T01-02](TASKS-01.md#t01-02), [T11-01](#t11-01).  
**Implementation:** Assemble a coherent app shell and reusable shadcn/ui components with Lucide icons, responsive navigation, account switching, and light/dark themes following system preference. Define design tokens and component states from the reviewed Impeccable direction.

**Acceptance and tests:** Verify keyboard focus, labels, responsive navigation, theme switching, and destination inspect-only indication. No Icons8 MCP, paid icon package, or fabricated payment branding is required. Feature-specific forms remain in their own tasks.

**Verification:** `docker compose run --rm app npm run check` passed formatting,
lint, types, **557 Jest tests**, artifact validation, and production build. Against
that build, **24 Chromium tests** passed; coverage includes 320–1440px layouts,
themes/storage fallback, keyboard entry, field/review focus, preserved drafts,
privacy, and no financial submission. React fixtures verify destination isolation
and inspect-only presentation. The baseline detector returned `[]`; rendered desktop,
tablet, mobile, dark, loading, error, review, and validation states were inspected.
The independent reviewer required one mobile navigation correction, then scored
that finding resolved with disposition `ship` at fix-list scope. Design-document
checks cover YAML/JSON structure, source values, token references, and the version-2
sidecar. The form-control follow-up adds registry-derived Input/Select components
and keyboard/typeahead/menu-fit checks. Its detector advisories and targeted visual
review are recorded separately from the baseline verdict. Commands and limitations
are recorded in the linked implementation/review documents.

**Boundary:** The shipped model is explicitly presentation-only; it neither seeds
nor queries wallet data. Final money submission is disabled until server services
and idempotency are integrated. This closes the shell foundation, not the connected
feature tasks or T11-03's cross-feature accessibility acceptance.

### T11-03

**Accessibility, motion, and design review**  
**Status:** To do.  
**Decisions:** [D-013](../DECISIONS.md#d-013), [D-014](../DECISIONS.md#d-014), [D-016](../DECISIONS.md#d-016).  
**Depends on:** [T11-02](#t11-02), [T04-02](TASKS-04.md#t04-02), [T05-02](TASKS-05.md#t05-02), [T07-02](TASKS-07.md#t07-02), [T08-02](TASKS-08.md#t08-02), [T09-02](TASKS-09.md#t09-02).  
**Implementation:** Audit the finished UI for semantic structure, focus order, contrast, narrow layouts, light/dark states, clear loading/empty/errors, and reduced-motion behavior. Since no automatic Impeccable hook is installed, follow the skill's manual detector guidance after UI changes and inspect rendered screens.

**Acceptance and tests:** User journeys are keyboard operable and readable at representative screen sizes and both themes; reduced motion is respected; findings and limitations are recorded and fixed or explicitly tracked. Detector results are not presented as a substitute for visual or browser testing.

### T11-04

**Two-column redesign and consistent shadcn interactions**

**Status:** Done. The user-approved [two-column/dialog redesign](../WALLET_REDESIGN.md), shadcn-control consistency, production verification, independent fix-list verdict, and refreshed design documentation are complete.

**Decisions:** [D-013](../DECISIONS.md#d-013), [D-014](../DECISIONS.md#d-014), [D-025](../DECISIONS.md#d-025).

**Depends on:** [T11-02](#t11-02).

**Implementation:** Replace the persistent form column with draft-preserving money dialogs, simplify the overview to two columns, add icon tooltips and coherent registry-derived shadcn controls, refine light/dark hierarchy, and correct the critique's conversion/validation issues. Keep all accounting and disconnected-service boundaries.

**Acceptance and tests:** Follow the brief's viewport, state, keyboard/focus,
privacy, isolation and no-financial-request checks; update skeletons; run Docker
and production-browser verification; complete independent finish review and
reconcile design/handover documents. Do not close future connected feature tasks.

**Verification:** Full Docker check and optimized build pass with
562 Jest tests; 33 production Chromium tests cover the new layout, named dialogs,
focus/keyboard behavior, retained drafts, menus/filter, validation, privacy,
no financial submission, and 320–1769px viewports. Independent review inspected
all 24 captures and found no demonstrated material visual gap, but returned
`fix` for inaccurate seed provenance and stale design documentation. Both fixes
were scored **resolved** by the same reviewer, with `disposition: ship` at
fix-list scope. The user-selected Refresh reconciles DESIGN.md and its sidecar;
handover/PRDs/diagrams reflect the implementation. See [DESIGN_REVIEW.md](../DESIGN_REVIEW.md)
for limitations; connected features and T11-03 remain open.

### T11-05

**CocoWallet SVG logo assets**

**Status:** Done. The requested full logo, dark-background variant and standalone
icon are delivered under `public/brand/`; app integration remains outside this
asset-only request.

**Decisions:** [D-013](../DECISIONS.md#d-013), [D-026](../DECISIONS.md#d-026).

**Depends on:** [T11-04](#t11-04).

**Implementation:** Create transparent, scalable, accessible SVGs using the
established palette and the user-supplied name, without external font or raster
dependencies. No app or database code changed.

**Acceptance and tests:** Verify XML structure/browser decoding and inspect the
full logo on light/dark plus small-icon sizes. All checks pass; provenance and
scope are recorded in [BRANDING.md](../BRANDING.md).
