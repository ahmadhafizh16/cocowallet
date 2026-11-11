# CocoWallet SVG logo

**Request:** The user named the app **CocoWallet** and requested an SVG logo.
See [D-026](DECISIONS.md#d-026) and [T11-05](tasks/TASKS-11.md#t11-05).

## Deliverables

| File | Use |
| --- | --- |
| `public/brand/cocowallet-logo.svg` | Full logo on light backgrounds; 360 × 72 viewBox. |
| `public/brand/cocowallet-logo-inverse.svg` | Light wordmark for dark backgrounds; same geometry. |
| `public/brand/cocowallet-icon.svg` | Standalone mark; 72 × 72 viewBox. |

The mark combines a wallet-shaped C with a smaller C-like clasp. The rounded
wordmark is authored vector geometry, not a font reference. Navy, icy blue,
white, and ink come from the existing frosted palette. Outer backgrounds are
transparent; keep the viewBox clear space and do not stretch either dimension.

These are self-contained SVG paths/shapes with accessible titles, no scripts,
external resources, embedded raster images, or required fonts. No raster
generation or stock asset was used. This delivery creates the downloadable
assets. The initial asset-only request did not replace application branding;
the user's later “okay apply it” approval under [D-027](DECISIONS.md#d-027)
authorizes the integration below, not another layout or identity redesign.

## Applied branding

`src/components/brand/cocowallet-logo.tsx` reuses every approved vector shape.
Its wordmark inherits theme ink through `currentColor`; the icon retains the
approved navy/white/icy-blue palette. Header and matching skeleton, error and
not-found surfaces use the reusable logo. Root metadata names CocoWallet and
`src/app/icon.svg` is byte-identical to the standalone icon. Downloadable files
remain unchanged. The 220 × 44px desktop logo scales proportionally to
`min(220px, 48vw)` on mobile; explicit theme and 320px fit checks pass.

## Verification

- All three files parse as XML and contain accessible SVG names.
- Structural checks reject script/image/text/foreignObject elements, event
  handlers and external hrefs; lettering remains vector-only.
- Chromium decoded all variants. A local review capture at
  `.impeccable/review/cocowallet-logo.png` was inspected on light/dark backgrounds,
  with icons at 72, 48, 32, 24 and 16px. It is nonshipping evidence.
- The later application pass adds four branding unit tests and browser checks
  for title/favicon, exact geometry, decorative accessibility, explicit themes
  and narrow fit. Wallet data, money rules and two-column layout remain unchanged.
