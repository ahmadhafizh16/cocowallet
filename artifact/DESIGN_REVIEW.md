# Wallet shell design review

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
