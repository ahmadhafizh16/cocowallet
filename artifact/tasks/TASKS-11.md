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

### T11-06

**Apply CocoWallet branding and smooth interaction motion**

**Status:** Done. Applied branding, bounded motion, interruption continuity,
production verification and design/handover reconciliation are complete.

**Decisions:** [D-013](../DECISIONS.md#d-013), [D-025](../DECISIONS.md#d-025), [D-026](../DECISIONS.md#d-026), [D-027](../DECISIONS.md#d-027).

**Depends on:** [T11-04](#t11-04), [T11-05](#t11-05).

**Implementation:** Apply the approved SVG branding consistently and implement
the bounded, dependency-free [motion thesis](../MOTION.md), without changing
layout, accounting or disconnected-service safeguards.

**Acceptance and tests:** Follow the motion brief's branding, viewport,
interruption, focus, keyboard, draft, theme, privacy, reduced-motion and stable
development checks; run Docker/production-browser verification and reconcile
current design/review/handover evidence before closure.

**Verification:** Full Docker check, optimized build, **572 Jest tests** and
**38 production Chromium tests** pass. The independent implementation reviewer
found one interrupted-arrival snap; a shared event-bound snapshot controller
corrects it without a per-frame loop. The same reviewer scored that fix resolved
and returned `ship` at fix-list scope. Production frame comparisons cover dialog,
scrim, DropdownMenu and Select; six unit cases cover snapshot/state semantics.
Design notes preserve palette/primitives while documenting branding, timing,
reduced motion and interruption behavior. See [MOTION.md](../MOTION.md) and
[DESIGN_REVIEW.md](../DESIGN_REVIEW.md) for scope and limits. No connected task or
broader accessibility/performance certification is closed here.

### T11-07

**Currency flags and gradient balance-history card**

**Status:** Done. Includes the user's follow-up on larger card headings and
recognizable visual cues.

**Decisions:** [D-025](../DECISIONS.md#d-025), [D-027](../DECISIONS.md#d-027), [D-028](../DECISIONS.md#d-028).

**Depends on:** [T11-06](#t11-06).

**Implementation:** Apply the [balance-card brief](../BALANCE_CARD.md): vector
currency flags, theme-independent navy gradient, clear Deposit hierarchy, truthful
recorded-history presentation, privacy and matching loading geometry. Incorporate
the user's follow-up: larger, semibold card headings and purpose-specific icons.

**Acceptance and tests:** Verify the brief's themes, responsive geometry, contrast,
missing/empty/invalid/private/data states, exact bounds and account isolation;
repeat Docker and production-browser checks, inspect rendered captures, reconcile
design/handover records and restore stable development before closure.

**Verification:** Full Docker check and production build pass **648 Jest tests**;
all **41 production Chromium checks** pass. Seventy chart cases, five flag tests
and expanded dashboard coverage retain exactness, truthfulness, account isolation
and privacy. Browser coverage includes heading size/weight/icons, both themes,
five card widths, contrast, forced colors and labelled test-only chart fixtures.
The independent bounded reviewer returned `ship`, then confirmed deterministic
EU star coordinates preserve that verdict after a development hydration warning
was corrected. No recorded history or financial service is fabricated/connected.
Source-matched design notes, 49-document/36-task validation and a 300-frame
interactive development probe with zero reloads/browser/console errors pass.

### T11-08

**Interview-ready wallet presentation and History page**

**Status:** Done. Requested presentation, review corrections, affected design documentation and restored-development verification are complete.

**Decisions:** [D-035](../DECISIONS.md#d-035), [D-036](../DECISIONS.md#d-036).

**Depends on:** [T09-02](TASKS-09.md#t09-02), [T11-07](#t11-07).

**Implementation:** Follow the user's screenshot-led
[presentation brief](../PRESENTATION_REFINEMENT.md): signed green-credit/red-debit
recent rows, concise checkmark successes without technical keys, discreet prototype
disclosure, persistent-shell `/history` navigation, compact recorded-USD sparkline
and tighter wallet rows. Preserve account isolation, exact money, drafts/recovery,
privacy, themes, motion and accessible controls.

**Acceptance and tests:** Verify each requested state at mobile/intermediate/wide
sizes and both themes, all transaction types, successful/recovery/privacy flows,
History routing/back/focus and draft preservation. Run Docker/Jest/isolated browser
checks, inspect current captures, obtain the finish review, update documentation,
preserve user financial data and restore healthy development before closure.

**Verified:** Full Docker check/build passes 1,507 Jest / 99 isolated production
Chromium checks. The same independent reviewer scored all four material fixes
resolved, `ship` at fix-list scope; see [DESIGN_REVIEW.md](../DESIGN_REVIEW.md).
The user approved affected-section DESIGN.md/sidecar refresh, preserving core
tokens. Normal development passed 300 stable frames with exact actual total,
two-record History, privacy/draft navigation and no financial POSTs or errors;
existing user financial data remains unchanged. See
[PRESENTATION_REFINEMENT.md](../PRESENTATION_REFINEMENT.md) for limits and evidence.
