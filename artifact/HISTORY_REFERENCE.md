# History page reference refinement

**Status:** Complete — T11-11. **Decision:** D-039.

The user supplied a **1024 × 629** History screenshot and explicitly requested it
as the page reference. This is a code-led refinement of the incumbent frosted
Operate interface, not a replacement visual world or a new financial capability.
The inline image is authoritative; the transcription below travels to reviewers
when the original attachment is unavailable to a child.

## Pinned image transcription

- Transaction history at top left; Back to overview at top right.
- A History icon and Completed transactions heading sit above the main sheet;
  a subdued, wrapping account-ID tag sits opposite.
- One pale rounded sheet, without redundant nested headings. Four labelled
  type/currency/from-UTC/to-UTC controls share a desktop row. Apply/Clear actions
  sit directly below, with visible transaction-ID search aligned right.
- One concise matching-count/page/newest-first line precedes dense divided rows.
  Each row has a circular direction icon, type and readable UTC time at left;
  exact signed currency amounts align right, followed by green Completed and a
  chevron. Conversion and outgoing transfer retain both debit and receiving
  credit; incoming inspection emphasizes its positive receiving side. No netting.
- Showing N of total transactions sits at bottom left. Previous, page-number
  input, Go to page and Next are one bottom-right group. Controls wrap on narrow
  screens rather than clipping; mobile completion remains accessible/visible.

The screenshot's eight transactions and historical example amounts are **reference
content only**, never hardcoded counts or seed data. Keep the app's brand/header,
navigation, privacy control, themes, exact accessible facts and existing details/
filter/paging/retry behavior. ID search remains an explicit exact account-scoped
lookup through the existing read-only detail endpoint, not a false fuzzy filter.
UTC/currency/paging explanations remain available in a compact disclosure.

## Boundaries and verification

No accounting, API contract, backend service, currency scope, monetary recovery,
dependency or migration change. D-038 modal behavior remains intact. The user
approved **Refresh History sections** of DESIGN.md/examples only, with unchanged
identity/core tokens. Review current source and 320/820/1024/1440 light/dark renders,
including the reference's native 1024 × 629 viewport, keyboard/focus, ID lookup,
details/back, paging, filters, empty/loading/error/privacy and incoming inspection.
Run Docker checks and isolated monetary browser regressions, finish independent
review/design handoff, preserve data, restore development and commit locally;
do not push.

Development stopped and a fresh SQLite backup was verified row-for-row across
all 15 tables: `/app/data/wallet.sqlite.pre-history-reference-1794478402550.bak`.
**Current baseline: 3 accounts / 5 wallets / 6 funding attempts / 1 conversion /
2 transfers / 9 transactions / 12 journal entries / 10 observations**, plus
5 quotes / 3 quote uses / 1 catalog cache / 7 rate caches. The user added another
deposit after D-038 restoration; preserve this newer nine-record baseline, not
the image's eight records. Integrity `ok`, no foreign-key violations.

## Verification

The latest full Docker check passes **1,530 Jest tests / 71 suites**, formatting,
lint, types, production build and **61 artifact documents / 40 tasks**. All
**118 Chromium checks** pass, including the new reference-layout/visible-lookup/
signed-row/paging matrix and all prior financial/reset/recovery journeys. This
includes the fresh complete rerun against the corrected 44px-submit build. The
conversion circle uses the existing line color; no new token was introduced.

The final rendered round covers **34 originals**: list/details at
320/820/1024/1440 in both themes, native 1024 × 629 first viewports and eight
loading/error/empty/invalid/missing/private/notes/incoming states at 320 dark and
1440 light. Real isolated synthetic operations supply eight records, not frontend
fabrication. Every browsing branch reports zero page errors and zero API writes;
desktop filters share one row and every width fits without horizontal overflow.
The parent opened all five contact sheets covering every original, plus final
1024-light, 1440-dark, 820-light and 320-dark list originals for readable inspection.
The initial capture seed requested an unconfigured deterministic EUR/GBP pair;
using the fixture's supported USD/GBP pair corrected that test-only setup without
changing a backend or quote safeguard.

The once-only changed-target detector reports **1 inherited square amount-input
bottom-border warning / 32 font-radius advisories**; no new primary History
finding or blanket suppression. That scan predates only the reviewer's hit-target
correction below and was not repeated.

The fresh independent full finish review returned **`fix`**, accepting reference
fidelity, identity, responsive adaptations and supplied states but finding one
material hit-target issue: the lookup-submit override was 40 × 40px, not 44px.
The correction uses 44 × 44px at zero inset and reserves 48px trailing input
padding. Capture telemetry and the new browser matrix now assert this minimum in
all eight width/theme combinations. All 34 same-view originals were refreshed and
the parent reopened all five sheets. **Verdict pass: `ship`; the same reviewer
scored the sole material fix resolved**, with no fix-introduced overlap/layout
regression observed. This verdict approves the listed fix, not a new whole-app
audit; parent-run test results are not reviewer browser execution or a WCAG,
screen-reader, backend/security or performance certification.

## Design handoff

The approved documenter refreshed only History sections of DESIGN.md and its
v2 sidecar. All 12 original previews and all existing extensions remain unchanged;
one inert illustrative History-sheet preview was added because none existed.
The parent verified valid JSON, inert controls, byte-identical normative
frontmatter and unchanged color metadata/ramps, typography metadata, shadows,
motion values, breakpoints and D-038 guidance. New History guidance is not a new
token layer or connected financial dataset. This is documentation validation,
not another independent visual audit of the preview.

## Normal-development restoration

Both disposable previews are stopped. All **15 tables were row-identical** to the
current backup before restoration; afterwards all **13 non-cache tables remain
bigint-safely identical**, including every financial/account/wallet, attempt,
quote/use and observation row. Only catalog/rate caches refreshed. Counts remain
the nine-transaction baseline above; integrity `ok`, zero FK violations.

Healthy development retains `.next/dev.pre-history-reference-1794480219674`.
The read-only Chromium probe passes **300 stable frames**, actual nine-record
History/five recent rows, exact available portfolio total, visible exact-ID
lookup/details/back focus, privacy, soft navigation and D-038 zero-on-reopen.
It records one initial document navigation, no extra reload, zero page/console
errors and **zero API writes**. The parent opened the restored History capture.
Reports/scripts live under `.impeccable/review/history-reference/`.
No normal seed/money test, migration, dependency change, restore drill or push ran.
Final artifact/status checks and a local commit close this follow-up.
