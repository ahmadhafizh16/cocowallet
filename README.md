# Simulated multi-currency wallet

A local-only Next.js/Node 26 wallet simulation. Product requirements, decisions, diagrams, and progress are in [`artifact/`](artifact/README.md).

**Current milestone:** Docker/Next.js foundation plus the tested money/journal core: exact bigint arithmetic, pinned currency precision, journal-derived balances, and serialized atomic writes. Wallet HTTP flows, account seeding, and the interface are not implemented yet; `/` remains a technical scaffold. Impeccable design initialization is next.

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

The browser tests are foundation smoke tests, not wallet journeys. The 486 Jest tests additionally verify exact money, metadata, schema, snapshots, rollback, and independent-connection concurrency. See [`artifact/MONEY.md`](artifact/MONEY.md), [`artifact/JOURNAL.md`](artifact/JOURNAL.md), and [`artifact/DEPENDENCIES.md`](artifact/DEPENDENCIES.md).

For the complete local check (including a production build), stop the development compiler first:

```sh
docker compose stop app
docker compose run --rm app npm run check
docker compose up -d app
```

Generate a migration after an intentional schema change with `docker compose run --rm app npm run db:generate -- --name=descriptive_name`, review/commit the generated SQL and metadata, then apply it with `npm run db:migrate` in the container. Never use schema-push or a volume reset as a substitute for a reviewed migration.

The shadcn component registry, Tailwind 4/PostCSS configuration, Lucide dependency, and class-merging helper are ready for the design phase. No theme palette, wallet layout, or visual component has been claimed as complete; `globals.css` is not attached to a visual page yet.

Stop the development service before building against the same Next output volume to avoid two compilers writing there at once. Existing planning files and the design skill are preserved. Node 26 is enforced by npm; TypeScript 5.9 is pinned for the initial verified Next.js toolchain rather than adopting a new TypeScript major by default.

Normal shutdown will use `docker compose down`, **without `--volumes`**. Removing `wallet-data` explicitly destroys simulated balances/history. No real payment, authentication, or crypto integration is included.

## Design tooling

See [`artifact/TOOLING.md`](artifact/TOOLING.md) to restore the checksum-verified Impeccable engine excluded from Git.
