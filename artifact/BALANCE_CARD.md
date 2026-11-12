# Balance card and currency flags

**Status:** Implemented and verified under [T11-07](tasks/TASKS-11.md#t11-07) and
[D-028](DECISIONS.md#d-028). User-pinned refinement of the existing two-column
overview, not a replacement visual world.

**Later refinement:** D-035/D-036 supersede the separate/disconnected chart
composition below with a compact recorded-USD sparkline beside the total and
connected Frankfurter valuation, including read-only destinations. See
[PRESENTATION_REFINEMENT.md](PRESENTATION_REFINEMENT.md). Palette, flags, heading
roles, accounting truth and exact disclosure remain; the original checkpoint's
test counts and disconnected-service limitations are historical evidence only.

## Direction and truth

- Replace currency-symbol discs with locally authored US / EU / UK vector flags
  for USD / EUR / GBP. Keep currency codes and names visible; the decorative flag
  does not identify the account holder's nationality. No emoji, image downloads,
  third-party flag package, or runtime asset request is needed.
- Make the balance card the deliberate color anchor: an opaque 118° navy gradient
  `#142944 → #243f64 (58%) → #315b79`, identical in both themes. Pale main text
  `#f4f8ff`, blue-tinted supporting text `#c3d6ec`, pale-mint Deposit fill
  `#bce9e1` with `#123d39` text, outlined secondary actions, and a teal `#79dfcf`
  data stroke preserve hierarchy. The surrounding frosted layout remains intact.
- Keep the existing approximate-total rules and presentation disclaimer. No
  fabricated reference balance, percent return, date range, financial outcome,
  exchange rate, trend, zero-history line, or delayed loading state.
- Follow-up feedback strengthens card-header recognition: 22px semibold titles
  (20px on compact phones), with distinct dollar-circle / wallet / history Lucide
  icons. The history subheading is 16px semibold. Mobile privacy keeps a labelled
  44px icon target; title/control layout wraps safely instead of shrinking text.

## History presentation contract

`WalletOverview.balanceHistory` optionally supplies account-scoped
`BalanceHistorySeries` values. These contain already-valued USD totals as exact
minor-unit decimal strings, exponent 2, and strictly increasing canonical UTC
timestamps. They are presentation inputs, **not** a new API or valuation policy.
Future services must provide complete, verifiable valuations and rate provenance;
this component never reconstructs old totals using today's balances or rates.

The preview supplies none, so the shipping card says **History not connected**
and draws no data line. An explicitly supplied empty series has no recorded
balances. Malformed, wrong-account, duplicate/ambiguous or unsupported series must
not leak another account's history or masquerade as zero. Supplied valid points
use true time spacing, a zero baseline, straight connecting segments and recorded
markers, with exact amounts/timestamps available in a keyboard-accessible table.
Single points do not imply a trend. Bigint amounts remain exact; only bounded
normalized SVG coordinates use floating point.

Privacy removes the plot, its values, timestamps and table immediately from the
DOM and accessibility tree. No amount or plot animation is added. Loading reserves
the chart's geometry without a fake trend. Focus, forced colors, narrow layouts,
reduced motion and existing draft-preserving dialogs remain supported.

## Acceptance

Verify both themes at desktop, stacked/tablet and 320/390px widths; vector flags,
gradient text/action/boundary/focus contrast; hover/open/disabled states; real
preview missing-history behavior; supplied-data, empty, invalid, private,
single/zero/max-bound and account-isolation fixtures. Fixture captures must be
labelled test-only, never presented as populated application data. Repeat Docker
checks and production browser journeys, inspect captures in batches, update the
design/artifact records, commit locally, and restore stable interactive dev.

## Verification and limits

- Full Docker check/build: **648 Jest tests**. **41 production Chromium tests**
  pass, including all prior interaction/motion journeys and three new card tests.
- Heading fonts/icons are computed-checked at 1440/1024/820/390/320px in both
  themes. Body/supporting text exceeds 4.5:1 across the gradient/hover surfaces;
  control boundaries, data/focus strokes exceed 3:1. Deposit text exceeds 4.5:1
  on normal and hover fills. Forced colors replaces the gradient with system roles.
- Seventy history component cases and expanded dashboard tests verify exact
  bounds, timestamps, single/zero series, account isolation and immediate privacy.
  Populated `balance-fixture-{light,dark}.png` captures are explicitly test-only;
  application captures show the actual disconnected state.
- A final dev console probe exposed platform-dependent trigonometric rounding in
  EU stars. Twelve fixed vector positions remove it; a unit regression forbids
  runtime sin/cos and browser checks collect console errors before navigation.
  The repeated final build/browser suite and development check pass afterward.
- A fresh bounded reviewer returned **`ship`**, inspecting application/loading
  and labelled fixture captures, source/tests and design notes; a follow-up read
  confirmed the deterministic flag fix preserves that verdict. It did not rerun
  tests or certify global WCAG, performance, persistence or connected services.
- The changed-target detector has **19 advisory** type/radius inventory findings,
  no non-advisory findings. It predates the coordinate-only hydration fix; that
  fix adds no style tokens. No clean-count rerun or blanket suppression was used.
- Final development recovery retained only generated cache at
  `.next/dev.pre-flag-hydration-1794409722371`; no wallet data changed. A real
  browser hydrated, remained stable for 300 frames with zero additional reloads,
  page errors or console errors, and exercised the theme and deposit dialog.
