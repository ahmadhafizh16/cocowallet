# Money workflow refinement

**Status:** Complete — T11-09. **Decision:** D-037.

**Follow-up:** [D-038](DECISIONS.md#d-038) /
[MODAL_CONTINUITY.md](MODAL_CONTINUITY.md) subsequently resets ordinary amounts to
zero on reopen and limits Convert's UI choices as well. Its newer normal-wallet
baseline supersedes the counts in this historical D-037 verification record.

The user's review screenshot pins the review layout: wallet identity, large exact
amount, recipient/provider identity, Edit details at the review heading, and
Cancel/green Confirm actions below. Preserve the existing frosted world, accounting,
privacy, quote expiry and original-key recovery; this is not a new payment service.

- Confirmed successes have Done only. Done, outside click, X and Escape clear a
  safely completed presentation so the next action opens its intended form.
  Unknown results and blocked recovery storage must never be discarded.
- Center the recent empty state vertically/horizontally with a large icon, bold
  “No matching completed activity” and normal supporting text.
- Human-readable UTC dates throughout presentation; retain canonical API/storage
  dates and machine-readable time attributes. Keep exact quote expiry/provenance.
- Refine customer-facing copy, removing repeated simulation/demo/provider jargon.
  Retain the single truthful prototype footer and necessary uncertainty safeguards.
  User chose **Currency rates**, not a misleading streaming-rate claim.
- Numeric decimal amount entry, exact string-based thousands grouping, large type
  and bottom-border field. Reject invalid edits; never parse money through Number,
  silently truncate precision or send grouped text to accounting APIs.
- Green confirmation buttons and animated icon loading for API actions, disabled
  during requests; honor reduced motion and retain accessible loading text.
- Expanded balance history: six exact records per page; graph retains all supplied
  observations. Hide the unused Wallets navigation, not the currency balance card.
- Send money offers saved recipients or Create new address. Creation remains part
  of successful transfer confirmation, not a new write during selection/review.
  The user chose **both send/receive limited to USD/GBP/EUR** in this interface;
  new addresses default to USD. Keep other balances visible and do not restrict
  backend/conversion capabilities or overwrite existing recipient defaults.
- User approved refreshing affected DESIGN.md/sidecar sections after completion.

## Operational boundary

Normal development was stopped before implementation. Verified SQLite backup:
`/app/data/wallet.sqlite.pre-workflow-1794469981334.bak`, all 15 tables identical,
integrity `ok`, no foreign-key violations. The normal wallet now contains actual
user activity: **2 accounts / 4 wallets / 2 funding attempts / 1 transfer attempt /
3 transactions / 4 journal entries / 3 portfolio observations**, plus existing
quotes/use and reference caches. Do not replace these with prior empty/two-deposit
assumptions. All monetary tests use isolated databases. No push.

## Verification

- Full Docker `npm run check`: **1,529 tests in 70 suites**, formatting, lint,
  TypeScript, production build and **59 artifact documents / 38 tasks** passed.
- A complete fresh-server Chromium run passes **109/109** journeys, including
  four success-dismissal methods, intended next-action forms, exact grouped input/
  caret and ungrouped POSTs, old/new recipient defaults, unknown-result recovery,
  request loading and six-row chart data disclosure.
- Corrected old assertions now follow readable dates, labels, recipient choices,
  safe success reset and the 100px amount field. The motion helper waits for an
  exiting recipient Select to leave the DOM before Escape, matching other Select
  helpers; the dialog focus test also checks actual DOM removal.
- The second visual batch covers **320/820/1440 in light/dark**: amount and all
  review types, empty activity, saved/new picker, loading/success/recovery and two
  balance-table pages. Full-document empty captures start at the document top;
  overlays are bounded viewport captures. All 13 six-viewport contact sheets were
  opened; native originals and capture scripts/results remain under
  `.impeccable/review/workflow/`. The supplemental capture run has zero page errors.
- One changed-UI detector pass: the thick-border warning targets the user-requested
  bottom-border focus indicator on a **zero-radius input**, not a rounded card.
  Font-size/radius advisories include existing documented local exceptions and
  requested new amount/review sizes. No blanket suppression or repeated scan.
- Before restoration, all **15 normal-wallet tables remain row-identical** to the
  backup, integrity `ok`, zero foreign-key violations. No normal money operation,
  seed, migration, dependency change or push ran.

The fresh independent full finish review returned **`ship`**, with **no material
fixes**, at the bounded D-037 scope. All 78 originals were valid; the reviewer
inspected the complete matrix and relevant source/recovery boundaries. The original
inline screenshot was represented by its pinned transcription, not claimed as
visible to the child. See [DESIGN_REVIEW.md](DESIGN_REVIEW.md) for scope/limits.
The approved affected-section documenter refreshed `DESIGN.md` and the valid v2
sidecar. The normative amount size now matches the responsive editor, its obsolete
fixed line height is removed, and amount/success component mappings are recorded.
All ten existing previews remain, with new amount and success/loading previews.
Palette/ramp/card colors, unrelated type/spacing/radius primitives, elevation,
existing motion tokens and breakpoints remain unchanged. Only the balance-card
history disclosure description changes for readable six-row paging; its roles do
not change. No unapproved drift repair, blanket detector exception or raster work.

T11-09 is closed; the board is **38 tasks: 6 To do / 2 In progress / 30 Done**.

## Restored development

The normal development service is healthy again at `http://localhost:3000`.
The old development cache was retained as
`.next/dev.pre-workflow-1794471830280`; no broad cache deletion or volume removal.
A real Chromium probe rendered the actual main account and **three existing
completed records**, matched its available approximate total against the API,
verified grouped draft preservation across History navigation and privacy, and
passed **300 stable frames**. It recorded **one initial document navigation,
zero extra navigations, zero page/console errors and zero monetary/quote POSTs**.
Evidence: `.impeccable/review/workflow/restored-development.json` and `.png`.

After that normal read-only probe, all **13 non-cache tables remain row-identical**
to the verified backup, including migration metadata, quotes/use, attempts,
accounts/wallets, immutable observations, transactions and journal entries. Only
the catalog/rate caches refreshed legitimately. Counts remain **2 accounts /
4 wallets / 2 funding attempts / 1 transfer attempt / 3 transactions /
4 journal entries / 3 observations**, with **2 quotes / 1 quote use**. Integrity
`ok`; zero foreign-key violations. No normal seed, monetary test, migration,
dependency change, restore drill or remote push ran.
