---
name: CocoWallet
description: Frosted wallet — icy-blue glass, softly raised controls, and clear financial UI.
colors:
  ground: "#edf3f7"
  glass: "rgb(255 255 255 / 78%)"
  inner: "rgb(255 255 255 / 55%)"
  solid: "#f7fafc"
  edge: "rgb(255 255 255 / 85%)"
  line: "rgb(74 97 122 / 17%)"
  control-border: "#a6b6c7"
  control-surface: "#f9fbfd"
  ink: "#223349"
  secondary: "#4f6175"
  navy: "#405e87"
  navy-hover: "#314c73"
  on-navy: "#ffffff"
  positive: "#27634f"
  positive-ground: "#dfeee7"
  danger: "#994238"
  danger-ground: "#fae9e5"
  wash: "#b3c6d9"
  wash-deep: "#7b98b6"
  dark-ground: "#101b26"
  dark-glass: "rgb(31 49 66 / 90%)"
  dark-inner: "rgb(68 91 114 / 32%)"
  dark-solid: "#1d3042"
  dark-edge: "rgb(188 207 226 / 16%)"
  dark-line: "rgb(188 207 226 / 20%)"
  dark-control-border: "#63809b"
  dark-control-surface: "#243b50"
  dark-ink: "#edf3fb"
  dark-secondary: "#b4c6d9"
  dark-navy: "#a7c4e9"
  dark-navy-hover: "#c1d7f4"
  dark-on-navy: "#142536"
  dark-positive: "#a8dfc4"
  dark-positive-ground: "#284b43"
  dark-danger: "#ffc4b9"
  dark-danger-ground: "#4c302f"
  dark-wash: "#294a68"
  dark-wash-deep: "#426588"
typography:
  display:
    fontSize: "48px"
    fontWeight: 450
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  headline:
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.025em"
  title:
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.015em"
  body:
    fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  supporting:
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.375
  button:
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "20px"
  amount:
    fontSize: "clamp(32px, 6vw, 48px)"
    fontWeight: 500
    letterSpacing: "-0.025em"
  currency-amount:
    fontSize: "23px"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  dialog-title:
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
rounded:
  panel: "24px"
  panel-mobile: "22px"
  control: "12px"
  notice: "14px"
  option: "4px"
  circle: "50%"
  skeleton: "8px"
spacing:
  field-gap: "8px"
  action-gap: "10px"
  inline-gap: "12px"
  inline-inset: "16px"
  compact-panel-gap: "18px"
  form-group-gap: "20px"
  compact-panel-inset: "22px"
  panel-gap: "24px"
  panel-inset: "26px"
  dialog-inset: "30px"
  shell-gutter: "32px"
components:
  button-primary:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.on-navy}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-primary-dark:
    backgroundColor: "{colors.dark-navy}"
    textColor: "{colors.dark-on-navy}"
  button-success:
    backgroundColor: "{colors.positive}"
    textColor: "{colors.solid}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-success-dark:
    backgroundColor: "{colors.dark-positive}"
    textColor: "{colors.dark-solid}"
  button-secondary:
    backgroundColor: "{colors.inner}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "{colors.control-surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-circle:
    backgroundColor: "{colors.inner}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    padding: "10px"
    size: "44px"
  button-destructive:
    backgroundColor: "{colors.danger-ground}"
    textColor: "{colors.danger}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.navy}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  quick-action:
    backgroundColor: "{colors.inner}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 8px"
  input:
    backgroundColor: "{colors.control-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
    height: "44px"
    width: "100%"
  money-amount-input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.amount}"
    rounded: "0"
    padding: "12px 0 12px 36px"
    height: "100px"
    width: "100%"
  select:
    backgroundColor: "{colors.control-surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
    height: "44px"
    width: "100%"
  wallet-panel:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel-inset}"
  wallet-panel-dark:
    backgroundColor: "{colors.dark-glass}"
    textColor: "{colors.dark-ink}"
  navigation:
    backgroundColor: "transparent"
    textColor: "{colors.secondary}"
    rounded: "{rounded.circle}"
    padding: "12px"
    size: "48px"
  navigation-current:
    textColor: "{colors.navy}"
    backgroundColor: "{colors.solid}"
  badge-secondary:
    backgroundColor: "{colors.inner}"
    textColor: "{colors.ink}"
    padding: "2px 8px"
  skeleton:
    backgroundColor: "{colors.line}"
    rounded: "{rounded.skeleton}"
  dropdown-menu:
    backgroundColor: "{colors.solid}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "4px"
  tooltip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  dialog:
    backgroundColor: "{colors.solid}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.dialog-inset}"
    width: "min(560px, calc(100vw - 32px))"
---

# Design System: CocoWallet

## Overview

**Creative North Star: "Frosted wallet"**

Icy-blue glass sits over a diffuse navy wash. Rounded panels and softly raised controls make the interface tactile without competing with balances, field labels, or review details. The approved reference supplies the material character, not a different banking product or a permanent page topology.

Workhorse system typography, purposeful Lucide icons, and restrained navy accents keep task completion ahead of decoration. Light and dark themes share the same material roles. Simulation notices, unavailable information, and disabled final actions remain legible parts of the composition rather than being disguised as successful financial activity.

The user-requested [balance-card refinement](artifact/BALANCE_CARD.md) adds one opaque navy-gradient anchor, identical in light and dark themes, and locally authored currency flags. The surrounding frosted world remains unchanged. Balance history shows only recorded USD-total observations; when recorded data is absent, show no invented figures or trend.

The later [backend read integration](artifact/BACKEND_READS.md) preserved these visual rules while replacing runtime preview identities/balances with stored journal snapshots. Its connection notices distinguished connected reads from then-unimplemented money/history services. That milestone's deferred visual feedback has resumed under the refinement below; component examples remain illustrative, not database seed data.

The [funding integration](artifact/FUNDING.md) preserves the same visual system.
Existing dialogs now support explicit simulated deposit/withdrawal confirmation,
pending/unknown/result states and immutable original-request recovery. Shared
Buttons, typography and fact-list patterns are reused; no CSS, flags, gradient,
branding or motion changes were introduced. Transfer final actions
remained disabled at that milestone; the later transfer integration connects them.
Ordinary drafts stay in shell memory; only unresolved monetary
intent may use the approved per-tab storage exception in D-030.

The [conversion flow](artifact/CONVERSIONS.md) reuses those same dialog/fact-list
patterns for server quote loading, fixed terms, expiry/reconfirmation and explicit
simulated conversion. Shared submission recovery protects funding/conversion in
one slot. Quote and receipt amounts/rates/timestamps are removed when private;
the quote's original expiry is never extended by reopening the dialog. New fiat
wallets without an approved USD/EUR/GBP flag use a neutral Lucide currency marker,
not another country's flag. No palette, CSS, typography, layout or motion token
changes accompany this connection.

The [presentation refinement](artifact/PRESENTATION_REFINEMENT.md) (D-035/D-036)
keeps this world and its core tokens. A compact recorded-total sparkline sits beside
the amount, with actions below; tighter currency rows and five signed recent rows
improve scanning. Full History is a real `/history` page in the persistent wallet
shell, not an overview section. Confirmed success uses a concise green-check
summary; uncertain outcomes retain recovery. Main and inspect-only destination
totals are independently valued from journal balances with fresh/cached Frankfurter
reference rates. One discreet prototype footer replaces the demo badge and large
connection banner. Missing valuations never fabricate or backfill a trend.

The [workflow refinement](artifact/WORKFLOW_REFINEMENT.md) (D-037) composes the
existing panels into amount-first entry/review, with a square bottom-border amount
editor, green confirmation controls and honest request-loading feedback. Confirmed
success has Done only; safe dismissal clears its result/review, never unresolved
intent or blocked recovery cleanup. Readable UTC dates, centered recent empty
states, six-record balance-table pages and saved/new recipient selection refine
task clarity without changing the frosted identity or financial capabilities.

**Key Characteristics:**

- Icy-blue glass and a diffuse navy backdrop.
- Soft offset depth, rounded panels, and selectively raised controls.
- Workhorse UI type with tabular figures and wrapping long values.
- Named desktop icons with real tooltips, visible mobile labels, and clear focus.
- Equivalent light/dark roles and honest unavailable states.

This affected-section refresh preserves the approved identity and records current [global styles](src/app/globals.css), [wallet styles](src/features/wallet/wallet.css), [shared controls](src/components/ui/), [dashboard](src/features/wallet/dashboard.tsx), [amount editor](src/features/wallet/money-amount-input.tsx), [shared review](src/features/wallet/money-review.tsx), [recorded balance history](src/features/wallet/balance-history.tsx), [recent rows](src/features/history/recent-transactions.tsx), and [submission presentation](src/features/submissions/submission-panel.tsx). The approved [CocoWallet vector](src/components/brand/cocowallet-logo.tsx) and [branding/motion extension](artifact/MOTION.md) build on that world. Page strategy belongs in the newest section of the [canonical surface brief](.impeccable/surfaces/src-app-page-tsx.md) and [workflow refinement](artifact/WORKFLOW_REFINEMENT.md), superseding conflicting older workflow copy; product capabilities belong in [PRODUCT.md](PRODUCT.md). The direction was explicitly user-pinned; no new visual-world or quality-bar roll was required or performed.

The [sidecar](.impeccable/design.json) extends the frontmatter with shadows, motion, breakpoints, narrative, and standalone visual examples. Its eight-step OKLCH ramps are **non-normative previews**, not an application palette: they derive hue/chroma from the underlying source RGB, ignore alpha, and reduce chroma toward white and black. Examples depict appearance, not functioning Radix widgets or connected financial services. Existing [review captures](.impeccable/review/) are non-shipping evidence, not product assets; this documentation pass generated no raster.

## Colors

Icy neutrals support one muted navy accent; dark mode changes values, not jobs. Unprefixed frontmatter entries are light-theme custom properties. Each `dark-` entry is the replacement under `:root[data-theme="dark"]`; application components use the same unprefixed semantic property in either theme. The `.dark` class enables the matching Tailwind state variant.

### Primary

- **Muted navy / pale blue action** (`navy`, `on-navy`): action fill and label, selected navigation, focus, and small action icons. Dark mode pairs pale blue with dark text, not white text.
- **Navy hover foundation** (`navy-hover`): retained in both source themes, but the current shared primary Button does **not** use it. Its hover reduces primary-fill opacity to (90%); do not restore the old alternate-fill example.
- **Blue wash** (`wash`, `wash-deep`): diffuse background atmosphere, never a status indicator or rate visualization.

### Neutral

- **Ground** (`ground`): full-page base. Dark ground stays distinct from panel and field levels.
- **Frosted glass** (`glass`): outer wallet panels and selected utility treatments.
- **Inner glass** (`inner`): the base quick-action treatment, secondary surfaces, highlighted menu options, and local notices. The balance card overrides its actions locally; currency flags fill their circular markers. Ordinary fields use the separate opaque control surface; the amount editor alone is transparent. The overview no longer carries a large preview notice.
- **Solid surface** (`solid`): dialogs, portaled menus, active desktop navigation, and the fixed mobile bar. Reduced transparency replaces both glass roles with this value.
- **Light-catching edge / quiet divider** (`edge`, `line`): outer panel/raised-control edges versus row separators and menu boundaries. Neither substitutes for the stronger field boundary.
- **Control surface / boundary** (`control-surface`, `control-border`): opaque, theme-aware input, Select, and outline-button treatments.
- **Ink / secondary ink** (`ink`, `secondary`): main content versus supporting text; secondary is not a second accent palette. Tooltips invert ink and page-ground roles, including in dark mode.

### Semantic states

- **Danger** (`danger`, `danger-ground`): invalid borders/rings, associated error copy, and the available destructive Button. Explain errors in text, not color alone.
- **Positive** (`positive`, `positive-ground`): signed recent credits, completed-status checks, and confirmed-success checks. The shared success Button uses positive ink as its fill with solid-surface text: dark mode therefore pairs pale mint with dark ink. These existing roles are not evidence by themselves of completion: a success summary requires a validated definitive server result; neither color nor local review can imply success. Recent debits pair the danger role with an explicit minus sign.

The dialog scrim is a local translucent treatment (`rgb(13 28 45 / 40%)`), not a new reusable palette primitive. Shadow colors likewise belong to elevation rather than extra color swatches.

**The Theme Roles Rule.** Use semantic CSS properties in both themes; do not freeze light surfaces or white primary-action text into a theme-aware control. The approved logo icon and decorative currency flags are fixed-color asset exceptions; the logo wordmark follows ink, not on-navy action text. The explicitly user-requested opaque navy balance card is a card-scoped exception with local semantic roles identical in both themes, not a generic fixed-color rule.

The balance card's local roles are an opaque (118°) gradient from (`#142944`, 0%) through (`#243f64`, 58%) to (`#315b79`, 100%); pale ink (`#f4f8ff`); blue-tinted supporting ink (`#c3d6ec`); mint action (`#bce9e1`) and hover (`#d2f3ed`) with dark action ink (`#123d39`); secondary hover (`#375877`); boundary (`#9ab2cc`); divider (`rgb(195 214 236 / 20%)`); and teal chart/focus (`#79dfcf`). These live in the sidecar's `extensions.balanceCard`, not the 38 global colors or their preview ramps. Decorative flag colors likewise stay inside their self-contained SVGs, not the global palette.

Forced colors replaces the balance gradient with `Canvas`, maps local ink/muted to `CanvasText`, action/secondary-hover to `ButtonFace`, action-hover to `Highlight`, action ink/boundary to `ButtonText`, divider to `GrayText`, and chart/focus to `LinkText`. All three gradient stops become `Canvas`; history-grid backgrounds are removed. Flag SVGs retain their artwork with `forced-color-adjust: none`; adjacent currency labels remain authoritative.

These extracted roles and captures are not a claim of WCAG conformance.

## Typography

**UI font:** the native workhorse sans stack in `typography.body`, exposed as `--font-ui`. Headings, body, labels, and figures share it; no display-font identity, paid font, separate mono face, or font request was introduced. System sans here serves an Operate interface, not a decorative display treatment.

### Hierarchy

- **Display:** the total retains the (48px), weight (450) role; mobile uses (44px). Unavailable totals use local (32px), then (29px), treatments. Inside the compact amount/sparkline composition at maximum width (640px), the total/status uses `clamp(28px, 7vw, 44px)` so both columns remain usable. These are local responsive exceptions, not new global type tokens.
- **Headline:** the page heading uses (28px), weight (600); it becomes (26px) in the mobile layout and (25px) at the compact-phone boundary. Allow balanced wrapping.
- **Title:** the global title foundation remains (18px), weight (600). Wallet-card headings use a local clarity override of (22px), weight (600), line height (1.4), reducing to (20px) on compact phones; do not promote this exception into the global scale. Panel subheadings, including balance history, use (16px), weight (600), line height (1.45). Currency codes use (15px), weight (600), line height (1.4).
- **Body / supporting:** normal copy and form descriptions use the body role; secondary dashboard details use the supporting role. Empty-history text has line height (1.6) and a local maximum measure (54ch), not a universal paragraph width.
- **Label / button:** fields use the label role; default shared actions use the button role. Mobile navigation uses (13px), weight (500), retaining the shared Button's unitless leading. Badge labels are (12px), weight (500); the wallet-count override is (13px), retaining the badge's unitless leading rather than a fixed (16px) line box.
- **Amount / currency amount:** the shared editable amount uses the responsive `typography.amount` role in a (100px) bottom-border editor, with a separate (36px) symbol. It inherits shared Input leading rather than imposing the obsolete fixed (32px) line box. Wallet-row figures retain the separate currency-amount role; mobile reduces them to (22px), then (20px). Row markers remain SVG flags, not enlarged currency glyphs.
- **Dialog title / review:** a semibold (24px) title labels the active dialog. Shared MoneyReview subheadings use local (20px), weight (600), text; its centered amount uses `clamp(28px, 6vw, 40px)`, weight (600), line height (1.25), and a (0.75em) currency label. Pending/recovery headings retain their (18px)/(28px) treatment. These review-local sizes are not new global type roles.

The CocoWallet wordmark is font-independent vector geometry, not a new UI typeface. The standalone error heading still uses (25px), weight (550), and line height (1.3). Local values and responsive exceptions are not extra global scale steps.

**The Readable Figures Rule.** Keep tabular numerals, explicit currency labels, and wrapping long values. Format money through the existing minor-unit presentation helpers; do not visually truncate an amount or account ID to preserve a card silhouette.

## Layout

Use flexible grids, `min-width: 0`, wrapping labels, and content-sized panels. The shell's minimum CSS viewport width is (320px). Topbar and workspace share an outer maximum width (1536px), including desktop side padding (32px). The workspace reserves a (56px) rail and (28px) gap; desktop panel grids use (24px) gaps and wallet panels use (26px) padding. Forms group fields at (20px), with (8px) gaps inside a field.

Observed overview composition is two content columns in a (1.4:1) ratio: total/actions and recent transactions at left, currency wallets at right. Within the total card, amount/copy and the compact sparkline share a grid with a flexible amount column, a (100–160px) chart column, and (16px) gap; actions sit below. At maximum width (640px), the chart column is (100px) and the gap (8px). At maximum width (1023px), overview content stacks as total, currencies, recent transactions. At maximum width (760px), the rail becomes a labelled fixed bottom bar. These are current CSS boundaries, not a requirement that every future surface use this topology. The original sketch remains material authority, not a three-column layout prescription.

Full transaction History uses `/history` and a single-column completed-activity panel within the same [persistent route shell](<src/app/(wallet)/layout.tsx>). Account selection, privacy and mounted money drafts/recovery survive navigation between Overview and History; reload still clears ordinary drafts. Do not describe History as an overview anchor or promise durable browsing state.

### Responsive behavior

- **Compact desktop (maximum 1190px):** shell side padding (24px), rail gap (20px), panel gap (18px), panel padding (22px), and quick actions in two columns.
- **Stacked content (maximum 1023px):** panels become one column; quick actions return to four columns while the desktop rail remains.
- **Mobile shell (maximum 760px):** side padding (20px), panels retain (22px) padding and use the mobile panel radius. Quick actions form a **2×2 grid**. Currency rows tighten to minimum height (70px), vertical padding (12px), and a final-row minimum (64px). The balance privacy control hides only its visible Show/Hide text, retaining the icon, accessible name/pressed state, and (44px) target so the larger card heading remains readable. The bottom bar has three labelled items—Overview, History, Actions—with minimum item height (60px) and safe-area padding. Workspace bottom clearance is `calc(116px + env(safe-area-inset-bottom))`; focused controls retain matching scroll clearance.
- **Compact phone (maximum 420px):** side padding (16px), panel padding (20px), a full-width history filter below its heading, stacked history-empty content, and smaller currency markers/figures.
- **Dialog/theme control (maximum 640px):** shared money-dialog width is `calc(100vw - 16px)`, maximum height `calc(100dvh - 16px)`, padding (24px 20px). The balance-history dialog has its own width/height limits in Components. Theme trigger hides its text/chevron but retains its accessible name and (44px) target. Recent completed status retains a visible check while its text becomes screen-reader-only; the row's accessible name also includes “Completed.” The account trigger becomes icon-sized at the separate (760px) shell boundary.
- **Input text (minimum 48rem):** shared Input text changes from (16px) to (14px); the amount editor overrides size with its responsive amount role at every width.

Dialogs are independently bounded and scroll internally; do not make a form fit by clipping its fields or close control. Portaled menus also have available-height/viewport limits. Preserve safe-area clearance and test long content rather than assuming the preview's short labels establish a maximum.

## Elevation & Depth

Depth combines translucent tonal layers, light-catching borders, backdrop blur, and soft offset shadows. Outer wallet panels use `--shadow`; selected desktop navigation and the base wallet quick-action treatment use paired `--raised` depth. The opaque balance card retains ambient panel depth but removes its action shadows. The shared secondary Button alone uses the quieter shadcn shadow, not the wallet-specific raised override. Dark mode keeps canvas, panel, and opaque control levels distinct.

### Shadow vocabulary

- **Panel:** `--shadow`, with separate light/dark values in the sidecar; ambient separation under wallet panels and dialogs.
- **Raised control:** `--raised`, paired soft offsets for quick actions and selected navigation, plus the compact account trigger.
- **Shared control:** shadcn `shadow-xs` for inputs, Select triggers, secondary/outline/circle Buttons; `shadow-sm` for primary Buttons and the uncustomized Card. Select/Tooltip use `shadow-md`; DropdownMenu uses `shadow-lg`. Exact expansion is recorded in the sidecar.
- **Bottom navigation:** its local source shadow is not a new general elevation step. The approved inline logo has no added brand-mark shadow; no permanent navy account sheet remains.

Frosted-panel blur is (22px); the opaque balance card alone uses `backdrop-filter: none` and `-webkit-backdrop-filter: none`. Scrim blur is (5px). Reduced transparency makes glass/inner roles solid, removes decorative washes and scrim blur; the balance card is already opaque. Forced colors removes washes and supplies system-color control/menu borders and the local balance-role replacements above.

The stacking contract is mobile navigation (20), theme storage note (30), dialog overlay (50), dialog content (60), Select/DropdownMenu (70), Tooltip (80), and skip link (100). Keep menus above their owning dialog and the skip link reachable; do not flatten these into one overlay level.

**The Quiet Depth Rule.** Use ambient shadows for panels and paired soft offsets for raised controls; bounded task overlays may settle through transform/opacity, not ornamental hover lift or animated blur.

### Motion and continuity

The approved motion thesis is protected focus and continuity: a money dialog settles into place, menus emerge from their trigger edge, and returning from review gives directional context. The source's unlayered motion rules override the base utility transitions; do not describe Tailwind's former (150ms) default as the current runtime behavior.

- **Timing:** `--motion-fast` (120ms) for dismissal/press feedback, `--motion-state` (180ms) for controls/menus/local steps, `--motion-overlay` (240ms) for dialog/scrim arrivals, and `--motion-theme` (220ms) for theme colors. `--ease-settle` is `cubic-bezier(0.16, 1, 0.3, 1)`; `--ease-feedback` is `cubic-bezier(0.2, 0, 0, 1)`. Exits use `ease-in`; there is no bounce.
- **Theme:** canvas, panels, logo wordmark, and targeted semantic text/surfaces transition background, border, and color over (220ms); shadows use (180ms). This interpolates existing roles, not a full-page overlay or filter.
- **Controls:** Button, Input, and Select trigger transition color, background, border, shadow, and individual `translate` over (180ms), with feedback easing. Enabled shared Buttons press down (1px) over (120ms); disabled/aria-disabled Buttons do not. Rail color/background/border/shadow uses (180ms), with (120ms) translate feedback.
- **Dialogs:** a fresh scrim fades in over (240ms), out over (120ms). Fresh content arrives over (240ms): opacity (0 → 1), vertical translate (12px → 0), scale (0.985 → 1). Exit is (120ms), fading from the currently rendered opacity, moving (6px) farther down and multiplying the current scale by (0.99). Individual translate/scale leave the centered `transform` unchanged. Panel/scrim blur stays constant at the values above.
- **Menus / tooltips:** fresh DropdownMenu and Select arrivals use (180ms), opacity (0 → 1), scale (0.98 → 1), and vertical offset (-4px → 0), reversed to (+4px → 0) above the trigger. Use the actual Radix transform origin. Menu exit is (120ms), fading from captured opacity to (0), keeping captured translation and multiplying captured scale by (0.985); tooltips fade from their current opacity over (120ms). Closing overlay/menu surfaces do not intercept pointer events during their exit.
- **Local review / edit:** review enters over (180ms) from opacity (0.6), horizontal translate (+8px); returning edit uses (-8px). The form's `data-entry="back"` gates the return transition; initial form entry does not add a duplicate step animation. Focus and preserved drafts remain authoritative.

These spatial/opacity effects and color transitions run only when motion is permitted. Reduced motion removes animations/transitions and smooth scrolling immediately without dropping state, focus, labels, or errors. Existing loading skeletons retain their (1.8s) breathing cycle, opacity (0.45) halfway through, and stop under reduced motion. Request-loading Buttons add a local LoaderCircle spin (900ms, linear, infinite while loading); reduced motion stops the icon without removing busy state or readable loading copy. Existing timing/easing tokens are unchanged; neither loop is decoration. Do not tween money, rates, or outcomes, fade privacy masking, animate blur/full-page filters, add page-load choreography, or retain `will-change`. Section scrolling remains smooth only when permitted. Static sidecar examples demonstrate control feedback, not fake portal/open-close behavior or an automatic page entrance.

**Interrupted presence:** before a Radix open-state change, the small shared motion controller batches current opacity/translate/scale reads and stores them as element-local CSS variables. Closing during arrival continues from that frame, not an assumed fully open value; reopening a still-mounted exiting layer likewise begins from its current frame. CSS owns timing and unmount remains Radix Presence's responsibility. Controlled and default-open APIs are preserved; there is no per-frame JavaScript loop. Reduced motion skips the snapshot work. Explicit task-dismiss buttons use the same capture boundary.

## Shapes

Generously rounded panels contrast with tighter controls: wallet panels/dialogs use the panel radius, mobile wallet panels use the mobile radius, and shared Buttons, Inputs, Select triggers, menu shells, and tooltips use the control radius. Quick-action Buttons currently inherit that same control radius; their base raised material is a wallet-local override, replaced by flat mint/outline treatments on the balance card. The (14px) notice radius also appears on mobile navigation items and the history-filter skeleton; it is not the default Button radius.

The amount editor is the deliberate component-scoped exception: square corners,
transparent fill and a single bottom boundary, not another rounded input box or a
thick accent border around a card. Ordinary Input/Select geometry stays unchanged.

Full rounding is reserved for theme/badge pills, the optional circle variant, avatars, desktop rail controls, and currency markers. Shared menu options use small (4px) corners. The uncustomized Card's `rounded-xl` resolves to (12px); the wallet panel overrides it to (24px). Thin (1px) edges and quiet dividers distinguish rows without hard stacked offsets.

Skeletons reserve destination geometry rather than prescribing every final corner: generic shapes use (8px), circles remain circular, mobile navigation glyph placeholders use a local (5px), and some utility/action placeholders are fully rounded. Do not promote those placeholder-only differences into new control variants. The selectable account ID's local (4px) focus shape is not a replacement field radius.

## Components

The shared foundations are copied registry-derived shadcn/ui source with existing Radix and Lucide dependencies, not a separate new UI package. Preserve [the retained MIT notice](src/components/ui/LICENSE.shadcn). Semantic Tailwind aliases map to wallet custom properties in global styles; prefer the existing components over parallel native utility selects or hand-built focus/menu behavior.

### CocoWallet branding

Reuse `CocoWalletLogo` for the header, loading, error, and not-found surfaces. Its inline SVG combines the approved icon with a path-based wordmark; do not rebuild the lettering with system text or introduce a global brand font. The icon retains fixed navy (`#405e87`), white (`#ffffff`), and ice (`#a7c4e9`) in both themes. Wordmark strokes use `currentColor`, supplied by the ink role. These fixed asset colors are not new palette primitives or theme-action assignments.

The source viewBox is (360 × 72), a (5:1) aspect ratio. Display size is (220 × 44px); at maximum width (760px), width is `min(220px, 48vw)` with automatic height. Keep the full mark/name and adjacent theme/account controls usable at (320px). The SVG exposes the name “CocoWallet” unless a parent supplies the accessible name and marks it decorative; do not create duplicate announcements. Page metadata uses CocoWallet, and the favicon is the approved icon. Downloadable SVG assets remain unchanged. Do not reintroduce the former circular Lucide brand mark or its local shadow.

### Buttons and quick actions

Restrained, touch-sized controls with purposeful emphasis. `Button` supports `default`, `primary`, `success`, `secondary`, `outline`, `ghost`, `circle`, `destructive`, `danger`, and `link`; `default`/`primary` and `destructive`/`danger` are compatibility pairs. Its default variant remains `primary`. Sizes are `default`, `sm`, `lg`, and `icon`, with `asChild` for a real link/trigger element. `asChild` retains exactly one child; the component does not inject a spinner beside that child.

- **Default / primary:** navy/on-navy, a small shadow, control-radius corners, minimum height (44px), padding (8px 16px), gap (8px). Hover uses primary at (90%) opacity, **not** `navy-hover`.
- **Success:** positive fill with solid-surface text, the same small shadow/geometry and (90%) hover opacity. It is the green Confirm and original-submission retry treatment, not a completed-state assertion. Dark mode uses the existing pale-mint positive role with dark solid text; do not substitute white text or a new green palette.
- **Secondary:** inner glass, quiet divider border, subtle shadow; hover uses the accent alias of inner glass. **Outline:** opaque control surface and stronger control border; hover uses inner glass and ink.
- **Ghost:** ink on transparent ground; hover adds inner glass. **Link:** navy text with an underline on hover. Neither gets an invented lift transform.
- **Circle:** fully rounded secondary treatment; it does not make every icon Button circular. `icon` size alone is (44px) square with padding (10px).
- **Destructive / danger:** danger-ground with danger text; hover uses the same ground at (80%) opacity. Shared review uses it for Cancel, which dismisses the review without submitting; the color does not imply a financial reversal.
- **Small / large:** minimum heights (40px)/(48px), padding (8px 12px)/(12px 24px); small remains (14px) text.
- **Focus / disabled:** shared Button uses a (3px) navy ring at (30%) opacity; disabled opacity is (0.5), cursor not-allowed. This is not the old global (3px) outline with (4px) offset; that outline remains on ordinary focusable content such as account IDs and the brand link.
- **Loading:** `loading` sets disabled and `aria-busy`, adding a decorative inline LoaderCircle to ordinary Buttons. Keep readable request/loading text; do not replace it with an icon-only state or invent a minimum request duration. The local spin and reduced-motion behavior are described above.
- **Motion:** use the state/press feedback above; a press is a (1px) acknowledgement, not a hover lift. Select triggers and Inputs share state transitions but do not inherit the Button-only press rule.
- **Wallet quick actions:** labelled Deposit, Withdraw, Convert, Send money Buttons; minimum height (48px), padding (10px 8px), gap (7px). The base treatment has an edge border and raised shadow, with solid/control-border hover/open feedback. The balance-card scope overrides that base: mint Deposit with dark ink; three transparent outlined actions with pale ink/boundaries; no action shadow. Deposit hover/open uses the lighter mint, while the other actions use the local blue hover fill and pale supporting-ink boundary. Icons inherit each action's ink. Disabled opacity remains (0.5); mobile retains two rows of two, not circular icon-only actions.
- **Balance-card focus / selection:** card buttons, including the sparkline trigger, use a solid (3px) teal outline with (3px) offset and no focus shadow. The portaled history dialog uses the shared semantic focus treatment rather than inheriting card-local roles. The privacy action uses local supporting ink, becoming pale ink on the local hover fill. Text selection pairs mint fill with dark action ink. These specific card-scoped rules override shared semantic text, Button, and quick-action styling without changing other surfaces or adding motion.

### Cards / containers

The registry Card supplies composable Header/Title/Description/Content/Footer regions. Wallet panels override the base spacing, radius, border, shadow, and blur with the frosted treatment, except for the explicitly opaque navy balance card; their header/content padding is zero so the outer panel supplies the inset once. Keep long values wrapping.

Wallet-card headings are deliberately recognizable: local (22px) semibold text pairs with a purpose-specific Lucide icon—CircleDollarSign for the approximate total, Wallet for currencies, History for recent transactions. Align icon/text centrally with a (10px) gap and a (24px) icon, using the mint action color on the balance card and theme-aware navy elsewhere. At the existing compact-phone boundary, heading text/icons become (20px) with an (8px) gap. Keep the named heading authoritative and the SVG decorative; do not add an icon pill or a new global heading token. The balance header reserves a flexible title column beside its privacy action rather than letting the utility displace the title.

Currency rows pair a circular currency marker with code/name and a right-aligned amount plus explicit currency. Locally authored, self-contained [US / EU / UK SVG flags](src/features/wallet/currency-flag.tsx) identify USD / EUR / GBP, never the account holder's nationality. They are decorative (`aria-hidden`, non-focusable), not emoji, font glyphs, downloaded images, or replacement labels. Preserve visible currency codes/names. Each flag fills an overflow-clipped circle with the stronger control boundary: (42px) normally, (36px) at the existing compact-desktop boundary, and (32px) on compact phones. Desktop rows have minimum height (76px), vertical padding (14px), and a quiet bottom divider; the final row removes its divider, uses minimum height (70px), and reduces its bottom padding to (10px). Mobile rows use the tighter (70px)/(12px) treatment and final-row minimum (64px), retaining the (10px) bottom inset. Minimums allow long content to grow rather than clip. On the wallet overview, count/default metadata is integrated in the panel header rather than a separate summary card. The former large navy account object is absent; account details live in a themed menu.

Keep EU star centers as fixed vector coordinates, not runtime trigonometry; tiny server/browser math differences must not create hydration warnings.

### Balance card and history

The total remains an **approximate USD total**, independently calculated for the selected main or inspect-only destination account. Journal-derived balances are valued using direct foreign→USD Frankfurter reference pairs for nonzero foreign wallets, half-up to USD cents per wallet before exact summation. Fresh-first rates may fall back only to an eligible exact-pair cache less than 24 hours old; no reciprocal/cross-rate synthesis. A missing, invalid or expired required rate, overflow, or stale balance revision makes the whole current total unavailable, not partial; individual balances stay visible. A tiny portfolio contribution may validly round to zero USD cents without changing the stricter monetary-payment rules. A keyboard-focusable **Currency rates** trigger beside the supporting copy exposes fresh/cached reference provenance, pair, source date and original fetch time in a tooltip. USD-only/zero portfolios need no FX. The gradient does not imply real funds or financial completion. Main/supporting copy retains the local ink/muted roles.

The overview now places a compact sparkline **beside the amount, above the actions**, not in a separate chart section. Its plot is (72px) high, reducing to (60px) at maximum width (640px), inside a keyboard-operable trigger with minimum height (80px). Multiple points use straight teal segments and a subtle local-color area wash; the compact vertical range spans only recorded minimum/maximum values and has no background grid. One point is a marker, not a trend. Missing/empty history says “No history yet”; rejected data says “History unavailable”; privacy says “History hidden.” None receives a placeholder line, date range, percentage, zero history, or large empty chart region.

Opening a ready sparkline uses the shared portaled Dialog for **USD balance history**, width `min(640px, calc(100vw - 32px))`, maximum height `calc(100dvh - 48px)`, with internal scrolling. The expanded plot is (112px) high even outside the app subtree, uses a zero baseline and true timestamp spacing, and remaps chart/ink/divider roles to the surrounding theme's positive/solid/ink/line roles. Its neutral grid is context, not recorded data. Straight segments retain the (2.5px) non-scaling stroke; markers use a (1.5px) boundary stroke. Above 24 expanded points, only endpoint markers remain, but **every polyline vertex and exact table record is retained**. Multi-point compact plots omit markers, not observations. A keyboard-reachable details table shows **six exact USD records per page**, with readable UTC times and canonical `dateTime` values. Previous/Next and polite page status appear when needed, wrap with an (8px) gap, disable at the bounds and move focus to the table caption after paging. Paging never slices the graph. The details summary retains its minimum (44px) target. Dialog labelling, Escape, focus trapping and trigger-focus return use the shared foundation.

The series remains account-scoped, already-valued USD, exponent 2, exact minor-unit strings and strictly increasing canonical UTC timestamps. The connected portfolio service supplies actual immutable observations, not a reconstruction from today's FX or local drafts. Current valuation can refresh without rewriting a recorded observation; missed past observations are not backfilled. Empty, invalid, unsupported, wrong-account or ambiguous duplicate series never become fabricated figures or another account's history. A currently unavailable total does not invalidate otherwise verified recorded observations. See [the current valuation/presentation contract](artifact/PRESENTATION_REFINEMENT.md), which supersedes the old disconnected chart arrangement in [BALANCE_CARD.md](artifact/BALANCE_CARD.md).

Privacy immediately removes the compact trigger/plot and any open history dialog/table, monetary values, and timestamps from the DOM and accessibility tree; it does not merely blur, fade, or visually mask them. No amount, line, point, or missing-state animation is added. The overview skeleton reserves the compact amount/sparkline geometry without inventing a line or delaying the real state.

### Inputs / fields and Select

Input and Radix Select use opaque control fill, visible control border, control-radius corners, height (44px), padding (8px 12px), and a subtle shadow. Focus changes the border to navy and adds a (3px) ring at (20%) opacity. Invalid fields use danger border/ring at (15%) opacity plus an associated error. Disabled opacity is (0.5).

`Field`, `FieldLabel`, `FieldDescription`, and `FieldError` keep labels, guidance, and alert copy together. `MoneyAmountInput` reuses shared Input as decimal **text** with `inputMode="decimal"`, not floating-point number input. Its component tokens define the (100px) height, responsive amount type, transparent fill, square corners and symbol inset. A (2px) control-border bottom edge becomes (3px) navy on visible focus, without a box/ring/shadow; invalid input changes that edge to danger and retains explanatory copy. The symbol is decorative and separate from the input value. Source currency remains a labelled Select beside the amount label.

Thousands grouping is an exact string presentation with caret preservation; raw draft/API amounts remain ungrouped decimal strings. Invalid characters/paste are rejected with a readable hint, never parsed through floating point, silently rounded or precision-truncated. Privacy blanks/read-only masks the editor without destroying its draft; never replace the field with a password input or a bare decorative number.

Select menus are portaled, collision-aware solid surfaces with (4px) menu inset, (44px) minimum option height, checkmarked selection, scrolling controls, keyboard/typeahead support, and focus restoration. History uses the same Select foundation as forms, not a native select. Local history trigger width is (176px), becoming full width on compact phones.

Send money uses that same Radix Select for saved destination addresses and
**Create new address**, revealing a labelled text Input only for new entry. New
addresses default to USD and are saved only with a successful transfer, not by
selection or review. Both send/receive currency choices in this UI are limited to
USD/GBP/EUR (source choices also require an existing wallet). Existing recipient
defaults remain stored facts; an unsupported saved default gets a USD receiving
selection without rewriting it. Other currency balances remain visible, and this
picker scope does not restrict backend or conversion capabilities.

### Navigation, tooltips, and utility menus

Desktop rail controls are named (48px) circles: resting icons are quiet on transparent ground; hover introduces glass/edge; current or open actions use navy, solid fill, and raised depth. Overview links to `/` and History to the real `/history` page; History uses the page-current state rather than an overview-section anchor. The unused Wallets navigation item is hidden, not the visible currency-balance panel. Deposit, Withdraw, Convert, Send money open dialogs. Real Radix tooltips appear on hover/focus with a (200ms) provider delay, not browser `title` text as the sole explanation.

Mobile keeps three visible labels: Overview, History, **Actions**. Actions opens a named menu of all four money operations; selecting one opens its dialog and returns focus to the stable Actions trigger when closed. Do not link it to a removed inline workspace or relabel all operations as Transfer. Task labels on quick actions remain visible at every size.

Theme and account utilities use themed DropdownMenu radio groups; history uses Select. System/Light/Dark follows the system when requested and persists only the theme preference. If storage fails, an in-memory preference still applies for the visit and a status note explains it. Account inspection is not authentication; destination accounts disable money actions. The account ID wraps and can be selected manually. Copy feedback stays inside the open account menu as a status; failure gives a manual-copy fallback. Copy status, account selection, filters, privacy, and drafts are in-memory UI state, not durable financial state. The persistent shell preserves account/privacy/money drafts across Overview/History navigation; this is not a guarantee that full-history filters persist after leaving their page.

### Badges and notices

Badge supports `default`, `secondary`, and `outline` pill variants. Wallet count uses secondary; inspect-only uses outline. They convey metadata, not money-success status. The overview has no demo badge or large connection banner. One discreet footer, **Prototype · Local ledger only. No real funds move.**, uses secondary ink and (12px) centered text after the content. Local errors, unavailable states and actual recovery guidance remain visible; do not replace these with a global alert or fabricate rates, activity, or outcomes. The stored `demo_bank` provider is presented as **Bank account**, without implying a real bank connection.

### Recent transactions and full History

Recent activity shows at most **five** newest matching completed records from the selected account's bounded recent read. Each wrapping, full-row action combines an income/outgoing/conversion Lucide icon, name, UTC time, exact signed amount and completed check. Credits use positive ink with `+`; debits use danger ink with `−`. Conversions show both exact legs, never a fabricated net. Desktop status pairs the check with “Completed”; at maximum width (640px), the check remains visible and the label is screen-reader-only, with “Completed” also retained in the row's accessible name. Color is not the only sign or status cue. No invented merchants, logos, per-record sparklines or transactions.

The recent empty state centers its content on both axes in a minimum (260px)
region with (32px) vertical padding and (16px) gaps. A (64px) circular container
holds a decorative (32px) icon, followed by the bold (16px), weight (600), title
**No matching completed activity** and normal (14px) sentence **Your completed
transactions will appear here.** Clear filter remains available when applicable;
empty is not an error or invented activity.

Selecting a recent row opens its account-scoped details on `/history`; there is no Browse full history action in the recent panel. History's completed list, type/currency/inclusive-UTC-day filters, numbered pages, lookup and record details reuse the existing shared controls. Account changes reset its scoped browsing context; stale reads cannot replace current facts. Returning from details preserves the mounted list's filters/page and restores focus; leaving the page does not promise persistence of those filters. Privacy removes rows, counts, timestamps and detailed facts, not just visible amounts.

Presentation dates use the shared en-US UTC helpers across recent/full history,
chart endpoints/table, quote expiry and rate provenance. Use readable month names,
12-hour times and an explicit UTC suffix for timestamps, including accessible row
names, instead of reading out raw ISO strings. Canonical API/storage values and
existing machine-readable `time`/`dateTime` attributes remain unchanged. Distinguish
rate source date, fetch time and expiry. The overview trigger says **Currency
rates**; describe reference rates, never live or streaming prices.

### Money dialogs and review

All four money forms use the shared Radix Dialog. Content uses solid surface, ambient depth, a labelled title/description, accessible close Button, and the bounded width in frontmatter. Desktop maximum height is `calc(100dvh - 48px)` with internal vertical overflow; the mobile exception is in Layout. Escape dismisses, focus is trapped while open, and closing restores the invoking control. Initial focus goes to recipient for Send money, otherwise amount, or to the preserved review heading when reopening a review.

The always-mounted workspace preserves separate ordinary drafts/errors/reviews across close/reopen; safely completed results/reviews are the exception below. Reload clears ordinary drafts. Validation focuses the first invalid control, valid review focuses its heading, and editing returns to amount. Conversion source changes clear an identical receiving currency; conversion disables same-currency targets, while transfers permit them. Review facts wrap. Reviewing never moves funds. Confirmation requires visible amounts and verified shared recovery storage; the single prototype footer supplies the simulation boundary without repeated provider/demo jargon in every form. Transfer entry retains exact arbitrary address IDs, saved defaults and permitted target overrides through the picker described above. Same-currency review uses identical minor units without a rate/quote. Conversion and FX-transfer reviews request server-owned terms; missing or expired quotes disable confirmation and require explicit fresh terms plus renewed review. See [the connected transfer contract](artifact/TRANSFERS.md).

All four reviews share `MoneyReview`: a wrapping heading row with **Edit details**
at the top; a source identity panel; a large centered exact amount/currency; then a
recipient/provider identity panel. Deposit correctly places the provider first and
the destination wallet last. Identity panels use existing quiet borders,
control-radius corners and (14px 16px) padding. Bottom actions use danger **Cancel**
and green success **Confirm**, in (1:1.5) flexible columns with a (12px) gap and
(48px) minimum height. Cancel closes without submitting; Edit returns to the draft.
Quote details remain between identities and final actions, retaining explicit
expiry/reconfirmation. This screenshot-led composition reuses existing materials,
not a new global card or type system. No Back to overview or draft-retention footer
copy is mounted in the money modal.

Confirmed results now use a centered, concise success view: an (88px) positive-ground
circle with a (48px) green check, the appropriate “Deposit complete,” “Withdrawal
complete,” “Conversion complete,” or “Transfer complete” heading, an exact wrapping
summary, and **Done only**.
No retry key, quote ID, timestamp or technical balance/debug table belongs in this
success presentation. Privacy replaces its monetary summary with confirmation-only
copy. Only a validated definitive server receipt selects this view, never a local
review, loading state or valuation outcome.

Done, X, outside click and Escape all clear a safely confirmed result plus its
review/quotes so the next explicit operation opens its intended form. A confirmed
result arriving after dismissal is likewise reset on the next explicit open.
Neither path discards an unknown outcome or bypasses blocked recovery-storage
cleanup; those safeguards outrank presentation reset. Ordinary draft preservation
is not permission to reopen a stale completed review.

Pending/recovery/error views retain the existing dialog/fact-list composition and
original-key protections. Step headings take focus; closing restores the invoking
control and never forgets uncertainty. A notice exposes unresolved or newly confirmed
results after dialog dismissal. Original request fields cannot be edited while
unresolved; recovery explicitly retries the same key. A known outcome permits a new
operation/edit action only after recovery context is cleared. Privacy removes
recovery amounts and completed-activity records from the DOM. Retained receipts and
their original post-operation balances are immutable historical facts, not fresh
totals. Transfers share the same recovery slot and cannot bypass unresolved
funding/conversions. Destinations remain inspect-only even though their independent
USD valuation and recorded observations are now available. Portfolio/rate failure
must not relabel, delay or roll back a confirmed monetary outcome.

### Loading and error states

The real dashboard skeleton reserves the current two-column/stacked geometry, top utilities, rail/bottom labels, actions, recent transactions and tighter currency rows. The balance card reserves a compact (72px) sparkline shape beside its total, not the former separate (112px) chart or a connection banner. Section-heading placeholders remain (30px) high; no separate balance-history heading is mounted in the overview skeleton. Balance-card shapes use its local divider role. Shapes are decorative; the busy main region supplies one “Loading wallet overview” status. No minimum loading delay or fake progress is introduced. Standalone errors retain the frosted world, offer retry/navigation, and do not expose exceptions or claim a known financial outcome. This affected-section documentation refresh is not a new visual review, full-accessibility or connected-feature certification; see [the scoped review](artifact/DESIGN_REVIEW.md), [presentation evidence](artifact/PRESENTATION_REFINEMENT.md) and [workflow evidence](artifact/WORKFLOW_REFINEMENT.md).

## Do's and Don'ts

### Do:

- **Do** use semantic theme roles for glass, ink, navy actions, and their dark counterparts.
- **Do** preserve soft offset depth, rounded panels, and selectively raised controls.
- **Do** use the native UI sans stack, tabular figures, explicit currencies, and wrapping long values.
- **Do** give desktop icon navigation accessible names and real tooltips; retain visible mobile and quick-action labels.
- **Do** reuse the shared shadcn/Radix controls, visible focus, associated errors, and one loading announcement per busy region.
- **Do** preserve dialog drafts, focus return, viewport overflow, and fixed-navigation clearance.
- **Do** honor reduced motion, reduced transparency, and forced-colors treatments.
- **Do** reuse the approved CocoWallet vector: fixed icon colors, ink-following wordmark, and a preserved accessible name.
- **Do** preserve focus and drafts through bounded overlay/step motion, with immediate state changes under reduced motion.
- **Do** keep simulation, preview, inspect-only, and unavailable states plain and visible.
- **Do** keep the user-requested opaque balance gradient and its semantic roles local, consistent in both themes, with forced-colors replacements.
- **Do** retain visible currency codes/names beside decorative vector flags and remove history values, timestamps, plot, and table immediately when privacy is enabled.

### Don't:

- **Don't** freeze light-theme colors into theme-aware controls or use white text on the dark theme's pale primary fill.
- **Don't** replace the icy glass world with warm cream, an unapproved display font, or a different visual identity.
- **Don't** add hard stacked shadows, ornamental lift animations, or hover-only labels on mobile.
- **Don't** tween financial values or privacy masking, animate blur/full-page filters, or add page-load choreography and persistent `will-change`.
- **Don't** truncate monetary values or account IDs to preserve panel geometry.
- **Don't** restore stale native utility-select or inline-workspace examples that misrepresent the current shared controls.
- **Don't** depict disconnected services as completed money movement, stored preview balances, real payment cards, or live exchange rates.
- **Don't** turn the wallet's surface-specific column arrangement into a global layout prohibition.
- **Don't** invent history figures, dates, returns, or a flat/rising trend when future recorded data is absent, or promote card-local/flag colors into the global palette.
