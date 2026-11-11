# CocoWallet

A local-only multi-currency wallet simulation built with Next.js and Node 26. Product requirements, decisions, diagrams, and progress are in [`artifact/`](artifact/README.md).

**Current milestone:** Persistent accounts and exact journal-derived balances now power the existing overview. Explicit repeatable seeding creates one main account and zero-balance USD/EUR/GBP wallets without resetting stored data. Read APIs and their OpenAPI document are available; financial submissions, FX and history remain disconnected. UI refinements are deferred. See [`artifact/BACKEND_READS.md`](artifact/BACKEND_READS.md).

## Development environment

Requirements: Docker Engine and Docker Compose. Host Node 26 is not required.

```sh
docker compose build app
docker compose run --rm app npm ci
docker compose run --rm app npm run db:migrate
docker compose run --rm app npm run db:seed
docker compose up -d app
```

Open `http://localhost:3000/api/health` for the health endpoint. Use `APP_PORT=3100 docker compose up -d app` if port 3000 is already occupied.

`/api/ready` verifies SQLite and its migrated metadata table; it is not a full application-schema version or seeded-account check. Three migrations create operational metadata, account/wallet/completed-transaction/journal tables, and accounting invariants. Migration and seed commands are safe to repeat and run explicitly, never during a GET request or production build. Seeding creates missing startup accounts/wallets, never funds or transaction history. On a fresh database, both commands are required before opening `/`.

Read APIs: `GET /api/accounts`, `GET /api/accounts/{accountId}/wallets`, and the read-only specification at `GET /api/openapi`. Wallet amounts are exact minor-unit strings; responses are not cached. Swagger UI and financial endpoints are not implemented yet.

The application service runs as the non-root `node` user. It uses separate named volumes for Linux dependencies, Next.js output, and SQLite data, so host dependencies cannot overwrite native modules in the container. The host port is bound to `127.0.0.1`; this no-auth simulation must not be exposed publicly.

```sh
docker compose run --rm app npm run typecheck
docker compose run --rm app npm run build
docker compose logs app
```

## Local verification

```sh
docker compose run --rm app npm run artifacts:check
docker compose run --rm app npm run lint
docker compose run --rm app npm run format:check
docker compose run --rm app npm test
docker compose --profile test build browser-tests
docker compose --profile test run --rm browser-tests
```

The Playwright image runs Node 26 with its pinned Chromium and required Linux libraries. It addresses the app as `wallet.test` on the private Compose network; the bare `app` hostname can trigger Chromium's HTTPS upgrade for the `.app` namespace. No HTTPS validation is disabled to work around that.

`next.config.ts` allows only this additional development origin (`wallet.test`)
so Next's private-network HMR handshake does not block client hydration. It does
not allow arbitrary origins or change the localhost-only host-port binding.

Jest covers exact accounting, atomic/repeated/concurrent seeding, snapshot reads, safe API contracts and interface validation. Chromium checks stored account identity, read APIs, theme/storage, responsive/keyboard behavior, draft review and privacy—not connected payment journeys. See [`artifact/BACKEND_READS.md`](artifact/BACKEND_READS.md), [`artifact/HANDOVER.md`](artifact/HANDOVER.md), and [`artifact/DEPENDENCIES.md`](artifact/DEPENDENCIES.md) for evidence and limitations.

For the complete local check (including a production build), stop the development compiler first:

```sh
docker compose stop app
docker compose run --rm app npm run check
docker compose up -d app
```

Generate a migration after an intentional schema change with `docker compose run --rm app npm run db:generate -- --name=descriptive_name`, review/commit the generated SQL and metadata, then apply it with `npm run db:migrate` in the container. Never use schema-push or a volume reset as a substitute for a reviewed migration.

The wallet retains its existing shadcn/Radix controls, Lucide icons, branding and frosted layout. The dynamic root page reads stored balances through server services; `createPreviewOverview()` is test-only. Money forms still review local drafts and cannot submit operations. Loading is not artificially delayed to show skeletons.

Stop the development service before building against the same Next output volume to avoid two compilers writing there at once. Existing planning files and the design skill are preserved. Node 26 is enforced by npm; TypeScript 5.9 is pinned for the initial verified Next.js toolchain rather than adopting a new TypeScript major by default.

Normal shutdown will use `docker compose down`, **without `--volumes`**. Removing `wallet-data` explicitly destroys simulated balances/history. No real payment, authentication, or crypto integration is included.

## Design tooling

See [`artifact/TOOLING.md`](artifact/TOOLING.md) to restore the checksum-verified Impeccable engine excluded from Git.

The user confirmed local demo/evaluation use, code-first, and the frosted reference adaptation. The built shell's [review record](artifact/DESIGN_REVIEW.md) documents its corrected finding and verdict scope. [DESIGN.md](DESIGN.md) and `.impeccable/design.json` capture its actual tokens and component examples. Live-picker configuration has not been enabled automatically.

Commit shared Impeccable artifacts when present: `PRODUCT.md`, `DESIGN.md`, `.impeccable/config.json`, `.impeccable/surfaces/`, `.impeccable/design.json`, `.impeccable/live/config.json`, and `.impeccable/critique/ignore.md`. Do not blanket-ignore `.impeccable/`; runtime directories ignore themselves, and `.impeccable/config.local.json` remains local.
