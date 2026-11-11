# Tasks 06 — Reference rates and quotes

**Feature PRD:** [PRD-06](../prd/PRD-06-rates.md).  
**Related diagram:** [Rate, cache, and quote sequence](../DIAGRAMS.md#rate-cache-and-quote-sequence).  
Status is mirrored in [KANBAN.md](../KANBAN.md).

### T06-01

**Frankfurter adapter, currency listing, and rate cache**  
**Status:** To do.  
**Decisions:** [D-004](../DECISIONS.md#d-004), [D-007](../DECISIONS.md#d-007), [D-018](../DECISIONS.md#d-018).  
**Depends on:** [T01-03](TASKS-01.md#t01-03), [T02-01](TASKS-02.md#t02-01).  
**Implementation:** Implement a server-only Frankfurter client with timeout, response validation, fiat listing, exact pair/rate/source-date handling, and a persistent or otherwise agreed 24-hour fetched-rate fallback. Validate pair coverage instead of assuming any two listed currencies are convertible. Keep original precision needed for decimal-safe calculations.

**Acceptance and tests:** Mock API success, timeout, unavailable pair, malformed data, and exact 24-hour boundaries. A fallback uses only the requested eligible pair, records/labels its fetch and source dates separately, and fails without inventing a rate when none exists. Catalog-offline behavior remains [O-005](../DECISIONS.md#o-005).

### T06-02

**Server-owned quote preview and one-minute validity**  
**Status:** To do.  
**Decisions:** [D-007](../DECISIONS.md#d-007), [D-008](../DECISIONS.md#d-008), [D-017](../DECISIONS.md#d-017), [D-018](../DECISIONS.md#d-018).  
**Depends on:** [T06-01](#t06-01), [T10-01](TASKS-10.md#t10-01).  
**Implementation:** Define a server-owned quote representation tied to operation parameters, rate provenance, calculated target amount, and one-minute expiry; expose a documented preview. Validate that confirmation uses the quote's actual rate and original inputs, not a client-supplied value. Final request/storage details follow [O-003](../DECISIONS.md#o-003).

**Acceptance and tests:** A preview shows source/target amounts, exact rate, source date, cache state, and expiry. Controlled-clock tests cover valid and expired quotes and parameter tampering. A stale quote or missing rate produces no monetary change; network fetches do not occur inside a SQLite write transaction.
