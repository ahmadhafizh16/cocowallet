# Simulated multi-currency wallet

A local-only Next.js/Node 26 wallet simulation. Product requirements, decisions, diagrams, and progress are in [`artifact/`](artifact/README.md).

**Current milestone:** Git and Docker foundation. Wallet features are not implemented yet.

## Development environment

Requirements: Docker Engine and Docker Compose. Host Node 26 is not required.

```sh
docker compose build app
docker compose run --rm app node --version
```

The application service runs as the non-root `node` user. It uses separate named volumes for Linux dependencies, Next.js output, and SQLite data, so host dependencies cannot overwrite native modules in the container. The host port is bound to `127.0.0.1`; this no-auth simulation must not be exposed publicly.

The app scaffold and startup/test commands will be added in the next implementation intention. Existing planning files and the design skill are preserved.

Normal shutdown will use `docker compose down`, **without `--volumes`**. Removing `wallet-data` explicitly destroys simulated balances/history. No real payment, authentication, or crypto integration is included.

## Design tooling

See [`artifact/TOOLING.md`](artifact/TOOLING.md) to restore the checksum-verified Impeccable engine excluded from Git.
