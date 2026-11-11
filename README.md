# CocoWallet

A local-only multi-currency wallet simulation built with Next.js and Node 26. Product requirements, decisions, diagrams, and progress are in [`artifact/`](artifact/README.md).

**Current milestone:** Persistent accounts, exact journal balances and reviewed simulated funding/conversion/transfers power the existing interface. Send money supports exact arbitrary IDs, destination defaults, same-currency or expiring FX review and shared original-key recovery. Destinations stay inspect-only, with scoped incoming recent activity. History GETs use inclusive UTC days and numbered pages. Quotes reserve no funds. Full-history browsing, valuation, wallet management and Swagger remain separate work. The visual design is preserved and refinements stay deferred. See [`artifact/TRANSFERS.md`](artifact/TRANSFERS.md) and [`artifact/HISTORY.md`](artifact/HISTORY.md).

The internal atomic conversion service now supports exact quote-bound accounting,
missing target currency/wallet creation and durable original-result replay. Retry
keys cannot be reused across funding, conversion and internal transfers. `POST /api/conversions` and
the existing Convert dialog now connect that service, with explicit expiry and
reconfirmation; see [`artifact/CONVERSIONS.md`](artifact/CONVERSIONS.md).

Shared HTTP groundwork now consolidates structural guards/published schemas,
strict bounded JSON input, safe Problem Details and exact no-store/replay
responses; see [`artifact/HTTP.md`](artifact/HTTP.md). T09-01 now adds read-only history
endpoints; T08-02 adds reviewed transfer submission, but no Swagger UI. Existing accounting and
retry rules are unchanged.

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

`/api/ready` verifies SQLite and its migrated metadata table; it is not a full schema-version or seeded-account check. Eight migrations create metadata, accounting/invariants, retained funding/conversion/transfer outcomes, reference caches and immutable quote/use tables. Migration and seed commands are safe to repeat and run explicitly, never during a GET or production build. Seeding creates startup accounts/wallets, never funds, history, quotes or provider snapshots. On a fresh database, migrate and seed before opening `/`. Existing installations must back up SQLite and run `db:migrate` through migration 0007 before funding/conversion resume using shared key ownership; no volume reset is needed.

APIs: account/wallet GETs, `POST /api/deposits`, `POST /api/withdrawals`, `POST /api/conversions`, `POST /api/transfers`, `GET /api/currencies`, `GET /api/rates?base=USD&quote=EUR`, `POST /api/quotes`, `GET /api/quotes/{quoteId}`, `GET /api/transactions?accountId=…`, `GET /api/transactions/{transactionId}?accountId=…`, and `GET /api/openapi`. Money submissions require a UUID key; identical retries replay the original result indefinitely, while changed input is rejected. Amounts/rates are exact strings and responses are not cached. Reference GETs update technical caches, never money/wallets; eligible fallback is less than 24 hours old, without invented reciprocal/cross rates. Quotes move/reserve no funds and create no recipient/wallet. History reads completed journal facts without fetching rates, expose no balances/retry keys and require explicit account context. Swagger UI and full-history browsing remain unimplemented.

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

Jest covers exact accounting, atomic seeding, snapshot reads, funding concurrency/rollback/replay, client recovery and quote lifecycle/consumption. Read/visual Chromium checks can use the ordinary local server. **Monetary and quote browser tests must use the disposable funding-e2e server** in [`artifact/QUOTES.md`](artifact/QUOTES.md); they refuse the ordinary runtime target. Never fund or seed quotes in the persistent wallet as test setup. Retain the same key/input after a timeout/storage failure; do not start a replacement attempt while its outcome is unknown.

Reference tests mock the network and clock. The optional live check is separate:
`docker compose run --rm -e DATABASE_PATH=/tmp/opencode/rates-smoke.sqlite -e WALLET_RATES_SMOKE=1 app node --conditions=react-server --import tsx scripts/smoke-rates.ts`.
It refuses the runtime database. The root page makes no provider request in this
stage, so ordinary funding/reads stay independent of Frankfurter outages.

For the complete local check (including a production build), stop the development compiler first:

```sh
docker compose stop app
docker compose run --rm app npm run check
docker compose up -d app
```

Generate a migration after an intentional schema change with `docker compose run --rm app npm run db:generate -- --name=descriptive_name`, review/commit the generated SQL and metadata, then apply it with `npm run db:migrate` in the container. Never use schema-push or a volume reset as a substitute for a reviewed migration.

The wallet retains its shadcn/Radix controls, flags, gradient, branding, typography and motion. The dynamic page reads stored snapshots; `createPreviewOverview()` is test-only. Review alone never moves funds. Funding/conversion require explicit confirmation; transfers stay disabled. Ordinary drafts/quotes clear on reload. Only unresolved intent temporarily uses verified per-tab storage, now shared across funding/conversion under the historical `cocowallet.pending-funding.v1` key for compatibility. Unknown outcomes retain the exact original key/request/quote, never a replacement. Closing the tab or deleting storage can lose that context; it is not cross-device recovery. Recent transactions is labelled as the latest 50 completed funding/conversion receipts, not full history or historical USD valuation.

Stop the development service before building against the same Next output volume to avoid two compilers writing there at once. Existing planning files and the design skill are preserved. Node 26 is enforced by npm; TypeScript 5.9 is pinned for the initial verified Next.js toolchain rather than adopting a new TypeScript major by default.

Normal shutdown will use `docker compose down`, **without `--volumes`**. Removing `wallet-data` explicitly destroys simulated balances/history. No real payment, authentication, or crypto integration is included.

## Design tooling

See [`artifact/TOOLING.md`](artifact/TOOLING.md) to restore the checksum-verified Impeccable engine excluded from Git.

The user confirmed local demo/evaluation use, code-first, and the frosted reference adaptation. The built shell's [review record](artifact/DESIGN_REVIEW.md) documents its corrected finding and verdict scope. [DESIGN.md](DESIGN.md) and `.impeccable/design.json` capture its actual tokens and component examples. Live-picker configuration has not been enabled automatically.

Commit shared Impeccable artifacts when present: `PRODUCT.md`, `DESIGN.md`, `.impeccable/config.json`, `.impeccable/surfaces/`, `.impeccable/design.json`, `.impeccable/live/config.json`, and `.impeccable/critique/ignore.md`. Do not blanket-ignore `.impeccable/`; runtime directories ignore themselves, and `.impeccable/config.local.json` remains local.
