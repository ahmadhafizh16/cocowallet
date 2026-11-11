# PRD-10 — HTTP API and Swagger

**Status:** Account/wallet reads, funding/conversion POSTs, durable replay, fresh-first reference metadata and immutable quotes have maintained OpenAPI contracts. T10-01's reusable structural guards/schema definitions, safe responses and thin handlers are verified. The transfer service is internal only. Transfer/full-history endpoints, full generation and Swagger UI remain future work. See [HTTP.md](../HTTP.md).
**Decisions:** [D-002](../DECISIONS.md#d-002), [D-003](../DECISIONS.md#d-003), [D-016](../DECISIONS.md#d-016), [D-017](../DECISIONS.md#d-017), [D-019](../DECISIONS.md#d-019).  
**Tasks:** [T10-01–T10-03](../tasks/TASKS-10.md).  
**Diagrams:** [API contract flow](../API_DESIGN.md#proposed-api-contract-flow) and [money-operation code flow](../DIAGRAMS.md#code-flow-for-a-completed-money-operation).

## Outcome and user story

As a developer or local operator, I can inspect and exercise documented HTTP endpoints for the wallet using Swagger UI, with requests, responses, errors, and safety rules kept aligned with the implementation.

## Requirements

1. Expose the agreed application operations using Next.js App Router Route Handlers. Keep route handlers thin and delegate domain rules to server-side feature services.
2. Provide an OpenAPI specification and Swagger UI. Reuse server validation schemas for generated schema definitions where possible; explicitly document each route, method, response, and error. Test for contract drift.
3. Return HTTP Problem Details with a stable machine-readable code. Use the agreed baseline: 400 invalid request, 404 missing resource, 409 balance/quote/idempotency conflict, and 503 no eligible rate.
4. Require `Idempotency-Key` for deposit, withdrawal, conversion confirmation, and transfer. An accepted key with the same input replays its original definitive success or error; a key reused with different input is rejected. Store definite failure metadata separately from completed transaction history.
5. Treat amount precision and server-owned quotes safely at the JSON boundary. Implemented endpoints use fixed exact decimal strings, canonical ISO timestamps, strict payloads and UUID quote/key contracts. Shared structural definitions do not replace domain precision/bounds, quote binding or durable original-result checks. Future history/transfer HTTP shapes retain their tasks.
6. Swagger's interactive requests target real **simulated** local data. The no-auth API is not a security boundary; bind it locally and enforce the main/destination account rules on the server.

## Acceptance criteria

- The OpenAPI document and Swagger UI are served locally and describe every implemented endpoint, including request schemas, status codes, and idempotency headers where required.
- A malformed request, missing resource, conflict, and unavailable rate produce documented Problem Details with the agreed baseline status and no unintended journal writes.
- Retrying a successfully committed operation with the same key/input cannot create a second transaction; different input with that key is rejected.
- Retrying a definitively failed operation with the same accepted key/input returns the original error, even if conditions later change; a deliberate new attempt uses a new key. When the outcome is unknown, retry with the original key.
- Contract tests verify the documented schemas and status codes against actual responses. Documentation generation does not expose the app publicly or require a paid service.

## Tests and open items

See [API_DESIGN.md](../API_DESIGN.md) for implemented versus proposed routes and [HTTP.md](../HTTP.md) for shared conventions. [O-003](../DECISIONS.md#o-003) retains future history/transfer HTTP contracts, generator and pagination questions. [O-006](../DECISIONS.md#o-006) records the implemented funding/conversion/internal-transfer retention/recovery policy. Test malformed JSON/headers, account restrictions, quote expiry, idempotency races, stable failure replay, and spec drift.
