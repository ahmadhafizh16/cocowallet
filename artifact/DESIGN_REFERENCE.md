# Reference-led wallet sketch

**Status:** Historical approval record for [T11-01](tasks/TASKS-11.md#t11-01).
After reviewing the adapted sketch, the user confirmed: “yes, this is good”.
That approval established the reference-led direction, not application implementation
or production readiness. The previous Atlas proposal was not locked. The user
supplied a pale-blue frosted banking dashboard and chose to adapt its visual
treatment to our actual wallet features.
Related requirements: [PRD-11](prd/PRD-11-interface.md),
[D-013](DECISIONS.md#d-013), and [PRODUCT.md](../PRODUCT.md).

## Breakdown of the supplied reference

- **Composition:** a slim left navigation rail; three asymmetric work columns;
  balance and activity left, supporting information middle, transfer panel right.
- **Material:** pale blue-grey ground, a diffuse navy light field behind the top,
  translucent white panels, fine bright borders, broad rounded corners, and
  offset soft shadows. Circular controls have a gently raised treatment.
- **Hierarchy:** large light-weight monetary figures, restrained sans-serif UI,
  small section headings, spacious panel interiors, and compact activity rows.
- **Accent:** muted navy for the primary action, selected navigation, and one
  account object. Most other surfaces stay pale; green is reserved for incoming
  transaction meaning rather than decorative growth claims.
- **What needs improvement:** the supplied reference has faint supporting copy
  and icon-only navigation. The sketch uses darker foregrounds and visible
  navigation/action labels, with Lucide-derived SVG icons.

## Confirmed design brief

- **Job:** let a local-demo user understand exact currency balances, inspect
  completed activity, and enter the four simulated money workflows confidently.
- **Direction:** retain the approved pale-blue frosted surfaces, diffuse navy
  backdrop, rounded panels, raised circular controls, restrained sans-serif type,
  and visible Lucide labels. Do not revert to the earlier flat Atlas proposal.
- **Composition:** balances/actions and activity left; currency information and
  conversion middle; transfer workspace and simulated account identity right.
  Preserve the sketch's responsive stacking and light/dark character.
- **Boundaries:** illustrative values are not seed data. No bills, payment cards,
  real banking, extra brand identity, or settled answers to open product questions
  follow from this visual approval. Production first-run balances remain zero.
- **Agreed sequence:** implement the responsive shell under T11-02, then integrate
  real feature flows. Produce the final token-bearing `DESIGN.md` from the built,
  visually reviewed interface, not from an unimplemented rulebook.

## Adaptation, not extra banking scope

| Reference region | Wallet sketch |
| --- | --- |
| Available balance and quick actions | Approximate USD total; Deposit, Withdraw, Convert, Transfer |
| Revenue and expense tiles | Currency-wallet count and default currency |
| Earnings activity | Exact per-currency balances for USD, EUR, GBP |
| Upcoming bills | Source-to-target conversion preview with an illustrative rate |
| Send money | Simulated destination, source amount, recipient amount, no fee, review action |
| Credit card | Simulated account ID/default, explicitly not a payment card |
| People and banking identity | Fictional provider labels and simulated account IDs; no invented people |

The populated amounts, history, account ID, and rates are labelled example data.
They are not read from or written to the application database. Quote-date/cache/
expiry confirmation remains part of the planned full conversion journey, not a
claim that the small illustrative panel is a usable quote.

## Sketch and checks

The isolated, self-contained HTML sketch is stored at
`.impeccable/mocks/decision/wallet-frosted-reference.html` and presented through
Impeccable's local decision page. Runtime sketches/review screenshots remain
Git-ignored by the established tooling policy; this note records the approval.
The approved HTML's SHA-256 is
`a1dc740678fd0876c5565098e57c898b5b0c422565d6a0088a4579c76f2ebad8`.
Preserve it as the local visual reference; future alternatives need separate files.
No `src/` files, production styles, routes, money, or database state were changed
by that sketch-planning stage. The later interface implementation is recorded in
[UI_FOUNDATION.md](UI_FOUNDATION.md) and [DESIGN_REVIEW.md](DESIGN_REVIEW.md), with
actual visual tokens in [DESIGN.md](../DESIGN.md).

- Desktop retains the three-column composition; tablet uses two columns; mobile
  stacks the workspaces and moves labelled navigation to the bottom.
- Light/dark preview switching, balance visibility, section navigation, and
  editable illustrative transfer input are available to evaluate the sketch.
- Planned actions show a preview-only explanation; they never claim success or
  change money. Selecting destination inspection explains that this single-screen
  sketch contains only main-account sample data, rather than relabelling it.
- Chromium captures checked at 1440px desktop/light and desktop/dark, 820px tablet,
  and 390px mobile: no horizontal page overflow or JavaScript errors. Theme,
  balance visibility, currency-change/FX notice, review notice, and inspection
  boundary were exercised. No production accessibility certification is implied.

**Approval boundary:** no application UI or final design tokens were created by
the planning approval itself. T11-02 separately implements and verifies the shell;
connected feature tasks retain their own implementation and acceptance requirements.
