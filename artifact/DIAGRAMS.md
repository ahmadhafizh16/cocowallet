# Architecture and flow diagrams

**Status:** The platform foundation, journal schema, exact money, and snapshot balance reads are implemented and tested. Write orchestration is in progress; HTTP operations, quotes, idempotency storage, and interface diagrams still describe future features. The [decision register](DECISIONS.md) is authoritative when a diagram and an open question conflict.

## Implemented foundation flow

```mermaid
flowchart LR
    Local[Local browser or API client] -->|127.0.0.1:3000| Next[Next.js on Node 26 in Docker]
    Next --> Health[GET /api/health: liveness]
    Next --> Ready[GET /api/ready: schema readiness]
    Ready --> Runtime[src/server/db/runtime.ts]
    Runtime --> Connection[connection.ts: Drizzle and better-sqlite3]
    CLI[npm run db:migrate] --> Migrations[Committed Drizzle SQL and metadata]
    Migrations --> Connection
    Connection --> SQLite[(SQLite operational metadata)]
    SQLite --- Volume[Persistent wallet-data volume]
    Jest[Jest: isolated temporary databases] --> Connection
    Browser[Playwright: pinned Chromium container] -->|wallet.test:3000| Next
```

The application database currently contains operational metadata and migration tracking, not accounts or wallet balances. Ordinary unit/integration tests create their own temporary files and cannot use the configured runtime connection. The following sections remain the future feature design.

## System and Docker boundary

Decisions: [D-001](DECISIONS.md#d-001), [D-002](DECISIONS.md#d-002), [D-007](DECISIONS.md#d-007), [D-017](DECISIONS.md#d-017), [D-020](DECISIONS.md#d-020). Tasks: [T01-01](tasks/TASKS-01.md#t01-01), [T01-03](tasks/TASKS-01.md#t01-03), [T10-03](tasks/TASKS-10.md#t10-03).

```mermaid
flowchart LR
    User[Local simulated user] --> Browser[Browser: wallet interface]
    Browser -->|localhost HTTP| App
    Swagger[Swagger UI in browser] -->|local HTTP requests| App
    subgraph Docker[Docker Compose: Node 26 app container]
        App[Next.js pages and Route Handlers]
        Services[Feature services: wallets, funding, FX, transfers, history]
        Schemas[Validation schemas and OpenAPI metadata]
        Adapter[Frankfurter client and cache policy]
        App --> Services
        Schemas --> App
        Schemas --> Spec[OpenAPI document]
        Services --> Adapter
    end
    Spec --> Swagger
    Adapter -->|latest reference rate| Frankfurter[Frankfurter API]
    Services --> DB[(SQLite file)]
    Adapter --> DB
    DB --- Volume[Persistent named volume]
```

SQLite is an embedded file, not a separate database server. The application is local and has no authentication; the host-facing port should be bound appropriately, e.g. localhost. The named volume must survive normal container recreation. Explicit volume deletion can delete the wallet data; backups need an agreed procedure.

## Logical data relationships

Decisions: [D-003](DECISIONS.md#d-003), [D-004](DECISIONS.md#d-004), [D-008](DECISIONS.md#d-008), [D-012](DECISIONS.md#d-012), [D-018](DECISIONS.md#d-018), [D-019](DECISIONS.md#d-019). Tasks: [T02-02](tasks/TASKS-02.md#t02-02), [T03-01](tasks/TASKS-03.md#t03-01), [T09-01](tasks/TASKS-09.md#t09-01), [T10-02](tasks/TASKS-10.md#t10-02).

```mermaid
erDiagram
    ACCOUNT ||--o{ WALLET : contains
    WALLET ||--o{ JOURNAL_ENTRY : has
    TRANSACTION ||--|{ JOURNAL_ENTRY : records
    FX_QUOTE o|--o{ TRANSACTION : informs
    IDEMPOTENCY_KEY o|--o| TRANSACTION : protects
```

Account, wallet, transaction, and journal tables now exist; FX quote and idempotency relationships remain conceptual. A wallet is unique by account and currency. A deposit or withdrawal affects one wallet; a conversion or transfer affects two wallets and stores one related debit and one related credit. Amounts use each wallet currency's minor units, so entries in different currencies must **not** be summed together. A wallet balance is derived from its own journal entries. Triggers protect recorded history, wallet/account identity, journal direction, and used currency precision. Full journal cardinality and balance checks belong to the upcoming application write boundary, not a claim that arbitrary direct SQL is safe. A quote is needed only when FX applies. Definitive failed-result metadata is separate from completed transactions; retention and recovery details are [O-006](DECISIONS.md#o-006).

Implemented balance reads:

```mermaid
flowchart LR
    Reader[Wallet or account read] --> Snapshot[SQLite read transaction]
    Snapshot --> Identity[Check account/wallet and precision]
    Identity --> Stream[Stream each wallet's own signed entries]
    Stream --> Bigint[Arbitrary-precision bigint subtotal]
    Bigint --> Bounds[Validate final balance 0..M]
    Bounds --> Result[Return bigint minor units]
    Result --> Text[Future HTTP layer: format decimal strings]
```

Account wallet metadata and balances share one snapshot. No balance column,
SQL `SUM()`, floating-point aggregate, or cross-currency addition is used.

## Business operations and history

Decisions: [D-003](DECISIONS.md#d-003), [D-005](DECISIONS.md#d-005), [D-006](DECISIONS.md#d-006), [D-009](DECISIONS.md#d-009), [D-010](DECISIONS.md#d-010), [D-012](DECISIONS.md#d-012).

```mermaid
flowchart TD
    Start[Main account action] --> Select{Operation}
    Select -->|Deposit| Deposit[Select fictional provider and source wallet]
    Select -->|Withdraw| Withdraw[Select fictional provider and source wallet]
    Select -->|Convert| Convert[Select two currencies and preview quote]
    Select -->|Transfer| Transfer[Enter destination ID and choose destination currency]
    Deposit --> Validate[Server validates amount and operation]
    Withdraw --> Validate
    Convert --> Validate
    Transfer --> Validate
    Validate -->|invalid or insufficient| Error[Show error; no completed history entry]
    Validate -->|valid| Commit[Atomic journal entries and completed transaction]
    Commit --> Balances[Balances derived from wallet journal]
    Commit --> History[Completed transaction history and details]
    History --> Inspect[Switch to destination account for inspection]
```

No action moves real money. Destination accounts can be inspected but cannot initiate operations. A transfer to the main account's own ID is rejected; conversions handle the main account's currency changes.

## Rate, cache, and quote sequence

Decisions: [D-007](DECISIONS.md#d-007), [D-008](DECISIONS.md#d-008), [D-018](DECISIONS.md#d-018); open precision choice: [O-002](DECISIONS.md#o-002). Tasks: [T06-01](tasks/TASKS-06.md#t06-01), [T06-02](tasks/TASKS-06.md#t06-02).

```mermaid
sequenceDiagram
    actor User
    participant UI as Browser
    participant API as Quote handler/service
    participant FX as Frankfurter
    participant Cache as SQLite rate cache
    User->>UI: Enter source, target and amount
    UI->>API: Request preview
    API->>API: Validate currency pair and amount
    API->>FX: Fetch latest available reference rate
    alt Rate available
        FX-->>API: Rate and source date
        API->>Cache: Record exact pair and fetch time
    else API unavailable or pair unavailable
        API->>Cache: Look for exact pair fetched within 24 hours
        alt Eligible cached rate exists
            Cache-->>API: Rate, source date and fetch time
            API->>API: Mark preview as cached
        else No eligible cached rate
            API-->>UI: 503 Problem Details; no operation
        end
    end
    API->>API: Prepare server-validated quote, expiry and rounded target amount
    API-->>UI: Preview amount, rate, source date, cache status and expiry
    User->>UI: Confirm within one minute
```

The API may return a prior reference **source date** even when a rate was fetched just now. Cache eligibility is based on fetch time, while the one-minute quote expiry is a separate confirmation rule. The implementation of server-owned quote storage is open; the client must not be trusted to supply the applied rate.

## Code flow for a completed money operation

Decisions: [D-006](DECISIONS.md#d-006), [D-017](DECISIONS.md#d-017), [D-018](DECISIONS.md#d-018), [D-019](DECISIONS.md#d-019). Tasks: [T02-03](tasks/TASKS-02.md#t02-03), [T10-01](tasks/TASKS-10.md#t10-01), [T10-02](tasks/TASKS-10.md#t10-02).

```mermaid
sequenceDiagram
    participant UI as Browser or Swagger
    participant API as Route Handler
    participant Service as Feature service
    participant DB as SQLite
    UI->>API: POST request plus Idempotency-Key
    API->>API: Parse and validate request
    API->>Service: Execute validated operation
    Service->>DB: Preflight lookup of key and request fingerprint
    alt Previously recorded matching result
        DB-->>Service: Original definitive success or error
        Service-->>API: Replay result; no new entries
    else Key reused with different input
        Service-->>API: Conflict; no new entries
    else New operation
        Note over Service: Prepare any FX quote before the write transaction
        Service->>DB: Begin serialized write transaction
        Service->>DB: Recheck key, quote and journal-derived balance
        alt Another matching request already completed
            DB-->>Service: Original definitive result
            Service-->>API: Replay result; no new entries
        else Valid new operation
            Service->>DB: Create any missing destination/wallet
            Service->>DB: Insert transaction and journal entry or entries
            Service->>DB: Atomically record success result and key
            DB-->>Service: Commit
            Service-->>API: Completed result
        else Definitive business error for an accepted key
            Service->>DB: Preserve error result/key without completed history
            DB-->>Service: Persist technical result
            Service-->>API: Original error
        end
    end
    API-->>UI: JSON result or Problem Details
```

The SQLite write-locking strategy is a proposed implementation detail; it must serialize competing balance checks and writes, and must not hold a write lock while making a network request. Check for an already recorded result before a fresh FX call or quote-expiry check, then recheck under the write lock to handle races. Validation or transaction failures cannot leave partial journal entries or a partially created destination. The exact handling of in-progress keys, pre-key validation, retention, and unavailable idempotency storage remains [O-006](DECISIONS.md#o-006).

## Cross-currency transfer sequence

Decisions: [D-003](DECISIONS.md#d-003), [D-008](DECISIONS.md#d-008), [D-010](DECISIONS.md#d-010), [D-018](DECISIONS.md#d-018), [D-019](DECISIONS.md#d-019). Tasks: [T08-01](tasks/TASKS-08.md#t08-01), [T08-02](tasks/TASKS-08.md#t08-02).

```mermaid
sequenceDiagram
    actor User
    participant UI as Transfer UI
    participant API as HTTP API and services
    participant DB as SQLite
    User->>UI: Enter destination ID and source amount
    UI->>API: Look up destination and prepare preview
    alt Unknown destination
        API-->>UI: Request default currency for new simulated account
    else Existing destination
        API-->>UI: Show destination default currency
    end
    User->>UI: Accept default or choose another currency
    UI->>API: Preview transfer and FX quote if needed
    API-->>UI: Source/target amounts, rate details and expiry
    User->>UI: Confirm
    UI->>API: Submit confirmation and idempotency key
    API->>DB: Begin serialized write transaction
    API->>DB: Revalidate quote, key, source balance and destination
    API->>DB: Create missing destination account/wallet
    API->>DB: Save transaction, source debit and destination credit
    DB-->>API: Commit atomically
    API-->>UI: Completed simulated transfer
    User->>UI: Switch to destination account
    UI->>API: Read destination balances and incoming history
```

If source and destination currencies match, no FX quote is needed. If the quote expires, is invalid, or funds are insufficient, no partial account, wallet, transaction, or journal entry is committed. The destination remains inspect-only.

## Illustrative accounting example

Assume the main USD wallet already has at least **100.00 USD**. A hypothetical reference rate of **1 USD = 0.80 GBP** is shown and confirmed within the quote window. A completed transfer records one transaction and two entries:

| Wallet | Journal delta in minor units | Display delta |
| --- | ---: | ---: |
| Main USD wallet | `-10000` | `-100.00 USD` |
| Destination GBP wallet | `+8000` | `+80.00 GBP` |

The example rate is fictional. The journal is the balance source; each wallet's balance is the sum of its **own** entries. Test exact arithmetic, half-up conversion rounding, duplicate requests, and concurrent attempts to spend the same balance.
