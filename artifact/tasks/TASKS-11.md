# Tasks 11 — Interface and design workflow

**Feature PRD:** [PRD-11](../prd/PRD-11-interface.md).  
**Related diagram:** [Business operations](../DIAGRAMS.md#business-operations-and-history).  
Status is mirrored in [KANBAN.md](../KANBAN.md).

### T11-01

**Impeccable product context and design direction**  
**Status:** To do. The project-local skill is already installed; initialization has not run.  
**Decisions:** [D-013](../DECISIONS.md#d-013), [D-014](../DECISIONS.md#d-014), [D-020](../DECISIONS.md#d-020).  
**Depends on:** None; coordinate with [T01-02](TASKS-01.md#t01-02) before UI implementation.  
**Implementation:** Run the skill's initialization workflow with the user, review the resulting `PRODUCT.md`, and develop a suitable operate-mode fintech direction. Preserve all agreed simulation, read-only, theme, and accessibility constraints. Do not assume a pre-existing design system.

**Acceptance and tests:** The user has reviewed the captured product context and an agreed direction exists before UI coding. Keep any skill-required root context files where the skill discovers them; keep project PRDs/decisions/tasks in `artifact/` per D-020.

### T11-02

**Responsive app shell, theme, and component foundation**  
**Status:** To do.  
**Decisions:** [D-003](../DECISIONS.md#d-003), [D-013](../DECISIONS.md#d-013), [D-014](../DECISIONS.md#d-014), [D-015](../DECISIONS.md#d-015).  
**Depends on:** [T01-02](TASKS-01.md#t01-02), [T11-01](#t11-01).  
**Implementation:** Assemble a coherent app shell and reusable shadcn/ui components with Lucide icons, responsive navigation, account switching, and light/dark themes following system preference. Define design tokens and component states from the reviewed Impeccable direction.

**Acceptance and tests:** Verify keyboard focus, labels, responsive navigation, theme switching, and destination inspect-only indication. No Icons8 MCP, paid icon package, or fabricated payment branding is required. Feature-specific forms remain in their own tasks.

### T11-03

**Accessibility, motion, and design review**  
**Status:** To do.  
**Decisions:** [D-013](../DECISIONS.md#d-013), [D-014](../DECISIONS.md#d-014), [D-016](../DECISIONS.md#d-016).  
**Depends on:** [T11-02](#t11-02), [T04-02](TASKS-04.md#t04-02), [T05-02](TASKS-05.md#t05-02), [T07-02](TASKS-07.md#t07-02), [T08-02](TASKS-08.md#t08-02), [T09-02](TASKS-09.md#t09-02).  
**Implementation:** Audit the finished UI for semantic structure, focus order, contrast, narrow layouts, light/dark states, clear loading/empty/errors, and reduced-motion behavior. Since no automatic Impeccable hook is installed, follow the skill's manual detector guidance after UI changes and inspect rendered screens.

**Acceptance and tests:** User journeys are keyboard operable and readable at representative screen sizes and both themes; reduced motion is respected; findings and limitations are recorded and fixed or explicitly tracked. Detector results are not presented as a substitute for visual or browser testing.
