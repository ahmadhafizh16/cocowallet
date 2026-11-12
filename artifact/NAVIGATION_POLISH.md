# History controls and navigation continuity

**Status:** Complete — T11-13. **Decision:** D-041.

## Confirmed scope

- Remove History's About these results disclosure and its page-level Show/Hide
  control, including detail views. Keep the existing Overview privacy setting and
  its cross-page masking, with a working return to Overview when History is private.
- Rename the full-History actions to **Apply Filter** and **Reset Filter** without
  changing staged UTC dates, exact-ID list search, reset semantics or paging.
- Center the empty information vertically/horizontally: large decorative History
  icon, **No matching completed activity**, then bold **Try clearing the search or
  filters. Your completed transactions will appear here.** Keep truthful out-of-page
  recovery separate from a genuine zero-match result.
- Put a decorative purpose-specific Lucide icon before each money-dialog header.
  Recovery uses a neutral status icon rather than the wrong attempted operation.
- Smooth Overview ↔ History content changes; keep the persistent shell, focus,
  account/privacy and original monetary recovery intact. No new dependency,
  data changes or financial behavior is requested. The user approved refreshing
  only affected DESIGN.md guidance/examples, with core identity/tokens unchanged.

## Motion thesis and budget

The navigation content—not the stable logo/rail/utilities—communicates movement
between two sibling workspaces: a short rightward-origin arrival into History,
leftward-origin return into Overview, using the existing 240ms settle token.
Animate the incoming persistent content only, never capture/retain old monetary
DOM or delay route/input/focus. Do not replay on initial load, same-page filtering,
account/model refresh or modal steps. Retarget interrupted motion from its current
frame; privacy, reduced motion (including a live preference change), viewport
change and unmount cancel immediately. Content is visible without animation/API
support. One transform/opacity animation, no layout/frame loops or persistent
`will-change`, no animation of money/rates, no fake loading or extra backend delay.

## Operational baseline

The user added two deposits after D-040. Fresh stopped-development backup:
`/app/data/wallet.sqlite.pre-navigation-polish-1794488971762.bak`.
All 15 tables are row-identical; integrity `ok`, zero FK violations. Preserve
**3 accounts / 5 wallets / 9 funding attempts / 1 conversion attempt / 2 transfer
attempts / 12 transactions / 15 journal entries / 13 observations**, plus
**5 quotes / 3 uses / 1 catalog cache / 7 rate caches**. Do not reuse the stale
ten-transaction comparison probe unchanged. Verify money only on the disposable
server; no normal-wallet seed, submission, migration, restore drill or push.

## Verification and closure

Cover changed controls/copy and absence of disclosure/privacy button; centered
empty/out-of-page states; every modal header; real bidirectional transition,
interruption/reduced motion/privacy/focus/shell persistence; retained calendar/
search/detail/account/recovery behavior; responsive light/dark renders, Docker
checks, independent scoped review, approved design handoff and read-only normal
development/data restoration. Commit locally only after these checks.

### Current evidence

- Full Docker check passes **1,549 tests / 75 suites**, formatting/lint/types,
  production build and **63 artifact documents / 42 tasks**. The two new Chromium
  journeys pass exact History controls/copy, all four modal icons, actual 240ms
  forward/back content motion, same-route suppression, interruption, live reduced
  motion, immediate focus and persistent shell/privacy behavior. The full
  **124-test** browser regression now passes on the disposable server.
- Final evidence in `.impeccable/review/navigation-polish/` contains **36 originals
  and four contact sheets**: list/empty at 320/820/1024/1440 light/dark; all four
  modal headers plus detail/private at 320-dark/1440-light; eight viewport-only
  navigation midpoint supplements. The parent opened all sheets and readable
  empty/modal originals. Eight branches have centered guidance, a 64px marker with
  32px icon, exact bold copy, bounded layout, preserved main/header nodes, zero
  page errors or API writes, and no spatial motion under reduced motion.
- Midpoints intentionally pause incoming animation at 120ms of 240ms; they are
  not settled-layout claims. Full-page screenshot resizing cancels motion as
  designed, so the capture harness uses viewport-only midpoint images and never
  resumes a canceled animation. The harness correction changed no app code.
- The changed-UI detector ran once: one inherited square amount-field bottom-edge
  warning and 42 type/radius inventory advisories. No blanket suppression or
  unrelated visual-system change was added.
- Verify-tier graph generation `2026-11-12T13:13:15Z` has clean matching metadata
  for all six evidence source/test paths, complete four-symbol results and a
  direct both-direction hook trace: WalletDashboard → useRouteContentMotion →
  local cancel. The pre-existing globals.css partial range is line 3's Tailwind
  custom-variant directive, checked directly; no relevant source gap is relied on.
  Clean best-effort coverage is not an exhaustive correctness claim.

### Independent review

A fresh independent read-only child opened all **36 originals / four sheets** and
returned all five sections with **`disposition: ship`**, **no material fixes**, at
this bounded refinement scope. Exact controls/removals/empty copy, purpose icons,
incoming-only motion, persistent shell, immediate focus and inherited privacy were
accepted. Type/material/ground remain in the incumbent frosted world. Midpoints
are valid supplements, not settled-layout claims; the detector warning remains
the inherited square amount editor. This is not a whole-app security/performance,
screen-reader or WCAG certification. Approved affected documentation is refreshed.

The first full browser run passed 123/124; its sole failure used the normal browse
helper while deliberately navigating to hidden History. That helper requires the
visible Completed transactions heading and rows, which must be absent in private
mode. Only the test navigation was corrected; the focused privacy regression and
fresh **124/124 Chromium** run pass, with every masking assertion retained. No
app, captured UI or reviewed motion changed.

### Restored development and data

Both disposable previews are stopped; normal development is healthy. The old dev
cache is retained as `.next/dev.pre-navigation-polish-1794490669056`. The D-041
read-only restoration probe confirms the actual **12 History / five recent rows**,
exact available total, renamed controls/removals, in-list search/detail/back focus,
library range calendar, exact empty guidance, purpose-specific modal header,
zero-on-reopen and inherited privacy through Overview with no History toggle.
**300 frames** retain the main surface/header/URL, with one document navigation,
zero page/console errors and zero API writes.

All 15 tables matched the current backup immediately before restart. Afterwards,
all **13 non-cache tables remain row-identical**, preserving **3 accounts / 5
wallets / 9 funding attempts / 1 conversion attempt / 2 transfer attempts / 12
transactions / 15 journal entries / 13 observations**, plus **5 quotes / 3 uses**.
Only `fx_catalog_cache` and `fx_rate_cache` refreshed, retaining 1/7 rows. Integrity
is `ok`; no foreign-key violations. No normal-wallet seed, submission, migration,
restore drill or push ran. The comparison uses the current twelve-record baseline,
not the stale ten-record D-040 probe.

### Approved design handoff

The independent documenter refreshed only DESIGN.md and its v2 sidecar. Parent
snapshot checks confirm byte-identical normative frontmatter, unchanged core
palette/ramps, typography values, geometry primitives, shadows, balance roles,
breakpoints and every motion name/value. Purpose descriptions alone explain the
new approved usage. All **15 incumbent preview names/order/keys remain**, with
**12 entries unchanged**; Money-dialog review, Completed History sheet and UTC
range calendar receive only affected changes. One synthetic inert Full History
empty state brings the total to **16 previews**.

Parent browser validation checks all four affected previews at 320/1440 light/dark
(**16 variants**): no horizontal overflow, scripts, page errors or network requests.
Readable empty/modal examples were opened. These are static documentation checks,
not another independent live-app review or a claim that inert controls perform
clipboard, navigation, calendar selection or money submission.

### Minor recorded-time divider follow-up

The user's subsequent request removes only the bottom edge of the final
**Recorded at (UTC)** fact. A scoped final-fact CSS override leaves every other
fact divider and the information footer's own top edge intact. The browser
regression now asserts the final fact's label and 0px edge, plus the retained 1px
transaction-ID edge. Read-only live verification passes all eight 320/820/1024/
1440 light/dark branches with zero page errors/API writes; six focused historical
presentation tests and formatting pass. Captures and the once-only detector output
are in `.impeccable/review/recorded-at-divider/`. No accounting, data, motion, core
token or design-file change accompanies this local polish; the full preceding
1,549/124 results are not represented as a rerun of this follow-up.

### Minor copy-tooltip follow-up

Successful transaction/account/wallet-ID copy now opens **Copied!** on the clicked
44px button through the existing shared Radix Tooltip, instead of adding a visible
success sentence below the facts. Success opens only after clipboard completion,
auto-dismisses after two seconds, closes on Escape/dismissal, and is also announced
through a screen-reader-only status. Timer cleanup follows dismissal/unmount.
Clipboard failure still selects/focuses the exact ID and keeps readable manual-copy
guidance; it never shows a success tooltip. No global tooltip/control styling or
financial behavior changes.

All **1,549 Jest tests / 75 suites**, type checking and focused lint pass. Read-only
live checks cover all three copy buttons across 320/820/1024/1440 light/dark,
including touch, keyboard/Escape, timer expiry, held-pending clipboard and failure.
Every tooltip stays anchored/in bounds, targets remain 44px, successful copy keeps
the detail sheet's height unchanged, and page errors/API writes are zero. Eight
success/two failure captures and inspection data are in
`.impeccable/review/copy-tooltip/`; sampled readable originals were opened. The
once-only changed-component detector is clean. No full production-build/124-test
browser rerun or independent whole-surface review is claimed for this local polish.

### Tooltip arrow join follow-up

The copy Button and shared Tooltip are local shadcn-derived source using the
existing `radix-ui` primitives, with the retained upstream MIT notice—not a separate
hand-built popup library. Rendered inspection found no bubble border: Radix's arrow
started flush against the shadowed body edge. Its SVG now overlaps the body by one
CSS pixel in its native local axis; Radix still owns positioning, rotation and
collision. No content, timing, radius, palette, dependency or copy behavior changes.

Read-only Chromium checks pass 320/820/1024/1440 light/dark and actual top/right/
bottom tooltip placements. Arrow fill matches the body and the measured overlap
is 1px; all tested popups remain in bounds, with zero page errors/API writes.
High-density close-ups were opened. Eleven focused copy/shared-control/motion
tests pass. Evidence is in `.impeccable/review/tooltip-arrow/`; this is a narrow
join correction, not another full 124-test browser or independent design review.
