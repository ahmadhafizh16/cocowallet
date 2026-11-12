---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/(wallet)/layout.tsx"
related_targets: ["src/features/wallet/dashboard.tsx","src/features/wallet/wallet.css","src/features/wallet/operation-workspace.tsx","src/features/submissions/submission-panel.tsx","src/features/conversions/quote-review.tsx","src/features/transfers/transfer-review.tsx","src/features/history/recent-transactions.tsx","src/features/history/workspace.tsx","src/features/history/use-history.ts","src/features/history/transaction-facts.tsx","src/features/funding/recent-funding.tsx","src/app/loading.tsx","src/app/error.tsx"]
---

# Wallet overview surface

## Current user refinement — D-035 / D-036

The user resumed visual feedback and supplied reference screenshots. This is a
code-led, user-pinned refinement of the same frosted world, not an identity round.
Their new instructions supersede the historical in-panel/no-route choice below:

- Recent rows: income/outgoing/conversion icons, name/time, green positive credits,
  red negative debits, completed status; both exact conversion legs. Five recent
  records, with scoped detail navigation. No invented merchants or mini price charts.
- Full History is `/history`, reached from the existing left/bottom menu. No Browse
  full history button in recent activity. One persistent route-group shell preserves
  account, privacy and money drafts/recovery across these pages.
- No demo badge/large connection alert. One discreet prototype/no-real-funds footer.
  Successful money submissions show a large green check and concise exact summary,
  not retry keys or technical balance tables. Recovery safeguards remain internal
  and are still explained for actual uncertainty/errors.
- Compact recorded USD-total sparkline beside the total, actions below. No large
  empty chart region or grid behind placeholder copy. Real account-scoped snapshots
  only; exact values are available on opening the sparkline. Fresh/cached Frankfurter
  provenance is reachable by keyboard without another permanent card row.
- Tighter wallet rows retain flags, names and exact amounts. Read-only destination
  USD totals are explicitly approved. Missing FX makes the whole total unavailable,
  never partial; no old FX-valued observations are fabricated or backfilled.

The palette, typography, logo/flags, material, two-column overview and existing
interaction motion remain authority. Local spacing/composition changes implement
the user's references. See `artifact/PRESENTATION_REFINEMENT.md` for the complete
scope, data/recording contract and operational evidence. The independent reviewer
scored all four material corrections resolved, `ship` at fix-list scope. The user
approved refreshing affected DESIGN.md/sidecar sections while preserving core
tokens. T11-08/T03-03 are complete; the historical contract below is not current
authority for chart placement, History navigation or destination valuation.

## Historical surface contract

**Mode:** Operate. **Target:** `src/app/page.tsx`; related targets: the wallet
feature, root layout/loading/error boundaries, and shared UI/theme components.

The user approved a two-column refinement after critiquing the initial frosted
shell: icon rail with tooltips, popup money workflows, and consistent actual
shadcn foundations. See `artifact/WALLET_REDESIGN.md`. The job remains inspecting
journal-backed balance snapshots and exploring local money drafts. The user has
paused visual feedback while backend workflows are integrated. Reviewed simulated
deposits/withdrawals, conversions and transfers connect through shared durable
retry/recovery. Destination inspection uses scoped incoming recent history, while
T09-02 subsequently connects full-history browsing below; valuation remains
separate. See `artifact/TRANSFERS.md` and `artifact/HISTORY.md`.

T09-02 extends this existing panel, not the visual world. The user confirmed
“Expand existing panel”: retain compact recent activity, add a Browse full history
entry, and show filters/numbered pages and inline record details in that same card.
No route/modal, new identity or durable token change. Applied filters use inclusive
UTC days and either affected currency; detail/back navigation keeps the list's
filters/page. Account switches clear detail/filter context; privacy removes records,
counts and timestamps. Loading, empty, missing, retry, keyboard/focus return and
long-content states use the incumbent controls. Ordinary browsing stays in memory.

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
theme menus; one truthful connection notice. Wide left column holds total/actions and compact
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
- The live page reads persistent accounts, destination lists and journal balances
  from one server snapshot. Test-only preview data is not a runtime fallback.
  Funding POSTs have explicit reviewed confirmation, immutable unresolved intent,
  same-key recovery and server-confirmed receipts. Only unresolved context may
  temporarily use per-tab session storage. Conversion review uses validated
  server-owned terms, with explicit expiry/reconfirmation and shared recovery.
   Transfers now use exact recipient/default/target context, no-FX same-currency
   review or expiring server terms, explicit confirmation and that same recovery
   slot. Recent activity is the selected account's latest 50 matching completed
facts, including incoming destination transfers, not a full history/valuation
   service by themselves. Full browsing/details use the approved in-panel T09-02
   extension. Unknown totals stay unavailable; destinations stay inspect-only.
- The scene is a local evaluation at a desk or on a phone under normal ambient
  light; light follows the supplied reference, dark follows system/user preference.

## Implementation record

T11-04 implements this contract; T11-06 applies branding and bounded motion.
T11-07 adds the requested flags, gradient/history presentation and clearer headings.
T03-01 connects stored account/balance reads without changing that visual system.
`artifact/UI_FOUNDATION.md` records current
behavior and integration limits; `artifact/DESIGN_REVIEW.md` distinguishes current
review from the historical three-column baseline. Funding retains that visual
system and shared controls; it does not resolve postponed visual feedback, full
FX/history or cross-feature accessibility acceptance. See `artifact/FUNDING.md`.
