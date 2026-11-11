# Wallet shell design review

## T11-04 — two-column redesign (current)

**Scope:** User-approved [two-column/dialog redesign](WALLET_REDESIGN.md), retaining
the frosted identity. Code-led Operate surface, explicitly pinned by the user;
the old sketch is material evidence, not a current topology specification.
Connected financial journeys and comprehensive WCAG acceptance remain outside
this review.

### Production evidence

- The preceding light/dark screenshot critique scored the former interface
  **23/40** and identified conflicting conversion context, stale dependent errors,
  excessive hierarchy, repeated preview notices, and weak supporting type. Its
  local archive is `.impeccable/critique/2026-11-11T12-20-32Z__src-features-wallet-dashboard-tsx.md`.
  That score is historical, not a score for the redesign.
- Full Docker check: formatting, ESLint, TypeScript, artifact validation,
  **562 Jest tests**, and optimized build. **33 Chromium tests** pass against
  that build (2 foundation, 17 interaction, 12 shell, 2 visual).
- 24 current captures under `.impeccable/review/`: `desktop.png`, `dark.png`,
  `user-1688.png`, `user-1769.png`, `tablet.png`, `tablet-dark.png`, `mobile.png`,
  `mobile-viewport.png`, `mobile-dark.png`, `narrow.png`, `deposit.png`,
  `deposit-review.png`, `account-menu.png`, `theme-menu.png`, `history-menu.png`,
  `convert-invalid-dark.png`, `currency-menu-dark.png`, `mobile-actions-dark.png`,
  `send-mobile-dark.png`, `loading.png`, `loading-mobile.png`, `loading-dark.png`,
  `error.png`, and `error-mobile.png`. These replace similarly named historical
  runtime files; old verdicts below do not apply to these new images.
- Screenshots use the production browser and real compiled CSS. Loading/error
  captures render the actual components independently; they are not evidence of
  induced network failures. Full-page mobile images show fixed navigation at
  its original viewport position; content remains scrollable with bottom clearance.
- One manual detector pass returned **22 advisory inventory findings**, all
  `design-system-color`, `design-system-radius`, or `design-system-font-size`
  mismatches against the old DESIGN.md. No non-advisory finding was returned.
  These are not 22 demonstrated UX defects or a contrast certification.
- Parent inspection corrected a global margin reset overriding utility spacing;
  production check/build and all 33 browser tests were repeated afterward.

### Independent review and material fixes

A fresh designer-agent substituted for the unavailable shipped finish-reviewer,
following the Impeccable finish protocol. It inspected all 24 captures as valid
and sampled source without browser/build/edit access. Some small presentation
primitives and E2E source were unread; keyboard behavior is supported separately
by production-browser checks, not inferred from screenshots.

**Initial disposition: `fix`.** Type, material, ground, two-column thesis,
navigation/first viewport, protected workflows, themed utility controls, and
product truth matched the approved contract. No material visual shortfall was
demonstrated. Two persistence findings remained:

1. The brief's `seed: none (unavailable)` provenance claim was inaccurate. The
   machine supports retained seeds; no roll was needed because the user explicitly
   pinned the direction. Both briefs now document that exception and withdraw
   the unavailable claim. No seed or random approval was fabricated; no redesign
   was required.
2. DESIGN.md and its component sidecar still described the former system. The
   user chose **Refresh** after seeing the existing file and stale examples.
   The refreshed DESIGN.md/sidecar now describe 38 exact theme colors, current
   type/radius rules, actual responsive boundaries, Radix utilities and dialogs,
   with 20 component-token entries and 10 standalone visual examples. The
   documenter checked source values, YAML/JSON structure, canonical sections,
   references, links, preview syntax/scoping/fallbacks, narrative and ramp math.

### Verdict

The same independent reviewer scored **both fixes resolved**, found no material
documentation regression, and returned **`disposition: ship`**. This verdict
covers the scored persistence fixes, not a new whole-surface certification.
Documentation-only fixes required no recapture; app source is unchanged since
the successful production check and 33-browser-test run. T11-04 is closed;
connected flows and T11-03's broader accessibility acceptance remain separate.

The original sketch remains unchanged at its recorded SHA-256. There are no
shipping raster assets in this interface; screenshots are nonshipping evidence.

## T11-02 — historical review

**Scope:** The interface-first shell under [T11-02](tasks/TASKS-11.md#t11-02),
not connected financial workflows or a comprehensive accessibility certification.
Visual authority: the user-approved [frosted reference](DESIGN_REFERENCE.md).
Implementation intent: [WALLET_SURFACE.md](WALLET_SURFACE.md).

## Evidence

- Full production desktop, mobile, dark, and tablet captures; mobile first viewport;
  actual loading-component desktop/mobile captures; root error mobile rendering;
  desktop deposit review; and mobile invalid-input workspace.
- Capture paths are `.impeccable/review/desktop.png`, `mobile.png`,
  `mobile-viewport.png`, `dark.png`, `tablet.png`, `loading.png`,
  `loading-mobile.png`, `error-mobile.png`, `deposit-review.png`, and
  `validation-mobile.png`. They are local runtime evidence, not shipping assets.
  The validation image intentionally shows the focused workspace rather than
  claiming to be a document-top capture.
- A fresh design subagent used the Impeccable finish-review protocol, with the
  approved reference captures, product/surface context, screenshots, source, and
  craft-floor instructions. It did not render its own screenshots or edit code.
- The manual detector ran once over changed UI targets and returned `[]`.
  This is mechanical evidence only, not proof of contrast or WCAG completeness.

## Initial review

**Disposition: `fix`.** Typography, material, ground, desktop topology, and the
requested application states matched or were acceptable adaptations. Honest zero/
empty states, unavailable rates, disabled execution, mobile stacking, and tablet
reflow were accepted within this phase's scope.

One material finding remained: the mobile navigation indicated **Transfer** as
current while Deposit, Withdraw, or Convert occupied the inline workspace. That
misstated the user's current task despite keeping the reference's appearance.

The reviewer read the reference captures and primary source, but not every shared
UI primitive, hydration helper, 404 component, or the approved HTML source. Those
limitations remain part of the review record.

## Correction and verdict

The shared workspace navigation is now **Actions**, and selecting it preserves
the chosen workflow instead of resetting it to Transfer. A dedicated 390px
Chromium regression checks all four workflows, current indication, and retained
deposit input. Production captures were refreshed after rebuilding the correction.

The same reviewer scored its sole material fix **resolved**, with no fix-induced
regression observed, and returned **`disposition: ship`**. This verdict covers the
scored fix list; it is not a new whole-surface certification. The initial matrix
had no other material findings. The built system was subsequently extracted into
[DESIGN.md](../DESIGN.md) and `.impeccable/design.json`; later real feature flows
retain their own tests and T11-03 acceptance.

Baseline implementation evidence: full Docker check, **557 Jest tests**, production
build, and **22 Chromium tests** against that build. See
[UI_FOUNDATION.md](UI_FOUNDATION.md) for behavior and integration limits.

## Form-control follow-up

Following the user's feedback about default-looking inputs, the amount editor
now uses the shared registry-derived shadcn Input. Provider/source/target controls
use the registry-derived Radix Select instead of native dropdowns. Theme tokens,
visible borders, focus/error rings, touch sizing, and matching skeletons were
reviewed in a focused parent-agent pass; this is not a new independent whole-page
verdict. The original review above remains historical evidence for its own scope.

Local follow-up evidence: `forms-before.png`, `forms-after.png`, `forms-select.png`,
`forms-error-mobile.png`, and `forms-dark-mobile.png` under `.impeccable/review/`.
These are targeted panel/menu/validation captures, not document-top captures.
The current full check and 24 production Chromium tests include the original
behavior plus keyboard/typeahead, popup fit, focus return, and computed input
boundaries. No financial submission was enabled.

The follow-up detector result is saved as `forms-detector.json`. With the new
DESIGN.md inventory available it reports advisory token-inventory gaps, not a
clean `[]`: existing brand/dialog colors, local radii, and responsive/secondary
type sizes are not all global frontmatter tokens. The new currency prefix is an
intentional local 22px treatment documented in the input guidance. These findings
were reviewed without global palette/type/radius churn or blanket suppression;
no non-advisory detector finding was returned. The earlier empty detector result
belongs to the baseline pass and is not represented as the current result.
