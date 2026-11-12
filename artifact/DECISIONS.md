# Decision register

**Status:** Agreed choices are recorded below. An open item is not an approved decision. Stable IDs are referenced by feature PRDs, tasks, diagrams, and the kanban; do not reuse an ID for a different decision.

## Agreed decisions

### D-001

**Application stack:** Next.js App Router and TypeScript on Node.js 26, npm, SQLite, Drizzle ORM, and `better-sqlite3`. Select compatible versions and verify the native driver inside the container. Server-side validation such as Zod is preferred; its exact package/version remains open.

### D-002

**Local runtime:** Docker-first. Run the application, migrations, and tests in a Node 26 container; persist SQLite in a named volume. The wallet has no authentication and is intended for local use, not a public multi-user deployment.

### D-003

**Account model:** One simulated user operates a main account. Each entered unknown transfer destination ID can become a separate simulated account with currency wallets. The account switcher can inspect destination accounts, but only the main account can perform money-moving actions.

### D-004

**Wallets and currencies:** The main account starts with zero-balance USD, EUR, and GBP wallets and USD as its initial, changeable default. An account has at most one wallet per fiat currency. Allow adding fiat currencies listed by Frankfurter. Destination defaults are selected when accounts are created and remain inspect-only.

### D-005

**Funding providers:** Demo Bank, Community Bank, and Crypto Gateway are fictional labels for simulated deposits and withdrawals. There is no real bank, blockchain, payment provider, crypto-denominated wallet, or KYC integration.

### D-006

**Simulation outcomes:** Valid deposits, withdrawals, and transfers complete immediately with no fees. Invalid and unaffordable requests are rejected. Rejected attempts are not shown in transaction history. Additional limits or simulated pending/failed provider states are not agreed.

### D-007

**Reference-rate source:** Frankfurter is the only FX provider. Fetch the latest available reference rate on demand; it is not a continuously updated market price. If the API is unavailable, allow a cached exact-pair rate fetched within the preceding 24 hours, label it as cached, and block the operation if no eligible rate exists. Show the source rate date separately from fetch time.

### D-008

**FX quote:** Hold a displayed, server-validated quote for one minute. If it expires, refresh the preview and require confirmation again. Retain the applied rate and its source date in completed transaction details.

### D-009

**Conversion:** Convert between currencies in the main account. Automatically create a missing target wallet as part of the successful conversion; wallet creation, debit, credit, and transaction records must commit or roll back together.

### D-010

**Transfer:** An unknown destination ID creates a simulated destination account; choose its default currency during transfer. Use the destination default unless another target currency is selected, create a missing target wallet, and convert automatically when currencies differ. Reject the main account's own ID; use Convert for its own currencies.

### D-011

**Balance presentation:** Show individual wallet balances and an approximate total in USD. If a required rate is unavailable, mark the total unavailable instead of silently omitting a balance; individual balances remain visible.

### D-012

**History:** Show completed operations newest first, with type, currency, and date filters and individual details. Show a transfer as outgoing for the main account and incoming for the destination account. Rejected operations do not create history entries.

### D-013

**Interface:** Use shadcn/ui and Lucide React for a modern fintech interface, light and dark themes with system preference, smooth transitions, and reduced-motion support. The original approved sketch established pale-blue translucent panels, diffuse navy backdrop, rounded/raised controls, labelled icons, and three columns. [D-025](#d-025) supersedes that topology and desktop label treatment with two columns, icon tooltips, and draft-preserving money dialogs, retaining the frosted identity. See [DESIGN_REFERENCE.md](DESIGN_REFERENCE.md) for historical approval and [WALLET_REDESIGN.md](WALLET_REDESIGN.md) for the current brief. [DESIGN.md](../DESIGN.md) records actual tokens and reusable rules; [UI_FOUNDATION.md](UI_FOUNDATION.md) separates the preview from future connected features. Icons8 MCP remains removed.

### D-014

**Impeccable:** Use the requested design workflow. Impeccable is installed project-locally for OpenCode without automatic hooks. Product context and the frosted direction are user-confirmed; existing product questions remain open. [PRODUCT.md](../PRODUCT.md) captures product truth, `.impeccable/config.json` records code-first, and [DESIGN_REFERENCE.md](DESIGN_REFERENCE.md) records sketch approval. The shell was built, checked with the manual detector, and visually reviewed; [DESIGN_REVIEW.md](DESIGN_REVIEW.md) records the corrected finding and bounded verdict. [DESIGN.md](../DESIGN.md) and `.impeccable/design.json` capture the built system, rather than an unimplemented seed. This does not complete connected workflows or T11-03. See the [official guide](https://impeccable.style/tutorials/getting-started/).

### D-015

**Code organization and style:** Use feature-based organization, strict TypeScript, ESLint, and Prettier defaults. Keep feature tests near the relevant code; keep Playwright tests in a separate end-to-end directory.

### D-016

**Verification:** Use Jest/`next/jest` for unit and integration tests and Playwright for browser flows. Cover critical money rules, failure cases, and core flows; no percentage coverage threshold or CI is required initially. Provide Docker-based local lint, formatting, type, test, and build checks.

### D-017

**HTTP API:** Use Next.js Route Handlers, OpenAPI, and Swagger UI. Reuse validation schemas to generate documentation where possible; explicitly describe routes and test the documented contract. Return standard HTTP Problem Details with a machine-readable code. Agreed baseline status convention: 400 invalid request, 404 missing resource, 409 balance/quote/idempotency conflict, and 503 when no eligible FX rate is available.

### D-018

**Journal and money:** Derive wallet balances from debit/credit journal entries. Store amounts in integer currency minor units, use decimal-safe FX arithmetic, and round positive conversion results half up to the target currency's minor unit. Enforce atomic writes and protect against SQLite integer/aggregate overflow and JavaScript precision loss.

### D-019

**Idempotency:** Require `Idempotency-Key` on money-moving HTTP requests. One accepted key and request fingerprint represent one attempt: retrying the same key and input returns its original definitive success or error; reuse with different input is rejected. Store failed-result metadata separately from completed transaction history. If an outcome is unknown, retry with the same key; after a definite error, a deliberate new attempt uses a new key. Storage/recovery details remain [O-006](#o-006).

### D-020

**Project documentation:** Keep Markdown PRDs, decisions, diagrams, detailed tasks, handover, and a kanban in the project's `artifact/` directory. Impeccable may require its own project-root `PRODUCT.md`/`DESIGN.md`; do not relocate its context files without verifying its discovery rules.

### D-021

**Git commits:** Use the [Angular commit-message convention](https://github.com/angular/angular/blob/main/contributing-docs/commit-message-guidelines.md) and make one commit per coherent intention instead of combining unrelated changes into a large commit. Include the tests, documentation, and migrations needed for that same intention where appropriate; one intention does not mean one file or necessarily one entire task. Use `<type>(<scope>): <summary>`, with an optional project-relevant scope and an imperative, lowercase summary without a trailing period. Follow the Angular body/footer rules; see [CODING_GUIDE.md](CODING_GUIDE.md#git-and-commit-convention) and the agreed workflow in [D-022](#d-022).

### D-022

**Git setup and workflow:** Initialize a new local Git repository when implementation begins. Create small Angular-style commits automatically as each intention is completed and checked; do not create a remote or push without approval. Exclude the installed platform-specific Impeccable engine binary from version control while keeping the local copy; document and verify a reproducible restoration path. Do not stage unrelated user work.

### D-023

**Exact accounting precision and bounds (O-002):** Pin the attributed MIT-package accounting metadata extract from `@financica/iso4217@0.2.0`, not CLDR display digits; reject unknown or unspecified precision. Wallet eligibility remains separately restricted to eligible Frankfurter fiat codes. Freeze precision once used. Use native bigint minor units and exact integer-rational FX with positive half-up rounding; no decimal dependency is required. With `M = 9223372036854775807`, allow operation amounts `1..M`, balances `0..M`, deltas `-M..M`, and arbitrary-precision intermediate arithmetic. Stream journal entries in a consistent snapshot and validate only the final aggregate, without SQLite `SUM()`/`TOTAL()`. Reject overly precise user input rather than rounding it; serialize money/rates as decimal strings. Bounds, rate-text limits, provenance, and licensing limitations are documented in [MONEY.md](MONEY.md) and [CURRENCY_METADATA.md](CURRENCY_METADATA.md).

### D-024

**SQLite write serialization:** Use a top-level synchronous `BEGIN IMMEDIATE` boundary before checking journal-derived funds. Create required account/wallet rows, the completed transaction, all entries, and eventual technical success metadata in that one transaction. Reject nested/deferred outer transactions and promise callbacks; close scoped writers immediately and roll back even caught scope-method failures. Fetch rates before acquiring the reservation and later validate server-owned quotes inside it. Propagate lock/storage failures without automatic retries; full durable-result policy remains D-019/T10-02. See [JOURNAL.md](JOURNAL.md).

### D-025

**Focused wallet redesign:** After reviewing the built shell and light/dark
critique, the user chose a two-column overview and popup Send money from the left
menu, permitted icon-only desktop navigation with tooltips, requested actual
shadcn foundations throughout forms and utility controls, and approved execution.
This supersedes D-013's original three-column topology and always-visible desktop
labels, not the frosted visual identity or simulation boundary. Use accessible
names/focus tooltips, usable mobile labels, draft-preserving dialogs for money
actions, and styled account/theme/history controls. See [WALLET_REDESIGN.md](WALLET_REDESIGN.md).

### D-026

**App name and SVG assets:** The user named the app **CocoWallet** and requested
an SVG logo. Deliver self-contained full, inverse and icon-only vector assets
in the incumbent navy/icy-blue palette. No font/network/raster dependency or
automatic header/favicon replacement follows from this asset request. See
[BRANDING.md](BRANDING.md) for files, provenance and validation.

### D-027

**Apply CocoWallet branding and purposeful motion:** The user approved applying
the SVG logo to the app and requested smooth animations/transitions. This
supersedes D-026's asset-only integration limit. Preserve the frosted identity
and two-column layout; use bounded money-dialog/menu transitions, review/edit
continuity, coherent control/theme feedback, and reduced-motion alternatives.
No delayed page-load choreography, invented money animation, dependency, or
financial capability follows. See [MOTION.md](MOTION.md).

### D-028

**Currency flags and a distinct balance-history card:** The user requested US /
EU / UK-style currency flags and a navy/blue gradient balance card with a user
balance-history graph in both themes. Preserve the two-column layout, branding,
motion and exact-money boundaries. The graph only plots supplied account-scoped
recorded totals; the disconnected preview shows an honest unavailable state,
not sample history. This does not authorize new financial APIs, seeded balances,
or fabricated FX/valuation history. The user's follow-up requests larger, clearer
card headings and recognizable visual cues; increase title size/weight and add
purpose-specific Lucide icons without altering factual labels or layout topology.
See [BALANCE_CARD.md](BALANCE_CARD.md).

### D-029

**Start backend integration; defer visual feedback:** The user paused further UI
refinements and authorized backend implementation/integration. Start with the
planned persistent main-account setup, read-only account/wallet APIs and a dynamic
journal-backed overview. Finalize the two read routes documented in
[BACKEND_READS.md](BACKEND_READS.md); O-003's write/quote/history contracts and
O-006's durable-result details remain open. Do not enable financial submission,
invent rates/history or change the visual design while those stages are pending.

### D-030

**Durable funding retries and narrow reload recovery:** The user approved UUID
retry keys, indefinite retention of definitive results, replay of the original
success/error for identical key/input, and rejection of changed input. Malformed
requests are rejected before key acceptance. Concurrent retries cannot move funds
twice; timeout/storage failures require the same key, not a new attempt.
Only unresolved submission context (key, kind, wallet, amount and fictional
provider) may temporarily persist in per-tab session storage. Save and verify it
before sending; block submission if this cannot be done safely. Clear it when the
result is known; ordinary drafts still clear on reload. Deposit/withdrawal HTTP
contracts are fixed in [IDEMPOTENCY.md](IDEMPOTENCY.md). FX/history decisions are
not resolved by this approval. No real payments or provider integrations.

### D-031

**Fresh-first reference metadata:** The user clarified the offline catalog rule:
try the fresh Frankfurter list on every request, validate and cache successes,
and use the cache only when that request fails, within the discussed 24-hour
limit. Never use cache-first behavior. Missing/expired catalogs block new currency
selection, not existing wallet reads or simulated funding. Rates use only an
exact-pair fallback fetched less than 24 hours ago. Catalog and rate source/fetch
times remain distinct; future timestamps and the exact 24-hour boundary are
ineligible. Implement T06-01 without enabling quotes/conversion/transfers.

### D-032

**Server-owned quote lifecycle:** The user approved immutable persisted quote
terms, a full 60-second hold starting after rate retrieval/final validation, no
funds reservation, and at most one successful operation per quote. Failed attempts
do not consume it; monetary confirmation must recheck funds. Original successful
idempotent requests replay before checking quote expiry/consumption. After an
explanation, the user selected the full-minute policy: cached data must still be
under 24 hours old at issuance, but an already issued quote keeps its complete
60-second hold even if that cache boundary passes. An expired cache cannot issue
a new quote; an existing quote is never extended. T06-02 implements preview,
readback and internal validation/consumption safeguards, not conversion/transfer
HTTP submission. Exact contracts are in [QUOTES.md](QUOTES.md).

### D-033

**History dates and numbered pages:** The user selected inclusive UTC calendar
days for `from`/`to` history filters (YYYY-MM-DD), and **numbered pages**, not the
recommended cursor alternative. List/detail requests require explicit `accountId`;
currency filters match either affected side and an unrelated account's detail is
404. Use 50 records by default, at most 100 per page, newest first with a stable
transaction-ID tie-breaker. Each page/count shares one read snapshot, but new
activity between requests can shift records across pages; no cursor/snapshot-token
guarantee is implied. T09-01 implements read-only queries/API, not T09-02's full
history interface or T08-02's transfer submission.

### D-034

**History interface placement:** The user selected **Expand existing panel**:
keep compact recent activity, add Browse full history, and put filters, numbered
pages and inline transaction-detail/back navigation in that same card. Do not
introduce a separate page or modal. Inherit the existing visual world and preserve
money drafts/recovery, account isolation and privacy. This does not resolve
destination valuation, wallet/default management or Swagger. See [HISTORY.md](HISTORY.md).

### D-035

**Presentation refinement:** The user resumed visual feedback with screenshots:
compact signed/color-coded recent rows and income/outgoing icons, no demo badge or
large connection banner, concise green-check successes without technical keys,
tighter currency rows, and full History as a dedicated navigation page. This
**supersedes D-034's in-panel placement**, not its scoped filtering/detail contract.
Keep the existing frosted identity, truthful discreet prototype disclosure,
privacy, account isolation and internal monetary recovery. See
[PRESENTATION_REFINEMENT.md](PRESENTATION_REFINEMENT.md).

### D-036

**Recorded USD portfolio totals:** The user requested recalculated total-USD
time-series observations and a compact sparkline, plus Frankfurter integration.
They explicitly selected **Yes, read-only totals** for inspected destinations.
Value every nonzero wallet using direct eligible foreign→USD reference rates,
round each wallet half-up to cents, then sum exactly. Missing FX makes the entire
total unavailable; do not silently drop balances or revalue/fabricate old history.
Record actual account-scoped observations independently of successful monetary
commit/replay. The main-default/missing-wallet question remains open. See
[PRESENTATION_REFINEMENT.md](PRESENTATION_REFINEMENT.md).

## Questions and resolutions

### O-001

**Resolved by D-019:** An accepted key replays its original definitive result, including errors; a new intentional attempt uses a new key. The [worked comparison](IDEMPOTENCY.md) retains the alternatives and examples.

### O-002

**Resolved by D-023:** Explicit pinned accounting metadata, native bigint rational arithmetic, signed-storage-compatible business bounds, decimal-string serialization, and snapshot-based bigint aggregation replace any assumed two-decimal or floating-point fallback. See [MONEY.md](MONEY.md). The precision extract's upstream licensing caveat remains documented, not represented as a legal guarantee.

### O-003

**API details:** D-029–D-032 finalize account/wallet GETs, simulated funding
POSTs, reference metadata GETs and immutable quote preview/readback, including
their exact receipt/problem, idempotency/provenance/lifecycle contracts and
maintained OpenAPI document. See [QUOTES.md](QUOTES.md) for the quote slice.
T07-02 fixes conversion HTTP/recovery shapes in [CONVERSIONS.md](CONVERSIONS.md).
T10-01 now shares structural guard/schema definitions and HTTP response/request
conventions in [HTTP.md](HTTP.md), without selecting a generator or changing
implemented endpoint shapes.
D-033 and T09-01 fix the history query/detail slice in [HISTORY.md](HISTORY.md):
explicit account context, inclusive UTC days, either-side currency filtering and
numbered pages. T08-02 fixes transfer submission/review/recovery in
[TRANSFERS.md](TRANSFERS.md). Generation and other remaining wallet/default shapes stay
open in [API_DESIGN.md](API_DESIGN.md). Swagger UI is not implemented.

### O-004

**Account and display details:** Confirm whether the USD total also appears for an inspected destination account; define date-filter time-zone boundaries and behavior when changing a main-account default to a currency without a wallet.

The history date-filter portion is resolved by D-033: inclusive UTC calendar days,
not browser-local boundaries. D-036 subsequently approves independent read-only USD
totals and recorded observations for inspected destinations. Main-default behavior
when no matching wallet exists remains open.

### O-005

**Operational details:** Confirm offline currency-catalog behavior, backup/restore procedure, any maximum transaction limits, and whether additional simulated provider failures are required. No such provider states or limits are currently approved.

The catalog-offline portion is resolved by D-031. Backup/restore verification,
additional business limits and provider failure states remain open, not approved.

### O-006

**Resolved for funding by D-030:** UUID keys and definitive outcomes are retained
indefinitely. Canonical JSON binds kind and exact wallet/amount/provider strings
(object property order ignored; `1` and `1.00` are different input). Structural,
provider and decimal-syntax failures are pre-acceptance; resource, precision,
range and funds failures are recorded under the writer reservation. SQLite
serializes concurrent attempts; busy/storage failures return a nondefinitive 503
and require the same key. See [IDEMPOTENCY.md](IDEMPOTENCY.md). Extending these
mechanics to future conversion/transfer submission remains their implementation
work. D-032 requires existing monetary results to replay before quote expiry/use
checks; preview itself needs no money key and moves no funds.

T07-01 now extends this policy to the internal conversion service: immutable
separate conversion outcomes, exact quote/original-input binding and global key
ownership across funding/conversion. Replay precedes quote/current-funds/clock
checks; target creation, journal, quote use and success commit together. See
[CONVERSIONS.md](CONVERSIONS.md). T07-02 now adds the documented conversion endpoint,
explicit quote/confirmation UI and shared per-tab original-key recovery.
T08-01 now extends global ownership/retention to the internal transfer service,
including atomic simulated-recipient/wallet creation, quote-bound FX and rate-free
same-currency sends. See [TRANSFERS.md](TRANSFERS.md). T08-02 now connects transfer
HTTP/UI and shared original-key recovery; T09-02 subsequently adds full-history
browsing/details under D-034. Swagger remains separate work; the backend alone
never implied those features.

### O-007

**Resolved by D-022:** Local Git is initialized on `main`, and baseline commits are separated by intention. The installed Impeccable engine is excluded while remaining available locally. No remote or push was performed.

### O-008

**Resolved:** [TOOLING.md](TOOLING.md) and `scripts/setup-impeccable.sh` document pinned online/offline restoration and verification. The official Linux x64 asset was restored and run in an isolated directory; a deliberately corrupt source was rejected without replacing the valid engine. Other platform binaries are not tested in this Linux environment.

## Maintenance rule

When a choice changes, keep the ID stable, record the changed decision and rationale, and update affected PRDs, tasks, diagrams, API contract, and kanban. Move an open question to a new decision only after it is agreed.
