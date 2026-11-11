# Product

<!-- impeccable:product-schema 1 -->

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
- **Balances:** Show each wallet balance and an approximate USD total, independently of the main account's default currency. When a required rate is unavailable, mark the total unavailable rather than silently excluding a balance; preserve the individual balances.
- **Deposits and withdrawals:** Demo Bank, Community Bank, and Crypto Gateway are fictional provider labels only. Valid operations complete immediately with no fees. There are no real payment, bank, blockchain, crypto-denominated wallet, or KYC integrations.
- **Conversion:** Convert between main-account currencies and create a missing target wallet atomically with the successful operation. Use Frankfurter's latest available reference rate, not a streaming market price. Show the source rate date separately from fetch time and quote expiry. A displayed, server-validated quote lasts one minute; expiry requires a refreshed preview and renewed confirmation. During an outage, use only an exact-pair cached rate fetched within the preceding 24 hours, identify it as cached, and block when no eligible rate exists.
- **Transfers:** An unknown destination ID can create a simulated destination account, with its default currency selected during transfer. Default the target to that currency, allow another target currency, create a missing destination wallet, and convert when needed. Reject the main account's own ID; its own currency changes use Convert. Destination accounts are inspect-only, with the restriction enforced on the server as well as in the interface.
- **History:** Include completed operations only, newest first, with type, currency, and date filters. Details retain the ID, time, status, amounts/currencies, applicable provider or destination, and any applied exchange rate and source date. Transfers appear outgoing for the main account and incoming for the destination. Rejected attempts produce errors, not completed-history entries.
- **Money integrity:** Derive balances from immutable debit/credit journal entries. Use exact bigint minor units, pinned currency accounting precision, integer-rational FX, and positive half-up rounding to target precision. Reject invalid, zero, negative, overly precise, unaffordable, or out-of-bounds input; do not silently round user-entered amounts. Wallet creation, money entries, and completed transaction records commit or roll back together. See [the money contract](artifact/MONEY.md) and [the journal contract](artifact/JOURNAL.md).
- **API and retries:** Expose wallet operations through documented Next.js HTTP endpoints, OpenAPI, and Swagger UI. Use Problem Details errors and idempotency keys for money-moving HTTP requests. An accepted key and matching input replay their original definitive success or error; different input with the same key is rejected. Failed-result metadata stays separate from completed history. Durable storage and recovery details are not yet settled.

### Implementation boundary

Implemented before interface work: the Docker/Next.js foundation, health/readiness endpoints, migrations and accounting tables, exact-money utilities, journal-derived snapshot balances, and serialized atomic journal writes. Evidence and verification are recorded in [the handover](artifact/HANDOVER.md).

At initialization, account seeding, wallet HTTP journeys, durable idempotency, Frankfurter/quotes, Swagger, and the interface did not exist. The approved frosted interface-preview shell now exists at `/`, with reusable controls and skeleton/empty/error/review states. Zero values are explicitly presentation-only; services remain disconnected and final submissions are disabled. Account/API/FX integration is future work. See [the interface record](artifact/UI_FOUNDATION.md) and [kanban](artifact/KANBAN.md) before presenting planned capabilities as available.

### Deliberately open decisions

- [O-003](artifact/DECISIONS.md#o-003): final HTTP routes and schemas, quote contract, OpenAPI generator, filtering/pagination, and error details.
- [O-004](artifact/DECISIONS.md#o-004): whether inspected destinations also show a USD total, date-filter time-zone boundaries, and changing the main default to a currency without a wallet.
- [O-005](artifact/DECISIONS.md#o-005): offline currency-catalog behavior, backup/restore, additional limits, and additional simulated provider failures. No extra pending/failed provider states or additional transaction limits are approved.
- [O-006](artifact/DECISIONS.md#o-006): idempotency key constraints/retention, fingerprints, pre-acceptance malformed requests, in-progress behavior, and recovery when an outcome cannot be durably stored.

## Brand Commitments

- “Simulated multi-currency wallet” is the existing project descriptor; no separate product name or logo was approved during init.
- Preserve the confirmed modern fintech interface requirement, shadcn/ui, Lucide React with visible labels, light/dark themes, and system theme preference.
- After initialization, the user supplied a frosted banking-dashboard reference and approved its wallet-specific adaptation. Preserve that direction: pale-blue glass surfaces, diffuse navy backdrop, rounded panels, softly raised circular controls, and the sketch's three-column desktop composition with responsive stacking. The [approved brief](artifact/DESIGN_REFERENCE.md) records scope and approval; the earlier Atlas proposal was not locked. [DESIGN.md](DESIGN.md) now records the built interface's tokens and visual rules, with the [review record](artifact/DESIGN_REVIEW.md) preserving verdict scope and limitations. Example balances, rates, and history are not approved seed data.
- Name simulation boundaries and fictional providers plainly. Do not imply real funds moved or call reference rates live/streaming market prices. No additional brand voice was established.

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
