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

**Interface:** Use shadcn/ui and Lucide React for a modern fintech interface, light and dark themes with system preference, smooth transitions, and reduced-motion support. Icons8 MCP was removed. Tailwind and exact visual tokens remain implementation/design proposals.

### D-014

**Impeccable:** Use the requested design workflow. Impeccable is installed project-locally for OpenCode without automatic hooks; `/impeccable init` and product-context review remain pending before design. See the [official guide](https://impeccable.style/tutorials/getting-started/).

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

## Questions and resolutions

### O-001

**Resolved by D-019:** An accepted key replays its original definitive result, including errors; a new intentional attempt uses a new key. The [worked comparison](IDEMPOTENCY.md) retains the alternatives and examples.

### O-002

**Precision and bounds:** Select authoritative fiat minor-unit metadata, the decimal arithmetic library and precision, supported amount/aggregate bounds, and an overflow-safe journal aggregation strategy. Frankfurter's currency list alone must not be assumed to define all minor-unit rules.

### O-003

**API details:** Finalize route names, request/response shapes, quote creation/confirmation contract, OpenAPI generator, filtering/pagination, and error types. Candidate routes are proposals in [API_DESIGN.md](API_DESIGN.md), not implemented endpoints.

### O-004

**Account and display details:** Confirm whether the USD total also appears for an inspected destination account; define date-filter time-zone boundaries and behavior when changing a main-account default to a currency without a wallet.

### O-005

**Operational details:** Confirm offline currency-catalog behavior, backup/restore procedure, any maximum transaction limits, and whether additional simulated provider failures are required. No such provider states or limits are currently approved.

### O-006

**Idempotency implementation details:** Define key format/size and retention, canonical request fingerprinting, how malformed requests are handled before a key is accepted, behavior while the first request is in progress, and recovery when the database cannot durably store an outcome. These details must preserve the stable-result decision in D-019 without claiming guarantees when no durable result exists.

### O-007

**Resolved by D-022:** Initialize locally when implementation begins, commit automatically by intention, and exclude the approximately 22 MB Impeccable engine binary while retaining it locally. No Git repository or commit has been created yet.

### O-008

**Skill restoration details:** Document and verify how to restore the excluded Impeccable engine with the required version and integrity checks, including supported platforms and offline/network limitations. Excluding the binary must not silently make the committed design skill unusable on a fresh checkout.

## Maintenance rule

When a choice changes, keep the ID stable, record the changed decision and rationale, and update affected PRDs, tasks, diagrams, API contract, and kanban. Move an open question to a new decision only after it is agreed.
