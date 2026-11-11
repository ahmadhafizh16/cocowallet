# Simulated multi-currency wallet

A local-only Next.js/Node 26 wallet simulation. Product requirements, decisions, diagrams, and progress are in [`artifact/`](artifact/README.md).

**Current milestone:** Docker/Next.js technical foundation. Wallet features and the wallet interface are not implemented yet; `/` returns a factual JSON milestone response.

## Development environment

Requirements: Docker Engine and Docker Compose. Host Node 26 is not required.

```sh
docker compose build app
docker compose run --rm app npm ci
docker compose up -d app
```

Open `http://localhost:3000/api/health` for the health endpoint. Use `APP_PORT=3100 docker compose up -d app` if port 3000 is already occupied.

The application service runs as the non-root `node` user. It uses separate named volumes for Linux dependencies, Next.js output, and SQLite data, so host dependencies cannot overwrite native modules in the container. The host port is bound to `127.0.0.1`; this no-auth simulation must not be exposed publicly.

```sh
docker compose run --rm app npm run typecheck
docker compose run --rm app npm run build
docker compose logs app
```

Stop the development service before building against the same Next output volume to avoid two compilers writing there at once. Existing planning files and the design skill are preserved. Node 26 is enforced by npm; TypeScript 5.9 is pinned for the initial verified Next.js toolchain rather than adopting a new TypeScript major by default.

Normal shutdown will use `docker compose down`, **without `--volumes`**. Removing `wallet-data` explicitly destroys simulated balances/history. No real payment, authentication, or crypto integration is included.

## Design tooling

See [`artifact/TOOLING.md`](artifact/TOOLING.md) to restore the checksum-verified Impeccable engine excluded from Git.
