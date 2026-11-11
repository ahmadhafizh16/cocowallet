# Coding guide: discussion draft

**Status:** Proposed practices for review, not a finalized or enforced coding standard. Do not treat the structure or tool choices below as approved merely because they appear here.

## Already agreed constraints

- TypeScript and Next.js App Router on Node.js 26, with npm and a Docker-first local workflow.
- SQLite, Drizzle, and `better-sqlite3`; one local simulated user, without authentication or real payments.
- shadcn/ui, an Impeccable design workflow, Lucide React icons, light/dark themes, and accessible motion.
- Jest for unit/integration tests and Playwright for browser flows.
- Feature-based organization, strict TypeScript, ESLint, and default Prettier formatting. Keep feature tests near their code and Playwright tests in a separate end-to-end directory.
- Next.js HTTP Route Handlers documented with OpenAPI and Swagger UI.
- Balances derived from integer-minor-unit debit/credit journal entries; decimal-safe conversion amounts rounded half up to the target currency's minor unit.
- Server-side idempotency keys for money-moving operations; HTTP Problem Details for API errors.
- Local Docker-based checks and tests for critical paths, without an initial percentage coverage threshold or required CI.
- Completed transactions only in history. The main account is writable; switched destination accounts are inspect-only.
- Frankfurter reference rates, a one-minute quote hold, and a 24-hour fetched-rate fallback when the API is unavailable.
- Angular commit-message convention with one coherent intention per commit; see [D-021](DECISIONS.md#d-021).

## Git and commit convention

The agreed convention follows [Angular's commit guidelines](https://github.com/angular/angular/blob/main/contributing-docs/commit-message-guidelines.md), using project-relevant scopes rather than Angular's own package names.

```text
<type>(<optional-scope>): <imperative lowercase summary>

<body explaining why the change is needed>

<optional footer, including BREAKING CHANGE when applicable>
```

- Keep each commit focused on **one intention**. Do not combine unrelated features, tooling, or fixes into one large commit. A task can have multiple commits, and a commit can contain code, tests, migrations, and documentation if they all support the same intention.
- Angular's documented types are `build`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, and `test`; a revert uses Angular's special `revert:` format. Use scopes meaningful to this project, such as `docker`, `wallets`, `rates`, or `transfers`.
- Write the summary in imperative present tense, with a lowercase first letter and no trailing period. The scope is optional.
- Following Angular's published rules, include a body explaining the motivation for non-`docs` commits; when present, the body must be at least 20 characters. Use a `BREAKING CHANGE:` footer and migration guidance for breaking changes.
- Initialize a local repository when implementation begins, then automatically create reviewable commits as each intention is completed and checked. Do not stage unrelated user work, rewrite history, create a remote, or push without authorization; see [D-022](DECISIONS.md#d-022).
- Exclude the installed platform-specific Impeccable engine binary from Git while preserving the local copy. Document and verify restoration and integrity before relying on a fresh checkout; details are tracked in [O-008](DECISIONS.md#o-008). Do not ignore the entire design-context directory by default.

Examples:

```text
build(docker): add the node 26 development container

Run the application in the agreed Node runtime.
```

```text
feat(wallets): support adding fiat wallets

Prevent duplicate currency wallets within an account.
```

```text
docs: document the transfer flow
```

## Proposed code organization

- Keep route/page components focused on request/response and rendering. Put wallet, conversion, transfer, and transaction rules in reusable server-side services rather than duplicating them in UI components.
- Keep database schema, migrations, connections, and transaction helpers in a clearly identifiable database area. Keep the Frankfurter client and its cache behind a separate interface.
- Group feature-specific code and tests together; use shared utilities only for genuinely shared behavior. Agree on the exact folder structure before implementation.
- Use strict TypeScript, meaningful names, small focused functions, and explicit input/output types at boundaries. Avoid `any` unless justified and documented.
- Prefer self-explanatory code. Add comments for non-obvious business rules or tradeoffs rather than narrating each line; update documentation when a meaningful decision changes.

## Proposed money and transaction rules

- Parse amount input as decimal text. Store journal amounts as integer minor units; use decimal-safe arithmetic, currency-specific precision, half-up rounding for conversion, and checked numeric bounds. Do not calculate balances with JavaScript floating-point numbers.
- Handle SQLite's signed 64-bit integer limits, JavaScript safe-integer/serialization limits, and aggregation overflow deliberately. In particular, a long journal can overflow a database aggregation even when its final balance is within bounds; test the chosen aggregation strategy.
- Validate every money-moving operation on the server. Reject invalid, negative, zero, overly precise, or unaffordable amounts. Restrict mutations to the main account on the server as well as in the UI.
- Derive each wallet's balance from its debit/credit journal entries rather than a separately stored balance. The transaction record, entries, and any destination/wallet creation must commit or roll back together. Serialize competing SQLite writes before checking funds; prevent concurrent overdrafts and unintended duplicate submissions.
- Fetch exchange rates before opening the write transaction. Validate the server-owned quote and its one-minute expiry at confirmation; preserve the applied rate, source date, fetch time, and cached/fresh status in the transaction record.
- Do not silently use an expired cache or show an incomplete USD portfolio total as complete. Tests must cover rate failures and rounding boundaries.

## Proposed quality and testing

- Use ESLint and Prettier defaults; run lint and formatting checks alongside strict TypeScript checks.
- Write Jest tests for monetary calculations, validation, persistence, concurrent/duplicate requests, and Frankfurter failure handling. Use temporary isolated SQLite databases, never the developer's wallet data. Use a temporary file and independent connections when testing concurrent access.
- Mock Frankfurter in routine automated tests so they are deterministic; any real-network smoke test should be clearly separated and optional.
- Use Playwright for the main flows and browser-level accessibility/responsive checks, including inspecting a destination account and the expired quote flow.
- Test behavior and invariants, not private implementation details. Cover critical paths without imposing a percentage coverage threshold initially.

## Proposed HTTP and documentation practices

- Keep Route Handlers thin: parse and validate the request, call server-side feature services, and return a consistent response. Do not put wallet accounting rules in the UI or duplicate them in handlers.
- Maintain an OpenAPI specification and Swagger UI; reuse validation schemas for documentation where feasible, explicitly describe routes/status codes, and test the specification against the implementation. The generator is not yet selected.
- Prefer decimal strings for amounts at the JSON boundary so large or fractional values are not silently rounded by JavaScript. Return standard HTTP Problem Details with machine-readable codes.
- Require an `Idempotency-Key` on money-moving requests. For an accepted key and matching input, replay the original definitive success **or error** without repeating effects; reject reuse with different input. Store failed outcomes outside completed history. If the outcome is unknown, the client retries with the original key; a new intentional attempt after a definite error uses a new key.
- See [API_DESIGN.md](API_DESIGN.md) for a tentative endpoint outline; its names and payloads are not yet a finalized contract.

## Proposed UI and operational practices

- Use semantic HTML and accessible labels, keyboard/focus states, clear loading/empty/error feedback, and reduced-motion preferences.
- Use the agreed icon library consistently and import only what is needed. Verify its licensing; do not assume every icon or style is free.
- Run the Node 26 app, migrations, and tests in a compatible container, build native dependencies there, and persist the SQLite file in the agreed named volume. Document startup, migrations, tests, backup, and safe data handling.
- Keep secrets out of the repository, parameterize database queries, and bind any no-auth local application to an appropriate local access boundary.

## Open decisions

- The OpenAPI generator, exact route contracts, additional status codes, and idempotency implementation/retention details in [O-006](DECISIONS.md#o-006).
- The decimal arithmetic library, supported-currency precision metadata, aggregation strategy, and numeric bounds.
