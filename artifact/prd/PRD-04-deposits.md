# PRD-04 — Simulated deposits

**Status:** Draft; no deposit code exists.  
**Decisions:** [D-005](../DECISIONS.md#d-005), [D-006](../DECISIONS.md#d-006), [D-018](../DECISIONS.md#d-018), [D-019](../DECISIONS.md#d-019).  
**Tasks:** [T04-01–T04-02](../tasks/TASKS-04.md).  
**Diagram:** [Business operations and history](../DIAGRAMS.md#business-operations-and-history).

## Outcome and user story

As the user, I select a main-account wallet, enter an amount, and choose a fictional provider so I can add simulated funds and inspect the completed deposit later.

## Requirements

1. Offer Demo Bank, Community Bank, and Crypto Gateway as provider labels. No real account data, payment call, crypto transfer, or fee is involved.
2. Accept a positive amount whose decimal precision matches the selected wallet currency; validate and convert to exact minor units on the server.
3. In one SQLite transaction, write the completed deposit record and one positive journal entry for the chosen main-account wallet. Protect successful submission with an idempotency key.
4. Immediately reflect the journal-derived balance and show the transaction in history with its amount, currency, provider, time, ID, and completed status.
5. Show that the flow is simulated. Destination accounts are inspect-only; never accept a deposit into one through a direct API request.

## Acceptance criteria

- Given an empty USD wallet, a valid simulated deposit of `100.00 USD` produces a `+10000` minor-unit entry, a `100.00 USD` balance, and one completed history record naming the chosen provider.
- Zero, negative, nonnumeric, overly precise, unsupported-provider, and invalid/read-only-wallet requests show errors with no completed history or journal entry.
- Repeating a committed request with the same idempotency key and identical payload returns the original result without another credit.
- If record or journal insertion fails, neither the other record nor a balance change persists.

## Tests and dependencies

Depends on [PRD-02](PRD-02-journal.md) and [PRD-03](PRD-03-accounts.md). Cover all provider labels, minor-unit precision, API error mapping, atomic rollback, stable success/error replay, persistence, and the browser flow. Idempotency storage/recovery details remain [O-006](../DECISIONS.md#o-006).
