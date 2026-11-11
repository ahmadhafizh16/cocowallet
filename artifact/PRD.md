# Product requirements: simulated multi-currency wallet

**Status:** Persistent account reads and durable simulated deposits/withdrawals
now connect the existing interface to exact journal accounting. Reviewed
confirmation, original-key recovery and partial completed-funding visibility work.
Reference catalog/rates, bounded persistent fallback and T06-02's immutable
one-minute quote previews/readback now exist. Quotes reserve no funds; actual
conversion/transfer submission, quote UI, full history/valuation and Swagger remain
future work. Visual feedback is deferred. See [QUOTES.md](QUOTES.md), linked feature
PRDs and [KANBAN.md](KANBAN.md) for actual acceptance boundaries.

T07-01 now adds the internal atomic conversion service, including missing target
creation, exact quote use and durable original-result replay. This does not enable
conversion submission or UI confirmation; see [CONVERSIONS.md](CONVERSIONS.md).

## Goal

Build a simple digital wallet for one simulated user. The user can hold balances in multiple currencies, simulate deposits and withdrawals, convert funds, make transfers, and inspect balances and transaction history.

This is a simulation. It has no real payment provider, authentication, bank integration, or KYC.

## Feature PRD index

The feature PRDs link to their governing decisions and detailed task files. Their diagrams describe the **proposed** behavior, not an existing implementation.

| Feature | Scope | Detailed tasks |
| --- | --- | --- |
| [PRD-01: Platform](prd/PRD-01-platform.md) | Git setup, Docker, Node, SQLite persistence, application setup | [Tasks 00](tasks/TASKS-00.md), [Tasks 01](tasks/TASKS-01.md) |
| [PRD-02: Journal and money](prd/PRD-02-journal.md) | Exact arithmetic, journal-derived balances, atomicity | [Tasks 02](tasks/TASKS-02.md) |
| [PRD-03: Accounts and wallets](prd/PRD-03-accounts.md) | Main/destination accounts, currencies, balances | [Tasks 03](tasks/TASKS-03.md) |
| [PRD-04: Deposits](prd/PRD-04-deposits.md) | Simulated provider funding | [Tasks 04](tasks/TASKS-04.md) |
| [PRD-05: Withdrawals](prd/PRD-05-withdrawals.md) | Simulated provider withdrawals | [Tasks 05](tasks/TASKS-05.md) |
| [PRD-06: FX rates and quotes](prd/PRD-06-rates.md) | Frankfurter, cache, one-minute previews | [Tasks 06](tasks/TASKS-06.md) |
| [PRD-07: Conversion](prd/PRD-07-conversion.md) | Atomic main-account currency conversion | [Tasks 07](tasks/TASKS-07.md) |
| [PRD-08: Transfers](prd/PRD-08-transfers.md) | New/existing simulated destination accounts | [Tasks 08](tasks/TASKS-08.md) |
| [PRD-09: History](prd/PRD-09-history.md) | Lists, filters, individual transaction details | [Tasks 09](tasks/TASKS-09.md) |
| [PRD-10: HTTP API](prd/PRD-10-api.md) | Route Handlers, Problem Details, idempotency, Swagger | [Tasks 10](tasks/TASKS-10.md) |
| [PRD-11: Interface](prd/PRD-11-interface.md) | Impeccable, shadcn/ui, Lucide, themes, motion | [Tasks 11](tasks/TASKS-11.md) |
| [PRD-12: Quality and handover](prd/PRD-12-quality.md) | Jest, Playwright, local checks, operational handover | [Tasks 12](tasks/TASKS-12.md) |

See [diagrams](DIAGRAMS.md), the [decision register](DECISIONS.md), and [kanban](KANBAN.md) for flow, rationale, and status.

## Functional scope

1. **Wallets and balances** — Each simulated account has a default currency and can contain one wallet per fiat currency. The main account's default is initially USD and can be changed; it starts with zero-balance USD, EUR, and GBP wallets and can add fiat currencies listed by Frankfurter. Show each balance plus an approximate total in USD; if a required rate is unavailable, show the total as unavailable while keeping individual balances visible. A menu switches to created destination accounts for **inspection only**; destination defaults cannot be changed, and money-moving actions remain available on the main account.
2. **Deposit** — Simulate funding a wallet using Demo Bank, Community Bank, or Crypto Gateway. These are labels only: no real account details, integrations, or crypto-denominated wallets are required. Record the operation and its provider.
3. **Withdraw** — Simulate withdrawing to the same selectable providers and record the operation and provider.
4. **Convert** — Use Frankfurter's latest available reference rate and show its reference date. Hold a previewed quote for one minute; if it expires, refresh and obtain confirmation again. Create a missing target-currency wallet as part of a successful conversion. Record the completed conversion and rate used. When the API is unavailable, allow a rate fetched within the previous 24 hours and label it as cached; block the conversion if no eligible rate exists.
5. **Transfer** — Enter a destination account ID; for an unknown ID, choose its default currency during the transfer and create and credit a simulated destination account. Default to its default currency but allow choosing another destination currency; create a missing destination-currency wallet automatically. Convert when it differs from the source currency, record the transaction, and make the destination inspectable from the account switcher. Reject the main account's own ID and use Convert for its different currencies.
6. **History and details** — Show completed transactions, newest first, with basic filters for type, currency, and date. A transfer appears as outgoing in the main account's history and incoming in the destination account's history. Details include ID, time, type, status, amounts and currencies, provider or destination as applicable, and any exchange rate and date. Rejected attempts show an error but are not added to history.
7. **HTTP API** — Expose the application's operations through documented Next.js HTTP endpoints, with an OpenAPI specification and Swagger UI. Endpoint details are proposed in [API_DESIGN.md](API_DESIGN.md).

## External rate constraint

Frankfurter does not supply continuously updating live market prices. Its reference rates are published by their sources once or a few times per day. The API supports some crypto assets, but their coverage is limited. See the [Frankfurter documentation](https://frankfurter.dev/).

After discussing the distinction, the user confirmed Frankfurter alone is sufficient. Fetch the latest available reference rate on demand; these are not continuously updated market prices. In an outage, use a cached rate only if it was fetched within the previous 24 hours; otherwise block the conversion. Display the source rate date separately from when a rate was fetched or a quote expires.

## Proposed baseline behavior — not yet approved

- Label simulated operations clearly, and never imply that real funds have moved.
- Reject invalid, zero, negative, or unaffordable amounts; define rounding by currency or asset.
- Show a confirmation/preview before a completed conversion and retain the applied rate and its date in the history.
- Show the source amount, destination amount, and rate for cross-currency transfers before confirmation; record the rate used.
- Label the USD total as approximate. If a required rate is unavailable, do not silently present an incomplete total as complete.
- Persist wallet changes and their transaction records atomically, so a failed operation cannot leave them out of sync.
- Keep transaction history after the application restarts when using a persistent SQLite file.

## Questions to resolve

- Are limits or additional simulated failure scenarios required beyond immediate, no-fee operations and validation errors?
- Design scheduling is settled: initialize Impeccable after the money/journal checkpoint, establish product/design context, then build wallet screens without waiting for every API.
