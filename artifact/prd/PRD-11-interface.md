# PRD-11 — Interface, design system, and accessibility

**Status:** The frosted two-column wallet now connects reviewed money flows, History and USD valuation. D-035/D-036 refine compact signed recent rows, concise confirmed-success checkmarks, a small recorded-total sparkline and tighter wallet rows without replacing the visual identity. See [PRESENTATION_REFINEMENT.md](../PRESENTATION_REFINEMENT.md) and [DESIGN_REVIEW.md](../DESIGN_REVIEW.md). Complete cross-feature accessibility acceptance remains separate work; the interface-first evidence below is historical.

**Decisions:** [D-003](../DECISIONS.md#d-003), [D-011](../DECISIONS.md#d-011), [D-013](../DECISIONS.md#d-013), [D-014](../DECISIONS.md#d-014), [D-016](../DECISIONS.md#d-016), [D-025](../DECISIONS.md#d-025), [D-027](../DECISIONS.md#d-027).

**Tasks:** [T11-01–T11-08](../tasks/TASKS-11.md).

**Diagram:** [Business operations and history](../DIAGRAMS.md#business-operations-and-history).

## Outcome and user story

As the user, I can understand my balances and perform the simulated wallet workflows on a responsive, accessible, modern fintech interface without mistaking the simulation for real payment processing.

## Requirements

The user-supplied app name is **CocoWallet**. The user approved applying its SVG
logo and smooth interaction transitions; current integration and motion budgets
are recorded in [BRANDING.md](../BRANDING.md) and [MOTION.md](../MOTION.md).
The subsequent [D-028](../DECISIONS.md#d-028) refinement adds currency flags,
a shared-theme navy-gradient balance card, truthful recorded-history presentation,
and larger icon-led card headings. See [BALANCE_CARD.md](../BALANCE_CARD.md).

1. Initialize Impeccable with product context and review the resulting `PRODUCT.md` before designing a new interface. Follow the skill's applicable workflow; do not invent a design system or claim design work has been done.
2. Use registry-derived shadcn/ui foundations and Lucide React, with light/dark themes respecting system preference. Preserve pale-blue glass, navy accents, soft shadows, and rounded panels. Per D-025, use a two-column overview, accessible desktop icon tooltips, labelled mobile navigation, and draft-preserving dialogs for Send money, Deposit, Withdraw, and Convert. Theme/account menus and history filters must be themed shadcn/Radix controls, not native-looking utility selects.
3. Provide clear entry points for account switching, balances, funding, conversion, transfers, history, and transaction details. Destination account views are visibly inspect-only.
4. Support semantic labels, keyboard navigation, visible focus, readable contrast, mobile layouts, and loading/empty/error/confirmation states. Use purposeful smooth transitions and honor reduced-motion preferences.
5. Label simulated providers and transfers clearly. FX previews show the reference date, cached status if relevant, and quote validity; never call reference rates streaming/live market rates.
6. Impeccable was installed without an automatic hook. Follow its manual detector instruction after UI changes and perform visual review at representative sizes and themes.
7. D-035 moves full History to `/history` through the existing navigation; preserve account/privacy/money drafts in the shared shell. Remove the large connection alert/demo badge; retain one discreet **Prototype · Local ledger only. No real funds move.** footer. Confirmed successes contain a green check and exact concise summary, not retry keys/debug tables. Recovery/error guidance retains original-key safeguards.
8. D-036 places a recorded USD-total sparkline next to the balance with actions below. Show only actual observations; hide values/history under privacy. Independent destination valuation never enables destination money actions.

## Acceptance criteria

- A user can navigate the main tasks on desktop and a narrow screen without losing access to controls or labels.
- Account switching makes read-only destination status obvious; money-moving controls cannot operate from it.
- Light/dark themes remain readable, keyboard focus is visible, and reduced-motion preferences avoid unnecessary animation.
- Loading, empty, validation, insufficient-funds, rate-unavailable, quote-expired, and success states communicate the appropriate next step.
- Impeccable product context and a chosen visual direction are reviewed before design implementation; after implementation, run applicable detector and visual checks.

## Tests and open items

Coordinate with each feature PRD for actual form behavior. Test accessible names and focus, theme switching, reduced motion, narrow layouts, and error states. D-036 resolves destination USD-total display as independent/read-only; [O-004](../DECISIONS.md#o-004)'s main-default/missing-wallet behavior and [O-005](../DECISIONS.md#o-005)'s remaining operational ambiguities stay separate.

Current application evidence: **867 Jest tests and 51 production Chromium checks**
pass, including dialog focus/drafts, keyboard menus, utility controls, privacy,
validation, 320–1769px layouts, actual animation lifecycle, interruption, and
reduced-motion paths. This is not comprehensive WCAG certification.
Additional checks cover gradient text/control/focus contrast, larger heading
geometry, flags, forced colors, exact history bounds, account isolation and privacy.
No final financial submission, populated history, server quote, quote expiry, or
server-confirmed success is claimed by this interface-first checkpoint.
