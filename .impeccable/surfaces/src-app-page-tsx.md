---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/features/wallet/dashboard.tsx","src/features/wallet/wallet.css","src/features/wallet/operation-workspace.tsx","src/app/loading.tsx","src/app/error.tsx"]
---

# Wallet overview surface

**Mode:** Operate. **Target:** `src/app/page.tsx`; related targets: the wallet
feature, root layout/loading/error boundaries, and shared UI/theme components.

The user approved a two-column refinement after critiquing the initial frosted
shell: icon rail with tooltips, popup money workflows, and consistent actual
shadcn foundations. See `artifact/WALLET_REDESIGN.md`. The job remains inspecting
preview balances and exploring simulated forms, not connecting money services.

## Direction contract

**THESIS:** A focused two-column overview with money actions brought into a
protected dialog only when requested—not a permanent third form column or a grid
of redundant metrics. One conversion draft has one visible context.

**OWN-WORLD:** Icy blue ground, a diffuse navy light field, translucent white
rounded panels, offset soft shadows, circular raised controls, workhorse sans
type, the approved CocoWallet vector logo, and Lucide icons. Desktop labels become accessible tooltips; mobile labels
remain visible. Dark mode uses clear canvas/panel/control levels in blue-slate.
The user-requested balance card is an opaque navy-to-blue anchor in both themes,
with pale ink, a mint Deposit action and teal reserved for actual recorded data.
US/EU/UK flag markers retain visible currency labels; larger semibold card titles
and purpose-specific Lucide cues make sections easier to recognize.

**STORY:** Understand balances and next actions immediately; open a named money
dialog, enter/review a preserved draft, then return to the overview without fake
success or repeated global disclaimers.

**FIRST VIEWPORT:** Compact icon rail; restrained topbar with themed account and
theme menus; one preview notice. Wide left column holds total/actions and compact
empty history; right holds currency wallets with count/default integrated. No
third column, large account sheet, or disconnected conversion teaser. Dialogs
appear only on action. Mobile stacks the content and keeps labelled navigation.
Skeletons reserve this geometry.
Balance history occupies the total card only; absent recorded snapshots produce
“History not connected,” not an invented trend. See `artifact/BALANCE_CARD.md`.

**FORM:** User-pinned two-column/dialog refinement of the approved frosted world;
code-led, no new identity tournament. Seed exception: the user explicitly selected
two columns, popup Send money, icon tooltips and shadcn controls, then approved
execution. Under new-work's user-pinned-direction exception, no random roll was
required or performed. The earlier `seed: none (unavailable)` statement was
incorrect and is withdrawn; this machine's seed support was not unavailable.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Behavior and boundaries

- System/light/dark themes, persisted only as UI preference; visible keyboard
  focus, semantic names, reduced-motion support, and no page-load choreography.
  Apply the approved CocoWallet logo and bounded interaction/theme continuity
  under `artifact/MOTION.md`; never animate monetary values or delay input.
- Load/error/empty/disabled/validation/review states; no fabricated completed
  transactions or minimum-duration loading delays. Unconnected services are
  explained before confirmation and cannot mutate data or claim success.
- Preserve drafts on validation and dialog close/reopen; money stays decimal text.
  Registry-derived shadcn/Radix controls own menus, tooltips, fields and overlays.
- Preview data is presentation-only. Account creation, actual destination lists,
  real balances, rates/quotes, and operation outcomes remain future integration.
- The scene is a local evaluation at a desk or on a phone under normal ambient
  light; light follows the supplied reference, dark follows system/user preference.

## Implementation record

T11-04 implements this contract; T11-06 applies branding and bounded motion.
T11-07 adds the requested flags, gradient/history presentation and clearer headings.
`artifact/UI_FOUNDATION.md` records current
behavior and integration limits; `artifact/DESIGN_REVIEW.md` distinguishes current
review from the historical three-column baseline. Financial services remain
disconnected; connected tasks and cross-feature accessibility acceptance stay
separate.
