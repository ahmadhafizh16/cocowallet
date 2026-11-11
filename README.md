# Simulated multi-currency wallet

A local-only Next.js/Node 26 wallet simulation. Product requirements, decisions, diagrams, and progress are in [`artifact/`](artifact/README.md).

**Current milestone:** The approved frosted wallet interface is implemented as an explicit interface preview, alongside the tested money/journal core. It includes responsive layouts, themes, skeleton/error/empty states, exact validation, and draft review. Wallet services and account seeding are not connected; preview actions cannot submit money or change balances. See [`artifact/UI_FOUNDATION.md`](artifact/UI_FOUNDATION.md).

## Development environment

Requirements: Docker Engine and Docker Compose. Host Node 26 is not required.

```sh
docker compose build app
docker compose run --rm app npm ci
docker compose run --rm app npm run db:migrate
docker compose up -d app
```

Open `http://localhost:3000/api/health` for the health endpoint. Use `APP_PORT=3100 docker compose up -d app` if port 3000 is already occupied.

`/api/ready` verifies SQLite and its migrated metadata table; it is not a full application-schema version check. Three migrations now create operational metadata, account/wallet/completed-transaction/journal tables, and accounting invariants. Migration application is safe to repeat and runs explicitly rather than during a page request or production build. No accounts or funds are seeded yet.

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

Jest covers exact accounting and interface presentation/validation. Chromium checks theme/storage, responsive and keyboard behavior, draft review, privacy, and honest loading/error/empty states—not connected payment journeys. See [`artifact/UI_FOUNDATION.md`](artifact/UI_FOUNDATION.md), [`artifact/HANDOVER.md`](artifact/HANDOVER.md), and [`artifact/DEPENDENCIES.md`](artifact/DEPENDENCIES.md) for evidence and limitations.

For the complete local check (including a production build), stop the development compiler first:

```sh
docker compose stop app
docker compose run --rm app npm run check
docker compose up -d app
```

Generate a migration after an intentional schema change with `docker compose run --rm app npm run db:generate -- --name=descriptive_name`, review/commit the generated SQL and metadata, then apply it with `npm run db:migrate` in the container. Never use schema-push or a volume reset as a substitute for a reviewed migration.

The wallet uses local shadcn-style components, Radix primitives, Lucide icons, and the approved frosted direction. `globals.css` is attached through the root layout. The model is marked as preview and does not seed or read database balances; loading is not artificially delayed to show skeletons.

Stop the development service before building against the same Next output volume to avoid two compilers writing there at once. Existing planning files and the design skill are preserved. Node 26 is enforced by npm; TypeScript 5.9 is pinned for the initial verified Next.js toolchain rather than adopting a new TypeScript major by default.

Normal shutdown will use `docker compose down`, **without `--volumes`**. Removing `wallet-data` explicitly destroys simulated balances/history. No real payment, authentication, or crypto integration is included.

## Design tooling

See [`artifact/TOOLING.md`](artifact/TOOLING.md) to restore the checksum-verified Impeccable engine excluded from Git.

The user confirmed local demo/evaluation use, code-first, and the frosted reference adaptation. The built shell's [review record](artifact/DESIGN_REVIEW.md) documents its corrected finding and verdict scope. [DESIGN.md](DESIGN.md) and `.impeccable/design.json` capture its actual tokens and component examples. Live-picker configuration has not been enabled automatically.

Commit shared Impeccable artifacts when present: `PRODUCT.md`, `DESIGN.md`, `.impeccable/config.json`, `.impeccable/surfaces/`, `.impeccable/design.json`, `.impeccable/live/config.json`, and `.impeccable/critique/ignore.md`. Do not blanket-ignore `.impeccable/`; runtime directories ignore themselves, and `.impeccable/config.local.json` remains local.
