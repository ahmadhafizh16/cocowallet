# PRD-03 — Accounts, wallets, and balances

**Status:** Draft; no account or wallet implementation exists.  
**Decisions:** [D-003](../DECISIONS.md#d-003), [D-004](../DECISIONS.md#d-004), [D-011](../DECISIONS.md#d-011), [D-018](../DECISIONS.md#d-018).  
**Tasks:** [T03-01–T03-03](../tasks/TASKS-03.md).  
**Diagram:** [Logical data relationships](../DIAGRAMS.md#logical-data-relationships).

## Outcome and user stories

- As the simulated user, I see my main account's currency wallets and can add another supported fiat currency.
- As the user, I can switch to a destination account created by a transfer and inspect its wallets and history, without operating that account.

## Requirements

1. Seed one main account with USD as its initial default and three zero-balance wallets: USD, EUR, and GBP. Initialization must be safe to repeat.
2. Allow at most one wallet for each `(account, fiat currency)` pair. Use Frankfurter's fiat listing to identify supported currencies; crypto provider labels do not create crypto wallets.
3. Permit changing the main account's default currency. A destination account's default is chosen when created and cannot be edited from its inspection view.
4. Show the main and created destination accounts in an account switcher. Destination data is read-only at the server boundary as well as the interface.
5. Display journal-derived per-currency balances and an approximate USD total. If a rate required for the total is unavailable under the agreed FX policy, show the total as unavailable rather than excluding a balance silently.

## Acceptance criteria

- A fresh database shows the three starter wallets once, each with an exact zero balance; rerunning seed/migrations does not duplicate them.
- Adding a valid fiat currency creates one wallet; adding the same currency twice is rejected or otherwise prevented without creating duplicates.
- After a transfer creates a destination, the switcher shows it and its credited balance. Attempts to deposit, withdraw, convert, or transfer **from** that destination are rejected by the server.
- Main-account balances reflect journal entries. When the USD total cannot be fully calculated, all individual balances remain visible and the total is explicitly unavailable.

## Edge cases and open items

- [O-004](../DECISIONS.md#o-004): whether destination inspection includes a USD total, and what happens when a new main default currency does not have a wallet.
- [O-005](../DECISIONS.md#o-005): behavior when Frankfurter's currency catalog is unavailable. Unsupported conversion pairs must be handled even when both fiat codes exist in the catalog.
- Test duplicate-wallet races, account-switching state, missing accounts, zero-balance totals, persistence, and direct API attempts against read-only destinations.
