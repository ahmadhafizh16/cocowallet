# PRD-11 — Interface, design system, and accessibility

**Status:** Product context and reference-led frosted visual direction are user-approved; T11-01 is complete. See [PRODUCT.md](../../PRODUCT.md) and the [approved sketch brief](../DESIGN_REFERENCE.md). Production UI, final design-system tokens, accessibility review, and working flows remain unimplemented.

**Decisions:** [D-003](../DECISIONS.md#d-003), [D-011](../DECISIONS.md#d-011), [D-013](../DECISIONS.md#d-013), [D-014](../DECISIONS.md#d-014), [D-016](../DECISIONS.md#d-016).  
**Tasks:** [T11-01–T11-03](../tasks/TASKS-11.md).  
**Diagram:** [Business operations and history](../DIAGRAMS.md#business-operations-and-history).

## Outcome and user story

As the user, I can understand my balances and perform the simulated wallet workflows on a responsive, accessible, modern fintech interface without mistaking the simulation for real payment processing.

## Requirements

1. Initialize Impeccable with product context and review the resulting `PRODUCT.md` before designing a new interface. Follow the skill's applicable workflow; do not invent a design system or claim design work has been done.
2. Use shadcn/ui and visibly labelled Lucide React icons, with light/dark themes respecting system preference by default. Follow the approved frosted reference: pale-blue glass, navy accents, soft shadows, rounded panels, and its adapted three-column desktop hierarchy. Final tokens and type details are implementation/review decisions, not permission to replace the approved composition.
3. Provide clear entry points for account switching, balances, funding, conversion, transfers, history, and transaction details. Destination account views are visibly inspect-only.
4. Support semantic labels, keyboard navigation, visible focus, readable contrast, mobile layouts, and loading/empty/error/confirmation states. Use purposeful smooth transitions and honor reduced-motion preferences.
5. Label simulated providers and transfers clearly. FX previews show the reference date, cached status if relevant, and quote validity; never call reference rates streaming/live market rates.
6. Impeccable was installed without an automatic hook. Follow its manual detector instruction after UI changes and perform visual review at representative sizes and themes.

## Acceptance criteria

- A user can navigate the main tasks on desktop and a narrow screen without losing access to controls or labels.
- Account switching makes read-only destination status obvious; money-moving controls cannot operate from it.
- Light/dark themes remain readable, keyboard focus is visible, and reduced-motion preferences avoid unnecessary animation.
- Loading, empty, validation, insufficient-funds, rate-unavailable, quote-expired, and success states communicate the appropriate next step.
- Impeccable product context and a chosen visual direction are reviewed before design implementation; after implementation, run applicable detector and visual checks.

## Tests and open items

Coordinate with each feature PRD for actual form behavior. Test accessible names and focus, theme switching, reduced motion, narrow layouts, and error states. [O-004](../DECISIONS.md#o-004) covers destination USD-total display; [O-005](../DECISIONS.md#o-005) covers operational ambiguities.
