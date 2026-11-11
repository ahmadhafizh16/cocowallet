# Wallet interface foundation

**Scope:** [T11-02](tasks/TASKS-11.md#t11-02), following the user-approved
[frosted reference](DESIGN_REFERENCE.md), [surface brief](WALLET_SURFACE.md), and
[PRD-11](prd/PRD-11-interface.md). This is an interface-first implementation,
not completion of funding, FX, accounts, history, or idempotency APIs.

## Implemented surface

- `/` is an HTML wallet interface, not the old JSON foundation response. Desktop
  follows the approved sketch; tablet uses two columns and mobile stacks panels
  with labelled bottom navigation. “Actions” represents all four workflows.
- Native selects, visible labels, landmarks, a skip link, tabular exact money
  text, focus rings, and field-associated errors support keyboard use. Invalid
  fields and review headings receive focus; editing returns to the amount.
- Shared shadcn-style button/input/skeleton components and a Radix-backed dialog
  foundation are local source. Lucide supplies icons. No UI package or font/network
  dependency was added.
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

The inline workspace changes between Deposit, Withdraw, Convert, and Transfer.
It preserves separate drafts, uses the exact amount parser, rejects precision/
positive/bounds/funds errors, and reviews valid drafts. Providers are fictional;
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

The implementation passes the full Docker check, including **557 Jest tests** and
production build, plus Chromium checks against that build. Coverage includes
theme/storage, keyboard entry, draft/error focus, no financial submission, privacy,
zero-balance/self-transfer errors, clipboard fallback, history reset, 404 navigation,
reduced motion, loading/error rendering, and widths from 320 to 1440px. Destination
isolation uses explicit React fixtures, not fabricated application accounts.
Visual review covers desktop, tablet, mobile, dark, loading, error, review, and
invalid-input states. Detector results are not WCAG certification.

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
