---
name: Simulated multi-currency wallet
description: Frosted wallet — icy-blue glass, softly raised controls, and clear financial UI.
colors:
  ground: "#eaf1f5"
  glass: "rgb(255 255 255 / 58%)"
  inner: "rgb(255 255 255 / 40%)"
  solid: "#f5f8fa"
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
  dark-ground: "#14212d"
  dark-glass: "rgb(36 54 72 / 80%)"
  dark-inner: "rgb(65 88 111 / 26%)"
  dark-solid: "#263b50"
  dark-edge: "rgb(188 207 226 / 16%)"
  dark-line: "rgb(188 207 226 / 20%)"
  dark-control-border: "#63809b"
  dark-control-surface: "#203348"
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
    fontSize: "clamp(33px, 3.2vw, 45px)"
    fontWeight: 350
    lineHeight: 1.2
    letterSpacing: "-0.04em"
  headline:
    fontSize: "21px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.025em"
  title:
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.012em"
  body:
    fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  navigation:
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.5
  button:
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.5
  amount:
    fontSize: "24px"
    fontWeight: 500
    lineHeight: "32px"
    letterSpacing: "-0.025em"
  currency-amount:
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.02em"
  dialog-title:
    fontSize: "21px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
rounded:
  panel: "27px"
  panel-compact: "24px"
  panel-mobile: "25px"
  control: "14px"
  pill: "999px"
  circle: "50%"
  skeleton: "8px"
  account-sheet: "21px"
  default-badge: "10px"
spacing:
  field-gap: "7px"
  control-gap: "9px"
  inline-gap: "12px"
  compact-panel-gap: "14px"
  panel-gap: "18px"
  compact-panel-inset: "20px"
  panel-inset: "24px"
  wide-panel-inset: "27px"
  dialog-inset: "30px"
components:
  button-primary:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.on-navy}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "10px 19px"
  button-primary-hover:
    backgroundColor: "{colors.navy-hover}"
  button-primary-dark:
    backgroundColor: "{colors.dark-navy}"
    textColor: "{colors.dark-on-navy}"
  button-primary-dark-hover:
    backgroundColor: "{colors.dark-navy-hover}"
  button-secondary:
    backgroundColor: "{colors.inner}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "10px 19px"
  button-secondary-hover:
    backgroundColor: "{colors.solid}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.navy}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "10px 19px"
  button-ghost-hover:
    backgroundColor: "{colors.inner}"
  button-circle:
    backgroundColor: "{colors.inner}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "11px"
  button-circle-hover:
    backgroundColor: "{colors.solid}"
  button-danger:
    backgroundColor: "{colors.danger-ground}"
    textColor: "{colors.danger}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "10px 19px"
  input:
    backgroundColor: "{colors.control-surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
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
    textColor: "{colors.secondary}"
    typography: "{typography.navigation}"
  navigation-current:
    textColor: "{colors.navy}"
    backgroundColor: "{colors.solid}"
  default-badge:
    backgroundColor: "{colors.inner}"
    textColor: "{colors.navy}"
    rounded: "{rounded.default-badge}"
    padding: "0 5px"
  skeleton:
    backgroundColor: "{colors.line}"
    rounded: "{rounded.skeleton}"
  dialog-foundation:
    backgroundColor: "{colors.solid}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.dialog-inset}"
    width: "min(560px, calc(100vw - 32px))"
---

# Design System: Simulated multi-currency wallet

## Overview

**Creative North Star: "Frosted wallet"**

Icy-blue glass sits over a diffuse navy wash. Rounded panels and softly raised circular controls make the interface tactile without competing with balances, field labels, or review details. The approved reference is adapted to a wallet workspace, not reproduced as a different banking product.

Workhorse system typography, visible Lucide labels, and restrained navy accents keep task completion ahead of decoration. Light and dark themes share the same material roles. Simulation notices, unavailable information, and disabled final actions remain legible parts of the composition rather than being disguised as successful financial activity.

**Key Characteristics:**

- Icy-blue glass and a diffuse navy backdrop.
- Soft offset depth, rounded panels, and raised circular controls.
- Workhorse UI type with tabular figures and wrapping long values.
- Visible labels, clear focus, and equivalent light/dark roles.
- Plain simulation boundaries and honest unavailable states.

This is a code-led record of the reviewed shell. The visual sources are [global styles](src/app/globals.css), [wallet styles](src/features/wallet/wallet.css), [shared controls](src/components/ui/), and the [dashboard](src/features/wallet/dashboard.tsx). Surface composition belongs in [WALLET_SURFACE.md](artifact/WALLET_SURFACE.md); product capabilities belong in [PRODUCT.md](PRODUCT.md). The sidecar extends these tokens with source shadows, motion, breakpoints, and standalone component previews; it does not introduce a new application palette or scale. Synthesized OKLCH tonal ramps are non-normative live-panel previews derived from the source colors' underlying RGB hue/chroma (ignoring alpha), not adopted application tokens or scales.

## Colors

The palette combines icy neutrals with a muted navy accent; dark mode changes their values, not their jobs. Frontmatter names without a prefix are light-theme values. Each `dark-` name is the corresponding replacement under `:root[data-theme="dark"]`; application CSS continues to use the unprefixed custom property in either theme.

### Primary

- **Navy** (`navy`, `navy-hover`, `on-navy`): primary actions, selected navigation, focus, and small action icons. Dark mode uses pale blue for the action fill and dark ink for its text; do not carry white primary-button text into that pairing.
- **Blue wash** (`wash`, `wash-deep`): diffuse background atmosphere, not a data series or status indicator. The upper wash blends these roles through a radial gradient; a quieter lower wash adds depth behind the panels.

### Neutral

- **Ground** (`ground`): the full-page base.
- **Frosted glass** (`glass`): outer panels and utility pills.
- **Inner glass** (`inner`): fields, raised secondary controls, currency tokens, and inset details.
- **Solid surface** (`solid`): hover emphasis, the mobile navigation base, native select options, and dialog foundations. Reduced transparency replaces both glass roles with this surface.
- **Light-catching edge** (`edge`): panel and raised-control outlines. In dark mode it becomes a restrained translucent edge rather than a white outline.
- **Quiet divider** (`line`): row dividers, menu outlines, and decorative skeleton shapes; separate it from the brighter panel edge and the control boundary.
- **Control surface / border** (`control-surface`, `control-border`): opaque, theme-aware field fills and visible boundaries for the shadcn money-form controls. Do not substitute a row divider for a field border.
- **Ink / secondary ink** (`ink`, `secondary`): primary content versus supporting text. Secondary ink is a text role, not a second accent palette.

### Semantic states

- **Danger** (`danger`, `danger-ground`): invalid strokes, error text, and the available danger-button foundation. Pair the stroke with readable error copy; color alone does not explain a problem.
- **Positive** (`positive`, `positive-ground`): defined light/dark semantic tokens. The current shell does not demonstrate a completed money-operation success state; these tokens are not evidence of one.

**The Theme Roles Rule.** Use the semantic CSS custom properties in both themes; do not freeze a light surface or white action label into a theme-aware control. The account sheet and brand mark are intentional fixed navy treatments in the source, not replacements for the theme-aware action palette.

These are extracted visual values, not a claim of WCAG conformance.

## Typography

**UI font:** the native workhorse sans stack in `typography.body`, exposed as `--font-ui`. Display, body, labels, and figures use this same stack; no paid, display, or separate mono font is required.

### Hierarchy

- **Display:** a light-weight total with tight tracking; the desktop clamp is recorded in the tokens. At the mobile breakpoint the total is fixed at (42px). An unavailable total uses (29px) with tracking (-0.025em), rather than squeezing a long word into the monetary treatment.
- **Headline:** the page heading; mobile reduces it to (20px). Text can balance over more than one line.
- **Title:** panel headings. Subheadings use (14px), weight (600), and line height (1.45). The total-panel caption is quieter: (13px), weight (550).
- **Body:** normal UI copy and form content. Empty-history supporting copy has an observed maximum width of (42ch); this is not a global text-width limit.
- **Label:** field labels, hints, notices, navigation, and utility copy. Navigation increases the label weight to (500). The default-currency badge uses (10px), weight (500).
- **Button:** default action labels; the small size uses (12px) rather than the default token size.
- **Amount / currency amount:** editable amounts use the recorded amount role inside a bounded field, distinct from right-aligned wallet-row figures. Mini-summary figures use (29px), weight (380), line height (1.3), and tracking (-0.035em); default-currency summaries use (26px).
- **Dialog title:** an available foundation role, not the inline operation heading.

**The Readable Figures Rule.** Keep tabular numerals, explicit currency labels, and wrapping long values. Format money through the existing minor-unit presentation helpers; do not visually truncate an amount or account ID to preserve a card silhouette.

## Layout

Use flexible grids, `min-width: 0`, wrapping labels, and panels that expand for content. The shell has a bounded frame (1680px) and a minimum supported CSS viewport width (320px). Reused panel gaps are (18px), tightening to (14px) at the compact breakpoint. Standard panel padding is (24px), rising to (27px) on wide screens; compact, tablet, and mobile overrides are (20px), (22px), and (23px), respectively. At the narrowest breakpoint panels return to (20px).

The implemented responsive boundaries are wide (minimum 1530px), compact (maximum 1190px), tablet (701–990px), mobile (maximum 700px), and narrow (maximum 380px). They are source breakpoints, not a newly introduced device scale. Mobile side gutters are (18px), then (14px) in the narrow layout. Keep fixed navigation clear of focused controls with the existing bottom padding and safe-area allowance.

The wallet's desktop columns, tablet placement, and mobile panel order are surface-specific decisions recorded in [WALLET_SURFACE.md](artifact/WALLET_SURFACE.md). They are not a requirement that every future screen use three columns, or a prohibition on another layout. Preserve the material, readable hierarchy, and resilient content behavior when composing another surface.

## Elevation & Depth

Depth is a hybrid of translucent tonal layers, light-catching borders, backdrop blur, and soft offset shadows. Outer panels use the ambient `--shadow`; raised circular and secondary controls use the paired `--raised` shadow. Avoid replacing this with hard stacked offsets or motion-driven lift. The page's blurred washes are decorative and never carry information.

### Shadow vocabulary

- **Panel shadow:** `--shadow`, with separate light and dark values in the sidecar. It separates glass containers without turning them into floating dialogs.
- **Raised control:** `--raised`, a soft positive offset plus a lighter opposing offset; dark mode retains the structure with much quieter highlights.
- **Primary action:** the small source action shadow, also recorded in the sidecar. Disabled buttons remove their shadow.
- **Account / brand / mobile navigation:** local source shadows, recorded as such rather than generalized into a new elevation scale.

Panel glass uses backdrop blur (22px). The dialog overlay uses blur (5px). Reduced transparency removes the overlay blur and background washes and makes glass/inner surfaces solid. Forced-colors mode removes the washes and supplies visible system-color borders on shared buttons, fields, and the theme control.

**The Quiet Depth Rule.** Use ambient shadows for panels and paired soft offsets for raised controls; state emphasis comes from surface and border changes, not an invented lift animation.

Control transitions are short color/shadow changes (160ms); navigation and quick-action circles use (180ms). Skeletons breathe over (1.8s), reaching opacity (0.45) midway through the cycle. Reduced motion disables animations and transitions and removes smooth scrolling. Full source values are in the sidecar.

## Shapes

The silhouette is generously rounded, not uniformly pill-shaped. Panels use the panel radius; compact and mobile overrides use their recorded radii. Fields use the smaller control radius, while action buttons are pills and raised icon controls are circles. The account sheet is an inset rounded rectangle with its own radius. Skeletons echo the destination shape instead of imposing one radius on every placeholder.

Use thin edges (1px) and quiet dividers to distinguish containers and rows. Shared buttons start with a transparent border so state treatments do not change their geometry. Long text belongs inside an expanding, wrapping panel. Keep the account sheet's decorative gradient clipped to its rounded outline; its account ID still wraps.

## Components

### Buttons and quick actions

Tactile but restrained. The shared `Button` API provides `primary`, `secondary`, `ghost`, `circle`, and `danger` variants, with `default`, `sm`, and `icon` sizes. These are available foundations; their presence does not imply a shipped destructive action or money-moving flow.

- **Primary:** navy fill with on-navy text, a small shadow, and the recorded hover fill. Default size has minimum height (44px) and padding (10px 19px).
- **Secondary / circle:** inner glass, an edge border, and raised-control depth; hover changes the surface to solid. Icon size has minimum width and height (44px), with padding (11px).
- **Ghost:** navy text on transparent ground; hover adds inner glass. No extra active transform is defined.
- **Danger:** semantic danger text and ground. The source defines no distinct danger-hover color; do not invent one.
- **Small:** minimum height (40px), padding (8px 13px). All shared buttons use weight (500), an icon gap (9px), and wrapping labels.
- **Focus / disabled:** visible navy outline (3px), offset (4px); disabled opacity (0.52), no shadow, and no hover fill change. Disabled states need explanatory surrounding text when an operation is unavailable.
- **Quick actions:** raised circles with visible Deposit, Withdraw, Convert, and Transfer labels. Selected actions use the solid fill and an inset line. Their circles are (44px), becoming (45px) on mobile; these are not unlabeled icon-only navigation.

### Cards / containers

Outer cards use glass, an edge border, panel radius, ambient shadow, and blur. They retain `overflow-wrap: anywhere` for long IDs and values. Mini-summary cards inherit the same material at a denser inset. Currency rows use quiet bottom dividers, circular currency markers, and a right-aligned amount with an explicit currency label.

The inset account sheet deliberately stays navy with white copy in both themes, including a white focus outline on its copy control. It depicts a simulated account, not a real payment card. Do not generalize its fixed colors into all buttons or panels.

### Inputs / fields

Money-form controls use the official shadcn/ui new-york-v4 Input and Radix Select patterns, adapted to the wallet's semantic Tailwind tokens. Shared fields have a control-surface fill, a visible control-border, control radius, height (44px), padding (8px 12px), and a subtle shadow. Input text is (16px) on narrow screens and (14px) from the medium breakpoint to avoid mobile focus zoom. Field labels are (13px), weight (500), in primary ink; hints remain secondary.

Focus changes the border to navy and adds a theme-aware ring (3px). Invalid fields use a danger border/ring and an associated error message; disabled controls use opacity (0.5). Select menus are portaled, collision-aware solid surfaces with highlighted options, a selected checkmark, scrolling controls, keyboard/typeahead support, and focus restoration on dismissal. They are not browser-native selects dressed as custom menus.

The amount editor uses the same shared Input, enlarged to height (56px), with an inset currency symbol (22px) and the amount typography role. Keep its border and fill; do not strip it back to a bare number. It remains decimal text, not a number spinner. Privacy blanks it and makes it read-only without destroying the draft. The source currency uses a separate labelled Select trigger. Native theme/account/history selects outside the money form retain their existing behavior.

### Navigation and theme

Desktop navigation pairs raised circles with Overview, Wallets, History, and Account labels. At mobile width it becomes a fixed bottom bar and also exposes **Actions**. Actions links to the current operation workspace; it does not rename the workspace Transfer or reset a selected Deposit, Withdraw, or Convert form. Current location uses navy text, a distinct surface/inset edge, and heavier icon strokes.

Lucide icons support visible task labels rather than replacing them. The theme control is an accessible native select with System, Light, and Dark choices. Its narrow-screen presentation is an icon-sized select with the accessible label “Color theme,” not an unlabeled custom icon menu. Focus outlines remain visible; storage failure produces a status note without blocking the preference for that visit.

### Badges and notices

The Simulation badge is a frosted glass pill with an information icon and explicit text. The smaller Default badge uses navy text, inner glass, and a line border. Neither is a new semantic success state. Supporting notices explain disconnected services and unavailable rates without implying an operation completed.

### Loading

Skeletons mirror the panel, field, action-circle, and text geometry of the shell. Individual shapes are decorative (`aria-hidden="true"`); the enclosing main region is busy and supplies one “Loading wallet overview” status. Do not announce each rectangle. Honor reduced motion rather than replacing breathing with another animation.

### Inline review and dialog foundation

The current wallet form and review are **inline** in the operation panel. Error focus moves to the first invalid field; valid review focus moves to its heading. Review facts use wrapping values and retain a plainly explained disabled final action while services are disconnected. No funds are submitted by this shell.

A reusable Radix dialog foundation exists separately: solid panel, ambient shadow, panel radius, scrollable bounded height, labeled title/description, overlay, and accessible close button. Its width is recorded in the tokens; maximum height is `calc(100dvh - 48px)`. Do not describe this foundation as the shipped wallet operation flow.

## Do's and Don'ts

### Do:

- **Do** use semantic theme roles for glass, ink, navy actions, and their dark counterparts.
- **Do** preserve soft offset depth, rounded panels, and raised circular controls.
- **Do** use the native UI sans stack, tabular figures, explicit currencies, and wrapping long values.
- **Do** retain visible task labels, keyboard focus, associated errors, and one loading announcement per busy region.
- **Do** honor reduced motion, reduced transparency, and forced-colors treatments.
- **Do** keep simulation, preview, inspect-only, and unavailable states plain and visible.

### Don't:

- **Don't** freeze light-theme colors into theme-aware controls or use white text on the dark theme's pale primary fill.
- **Don't** replace the icy glass world with warm cream, an unapproved display font, or a different visual identity.
- **Don't** add hard stacked shadows, ornamental lift animations, or icon-only replacements for visible task labels.
- **Don't** truncate monetary values or account IDs to preserve panel geometry.
- **Don't** label mobile operation navigation Transfer or reset the selected form when Actions is used.
- **Don't** depict disconnected services as completed money movement, real payment cards, or live exchange rates.
- **Don't** turn the wallet's surface-specific column arrangement into a global layout prohibition.
