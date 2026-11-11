# Tasks 10 — HTTP API and Swagger

**Feature PRD:** [PRD-10](../prd/PRD-10-api.md).  
**Related diagrams:** [API contract flow](../API_DESIGN.md#proposed-api-contract-flow), [money-operation code flow](../DIAGRAMS.md#code-flow-for-a-completed-money-operation).  
Status is mirrored in [KANBAN.md](../KANBAN.md).

### T10-01

**Shared HTTP schemas, handlers, and Problem Details**  
**Status:** Done.
**Decisions:** [D-003](../DECISIONS.md#d-003), [D-015](../DECISIONS.md#d-015), [D-017](../DECISIONS.md#d-017), [D-018](../DECISIONS.md#d-018).  
**Depends on:** [T01-02](TASKS-01.md#t01-02).  
**Implementation:** Establish thin Next.js Route Handler conventions, reusable request/response validation definitions, exact monetary serialization, and `application/problem+json` responses with stable machine-readable codes. Apply the agreed 400/404/409/503 baseline; document any additional statuses before use.

**Acceptance and tests:** Handler tests cover malformed requests, missing resources, domain conflicts, no eligible FX rate, safe unexpected-error handling, and inspect-only destination restrictions. API schemas are reusable by the OpenAPI workflow. Candidate paths and precise contract remain [O-003](../DECISIONS.md#o-003).

**Partial groundwork:** D-029 implements thin account/wallet GET handlers, exact
string responses, safe 400/404/503 read problems and response-contract tests.
Funding now adds structural/business validation, safe 409 conflicts, exact receipts,
shared request helpers and actual response/schema tests. These historical slices
did not alone close the reusable shared-boundary task.

T06-01 additionally documents and tests eligible-catalog/exact-rate GET responses,
including safe 400/503 metadata failures. T06-02 adds strict quote preview/readback,
safe quote problems, internal confirmation/consumption safeguards and shared
bounded JSON input. It does not implement conversion/transfer submission.

T07-02 adds the strict conversion endpoint, no-store/replay headers and actual
response/schema checks. Transfers and full history remain outside this slice.

**Current scope:** [HTTP.md](../HTTP.md) consolidates dependency-free runtime/schema
definitions for implemented requests, shared exact JSON/Problem Details/header
helpers, a common direct-origin/media/byte-bounded request policy and thin funding/
conversion handlers. Structural validation precedes storage; domain/commit/replay
ownership remains in feature services. No endpoint, additional wallet status,
schema generator, Swagger UI, dependency or UI change is introduced. Full Docker
check/build passes 1,228 Jest tests in 52 suites; the backed-up runtime remains
row-identical across all 14 tables. All 63 production Chromium regressions pass
on a fresh disposable server; restored development is stable for 300 frames with
zero reloads/errors or financial/reference requests. This completes the shared
boundary prerequisite, not T10-03 generation/Swagger or future feature endpoints.

### T10-02

**Durable idempotency contract and implementation**  
**Status:** Done.
**Decisions:** [D-006](../DECISIONS.md#d-006), [D-017](../DECISIONS.md#d-017), [D-018](../DECISIONS.md#d-018), [D-019](../DECISIONS.md#d-019).  
**Depends on:** [T02-03](TASKS-02.md#t02-03), [T10-01](#t10-01).  
**Implementation:** Define header validation, request fingerprint scope and canonicalization, durable uniqueness, concurrent-key behavior, and result persistence. Replay the original definitive success or error for the same accepted key/input; reject different input. Atomically couple successful result registration with transaction/journal commit; store definite failure metadata separately and never treat it as completed history. Resolve retention, pre-key validation, in-progress behavior, and storage-failure recovery in [O-006](../DECISIONS.md#o-006).

**Acceptance and tests:** A response lost after successful commit can be retried with the same key/input and returns the original result without duplicate entries. A definite failure is replayed for that key even if account conditions later change; a deliberate new attempt uses a new key. A key reused for different input returns the documented conflict. Independent concurrent requests cannot both commit; tests cover restart, failure replay, and unknown-outcome recovery.

**Current implementation:** D-030 resolves O-006 for current funding requests.
Migration 0003 retains immutable key/request/status/body indefinitely, with success
and journal in the same top-level immediate transaction. Known failures are
separate technical records; unknown/storage failures remain same-key retries.
See [FUNDING.md](../FUNDING.md). Future quote/transfer request shapes are not
implemented by this funding-specific boundary.

T07-01 now adds a separate retained conversion-result boundary with global key
ownership across funding/conversion, original-result replay before quote checks,
and atomic creation/journal/quote use. See [CONVERSIONS.md](../CONVERSIONS.md).
T07-02 adds the documented conversion HTTP/recovery UI; transfers remain T08.

T08-01 now extends retained original results/global keys to the internal transfer
service. T10-01's HTTP consolidation preserves those outcomes and verifies that a
post-commit serialization failure remains unknown until original-key replay. No
transfer endpoint is implied. See [TRANSFERS.md](../TRANSFERS.md).

### T10-03

**OpenAPI generation, Swagger UI, and contract tests**  
**Status:** To do.  
**Decisions:** [D-002](../DECISIONS.md#d-002), [D-016](../DECISIONS.md#d-016), [D-017](../DECISIONS.md#d-017), [D-019](../DECISIONS.md#d-019).  
**Depends on:** [T10-01](#t10-01), [T10-02](#t10-02), [T04-02](TASKS-04.md#t04-02), [T05-02](TASKS-05.md#t05-02), [T07-02](TASKS-07.md#t07-02), [T08-02](TASKS-08.md#t08-02), [T09-01](TASKS-09.md#t09-01).  
**Implementation:** Select a compatible OpenAPI generator under [O-003](../DECISIONS.md#o-003); derive reusable schemas from the server validation definitions, explicitly register path/method/status metadata, and serve Swagger UI locally. Document the fact that interactive calls modify simulated data.

**Acceptance and tests:** Every implemented endpoint, required idempotency header, quote/amount schema, and Problem Details response is represented accurately. Contract tests validate real responses against the document; Swagger works without paid services and is not publicly exposed by default.

**Partial groundwork:** `/api/openapi` serves a tested hand-maintained document
for implemented read/operational, funding/conversion, reference and quote routes, including
required money keys, exact amounts, discriminated quote terms/lifecycle and safe
problems. Full generation and Swagger UI remain unimplemented; T08-02 now adds
transfer submission through the same HTTP safeguards in [TRANSFERS.md](../TRANSFERS.md);
T09-01 now supplies the history query/detail contract in [HISTORY.md](../HISTORY.md).
No closure of this generation/Swagger task is implied.

T10-01 now makes implemented request schemas directly reusable from their runtime
definitions, and centralizes common response/schema parts. Full path/schema
generation and selecting a generator still belong to this task; a small contract
vocabulary does not silently select an external schema tool or complete Swagger.
