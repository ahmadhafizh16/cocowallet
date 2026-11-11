# PRD-08 — Transfers to simulated accounts

**Status:** Draft; no transfer implementation exists.  
**Decisions:** [D-003](../DECISIONS.md#d-003), [D-004](../DECISIONS.md#d-004), [D-008](../DECISIONS.md#d-008), [D-010](../DECISIONS.md#d-010), [D-012](../DECISIONS.md#d-012), [D-018](../DECISIONS.md#d-018), [D-019](../DECISIONS.md#d-019).  
**Tasks:** [T08-01–T08-02](../tasks/TASKS-08.md).  
**Diagram:** [Cross-currency transfer sequence](../DIAGRAMS.md#cross-currency-transfer-sequence).

## Outcome and user story

As the user, I can enter an existing or arbitrary destination account ID, send simulated funds, and switch to the destination afterward to inspect what it received.

## Requirements

1. Reject the main account's own ID. If the destination ID is unknown, choose its default currency in the transfer flow and create a simulated account as part of the successful transaction; do not require a real external user or bank.
2. For an existing destination, default to its default currency but allow choosing another supported destination fiat currency. Create a missing target wallet atomically.
3. If source and destination currencies differ, obtain a one-minute server-owned FX quote; preview source/target amounts, rate, source date, cache status, and expiry. If currencies match, no FX quote is needed.
4. Under a serialized SQLite write transaction, recheck key, funds, destination, and any quote; record one transfer with source debit and destination credit entries. On failure, create no partial account, wallet, transfer, or entries.
5. Show the transfer as outgoing in the main account and incoming in destination history. The account switcher permits viewing destination balances/history but not originating actions from it.

## Acceptance criteria

- Given a funded USD wallet and a new random ID with GBP default, confirming a valid USD→GBP preview creates the account and GBP wallet, debits USD, credits the displayed GBP amount, and records the exact rate/date once.
- Given an existing recipient and a different selected target currency, a missing wallet is created only if the transaction succeeds; destination default is not silently changed.
- Given identical currencies, transfer the same minor-unit amount without calling FX. Given the main account ID, reject the request and direct the user to Convert for own-wallet currency changes.
- Given insufficient funds, an expired quote, a duplicate committed request, or a failed insert, no duplicate or partial entries/accounts remain.
- Switching to the destination shows the credited balance and incoming record; attempting to operate from it is rejected by the server.

## Tests and open items

Depends on [PRD-02](PRD-02-journal.md), [PRD-03](PRD-03-accounts.md), and [PRD-06](PRD-06-rates.md). Test new/existing IDs, same/cross-currency cases, wallet creation races, quote expiry, failure rollback, stable success/error replay, and outgoing/incoming views. Exact identifier validation and quote payloads remain [O-003](../DECISIONS.md#o-003); idempotency storage/recovery details remain [O-006](../DECISIONS.md#o-006).
