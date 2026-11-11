# Wallet interface foundation

**Scope:** [T11-02](tasks/TASKS-11.md#t11-02) and [T11-04](tasks/TASKS-11.md#t11-04),
following the [two-column redesign brief](WALLET_REDESIGN.md), the retained
[frosted identity](DESIGN_REFERENCE.md), [surface brief](WALLET_SURFACE.md), and
[PRD-11](prd/PRD-11-interface.md). This is an interface-first implementation,
not completion of funding, FX, accounts, history, or idempotency APIs.
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
  details remain in page memory; theme is the only persisted preference.
- History filters/reset, ID copy/manual fallback, and section navigation work.
  Wallets are scoped by account ID; explicit destination test fixtures show
  inspect-only status and disabled money actions. The default model invents no
  real destination account.

## Honest data and operations

`createPreviewOverview()` supplies **presentation-only** zero values for
USD/EUR/GBP, empty history, and a main-account placeholder. It does not seed or
query the database. The interface labels this boundary, including the total's
“not a stored balance” note. Invalid values become unavailable, not zero. Nonzero
cross-currency totals are unavailable without rates.

An always-mounted `OperationWorkspace` owns Deposit, Withdraw, Convert and Send
money dialogs. Closing/reopening preserves separate drafts and reviews; reloading
clears them. It uses the exact parser and distinguishes missing, zero, precision,
format, bounds and funds errors. Changing source currency clears dependent
errors and an identical receiving currency; the source is disabled in the target
options. One conversion has one visible context. Valid drafts can be reviewed. Providers are fictional;
rates/quotes are not invented; recipients are not verified or saved. The bounded
recipient input guard is preview validation, **not** a final HTTP ID contract.

**Every final money submission is disabled with a connection explanation.**
No preview action changes balances/history, creates accounts, sends a financial
request, or claims success. Keep these safeguards until real server services and
durable idempotency are integrated. Client validation is not server security.

## Loading, errors, and motion

- `src/app/loading.tsx` uses the real dashboard skeleton with matching panel
  geometry, one announcement, and noninteractive decorative placeholders.
- There is **no fake/minimum-duration loader**. Next renders loading when needed;
  the static preview is fast. Capture tests render the real loading component
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

The interface passes the full Docker check, including **572 Jest tests** and
production build, plus **38 Chromium checks** against that build. Coverage includes
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
