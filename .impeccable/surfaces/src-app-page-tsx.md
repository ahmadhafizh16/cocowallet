---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/features/wallet/dashboard.tsx","src/features/wallet/wallet.css","src/app/loading.tsx","src/app/error.tsx"]
---

# Wallet overview surface

**Mode:** Operate. **Target:** `src/app/page.tsx`; related targets: the wallet
feature, root layout/loading/error boundaries, and shared UI/theme components.

The user approved the frosted reference sketch, then requested interface-first
implementation with skeletons and proper application behavior. The job is to
inspect currency balances and enter simulated money workflows. The local demo
must preserve its simulation boundary, exact money, and destination inspection.
This phase implements the shell, not seeding, FX, or money-moving HTTP services.

## Direction contract

**THESIS:** A familiar three-column wallet workspace with a persistent operation
area, initially Transfer, not a generic grid of interchangeable metrics. The
source-to-target amount strip connects conversion entry/review without animating
invented balances.

**OWN-WORLD:** Icy blue ground, a diffuse navy light field, translucent white
rounded panels, offset soft shadows, circular raised controls, workhorse sans
type, and visibly labelled Lucide icons. Dark mode translates the same structure
into blue-slate glass. Restrained colour; state meaning stays explicit.

**STORY:** Understand currencies and available actions immediately; distinguish
interface preview from stored funds. Enter/review UI without fake success.

**FIRST VIEWPORT:** Slim labelled left rail; total and actions above history in
the left column; wallet/default summaries, currencies, and conversion in the
middle; transfer workspace above account identity at right. Preserve that topology
from `.impeccable/mocks/decision/wallet-frosted-reference.html`; use honest zero/
empty states instead of approved-sketch example amounts. Mobile stacks and uses
labelled bottom navigation. Skeletons reserve equivalent geometry.

**FORM:** User-pinned reference adaptation, no new ranking/roll; code-led from
the approved HTML. `seed: none (unavailable)`.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Behavior and boundaries

- System/light/dark themes, persisted only as UI preference; visible keyboard
  focus, semantic names, reduced-motion support, and no page-load choreography.
- Load/error/empty/disabled/validation/review states; no fabricated completed
  transactions or minimum-duration loading delays. Unconnected services are
  explained before confirmation and cannot mutate data or claim success.
- Preserve input on validation and retry; money input stays decimal text. Native
  or Radix-backed controls manage keyboard/focus/overlay behavior.
- Preview data is presentation-only. Account creation, actual destination lists,
  real balances, rates/quotes, and operation outcomes remain future integration.
- The scene is a local evaluation at a desk or on a phone under normal ambient
  light; light follows the supplied reference, dark follows system/user preference.

## Implementation record

The shell is implemented at the targets above, with the loading geometry and
honest states specified here. Mobile navigation calls the shared workspace
**Actions** and preserves the selected workflow. `artifact/UI_FOUNDATION.md`
records behavior and integration limits; `artifact/DESIGN_REVIEW.md` records the
review and bounded verdict. Root `DESIGN.md` and `.impeccable/design.json` describe
the built visual system. Financial services remain disconnected; this record does
not close connected feature tasks or full cross-feature accessibility acceptance.
