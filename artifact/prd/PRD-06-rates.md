# PRD-06 — Reference rates, cache, and quotes

**Status:** Server-only reference metadata and immutable one-minute quote storage/preview/readback are implemented under D-031/D-032; see [RATES.md](../RATES.md) and [QUOTES.md](../QUOTES.md). Actual conversion/transfer submission and reviewed UI wiring remain T07/T08.
**Decisions:** [D-007](../DECISIONS.md#d-007), [D-008](../DECISIONS.md#d-008), [D-017](../DECISIONS.md#d-017), [D-018](../DECISIONS.md#d-018), [D-032](../DECISIONS.md#d-032).
**Tasks:** [T06-01–T06-02](../tasks/TASKS-06.md).  
**Diagram:** [Rate, cache, and quote sequence](../DIAGRAMS.md#rate-cache-and-quote-sequence).

## Outcome and user story

As the user, I can preview an exchange using Frankfurter's latest available reference rate, understand when the rate was published and whether it is cached, and confirm the displayed terms before they expire.

## Requirements

1. Fetch rates server-side from Frankfurter, without a key or registration. Rates are reference data, not continuously updating market prices. The verified v2 integration uses the active catalog and exact-pair CSV endpoint, excluding crypto/metals/accounting units and unknown precision; do not infer pair coverage from catalog membership.
2. Cache each rate with its exact base/quote pair, source rate/date, and retrieval time. When the API cannot provide an eligible rate, use only an exact-pair cached rate fetched within the preceding 24 hours; otherwise return an unavailable error.
3. Display the source date separately from retrieval time; identify cached previews. Do not assume a freshly fetched rate has today's source date.
4. Compute the preview with decimal-safe arithmetic and half-up target-currency rounding. Persist immutable server-owned terms bound to exact original input and recipient/default context. D-032 starts a full 60-second hold after network work/final validation, reserves no funds and permits one successful use. Cached data must be eligible at issuance, not throughout the subsequent minute. Failed operations do not consume the quote; confirmation rechecks funds. Existing idempotent outcomes must replay before expiry/use checks.
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
- D-023 resolves accounting precision/bounds; D-031 fixes fresh-first fallback less than 24 hours old; D-032 and [QUOTES.md](../QUOTES.md) fix this quote slice of O-003. Conversion/transfer submission contracts and unrelated operational questions in O-005 remain open.
