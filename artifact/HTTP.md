# Shared HTTP contracts and boundaries

**Status:** T10-01 consolidates the existing endpoints' validation/schema
definitions, thin handlers, exact JSON and safe Problem Details are implemented and
verified with the full Docker check/build and production browser regressions. This is shared
groundwork for T09-01, not a transfer/history endpoint, Swagger UI or generator
selection. Existing visual design and monetary/recovery contracts are preserved.

## Reusable definitions

- `src/lib/contracts.ts` is a small dependency-free vocabulary for bounded text,
  enums, literals and exact objects. Each request contract exposes its structural
  `schema` and `is` guard. Identifiers, amount syntax, UUIDs and currency codes have
  one definition, reused by the feature guards and OpenAPI schema objects.
- Funding, conversion and conversion/transfer quote requests publish those exact
  runtime schema objects, not separately maintained field copies. The internal
  transfer request also reuses the vocabulary but is **not** registered as an
  endpoint/schema in the served document. Optional fields must be absent or valid;
  explicit `undefined`, unknown properties and inherited required fields fail.
- UUID keys/quote IDs retain existing case normalization. Other strings are not
  trimmed or coerced. A nonblank ID may contain exact spaces, Unicode or arbitrary
  non-UUID text, but no NUL. The existing 8192 UTF-16-code-unit server limit remains;
  JSON Schema's `maxLength` counts code points, so that schema bound alone does not
  describe the entire supplementary-character server limit.
- Lexical amount validation accepts plain decimal **strings**, including zero and
  syntactically valid out-of-range amounts. Currency eligibility, positive amounts,
  pinned precision, exact bigint bounds, funds, quote binding and account roles
  remain domain checks. Do not turn a recorded business rejection into a different
  pre-acceptance error by extending the structural guard.
- `src/server/http/schema-parts.ts` shares no-store/replay header definitions,
  local component references and Problem Details schemas. Common response fields
  reuse the same UUID/currency/exponent/time/minor-unit definitions. Minor-unit
  limits and fixed-precision arithmetic remain enforced by feature services;
  published annotations do not replace those checks.

This is not a general JSON Schema runtime evaluator or an OpenAPI generator.
Path/method/status registration and feature-specific response definitions remain
explicit. T10-03 still owns generator selection, full route generation and local
Swagger UI. No package was added or external schema service introduced.

## Request and response rules

1. Keep App Router modules thin. Funding and conversion delegate to HTTP adapters;
   quote/reference/account handlers use the common helpers and domain services.
   Open storage only after structural write validation succeeds. Both handlers
   and internal services retain validation, so direct internal callers are safe.
2. `jsonWriteIssue`/`localJsonRequest` require JSON and reject explicit foreign
   Origin/cross-site requests. The direct Host authority handles Next's internal
   bind-address URL. Host userinfo/path/query/fragment/backslash/invalid-port forms
   are rejected; forwarded headers grant no proxy/origin permission. CLI clients
   may omit Origin. This local-only no-auth simulation is not a security boundary
   or arbitrary reverse-proxy deployment contract.
3. `readBoundedJson` counts actual bytes up to **16 KiB**, not Content-Length or
   character count. UTF-8 decoding is fatal; split multibyte chunks are assembled
   without replacement or amount normalization. Missing/malformed/oversized bodies
   fail as the existing 400 contract. Failure/abort cancels and releases the reader;
   abort also interrupts an outstanding read. `readValidatedJson` applies a guard
   without translating domain exceptions into structural failures.
4. `jsonResponse`, `problemResponse` and `monetaryResponse` centralize exact media
   types and `Cache-Control: no-store`. Only monetary responses carry
   `Idempotency-Replayed`. Plain JSON values are validated before serialization;
   bigint, unsafe integer/nonfinite/negative-zero numbers, missing values, custom
   prototypes/serialization/getters, sparse/extended arrays and cycles are rejected,
   not silently coerced or dropped. Features format monetary bigint into exact
   strings before this boundary. Genuine native plain objects/arrays from another
   JavaScript realm (including native SQLite results) remain valid. Shared plain
   schema aliases are not cycles.
5. `src/lib/problem-details.ts` creates the common `about:blank`, title, status,
   code and detail envelope. Use only allowlisted public feature details, never
   exception messages, paths or stacks. The baseline stays **400/404/409/503**;
   no new wallet status is introduced. Unsupported methods retain Next's existing
   405 behavior, outside the application Problem Details contract.
6. Monetary adapters preserve the original result body/status and recovery headers.
   Funding error field order remains compatible with retained result validation.
   A serialization failure after commit is **unknown**, not a definitive rejection:
   return the safe feature 503 and preserve the original key/input/quote. Retrying
   finds the stored result without a second debit/credit. Never move persistence or
   commit ownership into a generic HTTP helper.

Read, reference and quote mappers retain their existing safe code/detail catalogs;
unexpected storage/data failures map to safe 503s. Reference GETs may update only
technical caches. HTTP refactoring never changes rate freshness, quote lifetime,
idempotency retention, ledger accounting, per-tab recovery or inspect-only roles.

## Verification and limits

`src/test/json-contract.ts` is a test-only assertion for the document's explicit
schema subset: local references, exact objects, arrays/item bounds, strings/lengths/
patterns/canonical dates, integers, booleans, constants/enums, `oneOf` and `not`.
Unknown assertion keywords fail, including in unused union branches. It is not a
standards-compliance certification, production validator or generated client.

Tests cover runtime/schema identity, exact Unicode IDs and existing lexical
boundaries, optional/unknown/inherited fields, malformed authorities, origin/media
guards, UTF-8/byte limits, open-stream cancellation/abort, safe response serialization,
all storage-backed routes' unexpected-error envelopes, operational body/header
contracts, inspect-only conflicts without provider calls/history, and post-commit
serialization failure followed by original-key recovery. Existing feature tests
remain responsible for exact bounds, accounting, concurrency and durable replay.

The first full check exposed an overly strict same-realm prototype comparison in
the response guard. Native SQLite's cross-realm rows/arrays were wrongly rejected
as unavailable reads. Genuine native constructor/prototype identity is now checked
across realms without invoking custom getters/serializers; explicit VM and account
route regressions pass. This was corrected before checkpoint closure.

Run checks with development stopped; use only the disposable production server in
[QUOTES.md](QUOTES.md) for monetary browser regressions. Back up the stopped runtime
and compare every table afterward. No migration, normal-wallet test funds,
recipients, quotes or live-provider check is needed for this stage.

### Checkpoint evidence

- Full Docker check/build passes **1,228 Jest tests in 52 suites**, formatting,
  lint, TypeScript and artifact checks (**56 documents / 36 tasks**). The repeated
  full run includes the cross-realm compatibility correction above.
- Verified SQLite backup `/app/data/wallet.sqlite.pre-http-1794427570259.bak`
  preceded checks. All **14 runtime tables**, including migration metadata, remain
  bigint-safely row-identical. Integrity is `ok`, FK violations zero. Runtime is
  **1 account / 3 wallets / 0 transactions / 0 journal entries / 0 funding attempts /
  0 conversion attempts / 0 transfer attempts**; reference caches and quotes/uses
  are empty. No schema migration or runtime test data was introduced.
- Bounded in-thread Verify review uses current graph/path coverage and exact source
  for guards, schema derivation, serialization, adapters and feature contracts.
  Imported `respond` aliases are checked in source/tests where graph call edges
  are incomplete; clean coverage is not proof of completeness. No independent-agent
  audit, exhaustive security/correctness certification or performance claim is made.
- All **63 production Chromium regressions** pass on a fresh guarded disposable
  server. They protect existing funding/conversion, account isolation, privacy,
  drafts, layout, themes and motion; they do not claim new history/transfer journeys.
- Development resumed with `.next/dev.pre-http-1794428115848` retained. A browser
  verified enabled funding review, documented conversion and absent transfer/history
  APIs, plus **300 stable frames** with zero extra navigations/page/console errors
  or financial/reference requests. No UI source or design token changed, and no
  new UI-detector/render-review claim is made.
- T09-01's history queries/API is next, with filter time zone, pagination and
  response contracts to finalize under O-003/O-004 before implementation. Transfer
  submission, full OpenAPI generation and Swagger UI remain their own tasks. No
  dependency or live-provider integration changed; no remote push is authorized.
