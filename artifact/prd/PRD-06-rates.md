# PRD-06 — Reference rates, cache, and quotes

**Status:** Draft; no Frankfurter adapter or quote store exists.  
**Decisions:** [D-007](../DECISIONS.md#d-007), [D-008](../DECISIONS.md#d-008), [D-017](../DECISIONS.md#d-017), [D-018](../DECISIONS.md#d-018).  
**Tasks:** [T06-01–T06-02](../tasks/TASKS-06.md).  
**Diagram:** [Rate, cache, and quote sequence](../DIAGRAMS.md#rate-cache-and-quote-sequence).

## Outcome and user story

As the user, I can preview an exchange using Frankfurter's latest available reference rate, understand when the rate was published and whether it is cached, and confirm the displayed terms before they expire.

## Requirements

1. Fetch rates server-side from Frankfurter, without a key or registration. Rates are reference data, not continuously updating market prices. Frankfurter v2 is the current integration proposal; verify the selected endpoint and currency-pair coverage.
2. Cache each rate with its exact base/quote pair, source rate/date, and retrieval time. When the API cannot provide an eligible rate, use only an exact-pair cached rate fetched within the preceding 24 hours; otherwise return an unavailable error.
3. Display the source date separately from retrieval time; identify cached previews. Do not assume a freshly fetched rate has today's source date.
4. Compute the preview with decimal-safe arithmetic and half-up target-currency rounding. Store or otherwise retain a server-validated quote bound to the requested operation and expire it after one minute. The precise quote storage contract remains open.
5. If the amount, pair, or relevant destination changes, prevent confirmation using mismatched terms. Fetch network data before holding a write transaction.

## Acceptance criteria

- Given an available pair, a preview shows the source and target amounts, rate, source date, and quote expiry; confirmation within the validity window uses the same server-validated rate.
- Given the API is unavailable and an exact-pair cached rate was fetched less than 24 hours ago, the preview marks it cached and shows its rate date.
- Given no eligible exact-pair cached rate, the API returns a 503 Problem Details response and no balance or completed transaction changes.
- Given an expired quote, confirmation is rejected, a fresh preview is required, and no wallet change is committed.
- Given an unsupported pair, malformed provider data, rate precision edge case, or slow network, return a clear failure without inventing a rate.

## Tests and open items

- Mock Frankfurter for ordinary tests, including timeouts, invalid responses, unsupported pairs, source dates, 24-hour boundaries, and one-minute expiry boundaries.
- Test rate/amount matching and ensure the client cannot override the confirmed rate.
- [O-002](../DECISIONS.md#o-002) covers decimal precision and bounds; [O-003](../DECISIONS.md#o-003) covers exact quote contracts; [O-005](../DECISIONS.md#o-005) covers offline currency-catalog behavior.
