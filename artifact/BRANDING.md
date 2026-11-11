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
assets; it does **not** automatically replace the application header, metadata,
or favicon. A wider interface/identity change is not implied by the logo request.

## Verification

- All three files parse as XML and contain accessible SVG names.
- Structural checks reject script/image/text/foreignObject elements, event
  handlers and external hrefs; lettering remains vector-only.
- Chromium decoded all variants. A local review capture at
  `.impeccable/review/cocowallet-logo.png` was inspected on light/dark backgrounds,
  with icons at 72, 48, 32, 24 and 16px. It is nonshipping evidence.
- Application code, wallet data, money rules and layout are unchanged. Existing
  application verification is not presented as a newly rerun full suite.
