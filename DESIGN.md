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
    fontSize: "24px"
    fontWeight: 500
    lineHeight: "32px"
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

**Key Characteristics:**

- Icy-blue glass and a diffuse navy backdrop.
- Soft offset depth, rounded panels, and selectively raised controls.
- Workhorse UI type with tabular figures and wrapping long values.
- Named desktop icons with real tooltips, visible mobile labels, and clear focus.
- Equivalent light/dark roles and honest unavailable states.

This refresh preserves the approved identity and records current [global styles](src/app/globals.css), [wallet styles](src/features/wallet/wallet.css), [shared controls](src/components/ui/), [dashboard](src/features/wallet/dashboard.tsx), and [money dialogs](src/features/wallet/operation-workspace.tsx). The approved [CocoWallet vector](src/components/brand/cocowallet-logo.tsx) and [branding/motion extension](artifact/MOTION.md) build on that world. Page strategy belongs in the [canonical surface brief](.impeccable/surfaces/src-app-page-tsx.md) and [two-column brief](artifact/WALLET_REDESIGN.md); product capabilities belong in [PRODUCT.md](PRODUCT.md). The direction was explicitly user-pinned; no new visual-world roll was required or performed.

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
- **Inner glass** (`inner`): quick actions, secondary surfaces, currency tokens, highlighted menu options, and the preview notice. Money inputs use the separate opaque control surface.
- **Solid surface** (`solid`): dialogs, portaled menus, active desktop navigation, and the fixed mobile bar. Reduced transparency replaces both glass roles with this value.
- **Light-catching edge / quiet divider** (`edge`, `line`): outer panel/raised-control edges versus row separators and menu boundaries. Neither substitutes for the stronger field boundary.
- **Control surface / boundary** (`control-surface`, `control-border`): opaque, theme-aware input, Select, and outline-button treatments.
- **Ink / secondary ink** (`ink`, `secondary`): main content versus supporting text; secondary is not a second accent palette. Tooltips invert ink and page-ground roles, including in dark mode.

### Semantic states

- **Danger** (`danger`, `danger-ground`): invalid borders/rings, associated error copy, and the available destructive Button. Explain errors in text, not color alone.
- **Positive** (`positive`, `positive-ground`): retained semantic foundations, not evidence of a completed operation. The disconnected wallet has no money-success receipt.

The dialog scrim is a local translucent treatment (`rgb(13 28 45 / 40%)`), not a new reusable palette primitive. Shadow colors likewise belong to elevation rather than extra color swatches.

**The Theme Roles Rule.** Use semantic CSS properties in both themes; do not freeze light surfaces or white primary-action text into a theme-aware control. The approved logo icon is a fixed-color asset exception; its wordmark follows ink, not on-navy action text.

These extracted roles and captures are not a claim of WCAG conformance.

## Typography

**UI font:** the native workhorse sans stack in `typography.body`, exposed as `--font-ui`. Headings, body, labels, and figures share it; no display-font identity, paid font, separate mono face, or font request was introduced. System sans here serves an Operate interface, not a decorative display treatment.

### Hierarchy

- **Display:** the total uses the recorded (48px), weight (450) role; mobile uses (44px). Unavailable totals use (32px), then (29px), so a status word is not forced into monetary display geometry.
- **Headline:** the page heading uses (28px), weight (600); it becomes (26px) in the mobile layout and (25px) at the compact-phone boundary. Allow balanced wrapping.
- **Title:** panel headings use (18px), weight (600). Panel subheadings use (16px), weight (600), line height (1.45). Currency codes use (15px), weight (600), line height (1.4).
- **Body / supporting:** normal copy and form descriptions use the body role; secondary dashboard details use the supporting role. Empty-history text has line height (1.6) and a local maximum measure (54ch), not a universal paragraph width.
- **Label / button:** fields use the label role; default shared actions use the button role. Mobile navigation uses (13px), weight (500), retaining the shared Button's unitless leading. Badge labels are (12px), weight (500); the wallet-count override is (13px), retaining the badge's unitless leading rather than a fixed (16px) line box.
- **Amount / currency amount:** the editable amount is (24px) with line height (32px) inside a bounded field. Wallet-row figures use the separate currency-amount role; mobile reduces them to (22px), then (20px). The currency symbol is a local (19px) marker, reduced to (16px) on compact phones; the form's inset symbol is (20px).
- **Dialog title:** a semibold (24px) title labels the active dialog. Review headings use (18px), weight (600), line height (28px).

The CocoWallet wordmark is font-independent vector geometry, not a new UI typeface. The standalone error heading still uses (25px), weight (550), and line height (1.3). Local values and responsive exceptions are not extra global scale steps.

**The Readable Figures Rule.** Keep tabular numerals, explicit currency labels, and wrapping long values. Format money through the existing minor-unit presentation helpers; do not visually truncate an amount or account ID to preserve a card silhouette.

## Layout

Use flexible grids, `min-width: 0`, wrapping labels, and content-sized panels. The shell's minimum CSS viewport width is (320px). Topbar and workspace share an outer maximum width (1536px), including desktop side padding (32px). The workspace reserves a (56px) rail and (28px) gap; desktop panel grids use (24px) gaps and wallet panels use (26px) padding. Forms group fields at (20px), with (8px) gaps inside a field.

Observed wallet composition is two content columns in a (1.4:1) ratio: total/actions and compact history at left, currency wallets at right. At maximum width (1023px), content stacks as total, currencies, history. At maximum width (760px), the rail becomes a labelled fixed bottom bar. These are current CSS boundaries, not a requirement that every future surface use this topology. The original sketch remains material authority, not a three-column layout prescription.

### Responsive behavior

- **Compact desktop (maximum 1190px):** shell side padding (24px), rail gap (20px), panel gap (18px), panel padding (22px), and quick actions in two columns.
- **Stacked content (maximum 1023px):** panels become one column; quick actions return to four columns while the desktop rail remains.
- **Mobile shell (maximum 760px):** side padding (20px), panels retain (22px) padding and use the mobile panel radius. Quick actions form a **2×2 grid**. The bottom bar has four labelled destinations/actions, minimum item height (60px), and safe-area padding. Workspace bottom clearance is `calc(116px + env(safe-area-inset-bottom))`; focused controls retain matching scroll clearance.
- **Compact phone (maximum 420px):** side padding (16px), panel padding (20px), a full-width history filter below its heading, stacked history-empty content, and smaller currency markers/figures.
- **Dialog/theme control (maximum 640px):** dialog width is `calc(100vw - 16px)`, maximum height `calc(100dvh - 16px)`, padding (24px 20px). Theme trigger hides its text/chevron but retains its accessible name and (44px) target. The account trigger becomes icon-sized at the separate (760px) shell boundary.
- **Input text (minimum 48rem):** shared Input text changes from (16px) to (14px); the amount editor explicitly remains (24px).

Dialogs are independently bounded and scroll internally; do not make a form fit by clipping its fields or close control. Portaled menus also have available-height/viewport limits. Preserve safe-area clearance and test long content rather than assuming the preview's short labels establish a maximum.

## Elevation & Depth

Depth combines translucent tonal layers, light-catching borders, backdrop blur, and soft offset shadows. Outer wallet panels use `--shadow`; selected desktop navigation and wallet quick actions use paired `--raised` depth. The shared secondary Button alone uses the quieter shadcn shadow, not the wallet-specific raised override. Dark mode keeps canvas, panel, and opaque control levels distinct.

### Shadow vocabulary

- **Panel:** `--shadow`, with separate light/dark values in the sidecar; ambient separation under wallet panels and dialogs.
- **Raised control:** `--raised`, paired soft offsets for quick actions and selected navigation, plus the compact account trigger.
- **Shared control:** shadcn `shadow-xs` for inputs, Select triggers, secondary/outline/circle Buttons; `shadow-sm` for primary Buttons and the uncustomized Card. Select/Tooltip use `shadow-md`; DropdownMenu uses `shadow-lg`. Exact expansion is recorded in the sidecar.
- **Bottom navigation:** its local source shadow is not a new general elevation step. The approved inline logo has no added brand-mark shadow; no permanent navy account sheet remains.

Panel blur is (22px); scrim blur is (5px). Reduced transparency makes glass/inner roles solid, removes decorative washes and scrim blur. Forced colors removes washes and supplies system-color control/menu borders.

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

These spatial/opacity effects and color transitions run only when motion is permitted. Reduced motion removes animations/transitions and smooth scrolling immediately without dropping state, focus, labels, or errors. Existing loading skeletons retain their (1.8s) breathing cycle, opacity (0.45) halfway through, and stop under reduced motion; this extension adds no decorative loop. Do not tween money, rates, or outcomes, fade privacy masking, animate blur/full-page filters, add page-load choreography, or retain `will-change`. Section scrolling remains smooth only when permitted. Static sidecar examples demonstrate control feedback, not fake portal/open-close behavior or an automatic page entrance.

**Interrupted presence:** before a Radix open-state change, the small shared motion controller batches current opacity/translate/scale reads and stores them as element-local CSS variables. Closing during arrival continues from that frame, not an assumed fully open value; reopening a still-mounted exiting layer likewise begins from its current frame. CSS owns timing and unmount remains Radix Presence's responsibility. Controlled and default-open APIs are preserved; there is no per-frame JavaScript loop. Reduced motion skips the snapshot work. Explicit overview-dismiss buttons use the same capture boundary.

## Shapes

Generously rounded panels contrast with tighter controls: wallet panels/dialogs use the panel radius, mobile wallet panels use the mobile radius, and shared Buttons, Inputs, Select triggers, menu shells, and tooltips use the control radius. Quick-action Buttons currently inherit that same control radius; their raised material is a wallet-local override. The (14px) notice radius also appears on mobile navigation items and the history-filter skeleton; it is not the default Button radius.

Full rounding is reserved for theme/badge pills, the optional circle variant, avatars, desktop rail controls, and currency markers. Shared menu options use small (4px) corners. The uncustomized Card's `rounded-xl` resolves to (12px); the wallet panel overrides it to (24px). Thin (1px) edges and quiet dividers distinguish rows without hard stacked offsets.

Skeletons reserve destination geometry rather than prescribing every final corner: generic shapes use (8px), circles remain circular, mobile navigation glyph placeholders use a local (5px), and some utility/action placeholders are fully rounded. Do not promote those placeholder-only differences into new control variants. The selectable account ID's local (4px) focus shape is not a replacement field radius.

## Components

The shared foundations are copied registry-derived shadcn/ui source with existing Radix and Lucide dependencies, not a separate new UI package. Preserve [the retained MIT notice](src/components/ui/LICENSE.shadcn). Semantic Tailwind aliases map to wallet custom properties in global styles; prefer the existing components over parallel native utility selects or hand-built focus/menu behavior.

### CocoWallet branding

Reuse `CocoWalletLogo` for the header, loading, error, and not-found surfaces. Its inline SVG combines the approved icon with a path-based wordmark; do not rebuild the lettering with system text or introduce a global brand font. The icon retains fixed navy (`#405e87`), white (`#ffffff`), and ice (`#a7c4e9`) in both themes. Wordmark strokes use `currentColor`, supplied by the ink role. These fixed asset colors are not new palette primitives or theme-action assignments.

The source viewBox is (360 × 72), a (5:1) aspect ratio. Display size is (220 × 44px); at maximum width (760px), width is `min(220px, 48vw)` with automatic height. Keep the full mark/name and adjacent theme/account controls usable at (320px). The SVG exposes the name “CocoWallet” unless a parent supplies the accessible name and marks it decorative; do not create duplicate announcements. Page metadata uses CocoWallet, and the favicon is the approved icon. Downloadable SVG assets remain unchanged. Do not reintroduce the former circular Lucide brand mark or its local shadow.

### Buttons and quick actions

Restrained, touch-sized controls with purposeful emphasis. `Button` supports `default`, `primary`, `secondary`, `outline`, `ghost`, `circle`, `destructive`, `danger`, and `link`; `default`/`primary` and `destructive`/`danger` are compatibility pairs. Its default variant remains `primary`. Sizes are `default`, `sm`, `lg`, and `icon`, with `asChild` for a real link/trigger element.

- **Default / primary:** navy/on-navy, a small shadow, control-radius corners, minimum height (44px), padding (8px 16px), gap (8px). Hover uses primary at (90%) opacity, **not** `navy-hover`.
- **Secondary:** inner glass, quiet divider border, subtle shadow; hover uses the accent alias of inner glass. **Outline:** opaque control surface and stronger control border; hover uses inner glass and ink.
- **Ghost:** ink on transparent ground; hover adds inner glass. **Link:** navy text with an underline on hover. Neither gets an invented lift transform.
- **Circle:** fully rounded secondary treatment; it does not make every icon Button circular. `icon` size alone is (44px) square with padding (10px).
- **Destructive / danger:** danger-ground with danger text; hover uses the same ground at (80%) opacity. This available API does not mean a destructive wallet action is shipped.
- **Small / large:** minimum heights (40px)/(48px), padding (8px 12px)/(12px 24px); small remains (14px) text.
- **Focus / disabled:** shared Button uses a (3px) navy ring at (30%) opacity; disabled opacity is (0.5), cursor not-allowed. This is not the old global (3px) outline with (4px) offset; that outline remains on ordinary focusable content such as account IDs and the brand link.
- **Motion:** use the state/press feedback above; a press is a (1px) acknowledgement, not a hover lift. Select triggers and Inputs share state transitions but do not inherit the Button-only press rule.
- **Wallet quick actions:** labelled Deposit, Withdraw, Convert, Send money Buttons; minimum height (48px), padding (10px 8px), gap (7px), edge border and raised shadow. Hover/open uses solid fill and the control border. Disabled quick actions remove their raised shadow. Mobile uses two rows of two, not circular icon-only actions.

### Cards / containers

The registry Card supplies composable Header/Title/Description/Content/Footer regions. Wallet panels override the base spacing, radius, border, shadow, and blur with the frosted treatment; their header/content padding is zero so the outer panel supplies the inset once. Keep long values wrapping.

Currency rows pair a circular currency marker with code/name and a right-aligned amount plus explicit currency. Desktop rows have minimum height (106px), padding (24px) vertically, and a quiet bottom divider; the final row removes its divider and tightens its trailing inset. On the wallet overview, count/default metadata is integrated in the panel header rather than a separate summary card. The former large navy account object is absent; account details live in a themed menu.

### Inputs / fields and Select

Input and Radix Select use opaque control fill, visible control border, control-radius corners, height (44px), padding (8px 12px), and a subtle shadow. Focus changes the border to navy and adds a (3px) ring at (20%) opacity. Invalid fields use danger border/ring at (15%) opacity plus an associated error. Disabled opacity is (0.5).

`Field`, `FieldLabel`, `FieldDescription`, and `FieldError` keep labels, guidance, and alert copy together. The amount remains decimal **text**, enlarged to height (56px), with a separate inset symbol and source-currency Select. Privacy blanks/read-only masks the editor without destroying its draft; never replace the field with a password input or a bare decorative number.

Select menus are portaled, collision-aware solid surfaces with (4px) menu inset, (44px) minimum option height, checkmarked selection, scrolling controls, keyboard/typeahead support, and focus restoration. History uses the same Select foundation as forms, not a native select. Local history trigger width is (176px), becoming full width on compact phones.

### Navigation, tooltips, and utility menus

Desktop rail controls are named (48px) circles: resting icons are quiet on transparent ground; hover introduces glass/edge; current or open actions use navy, solid fill, and raised depth. Overview, Wallets, History are section links; Deposit, Withdraw, Convert, Send money open dialogs. Real Radix tooltips appear on hover/focus with a (200ms) provider delay, not browser `title` text as the sole explanation.

Mobile keeps visible Overview, Wallets, History, **Actions** labels. Actions opens a named menu of all four money operations; selecting one opens its dialog and returns focus to the stable Actions trigger when closed. Do not link it to a removed inline workspace or relabel all operations as Transfer. Task labels on quick actions remain visible at every size.

Theme and account utilities use themed DropdownMenu radio groups; history uses Select. System/Light/Dark follows the system when requested and persists only the theme preference. If storage fails, an in-memory preference still applies for the visit and a status note explains it. Account inspection is not authentication; destination accounts disable money actions. The account ID wraps and can be selected manually. Copy feedback stays inside the open account menu as a status; failure gives a manual-copy fallback. Copy status, account selection, filters, privacy, and drafts are page-memory state, not durable financial state.

### Badges and notices

Badge supports `default`, `secondary`, and `outline` pill variants. Wallet count uses secondary; inspect-only uses outline. They convey metadata, not money-success status. One preview notice states the disconnected boundary; local dialog guidance explains the relevant unavailable operation without fabricating rates, activity, or outcomes.

### Money dialogs and review

All four money forms use the shared Radix Dialog. Content uses solid surface, ambient depth, a labelled title/description, accessible close Button, and the bounded width in frontmatter. Desktop maximum height is `calc(100dvh - 48px)` with internal vertical overflow; the mobile exception is in Layout. Escape dismisses, focus is trapped while open, and closing restores the invoking control. Initial focus goes to recipient for Send money, otherwise amount, or to the preserved review heading when reopening a review.

The always-mounted workspace preserves separate drafts/errors/reviews across close/reopen; reload clears them. Validation focuses the first invalid control, valid review focuses its heading, and editing returns to amount. Changing source currency clears dependent errors and an identical receiving currency; same-currency target options are disabled. Review facts wrap. Every final submission is disabled with a connection explanation; reviewing a draft is not a success receipt and does not create an account, move money, or record history.

### Loading and error states

The real dashboard skeleton reserves the current two-column/stacked geometry, top utilities, rail/bottom labels, notice, actions, history, and currency rows. Shapes are decorative; the busy main region supplies one “Loading wallet overview” status. No minimum loading delay or fake progress is introduced. Standalone errors retain the frosted world, offer retry/navigation, and do not expose exceptions or claim a known financial outcome. These source behaviors and existing captures do not certify full accessibility or connected feature acceptance; see [the scoped review](artifact/DESIGN_REVIEW.md).

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

### Don't:

- **Don't** freeze light-theme colors into theme-aware controls or use white text on the dark theme's pale primary fill.
- **Don't** replace the icy glass world with warm cream, an unapproved display font, or a different visual identity.
- **Don't** add hard stacked shadows, ornamental lift animations, or hover-only labels on mobile.
- **Don't** tween financial values or privacy masking, animate blur/full-page filters, or add page-load choreography and persistent `will-change`.
- **Don't** truncate monetary values or account IDs to preserve panel geometry.
- **Don't** restore stale native utility-select or inline-workspace examples that misrepresent the current shared controls.
- **Don't** depict disconnected services as completed money movement, stored preview balances, real payment cards, or live exchange rates.
- **Don't** turn the wallet's surface-specific column arrangement into a global layout prohibition.
