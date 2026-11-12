# Wallet interface foundation

**Latest follow-up:** [D-038](DECISIONS.md#d-038) resets ordinary amounts/reviews to
zero on explicit reopen, preserves amounts when editing within an open modal, and
restricts both Convert UI choices to USD/GBP/EUR. Shared task-step motion and a
bounded dialog resize preserve focus; privacy/reduced motion remain immediate.
Recovery requests/keys/quotes are never reset. See
[MODAL_CONTINUITY.md](MODAL_CONTINUITY.md); historical draft-retention wording below
does not override this newer request.

**Current refinement:** [D-037](DECISIONS.md#d-037) and
[WORKFLOW_REFINEMENT.md](WORKFLOW_REFINEMENT.md) supersede the historical entry/
success presentation below: grouped exact decimal bottom-border amounts,
screenshot-led reviews, saved/new addresses (USD default, USD/GBP/EUR Send UI),
Done-only safely dismissed successes, human UTC dates and six-row balance paging.
The dedicated History route and valuation were already connected by D-035/D-036.
Unknown outcomes, blocked storage, backend currency capabilities and existing
recipient defaults remain protected; these changes do not introduce real payments.

**Scope:** [T11-02](tasks/TASKS-11.md#t11-02) and [T11-04](tasks/TASKS-11.md#t11-04),
following the [two-column redesign brief](WALLET_REDESIGN.md), the retained
[frosted identity](DESIGN_REFERENCE.md), [surface brief](WALLET_SURFACE.md), and
[PRD-11](prd/PRD-11-interface.md). This is an interface-first implementation,
not itself completion of financial APIs. Subsequent [funding integration](FUNDING.md)
adds durable simulated deposit/withdrawal confirmation/recovery, while FX and full
history remain future work. The earlier
[backend read slice](BACKEND_READS.md) connects persistent account data without
changing the visual system; further UI feedback is deferred.
The later [T11-06](tasks/TASKS-11.md#t11-06) applies CocoWallet branding and
bounded motion without changing these integration limits.

## Implemented surface

- `/` is a two-column wallet overview: total/actions and compact history at left,
  currency wallets at right. Count/default metadata is integrated; no conversion
  teaser, permanent form column, or large account object remains. At 1023px and
  below, content stacks as total, wallets, history; at 760px and below, navigation
  becomes labelled fixed bottom navigation with a named Actions menu.
- Desktop icon navigation uses real hover/focus tooltips and accessible names.
  Money actions open named dialogs with focus trapping, initial focus, Escape,
  and return to a stable trigger. Invalid fields/review headings receive focus;
  editing returns to the amount. Landmarks, skip link and tabular exact money stay.
- Shared controls are registry-derived shadcn Button, Card, Dialog, DropdownMenu,
  Tooltip, Field/Label, Badge, Separator, Input, Select and Skeleton, adapted to
  wallet tokens. Theme/account use radio menus; history uses Select. Lucide supplies icons.
  No UI package or font/network dependency was added.
- System/light/dark applies before paint, follows later system changes, and
  persists as a browser preference. With blocked storage, it works for this visit
  and explains the limitation.
- Privacy masks displayed amounts and blanks read-only amount fields without
  destroying drafts or disguising money fields as password credentials. Form
  ordinary drafts remain in page memory. Theme is persisted as a preference;
  D-030 separately permits temporary unresolved intent in per-tab storage.
- History filters/reset, ID copy/manual fallback, and section navigation work.
  Wallets are scoped by account ID; explicit destination test fixtures show
  inspect-only status and disabled money actions. The default model invents no
  real destination account.

## Honest data and operations

`createPreviewOverview()` remains a **test-only** presentation fixture. The live
dynamic page reads persistent accounts and journal balances, labels them
“Balances connected,” and exposes the actual stored account ID. GET never seeds;
explicit migration/seed commands initialize startup metadata with no funds. Main
USD-only/zero totals require no FX; nonzero foreign balances make the total
unavailable while individual balances remain visible. Invalid data is not zero,
and unknown transaction history is explicitly disconnected, not empty activity.

An always-mounted `OperationWorkspace` owns Deposit, Withdraw, Convert and Send
money dialogs. Closing/reopening preserves separate drafts and reviews; reloading
clears them. It uses the exact parser and distinguishes missing, zero, precision,
format, bounds and funds errors. Changing source currency clears dependent
errors and an identical receiving currency; the source is disabled in the target
options. One conversion has one visible context. Valid drafts can be reviewed. Providers are fictional;
rates/quotes are not invented; recipients are not verified or saved. The bounded
recipient input guard is preview validation, **not** a final HTTP ID contract.

**Review alone never moves funds.** Funding/conversion require an explicit
simulated confirmation and verified per-tab recovery storage before sending.
Conversion review first requests validated server-owned terms, shows provenance
and expiry, and requires renewed review after expiry. Validated server outcomes
show receipts and refresh balances/bounded completed activity; unknown outcomes
retain immutable input/key/quote for explicit recovery. T08-02 now connects
transfers through that same slot: exact arbitrary IDs/defaults, no-FX same-currency
or expiring FX review and inspect-only incoming recent facts. The existing visual
system is retained. T09-02 subsequently adds in-panel history filters/numbered pages/
details through scoped GETs without touching monetary recovery; valuation remains
separate. See [HISTORY.md](HISTORY.md) and
[TRANSFERS.md](TRANSFERS.md).
Client validation never replaces server role, precision, funds or idempotency
enforcement. See [FUNDING.md](FUNDING.md) and [CONVERSIONS.md](CONVERSIONS.md).

## Loading, errors, and motion

- `src/app/loading.tsx` uses the real dashboard skeleton with matching panel
  geometry, one announcement, and noninteractive decorative placeholders.
- There is **no fake/minimum-duration loader**. Next renders loading when needed;
  no minimum loading delay is added. Capture tests render the real loading component
  independently to inspect its appearance.
- `src/app/error.tsx` offers retry without exposing exceptions or claiming a known
  outcome. The branded 404 links to the overview. Error captures verify rendering,
  not an induced production network failure or full idempotency recovery.
- JS-dependent controls stay disabled until hydration attaches their handlers.
  Next allows the exact private `wallet.test` development origin so HMR protection
  does not block browser-test hydration.
- Reduced motion removes pulse/transition/smooth scrolling; reduced transparency
  makes surfaces opaque; forced colours retain control borders. Mobile controls
  have scroll clearance for fixed bottom navigation.

## Verification and remaining scope

### Historical form-component correction (before T11-04)

The user identified that the form controls looked too much like default HTML.
The amount editor had bypassed the shared Input, and money-form dropdowns used
native selects. These now use registry-derived shadcn/ui Input and Radix Select
components with Tailwind semantic tokens, visible field borders/fills, consistent
focus/error rings, 44px controls, and a 56px amount field. Skeleton dimensions
followed the corrected fields. Theme/account/history utility selects were still
native at that milestone; T11-04 replaces them with themed shadcn/Radix controls.

Sources: official [Input registry](https://ui.shadcn.com/r/styles/new-york-v4/input.json)
and [Select registry](https://ui.shadcn.com/r/styles/new-york-v4/select.json).
The [upstream MIT license](https://raw.githubusercontent.com/shadcn-ui/ui/main/LICENSE.md)
is retained in `src/components/ui/LICENSE.shadcn`. Existing Radix and Lucide
dependencies are reused; no package was added. shadcn/ui is copied component
source, not a separate CSS framework or runtime component package.

Browser regressions cover keyboard selection/typeahead, Escape focus restoration,
provider menus at 320px/light, 390px/dark and desktop, computed field boundaries,
and retained validation/review/privacy behavior.

### Current verification and scope

The application passes the full Docker check, including **867 Jest tests** and
production build, plus **51 Chromium checks** against the isolated build. Coverage includes
theme/storage, keyboard entry, draft/error focus, no financial submission, privacy,
zero-balance/self-transfer errors, clipboard fallback, history reset, 404 navigation,
reduced motion, loading/error rendering, and widths from 320 to 1769px. Destination
isolation uses explicit React fixtures, not fabricated application accounts.
Production captures cover desktop light/dark, user widths 1688/1769px, tablet,
320/390px mobile, menus, dialogs, loading, error, review, and invalid-input states.
The two development regressions were fixed without dropping assertions: clipboard
status lives inside the modal account menu, and the keyboard test awaits Radix's
scheduled typeahead focus before Enter. Dialog initial focus is synchronous.
The final inspection also corrected a global reset overriding utility spacing.
Detector inventory advisories and independent verdict scope belong in
[DESIGN_REVIEW.md](DESIGN_REVIEW.md), not a claim of WCAG certification.

The applied CocoWallet vector logo follows explicit light/dark ink and fits
320px alongside the theme/account controls; favicon and metadata match. Dialogs
settle in 240ms and dismiss in 120ms; menus, review/edit and control feedback use
180ms, theme colors 220ms. Blur stays constant. Reduced motion makes these
effects immediate, while privacy masks remain immediate in every mode. The
animation tests observe real start/completion events, interruption, mobile
menu-to-dialog focus, and no remaining running animation work at rest. Helpers
await actual Radix exit unmounts, not arbitrary sleeps. See [MOTION.md](MOTION.md).
Interrupted arrivals now dismiss from their rendered frame instead of jumping
fully open; targeted production comparisons verify opacity/position/scale
continuity for dialogs, scrims and both menu types.

The later [T11-07](tasks/TASKS-11.md#t11-07) adds US/EU/UK currency flags,
an opaque navy-gradient balance surface shared by both themes, and 22px semibold
card headings with distinct icons (20px on compact phones). History plots only
verified account-scoped recorded USD totals; no series is supplied by the preview.
Seventy chart tests and extended dashboard tests cover exact bounds, dates,
missing/empty/invalid/private states and account isolation. Three added Chromium
journeys verify contrast, header sizing, flag fit, keyboard-accessible fixture
tables, privacy and forced colors. Populated fixture captures are explicitly
test-only. See [BALANCE_CARD.md](BALANCE_CARD.md).

Connected accounts/history, server quotes, success receipts, and operation outcomes
remain their own tasks. Cross-feature accessibility/motion acceptance remains
T11-03. See [HANDOVER.md](HANDOVER.md) for final counts and review outcome.

Production-browser verification without a dev compiler sharing Next output:

```sh
docker compose stop app
docker compose run --rm app npm run check
# Run in a separate terminal while browser checks execute:
docker compose run --rm --service-ports --name simulated-wallet-ui-preview app npm run start
docker compose --profile test run --rm --no-deps -e BASE_URL=http://simulated-wallet-ui-preview:3000 browser-tests
# Stop the preview with Ctrl+C, or target only that container:
docker stop simulated-wallet-ui-preview
docker compose up -d app
```
