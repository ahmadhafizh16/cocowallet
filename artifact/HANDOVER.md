# Handover

**Status:** Planning only. No application code, database, or dependencies have been created.

## Current environment

- The workspace was empty before the draft documents were added.
- The available host `node` command reports v24.22.1; the application will run on Node.js 26 in Docker, avoiding a requirement to install Node 26 on the host.
- The `sqlite3` CLI was not found. It is optional if the selected application driver manages the SQLite file.
- Docker and Docker Compose are installed; the Docker engine responded to a version check. A Docker-first workflow is agreed, but no application container configuration exists yet.
- Git is initialized on `main`; baseline commits separate ignore rules, feature requirements, architecture decisions, and vendored design tooling. Automatic Angular-style commits by intention are authorized; no remote or push is automatic.
- Impeccable is installed and loadable project-locally in `.opencode/skills/impeccable`, with the `/impeccable` command in `.opencode/commands/impeccable.md`; its bundled Linux engine reports version 4.8.2. It was installed without optional automatic hooks. Initialization has not run and `PRODUCT.md` does not yet exist. Before design, follow the [getting-started guide](https://impeccable.style/tutorials/getting-started/), run `/impeccable init`, and review the resulting product context. After UI edits, follow the skill's manual detector instruction because no automatic hook is active.
- The approximately 22 MB Impeccable Linux engine is excluded from Git and retained locally. `sh scripts/setup-impeccable.sh` restores the pinned, checksum-verified engine; online restoration and corrupt-source rejection were tested in isolation. See [TOOLING.md](TOOLING.md).
- Host npm/network requests timed out during installation; a direct IPv4-first Node fetch succeeded, but the npm installer still stalled. The skill was installed with the verified cached official CLI and an official locally downloaded bundle. Diagnose Node 26/npm networking inside Docker before relying on dependency installs.
- The project-local Icons8 MCP configuration has been removed at the user's request. Lucide React is the selected icon library; no icon package is installed yet.

## Core implementation guidance — proposed

No core code exists yet. When implementation starts, document the important actual modules and decisions here instead of presenting pseudocode as working code.

- Derive balances from integer-minor-unit journal entries; use decimal-safe arithmetic for rates, half-up conversion rounding, and currency-specific precision and numeric limits. Guard SQLite integer and aggregation overflow as well as JavaScript precision/serialization limits.
- The selected driver is `better-sqlite3`; verify native binary/build compatibility with Node 26 before committing dependency versions. Use Jest/`next/jest` for unit and integration tests and Playwright for browser flows.
- Validate on the server, not only in the UI. Avoid negative balances unless explicitly permitted.
- For each completed money-moving action, save the transaction and journal entries in one SQLite transaction. Serialize writers before checking the journal-derived balance, and plan for concurrent requests and duplicate submissions.
- Expose operations through Next.js Route Handlers and document them with OpenAPI and Swagger UI. Use Problem Details errors and require idempotency keys for money-moving requests. An accepted key replays the original definitive success or error; failed-result metadata is not completed history. The generator, exact contracts, and storage/recovery details remain open; see [API_DESIGN.md](API_DESIGN.md) and [O-006](DECISIONS.md#o-006).
- Fetch Frankfurter rates outside the database write transaction. Hold the displayed quote for one minute, retain the exact applied rate and its source date, and fall back only to an exact-pair rate fetched within the last 24 hours. Label cached rates and block when none is eligible. Do not confuse the source rate date with the cache retrieval time or quote expiry.
- For an unknown destination ID, choose its default currency and create and credit a simulated account. The account switcher permits inspecting destination accounts only; automatically create a missing destination-currency wallet, and convert when source/destination currencies differ. Do not imply a real external wallet received money.
- Enforce the inspect-only rule on the server as well as in the interface, even though this is a local no-authentication simulation.
- Only the main account's default currency is editable. The requested portfolio total is always shown in USD, independently of that default.
- History contains completed operations only; rejected requests return errors without creating transaction records. Show a transfer as outgoing for the main account and incoming for the destination.
- The USD portfolio total is approximate. When a required exchange rate is unavailable, show the total as unavailable while leaving individual balances visible.
- Honor reduced-motion preferences while implementing the requested smooth animations and transitions.
- A persistent SQLite file requires persistent storage and a deployment model compatible with a local database. No-auth operation needs a deliberate access/deployment boundary.
- Store the SQLite database in the agreed persistent Docker volume, build the native SQLite driver inside the Linux container, and keep the app's local-only access boundary. Do not assume removing containers preserves a named volume if the volume is explicitly deleted.

## Next steps

Read [README.md](README.md), the [main PRD](PRD.md), [decision register](DECISIONS.md), [readiness checklist](READINESS.md), and [kanban](KANBAN.md). Work from the linked feature PRDs and task acceptance criteria, and resolve remaining implementation details as needed. Update this handover with actual code paths and commands only after implementation exists.
