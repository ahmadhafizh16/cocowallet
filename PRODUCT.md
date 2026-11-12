# Product

<!-- impeccable:product-schema 1 -->

The latest continuity follow-up is pinned in
[MODAL_CONTINUITY.md](artifact/MODAL_CONTINUITY.md) (D-038): ordinary amounts reset
to zero on reopening a money modal; Edit within the same modal keeps its amount.
Smooth input/review/done continuity uses the existing motion world; original pending/
unknown/error/blocked-storage recovery remains protected. Both Convert UI choices
are limited to USD/GBP/EUR, without hiding other balances or narrowing backend
capabilities. This supersedes ordinary amount retention across reopening below.

The previous workflow feedback is pinned in
[WORKFLOW_REFINEMENT.md](artifact/WORKFLOW_REFINEMENT.md) (D-037): amount-first
review, grouped numeric bottom-border entry, Done-only success and safe reset on
every confirmed-result dismissal, human-readable UTC dates/copy, green/loading
API controls, centered recent empty states, six-row observation paging and hidden
Wallets navigation. Send money offers saved/new addresses, USD defaults for new
addresses and USD/GBP/EUR for both currency choices; existing metadata, other
balances, backend/conversion capabilities and uncertain-outcome recovery remain.
The user selected **Currency rates**, not a streaming-rate claim, and approved
refreshing affected design documentation. Older success-dismissal copy is superseded.

## Platform

web

## Users

The primary audience is people trying a local wallet demo for evaluation. One simulated user operates a main account; inspecting a simulated destination account does not introduce another authenticated user or grant money-moving permissions.

The user confirmed this demo/evaluation purpose and the existing agreed decisions in [the decision register](artifact/DECISIONS.md) and [the interface requirements](artifact/prd/PRD-11-interface.md) during initialization. Open questions in those documents remain open.

## Product Purpose

Demonstrate multi-currency wallet workflows: holding fiat balances, simulating deposits and withdrawals, converting currencies, transferring to simulated destinations, and inspecting balances and completed transaction history.

Success means a person can understand balances, previews, and outcomes without mistaking the demo for real payment processing. No real funds move, and the product is not a production financial service.

## Positioning

A local, persistent wallet simulation with exact journal-based accounting, fictional funding-provider labels, and planned reference-rate FX. Its product truth is the inspectable behavior of the simulation, not claims about banking, custody, blockchain connectivity, or continuously updating market prices.

## Operating Context

- Use the web application locally through a browser. There is no authentication; the Docker host port is bound to localhost and must not be exposed publicly.
- The established implementation uses Next.js App Router, TypeScript, Node 26, npm, SQLite, Drizzle, and `better-sqlite3`. Application execution, migrations, and verification are Docker-first; see [README.md](README.md).
- SQLite persists in the Docker `wallet-data` named volume. Normal shutdown must not delete volumes. Backup/restore procedures remain an operational open question.
- The account switcher changes the account being inspected. Main-account money actions and destination-account inspection are distinct workflows, not login or impersonation.

## Capabilities and Constraints

### Confirmed product scope

- **Accounts and wallets:** The main account starts with zero-balance USD, EUR, and GBP wallets and USD as its initial, changeable default currency. There is at most one wallet per fiat currency per account. Additional wallet currencies must be eligible fiat codes listed by Frankfurter. Destination defaults are chosen during creation and are not editable through inspection.
- **Balances:** Show each wallet balance and an approximate USD total, independently of the main account's default currency. The user also approved independent read-only USD totals for inspected destinations (D-036). Convert each nonzero foreign wallet using a direct Frankfurter reference rate, round half-up to USD cents, then sum exactly. Missing FX makes the entire total unavailable; individual balances stay visible. Record actual account-scoped USD-total observations after activity for the compact sparkline; never invent or revalue old history.
- **Deposits and withdrawals:** Demo Bank, Community Bank, and Crypto Gateway are fictional provider labels only. Valid operations complete immediately with no fees. There are no real payment, bank, blockchain, crypto-denominated wallet, or KYC integrations.
- **Conversion:** Convert between main-account currencies and create a missing target wallet atomically with the successful operation. Use Frankfurter's latest available reference rate, not a streaming market price. Show the source rate date separately from fetch time and quote expiry. A displayed, server-validated quote lasts one minute; expiry requires a refreshed preview and renewed confirmation. During an outage, use only an exact-pair cached rate fetched within the preceding 24 hours, identify it as cached, and block when no eligible rate exists.
- **Transfers:** An unknown destination ID can create a simulated destination account, with its default currency selected during transfer. Default the target to that currency, allow another target currency, create a missing destination wallet, and convert when needed. Reject the main account's own ID; its own currency changes use Convert. Destination accounts are inspect-only, with the restriction enforced on the server as well as in the interface.
- **History:** Include completed operations only, newest first, with type, currency, and date filters. Details retain the ID, time, status, amounts/currencies, applicable provider or destination, and any applied exchange rate and source date. Transfers appear outgoing for the main account and incoming for the destination. Rejected attempts produce errors, not completed-history entries.
- **Money integrity:** Derive balances from immutable debit/credit journal entries. Use exact bigint minor units, pinned currency accounting precision, integer-rational FX, and positive half-up rounding to target precision. Reject invalid, zero, negative, overly precise, unaffordable, or out-of-bounds input; do not silently round user-entered amounts. Wallet creation, money entries, and completed transaction records commit or roll back together. See [the money contract](artifact/MONEY.md) and [the journal contract](artifact/JOURNAL.md).
- **API and retries:** Expose wallet operations through documented Next.js HTTP endpoints, OpenAPI, and planned Swagger UI. An accepted key and matching input replay the original definitive success/error; changed input is rejected. D-030 approves UUID keys, indefinite definitive-result retention and identical-key retry after uncertainty. Failed-result metadata stays separate from completed history. Only unresolved submission context may temporarily use per-tab session storage; save/verify before sending, clear when known, block unsafe storage.

### Implementation boundary

Implemented before interface work: the Docker/Next.js foundation, health/readiness endpoints, migrations and accounting tables, exact-money utilities, journal-derived snapshot balances, and serialized atomic journal writes. Evidence and verification are recorded in [the handover](artifact/HANDOVER.md).

The interface connects persistent journal balances, reviewed funding/conversion/transfers and shared original-key recovery. Frankfurter supplies exact fresh-first reference rates and immutable one-minute quotes. The user's presentation refinement (D-035/D-036) connects approximate USD valuation and recorded observations, compact signed recent rows, concise confirmed-success checkmarks, tighter wallet rows and a dedicated History page. A shared route shell keeps account/privacy/money drafts in memory across navigation; only unresolved submissions use per-tab recovery storage. Wallet/default editing and generation/Swagger retain their tasks. See [the presentation/valuation boundary](artifact/PRESENTATION_REFINEMENT.md), [history](artifact/HISTORY.md) and [kanban](artifact/KANBAN.md).

### Deliberately open decisions

- [O-003](artifact/DECISIONS.md#o-003): OpenAPI generator and remaining wallet/default routes. Implemented funding, quote, conversion, transfer, history and portfolio contracts are fixed in their feature documents.
- [O-004](artifact/DECISIONS.md#o-004): changing the main default to a currency without a wallet. Inclusive UTC history days are settled by D-033 and read-only destination totals by D-036.
- [O-005](artifact/DECISIONS.md#o-005): backup/restore, additional limits and simulated provider failures remain open. D-031 resolves catalog offline behavior: try fresh first on every request, cache valid success, and only fall back after failure using data less than 24 hours old. No extra business limits or provider states are approved.
- O-006 is resolved for implemented funding/conversion/transfers through their documented indefinite original-result/recovery contracts; presentation and valuation cannot change those monetary results.

## Brand Commitments

- **CocoWallet** is the user-supplied app name. “Simulated multi-currency wallet” remains the project descriptor. The user subsequently approved applying the [SVG logo](artifact/BRANDING.md) to the app and requested smooth interaction transitions. Header/loading/error/404 branding, favicon and page metadata now use it; [MOTION.md](artifact/MOTION.md) records bounded motion and reduced-motion safeguards. This does not authorize another layout or financial-capability redesign.
- Preserve the confirmed modern fintech requirement, registry-derived shadcn/ui foundations, Lucide React, light/dark themes, and system theme preference. Desktop icon navigation has accessible names and real tooltips; mobile navigation retains visible labels.
- The user-approved frosted identity stays: pale-blue glass, diffuse navy backdrop, rounded panels, and softly raised controls. The later [two-column redesign](artifact/WALLET_REDESIGN.md) and [D-025](artifact/DECISIONS.md#d-025) supersede the original sketch's three-column topology and permanent transfer workspace. All four money forms use draft-preserving dialogs; theme/account/history controls use themed shadcn/Radix components. The [original approval](artifact/DESIGN_REFERENCE.md) remains historical material authority; the earlier Atlas proposal was not locked. [DESIGN.md](DESIGN.md) captures reusable visual rules; [the review record](artifact/DESIGN_REVIEW.md) preserves verdict scope and limitations. Example balances, rates, and history are not seed data.
- D-035 removes the demo badge and large connection banner for interview presentation. Use one discreet visible footer, **Prototype · Local ledger only. No real funds move.**, rather than repeated global alerts. Concise success summaries require a confirmed server result; never imply real banking/blockchain processing or call reference rates live/streaming prices. The stored `demo_bank` provider code is unchanged; its presentation label is **Bank account**.
- The user retains decorative US/EU/UK flags, the opaque navy-gradient balance card and larger semibold icon headings. Their subsequent screenshots place a compact recorded-total sparkline to the right of the amount, above the actions, and reduce wallet-row spacing. Missing/private history has no invented line. The old separate disconnected chart/grid is superseded by D-035/D-036; see [PRESENTATION_REFINEMENT.md](artifact/PRESENTATION_REFINEMENT.md).
- Visual feedback has resumed for the explicitly requested refinement. Preserve the surrounding frosted identity, theme/motion/focus/accessibility and accounting safeguards; do not treat the references as permission for a new visual identity or real payment integration.

## Evidence on Hand

- [The main PRD](artifact/PRD.md), [decision register](artifact/DECISIONS.md), feature PRDs, and linked task files contain the confirmed scope and explicit proposals/open questions.
- [The handover](artifact/HANDOVER.md), [money contract](artifact/MONEY.md), and [journal contract](artifact/JOURNAL.md) record implemented behavior and verification; they are not customer or marketing evidence.
- Implementation paths include `src/features/money/`, `src/features/journal/`, `src/server/db/`, and the interface in `src/features/wallet/`, `src/components/ui/`, and `src/app/page.tsx`. The approved sketch and built shell are visual authority; do not restart identity exploration during feature integration.
- No customer testimonials, adoption figures, performance benchmarks, regulated status, or product-brand assets were supplied or approved during initialization. Do not fabricate them.

## Product Principles

1. Make the simulation boundary unmistakable; never imply real financial processing.
2. Preserve exact accounting and atomic outcomes rather than hiding precision or storage failures.
3. Make rate provenance, cached status, and quote expiry understandable before confirmation.
4. Keep main-account actions separate from destination-account inspection.
5. Show missing information and rejected requests honestly without inventing balances, totals, or history.

## Accessibility & Inclusion

Support desktop and narrow-screen use, semantic labels, keyboard navigation, visible focus, readable contrast in both themes, and reduced-motion preferences. Preserve access to controls and labels on mobile layouts. Provide understandable loading, empty, validation, insufficient-funds, rate-unavailable, quote-expired, confirmation, and success states, with an appropriate next step. No additional product-specific accessibility standard was established during init.
