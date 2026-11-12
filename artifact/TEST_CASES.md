# Test case catalogue

This snapshot lists 1549 individual Jest cases in 75 suites, plus Playwright cases discovered by its test runner. Jest results below are from the isolated run used to build this catalogue; Playwright entries are discovered cases, not a claim that they were executed.

Repeated Jest names may represent separate parameterized executions whose inputs are not included in the runner's displayed name.

Jest uses temporary test databases. Monetary and quote browser tests must only target the guarded disposable funding-e2e server described in `artifact/QUOTES.md`; never run them against the persistent wallet.

## Jest cases

### `src/app/api/accounts/[accountId]/wallets/route.test.ts`

- [passed] GET /api/accounts/{accountId}/wallets serializes exact journal-derived balances as decimal integer strings
- [passed] GET /api/accounts/{accountId}/wallets scopes destination inspection and never supplies main-account balances
- [passed] GET /api/accounts/{accountId}/wallets returns a safe 404 for unknown
- [passed] GET /api/accounts/{accountId}/wallets returns a safe 404 for ' OR 1=1 --
- [passed] GET /api/accounts/{accountId}/wallets rejects invalid path IDs before database access
- [passed] GET /api/accounts/{accountId}/wallets rejects invalid path IDs before database access
- [passed] GET /api/accounts/{accountId}/wallets does not convert unavailable storage into zero balances

### `src/app/api/accounts/route.test.ts`

- [passed] GET /api/accounts reads the persistent main account without caching or mutating data
- [passed] GET /api/accounts does not seed during a GET when no main account exists
- [passed] GET /api/accounts redacts unexpected database failures

### `src/app/api/conversions/route.test.ts`

- [passed] conversion submission HTTP boundary returns the original receipt and replay header even after quote expiry
- [passed] conversion submission HTTP boundary rejects malformed/override input before storage
- [passed] conversion submission HTTP boundary rejects malformed/override input before storage
- [passed] conversion submission HTTP boundary rejects malformed/override input before storage
- [passed] conversion submission HTTP boundary rejects malformed/override input before storage
- [passed] conversion submission HTTP boundary rejects malformed/override input before storage
- [passed] conversion submission HTTP boundary rejects non-local JSON writes before storage: {"Origin":"https://evil.test"}
- [passed] conversion submission HTTP boundary rejects non-local JSON writes before storage: {"Content-Type":"text/plain"}
- [passed] conversion submission HTTP boundary rejects non-local JSON writes before storage: {"Sec-Fetch-Site":"cross-site"}
- [passed] conversion submission HTTP boundary records/replays missing quote failures outside completed history
- [passed] conversion submission HTTP boundary redacts unconfirmed storage errors and preserves the original key

### `src/app/api/health/route.test.ts`

- [passed] GET /api/health returns a healthy JSON response without caching mutable app state

### `src/app/api/openapi/route.test.ts`

- [passed] read-only OpenAPI contract serves the implemented read specification without advertising future money APIs
- [passed] read-only OpenAPI contract documents operational response bodies and no-store headers for every implemented response
- [passed] read-only OpenAPI contract validates safe unexpected failures across every storage-backed route
- [passed] read-only OpenAPI contract returns documented inspect-only conflicts without completed history or provider calls
- [passed] read-only OpenAPI contract validates actual account and balance responses against their published schemas
- [passed] read-only OpenAPI contract validates actual funding receipt and definitive error against the published schemas
- [passed] read-only OpenAPI contract validates actual reference metadata responses against the published schemas
- [passed] read-only OpenAPI contract validates actual server quote preview/readback against the discriminated schemas

### `src/app/api/portfolio/route.test.ts`

- [passed] GET /api/portfolio exposes exact scoped totals and immutable technical history without changing money
- [passed] GET /api/portfolio rejects malformed context before database access:
- [passed] GET /api/portfolio rejects malformed context before database access: ?accountId=
- [passed] GET /api/portfolio rejects malformed context before database access: ?accountId=main&accountId=recipient
- [passed] GET /api/portfolio rejects malformed context before database access: ?accountId=main&unknown=x
- [passed] GET /api/portfolio rejects malformed context before database access: ?accountId=%00
- [passed] GET /api/portfolio returns 404 for an unknown account without falling back to main
- [passed] GET /api/portfolio redacts storage errors

### `src/app/api/ready/route.test.ts`

- [passed] GET /api/ready verifies the migrated schema using an isolated database
- [passed] GET /api/ready returns a safe Problem Details response when migrations are missing

### `src/app/api/transfers/route.test.ts`

- [passed] transfer HTTP boundary creates exact arbitrary destinations in a no-FX transfer and replays the original balance snapshots
- [passed] transfer HTTP boundary honors reviewed FX terms and retained success even after expiry and later spending
- [passed] transfer HTTP boundary retains definitive expiry with no recipient or debit, and does not overwrite existing defaults
- [passed] transfer HTTP boundary rejects malformed/override input before storage
- [passed] transfer HTTP boundary rejects malformed/override input before storage
- [passed] transfer HTTP boundary rejects malformed/override input before storage
- [passed] transfer HTTP boundary rejects malformed/override input before storage
- [passed] transfer HTTP boundary rejects malformed/override input before storage
- [passed] transfer HTTP boundary rejects malformed/override input before storage
- [passed] transfer HTTP boundary rejects malformed/override input before storage
- [passed] transfer HTTP boundary rejects malformed/override input before storage
- [passed] transfer HTTP boundary rejects malformed/override input before storage
- [passed] transfer HTTP boundary rejects non-local or unkeyed writes before storage {"Origin":"https://evil.test"}
- [passed] transfer HTTP boundary rejects non-local or unkeyed writes before storage {"Content-Type":"text/plain"}
- [passed] transfer HTTP boundary rejects non-local or unkeyed writes before storage {"Sec-Fetch-Site":"cross-site"}
- [passed] transfer HTTP boundary rejects non-local or unkeyed writes before storage {"Idempotency-Key":"bad"}
- [passed] transfer HTTP boundary enforces source permissions and retains rejection INVALID_RECIPIENT
- [passed] transfer HTTP boundary enforces source permissions and retains rejection INSPECT_ONLY
- [passed] transfer HTTP boundary enforces source permissions and retains rejection INSUFFICIENT_FUNDS
- [passed] transfer HTTP boundary redacts storage exceptions and retains original-key uncertainty

### `src/app/boundaries.test.tsx`

- [passed] wallet route boundaries provides a polite loading region without fabricated balances
- [passed] wallet route boundaries does not leak internal error messages or suggest a fresh uncertain attempt
- [passed] wallet route boundaries gives an unknown route a semantic path back

### `src/components/brand/cocowallet-logo.test.tsx`

- [passed] CocoWallet branding renders an accessible, font-independent vector logo
- [passed] CocoWallet branding inherits the wordmark color while retaining the approved icon palette
- [passed] CocoWallet branding supports decorative use and merges caller SVG props
- [passed] CocoWallet branding preserves every approved vector shape and the matching favicon

### `src/components/ui/primitives.test.tsx`

- [passed] shared UI primitives does not accidentally submit a surrounding form
- [passed] shared UI primitives composes link buttons without nesting interactive elements
- [passed] shared UI primitives preserves accessible input attributes
- [passed] shared UI primitives keeps skeletons decorative so loading is announced only by the region

### `src/features/accounts/read.test.ts`

- [passed] persistent account read models reads one account's metadata without aggregating balances or validating unrelated destinations
- [passed] persistent account read models returns main first and destinations in stable created-at/id order
- [passed] persistent account read models reads empty wallets with stored names and preserves the current GBP main default
- [passed] persistent account read models returns exact JSON-safe balances above Number.MAX_SAFE_INTEGER and at MAX_MINOR
- [passed] persistent account read models includes stored currencies beyond the three startup currencies with pinned exponents
- [passed] persistent account read models lists an internally created and credited destination as inspect-only
- [passed] persistent account read models returns no wallets for an empty destination rather than reusing main wallets
- [passed] persistent account read models distinguishes unknown account "missing" without falling back to the main account
- [passed] persistent account read models distinguishes unknown account "" without falling back to the main account
- [passed] persistent account read models distinguishes unknown account "main-usd" without falling back to the main account
- [passed] persistent account read models distinguishes unknown account "main' OR 1=1 --" without falling back to the main account
- [passed] persistent account read models never seeds on a read when the main account is missing, including unknown-id reads
- [passed] persistent account read models requires a main account even when a destination exists
- [passed] persistent account read models rejects multiple main accounts instead of selecting one arbitrarily
- [passed] persistent account read models allows nested read snapshots and performs no writes on a query-only connection
- [passed] persistent account read models rejects malformed stored account timestamp ""
- [passed] persistent account read models rejects malformed stored account timestamp " "
- [passed] persistent account read models rejects malformed stored account timestamp "not-a-timestamp"
- [passed] persistent account read models rejects malformed stored account timestamp "2026"
- [passed] persistent account read models rejects malformed stored account timestamp "2026-01-01"
- [passed] persistent account read models rejects malformed stored account timestamp "2026-02-30T00:00:00.000Z"
- [passed] persistent account read models rejects a blank stored account identifier
- [passed] persistent account read models rejects a malformed role even when a valid main account remains
- [passed] persistent account read models rejects a missing stored currency name ""
- [passed] persistent account read models rejects a missing stored currency name " "
- [passed] persistent account read models rejects unpinned or malformed stored USD precision 0n
- [passed] persistent account read models rejects unpinned or malformed stored USD precision 1n
- [passed] persistent account read models rejects unpinned or malformed stored USD precision 3n
- [passed] persistent account read models rejects unpinned or malformed stored USD precision 5n
- [passed] persistent account read models rejects unpinned or malformed stored USD precision 1.5
- [passed] persistent account read models rejects unpinned or malformed stored USD precision invalid
- [passed] persistent account read models does not guess an accounting exponent for stored currency ZZZ
- [passed] persistent account read models does not guess an accounting exponent for stored currency XXX
- [passed] persistent account read models validates an account's default currency even without a matching wallet
- [passed] persistent account read models does not silently drop wallets whose currency metadata is missing
- [passed] persistent account read models does not hide an account with missing default-currency metadata
- [passed] persistent account read models rejects blank wallet identifiers instead of exposing malformed metadata
- [passed] persistent account read models does not silently omit wallets with missing account metadata from the overview
- [passed] persistent account read models propagates invalid final journal balances rather than showing a fabricated zero ("-1n")
- [passed] persistent account read models propagates invalid final journal balances rather than showing a fabricated zero ("9223372036854775807n")
- [passed] persistent account read models retains arbitrary-precision intermediate aggregation in the existing journal reader
- [passed] persistent account read models propagates malformed journal-entry errors rather than masking them
- [passed] persistent account read models keeps accounts, metadata, and every account's balances in one WAL read snapshot

### `src/features/accounts/seed.test.ts`

- [passed] explicit main-account initialization creates one persistent USD main account with three empty wallets and no history
- [passed] explicit main-account initialization is repeatable without resetting identities, timestamps, names, or defaults
- [passed] explicit main-account initialization retains initialized state after closing and reopening the database
- [passed] explicit main-account initialization adds only missing metadata and wallets without changing existing funded data
- [passed] explicit main-account initialization fails closed on conflicting USD precision and rolls back missing metadata
- [passed] explicit main-account initialization fails closed on conflicting EUR precision and rolls back missing metadata
- [passed] explicit main-account initialization fails closed on conflicting GBP precision and rolls back missing metadata
- [passed] explicit main-account initialization rolls back currencies, account, and earlier wallets after a late insert fails
- [passed] explicit main-account initialization rejects nesting rather than upgrading an existing deferred transaction
- [passed] explicit main-account initialization holds a writer reservation before its first insert on a second connection
- [passed] explicit main-account initialization serializes concurrent startup seeds from independent connections

### `src/features/conversions/concurrency.test.ts`

- [passed] independent serialized conversion writers same key and quote create only one target wallet/debit and replay the original receipt
- [passed] independent serialized conversion writers different keys cannot successfully consume the same quote twice
- [passed] independent serialized conversion writers separate valid quotes cannot overspend one source wallet
- [passed] independent serialized conversion writers funding and conversion serialize funds/global key ownership (same key: false)
- [passed] independent serialized conversion writers funding and conversion serialize funds/global key ownership (same key: true)

### `src/features/conversions/service.test.ts`

- [passed] atomic quote-bound conversion service commits exact source/target entries, original provenance, quote use and immutable receipt together
- [passed] atomic quote-bound conversion service atomically creates a missing EUR currency/wallet from reviewed server metadata
- [passed] atomic quote-bound conversion service atomically creates a missing JPY currency/wallet from reviewed server metadata
- [passed] atomic quote-bound conversion service replays after expiry, later spending and reopen without reading quotes or fetching/consulting the clock
- [passed] atomic quote-bound conversion service uses the full issued minute after a cached rate crosses 24 hours, with no provider work at confirmation
- [passed] atomic quote-bound conversion service requires eligible catalog metadata at issuance when a target wallet is missing, even for an already known currency
- [passed] atomic quote-bound conversion service preserves the exact int64-compatible boundary without number conversion
- [passed] atomic quote-bound conversion service converts a zero-decimal source using its accounting exponent
- [passed] atomic quote-bound conversion service validates strict quote expiry at 59999 ms and retains failures outside history
- [passed] atomic quote-bound conversion service validates strict quote expiry at 60000 ms and retains failures outside history
- [passed] atomic quote-bound conversion service rolls back if the quote expires between final validation and use, without retaining an unconfirmed failure
- [passed] atomic quote-bound conversion service replays a funds rejection even after funding changes, while a new key may still use the unconsumed quote
- [passed] atomic quote-bound conversion service rejects changed input under the same accepted key: {"amount":"10"}
- [passed] atomic quote-bound conversion service rejects changed input under the same accepted key: {"sourceWalletId":"main-gbp"}
- [passed] atomic quote-bound conversion service rejects changed input under the same accepted key: {"targetCurrency":"JPY"}
- [passed] atomic quote-bound conversion service rejects changed input under the same accepted key: {"quoteId":"94992b3c-e914-4b1c-9770-48f9f31b6e27"}
- [passed] atomic quote-bound conversion service retains quote/input mismatch for a well-shaped fresh key, without consuming the quote
- [passed] atomic quote-bound conversion service does not allow a new key to reuse an already successful quote
- [passed] atomic quote-bound conversion service retains unknown-quote 404 but leaves malformed input/key outside acceptance
- [passed] atomic quote-bound conversion service never accepts a transfer quote and never creates or debits destination accounts
- [passed] atomic quote-bound conversion service rechecks target balance bounds at confirmation without consuming failure
- [passed] atomic quote-bound conversion service rolls back all new metadata, money and quote use when currencies insertion fails
- [passed] atomic quote-bound conversion service rolls back all new metadata, money and quote use when wallets insertion fails
- [passed] atomic quote-bound conversion service rolls back all new metadata, money and quote use when transactions insertion fails
- [passed] atomic quote-bound conversion service rolls back all new metadata, money and quote use when debit insertion fails
- [passed] atomic quote-bound conversion service rolls back all new metadata, money and quote use when credit insertion fails
- [passed] atomic quote-bound conversion service rolls back all new metadata, money and quote use when fx_quote_uses insertion fails
- [passed] atomic quote-bound conversion service rolls back all new metadata, money and quote use when conversion_attempts insertion fails
- [passed] atomic quote-bound conversion service does not claim a definitive rejection when its error result cannot be stored
- [passed] atomic quote-bound conversion service reserves keys globally across funding and conversion, including definitive errors
- [passed] atomic quote-bound conversion service leaves corrupt stored receipts and quotes unconfirmed instead of fabricating a result
- [passed] atomic quote-bound conversion service fails closed on altered retained receipt rate without any new debit
- [passed] atomic quote-bound conversion service fails closed on altered retained receipt targetAmount without any new debit
- [passed] atomic quote-bound conversion service fails closed on altered retained receipt sourceBalance without any new debit
- [passed] atomic quote-bound conversion service fails closed on altered retained receipt transactionId without any new debit
- [passed] atomic quote-bound conversion service fails closed on altered retained receipt quoteTime without any new debit
- [passed] atomic quote-bound conversion service returns an unknown result on lock timeout; retrying the same key after unlock is safe

### `src/features/conversions/use-quote.test.tsx`

- [passed] reviewed server quote client lifecycle does not request automatically, validates fixed terms, and expires on focus without extending the minute
- [passed] reviewed server quote client lifecycle discards late responses after editing rather than binding stale terms
- [passed] reviewed server quote client lifecycle blocks confirmation for altered preview amount
- [passed] reviewed server quote client lifecycle blocks confirmation for altered preview rate
- [passed] reviewed server quote client lifecycle blocks confirmation for altered preview account
- [passed] reviewed server quote client lifecycle blocks confirmation for altered preview expiry
- [passed] reviewed server quote client lifecycle blocks confirmation for altered preview cachedTime
- [passed] reviewed server quote client lifecycle allows a labelled cached preview, but no replacement terms are auto-confirmed
- [passed] reviewed server quote client lifecycle uses one deadline and leaves no recurring timer after expiry
- [passed] reviewed server quote client lifecycle validates transfer-specific recipient context without creating or submitting anything
- [passed] reviewed server quote client lifecycle rejects altered transfer preview recipient
- [passed] reviewed server quote client lifecycle rejects altered transfer preview targetAccount
- [passed] reviewed server quote client lifecycle rejects altered transfer preview self
- [passed] reviewed server quote client lifecycle rejects altered transfer preview default
- [passed] reviewed server quote client lifecycle rejects altered transfer preview existed
- [passed] reviewed server quote client lifecycle rejects altered transfer preview precision
- [passed] reviewed server quote client lifecycle rejects altered transfer preview missingDefault
- [passed] reviewed server quote client lifecycle rejects altered transfer preview sameCurrency
- [passed] reviewed server quote client lifecycle rejects altered transfer preview operation

### `src/features/funding/concurrency.test.ts`

- [passed] independent funding writers concurrent identical keys commit only one credit
- [passed] independent funding writers different withdrawal keys cannot overdraw and preserve the losing definitive failure
- [passed] independent funding writers busy storage is nondefinitive and same-key retry remains safe

### `src/features/funding/read.test.ts`

- [passed] bounded completed-funding visibility includes immutable successful receipts only, never rejected attempts

### `src/features/funding/request-key.test.ts`

- [passed] secure funding keys uses native randomUUID when available
- [passed] secure funding keys uses cryptographically random bytes and correct UUID version/variant on local HTTP
- [passed] secure funding keys fails closed without secure randomness

### `src/features/funding/service.test.ts`

- [passed] durable simulated funding commits exact funding, original receipt and key atomically; replay survives later changes
- [passed] durable simulated funding retains definitive failures even after funds arrive, without history clutter
- [passed] durable simulated funding rejects changed key input deposit 1.00 main-usd demo_bank
- [passed] durable simulated funding rejects changed key input deposit 100 main-usd demo_bank
- [passed] durable simulated funding rejects changed key input deposit 100.00 main-gbp demo_bank
- [passed] durable simulated funding rejects changed key input deposit 100.00 main-usd community_bank
- [passed] durable simulated funding rejects changed key input withdrawal 100.00 main-usd demo_bank
- [passed] durable simulated funding rejects malformed input before accepting a key: null
- [passed] durable simulated funding rejects malformed input before accepting a key: []
- [passed] durable simulated funding rejects malformed input before accepting a key: {}
- [passed] durable simulated funding rejects malformed input before accepting a key: {"walletId":"main-usd","amount":"100.00","provider":"demo_bank","extra":true}
- [passed] durable simulated funding rejects malformed input before accepting a key: {"walletId":"main-usd","amount":"1e2","provider":"demo_bank"}
- [passed] durable simulated funding rejects malformed input before accepting a key: {"walletId":"main-usd","amount":"-1","provider":"demo_bank"}
- [passed] durable simulated funding rejects malformed input before accepting a key: {"walletId":"main-usd","amount":"1\n","provider":"demo_bank"}
- [passed] durable simulated funding rejects malformed input before accepting a key: {"walletId":"main-usd","amount":"01","provider":"demo_bank"}
- [passed] durable simulated funding rejects malformed input before accepting a key: {"walletId":"","amount":"1","provider":"demo_bank"}
- [passed] durable simulated funding rejects malformed input before accepting a key: {"walletId":"x\u0000x","amount":"1","provider":"demo_bank"}
- [passed] durable simulated funding rejects malformed input before accepting a key: {"walletId":"main-usd","amount":"1","provider":"bank"}
- [passed] durable simulated funding rejects malformed input before accepting a key: {"walletId":"main-usd","amount":1,"provider":"demo_bank"}
- [passed] durable simulated funding records amount validation result for 0
- [passed] durable simulated funding records amount validation result for 1.001
- [passed] durable simulated funding records amount validation result for 92233720368547758.08
- [passed] durable simulated funding supports exact int64 maximum and zero-decimal wallets, refusing overflow
- [passed] durable simulated funding enforces wallet existence and inspect-only rules for deposit
- [passed] durable simulated funding enforces wallet existence and inspect-only rules for withdrawal
- [passed] durable simulated funding rolls back journal if durable success recording fails; same key can safely retry
- [passed] durable simulated funding cannot report definitive failure if its storage fails, and cannot swallow journal failures
- [passed] durable simulated funding replays after a fresh connection and treats UUID casing/property order as immaterial
- [passed] durable simulated funding enforces append-only retention and rejects nested submission

### `src/features/funding/use-funding.test.tsx`

- [passed] per-tab submission recovery saves and verifies before sending, clears only after a confirmed result
- [passed] per-tab submission recovery does not relabel a known outcome as unknown if refreshing the overview fails
- [passed] per-tab submission recovery retains unknown context across remount; explicit retry uses the same key/body, never auto-submits
- [passed] per-tab submission recovery blocks sending if recovery cannot be retained or contains invalid context
- [passed] per-tab submission recovery blocks unreadable persisted context without sending or deleting it
- [passed] per-tab submission recovery blocks when recovery storage cannot be read
- [passed] per-tab submission recovery retains a timed-out request and permits only original-key recovery
- [passed] per-tab submission recovery does not overwrite an existing different unresolved request
- [passed] per-tab submission recovery cannot clear uncertainty for malformed/unmatched response {"requestKey":"wrong","transactionId":"87654321-1234-4123-8123-123456789012","type":"deposit","status":"completed","accountId":"main","walletId":"wallet","currency":"USD","exponent":2,"amountMinor":"1000","balanceMinor":"1000","provider":"demo_bank","createdAt":"2026-11-11T00:00:00.000Z"}
- [passed] per-tab submission recovery cannot clear uncertainty for malformed/unmatched response {"requestKey":"12345678-1234-4123-8123-123456789012","transactionId":"87654321-1234-4123-8123-123456789012","type":"deposit","status":"completed","accountId":"main","walletId":"wallet","currency":"USD","exponent":2,"amountMinor":"1","balanceMinor":"1000","provider":"demo_bank","createdAt":"2026-11-11T00:00:00.000Z"}
- [passed] per-tab submission recovery cannot clear uncertainty for malformed/unmatched response {"requestKey":"12345678-1234-4123-8123-123456789012","transactionId":"87654321-1234-4123-8123-123456789012","type":"deposit","status":"completed","accountId":"main","walletId":"wallet","currency":"USD","exponent":2,"amountMinor":"1000","balanceMinor":"-1","provider":"demo_bank","createdAt":"2026-11-11T00:00:00.000Z"}
- [passed] per-tab submission recovery cannot clear uncertainty for malformed/unmatched response {"requestKey":"12345678-1234-4123-8123-123456789012","transactionId":"87654321-1234-4123-8123-123456789012","type":"deposit","status":"pending","accountId":"main","walletId":"wallet","currency":"USD","exponent":2,"amountMinor":"1000","balanceMinor":"1000","provider":"demo_bank","createdAt":"2026-11-11T00:00:00.000Z"}
- [passed] per-tab submission recovery cannot clear uncertainty for malformed/unmatched response {"definitive":true,"status":503}
- [passed] per-tab submission recovery shows a known result but blocks new attempts if context cleanup fails
- [passed] per-tab submission recovery ignores rapid duplicate clicks while a request is in flight
- [passed] per-tab submission recovery clears context after a matched definitive error, preserving a deliberate new-attempt boundary
- [passed] per-tab submission recovery shares one immutable recovery slot for conversion and funding; remount never fetches a replacement quote
- [passed] per-tab submission recovery preserves conversion uncertainty for a mismatched receipt quoteId
- [passed] per-tab submission recovery preserves conversion uncertainty for a mismatched receipt amountMinor
- [passed] per-tab submission recovery preserves conversion uncertainty for a mismatched receipt rate
- [passed] per-tab submission recovery retains original conversion input after a definite expiry until an explicit new-attempt boundary
- [passed] per-tab submission recovery does not erase recovery data replaced during an in-flight confirmed request
- [passed] per-tab submission recovery extends the historical slot to transfers; reload and cross-feature candidates only recover original terms
- [passed] per-tab submission recovery retains transfer uncertainty for mismatched receipt recipient
- [passed] per-tab submission recovery retains transfer uncertainty for mismatched receipt default
- [passed] per-tab submission recovery retains transfer uncertainty for mismatched receipt rate
- [passed] per-tab submission recovery retains transfer uncertainty for mismatched receipt amount
- [passed] per-tab submission recovery retains transfer uncertainty for mismatched receipt quote
- [passed] per-tab submission recovery retains transfer uncertainty for mismatched receipt balance
- [passed] per-tab submission recovery retains transfer uncertainty for mismatched receipt key
- [passed] per-tab submission recovery validates same-currency receipts with explicit null terms
- [passed] per-tab submission recovery blocks transfers before network when recovery storage fails
- [passed] per-tab submission recovery retains original transfer input through a definitive expiry until explicit editing

### `src/features/health/service.test.ts`

- [passed] health service describes the foundation without claiming wallet features exist

### `src/features/history/contracts.test.ts`

- [passed] history query contracts uses explicit exact account context and numbered-page defaults
- [passed] history query contracts accepts one exact transaction ID without changing its bytes
- [passed] history query contracts accepts canonical UTC calendar day 2024-02-29
- [passed] history query contracts accepts canonical UTC calendar day 2000-02-29
- [passed] history query contracts accepts canonical UTC calendar day 0000-01-01
- [passed] history query contracts accepts canonical UTC calendar day 9999-12-31
- [passed] history query contracts rejects invalid calendar day "2026-02-29"
- [passed] history query contracts rejects invalid calendar day "1900-02-29"
- [passed] history query contracts rejects invalid calendar day "2026-02-30"
- [passed] history query contracts rejects invalid calendar day "2026-13-01"
- [passed] history query contracts rejects invalid calendar day "2026-00-01"
- [passed] history query contracts rejects invalid calendar day "2026-11-00"
- [passed] history query contracts rejects invalid calendar day "2026-1-01"
- [passed] history query contracts rejects invalid calendar day "2026-11-12T00:00:00Z"
- [passed] history query contracts rejects invalid calendar day "2026-11-12\n"
- [passed] history query contracts rejects malformed/duplicate/unknown filter
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=+
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=%00
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=main&accountId=other
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=main&type=deposit&type=withdrawal
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=main&transactionId=one&transactionId=two
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=main&transactionId=
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=main&transactionId=%00
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=main&currency=usd
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=main&currency=ZZZ
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=main&type=DEPOSIT
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=main&type=unknown
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=main&from=2026-11-13&to=2026-11-12
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=main&page=0
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=main&page=-1
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=main&page=01
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=main&page=1.5
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=main&page=1e2
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=main&page=9007199254740992
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=main&page=1%0A
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=main&pageSize=0
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=main&pageSize=101
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=main&pageSize=01
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=main&cursor=abc
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=main&sort=oldest
- [passed] history query contracts rejects malformed/duplicate/unknown filter accountId=main&__proto__=x
- [passed] history query contracts supports pinned historical accounting codes without a fresh catalog
- [passed] history query contracts accepts the largest exact JSON page without overflowing offset arithmetic
- [passed] history query contracts validates internal callers too: null
- [passed] history query contracts validates internal callers too: []
- [passed] history query contracts validates internal callers too: {}
- [passed] history query contracts validates internal callers too: {"accountId":"main","page":"2"}
- [passed] history query contracts validates internal callers too: {"accountId":"main","page":null}
- [passed] history query contracts validates internal callers too: {"accountId":"main","pageSize":1.5}
- [passed] history query contracts validates internal callers too: {"accountId":"main"}
- [passed] history query contracts validates internal callers too: {"accountId":"main","extra":true}
- [passed] history query contracts requires accountId as the detail endpoint's only query field
- [passed] history query contracts never coerces unsafe numeric pagination NaN
- [passed] history query contracts never coerces unsafe numeric pagination Infinity
- [passed] history query contracts never coerces unsafe numeric pagination -Infinity
- [passed] history query contracts never coerces unsafe numeric pagination -0
- [passed] history query contracts never coerces unsafe numeric pagination 0
- [passed] history query contracts never coerces unsafe numeric pagination 1.5
- [passed] history query contracts never coerces unsafe numeric pagination 9007199254740992
- [passed] history query contracts never coerces unsafe numeric pagination 1
- [passed] history query contracts never coerces unsafe numeric pagination 1n

### `src/features/history/date-range.test.tsx`

- [passed] keeps inclusive calendar days stable in America/Los_Angeles
- [passed] keeps inclusive calendar days stable in Pacific/Auckland
- [passed] keeps inclusive calendar days stable in UTC
- [passed] uses the library's semantic range calendar with explicit UTC endpoint modifiers

### `src/features/history/preview.test.ts`

- [passed] full-history client response validation accepts exact numbered pages, page boundaries and max-safe beyond-end pages
- [passed] full-history client response validation binds an exact-ID list response and rejects a different ID or impossible count
- [passed] full-history client response validation accepts stored deposit details in their explicit account
- [passed] full-history client response validation accepts stored withdrawal details in their explicit account
- [passed] full-history client response validation accepts stored conversion details in their explicit account
- [passed] full-history client response validation accepts stored transfer details in their explicit account
- [passed] full-history client response validation validates either affected currency, inclusive days and incoming transfer details
- [passed] full-history client response validation fails closed on changed page/filter account
- [passed] full-history client response validation fails closed on changed page/filter page
- [passed] full-history client response validation fails closed on changed page/filter pageSize
- [passed] full-history client response validation fails closed on changed page/filter total
- [passed] full-history client response validation fails closed on changed page/filter pages
- [passed] full-history client response validation fails closed on changed page/filter count
- [passed] full-history client response validation fails closed on changed page/filter duplicate
- [passed] full-history client response validation fails closed on changed page/filter order
- [passed] full-history client response validation fails closed on changed page/filter currency
- [passed] full-history client response validation fails closed on changed page/filter date
- [passed] full-history client response validation fails closed on changed page/filter type
- [passed] full-history client response validation never substitutes mismatched detail facts: id
- [passed] full-history client response validation never substitutes mismatched detail facts: account
- [passed] full-history client response validation never substitutes mismatched detail facts: side
- [passed] full-history client response validation never substitutes mismatched detail facts: rate
- [passed] full-history client response validation never substitutes mismatched detail facts: amount
- [passed] full-history client response validation never substitutes mismatched detail facts: timestamp
- [passed] full-history client response validation does not mistake UTF-16 surrogate order for SQLite UTF-8 ID ties
- [passed] full-history client response validation lists pinned historical accounting codes without a provider request or mutable registry

### `src/features/history/read.test.ts`

- [passed] account-scoped completed transaction history returns each transaction once, newest first with a descending ID tie-breaker
- [passed] account-scoped completed transaction history uses numbered pages and returns empty pages beyond the end
- [passed] account-scoped completed transaction history filters an exact ID outside the current page, combines filters and never leaks another account's record
- [passed] account-scoped completed transaction history matches legacy Unicode and surrounding spaces literally without normalizing IDs
- [passed] account-scoped completed transaction history truthfully permits numbered-page shifts when new activity arrives between requests
- [passed] account-scoped completed transaction history filters operation type deposit without duplicating paired entries
- [passed] account-scoped completed transaction history filters operation type withdrawal without duplicating paired entries
- [passed] account-scoped completed transaction history filters operation type conversion without duplicating paired entries
- [passed] account-scoped completed transaction history filters operation type transfer without duplicating paired entries
- [passed] account-scoped completed transaction history finds a cross-currency conversion and transfer by either side: USD
- [passed] account-scoped completed transaction history finds a cross-currency conversion and transfer by either side: GBP
- [passed] account-scoped completed transaction history combines destination scoping with either-side currency matching without leaking main-only activity
- [passed] account-scoped completed transaction history combines filters and includes both UTC day boundaries, never the neighboring days
- [passed] account-scoped completed transaction history does not depend on the process/browser timezone or today's clock
- [passed] account-scoped completed transaction history returns a useful empty page with zero totals for a valid empty account/filter
- [passed] account-scoped completed transaction history shows the same immutable transfer as outgoing/incoming without keys or balance leaks
- [passed] account-scoped completed transaction history represents deposit-start direction and explicit nulls
- [passed] account-scoped completed transaction history represents withdraw-middle direction and explicit nulls
- [passed] account-scoped completed transaction history represents conversion-tie-a direction and explicit nulls
- [passed] account-scoped completed transaction history does not return unrelated completed records or fall back to the main account
- [passed] account-scoped completed transaction history keeps arbitrary exact destination context __proto__ isolated
- [passed] account-scoped completed transaction history keeps arbitrary exact destination context constructor isolated
- [passed] account-scoped completed transaction history keeps arbitrary exact destination context recipient isolated
- [passed] account-scoped completed transaction history keeps arbitrary exact destination context وجهة-💰 isolated
- [passed] account-scoped completed transaction history excludes recorded failures and reads journal facts without requiring technical results
- [passed] account-scoped completed transaction history keeps original historical amounts/rates after restart, cache refresh and later spending
- [passed] account-scoped completed transaction history returns exact zero/three/four-decimal and int64-limit amounts without JSON numbers
- [passed] account-scoped completed transaction history holds account metadata, count, rows and entries in one WAL snapshot
- [passed] account-scoped completed transaction history performs no writes on a query-only connection and does not aggregate current balances
- [passed] account-scoped completed transaction history accepts actual service-produced funding/conversion/transfers without rereading current quotes
- [passed] account-scoped completed transaction history fails closed on selected damaged credit data without changing it
- [passed] account-scoped completed transaction history fails closed on selected damaged debit data without changing it
- [passed] account-scoped completed transaction history fails closed on selected damaged missing-entry data without changing it
- [passed] account-scoped completed transaction history fails closed on selected damaged extra-entry data without changing it
- [passed] account-scoped completed transaction history fails closed on selected damaged rate data without changing it
- [passed] account-scoped completed transaction history fails closed on selected damaged timestamp data without changing it
- [passed] account-scoped completed transaction history fails closed on selected damaged precision data without changing it
- [passed] account-scoped completed transaction history fails closed on selected damaged name data without changing it
- [passed] account-scoped completed transaction history fails closed on selected damaged missing-wallet data without changing it
- [passed] account-scoped completed transaction history fails closed on selected damaged partial-rate data without changing it
- [passed] account-scoped completed transaction history fails closed on selected damaged rate-time data without changing it
- [passed] account-scoped completed transaction history fails closed on selected damaged rate-date data without changing it
- [passed] account-scoped completed transaction history fails closed on selected damaged provider data without changing it
- [passed] account-scoped completed transaction history fails closed on selected damaged noninteger-entry data without changing it
- [passed] account-scoped completed transaction history fails closed on selected damaged int64-negative-limit data without changing it

### `src/features/history/recent-transactions.test.tsx`

- [passed] validated scoped recent history preserves incoming direction and original applied rate without current-clock checks
- [passed] validated scoped recent history rejects mismatched untrusted history account
- [passed] validated scoped recent history rejects mismatched untrusted history side
- [passed] validated scoped recent history rejects mismatched untrusted history direction
- [passed] validated scoped recent history rejects mismatched untrusted history rate
- [passed] validated scoped recent history rejects mismatched untrusted history precision
- [passed] validated scoped recent history rejects mismatched untrusted history amount
- [passed] validated scoped recent history rejects mismatched untrusted history time
- [passed] validated scoped recent history rejects mismatched untrusted history count
- [passed] validated scoped recent history rejects mismatched untrusted history type
- [passed] recent history loading and account isolation uses explicit scoped GETs, renders incoming facts, and removes every record under privacy
- [passed] recent history loading and account isolation discards stale responses when account context changes, including a late response after abort
- [passed] recent history loading and account isolation fails closed on foreign data and offers a bounded read-only retry
- [passed] recent history loading and account isolation refreshes scoped activity after a server overview refresh and handles empty results

### `src/features/history/transaction-copy.test.tsx`

- [passed] copies exact IDs and offers selected, readable text when clipboard access fails

### `src/features/history/transaction-facts.test.tsx`

- [passed] recorded history presentation preserves exact historical USD amounts without JSON-number/display rounding
- [passed] recorded history presentation preserves exact historical JPY amounts without JSON-number/display rounding
- [passed] recorded history presentation preserves exact historical BHD amounts without JSON-number/display rounding
- [passed] recorded history presentation preserves exact historical CLF amounts without JSON-number/display rounding
- [passed] recorded history presentation labels incoming same-currency facts without fabricating FX
- [passed] recorded history presentation escapes arbitrary counterparty text and keeps original source→target rate direction

### `src/features/history/use-history.test.tsx`

- [passed] scoped full history read lifecycle performs scoped GET-only no-store reads and validates the received page
- [passed] scoped full history read lifecycle discards late results after account switches, even if abort is ignored
- [passed] scoped full history read lifecycle binds detail to account and ID, never to a previous list or another record
- [passed] scoped full history read lifecycle encodes exact account/record IDs safely and distinguishes missing details without displaying response text
- [passed] scoped full history read lifecycle does not read hidden history; hiding aborts in-flight reads and hides results immediately
- [passed] scoped full history read lifecycle requires an explicit retry after failure and invalidates old revisions
- [passed] scoped full history read lifecycle times out without changing data or automatically retrying

### `src/features/history/workspace.test.tsx`

- [passed] keeps exact visible amounts, currencies and recorded time in each history row's accessible name
- [passed] centers honest zero-match information with a large decorative icon and the exact bold guidance

### `src/features/journal/after-record.test.ts`

- [passed] scoped synchronous success registration runs after complete entries and keeps the original receipt shape
- [passed] scoped synchronous success registration rolls back even a swallowed success-registration exception
- [passed] scoped synchronous success registration rejects thenable/async hook results without committing money
- [passed] scoped synchronous success registration latches an extension error caught inside the hook
- [passed] scoped synchronous success registration latches a mismatched transaction capability and does not run the extension
- [passed] scoped synchronous success registration closes the extension capability when the hook returns
- [passed] scoped synchronous success registration latches a thenable extension even when its error is caught inside the hook

### `src/features/journal/balances.test.ts`

- [passed] journal-derived balances returns zero for empty wallets and distinguishes missing resources
- [passed] journal-derived balances isolates wallets, currencies, and accounts and preserves signed amounts
- [passed] journal-derived balances validates only the final aggregate, not int64 intermediate subtotals
- [passed] journal-derived balances validates only the final aggregate, not int64 intermediate subtotals
- [passed] journal-derived balances validates only the final aggregate, not int64 intermediate subtotals
- [passed] journal-derived balances rejects an out-of-range final balance
- [passed] journal-derived balances rejects an out-of-range final balance
- [passed] journal-derived balances streams a long journal without int64 or floating-point aggregation
- [passed] journal-derived balances uses one snapshot for all wallets even when another connection commits

### `src/features/journal/write.test.ts`

- [passed] serialized journal writes records deposits, withdrawals, same-currency transfers and exact conversions
- [passed] serialized journal writes creates and credits a destination atomically
- [passed] serialized journal writes creates a missing cross-currency wallet and retains the exact applied terms
- [passed] serialized journal writes rolls back every row after injected failure on accounts (NEW.id = 'new-destination')
- [passed] serialized journal writes rolls back every row after injected failure on wallets (NEW.id = 'new-wallet')
- [passed] serialized journal writes rolls back every row after injected failure on transactions (NEW.id = 'transfer')
- [passed] serialized journal writes rolls back every row after injected failure on journal_entries (NEW.amount_minor < 0)
- [passed] serialized journal writes rolls back every row after injected failure on journal_entries (NEW.wallet_id = 'new-wallet')
- [passed] serialized journal writes cannot commit partial records even if a callback swallows an insertion error
- [passed] serialized journal writes rejects overspending, zero credits and target balance overflow without history
- [passed] serialized journal writes enforces main-only actions, no self-transfer, and conversion/FX shape
- [passed] serialized journal writes refuses deferred outer transactions, promises and escaped write scopes
- [passed] serialized journal writes supports atomic success-result recording and replay after reopening
- [passed] serialized journal writes rolls back accounting when recording a technical success result fails
- [passed] serialized journal writes reserves the writer lock before the callback's first read or insert
- [passed] serialized journal writes serializes independent concurrent connections before checking funds

### `src/features/money/currency-precision.test.ts`

- [passed] pinned currency precision metadata locks every code/precision pair independently of JSON formatting
- [passed] pinned currency precision metadata locks the complete non-two-digit exception lists and distribution
- [passed] getCurrencyExponent resolves the pinned exponent for AED
- [passed] getCurrencyExponent resolves the pinned exponent for AFN
- [passed] getCurrencyExponent resolves the pinned exponent for ALL
- [passed] getCurrencyExponent resolves the pinned exponent for AMD
- [passed] getCurrencyExponent resolves the pinned exponent for AOA
- [passed] getCurrencyExponent resolves the pinned exponent for ARS
- [passed] getCurrencyExponent resolves the pinned exponent for AUD
- [passed] getCurrencyExponent resolves the pinned exponent for AWG
- [passed] getCurrencyExponent resolves the pinned exponent for AZN
- [passed] getCurrencyExponent resolves the pinned exponent for BAM
- [passed] getCurrencyExponent resolves the pinned exponent for BBD
- [passed] getCurrencyExponent resolves the pinned exponent for BDT
- [passed] getCurrencyExponent resolves the pinned exponent for BHD
- [passed] getCurrencyExponent resolves the pinned exponent for BIF
- [passed] getCurrencyExponent resolves the pinned exponent for BMD
- [passed] getCurrencyExponent resolves the pinned exponent for BND
- [passed] getCurrencyExponent resolves the pinned exponent for BOB
- [passed] getCurrencyExponent resolves the pinned exponent for BOV
- [passed] getCurrencyExponent resolves the pinned exponent for BRL
- [passed] getCurrencyExponent resolves the pinned exponent for BSD
- [passed] getCurrencyExponent resolves the pinned exponent for BTN
- [passed] getCurrencyExponent resolves the pinned exponent for BWP
- [passed] getCurrencyExponent resolves the pinned exponent for BYN
- [passed] getCurrencyExponent resolves the pinned exponent for BZD
- [passed] getCurrencyExponent resolves the pinned exponent for CAD
- [passed] getCurrencyExponent resolves the pinned exponent for CDF
- [passed] getCurrencyExponent resolves the pinned exponent for CHE
- [passed] getCurrencyExponent resolves the pinned exponent for CHF
- [passed] getCurrencyExponent resolves the pinned exponent for CHW
- [passed] getCurrencyExponent resolves the pinned exponent for CLF
- [passed] getCurrencyExponent resolves the pinned exponent for CLP
- [passed] getCurrencyExponent resolves the pinned exponent for CNY
- [passed] getCurrencyExponent resolves the pinned exponent for COP
- [passed] getCurrencyExponent resolves the pinned exponent for COU
- [passed] getCurrencyExponent resolves the pinned exponent for CRC
- [passed] getCurrencyExponent resolves the pinned exponent for CUP
- [passed] getCurrencyExponent resolves the pinned exponent for CVE
- [passed] getCurrencyExponent resolves the pinned exponent for CZK
- [passed] getCurrencyExponent resolves the pinned exponent for DJF
- [passed] getCurrencyExponent resolves the pinned exponent for DKK
- [passed] getCurrencyExponent resolves the pinned exponent for DOP
- [passed] getCurrencyExponent resolves the pinned exponent for DZD
- [passed] getCurrencyExponent resolves the pinned exponent for EGP
- [passed] getCurrencyExponent resolves the pinned exponent for ERN
- [passed] getCurrencyExponent resolves the pinned exponent for ETB
- [passed] getCurrencyExponent resolves the pinned exponent for EUR
- [passed] getCurrencyExponent resolves the pinned exponent for FJD
- [passed] getCurrencyExponent resolves the pinned exponent for FKP
- [passed] getCurrencyExponent resolves the pinned exponent for GBP
- [passed] getCurrencyExponent resolves the pinned exponent for GEL
- [passed] getCurrencyExponent resolves the pinned exponent for GHS
- [passed] getCurrencyExponent resolves the pinned exponent for GIP
- [passed] getCurrencyExponent resolves the pinned exponent for GMD
- [passed] getCurrencyExponent resolves the pinned exponent for GNF
- [passed] getCurrencyExponent resolves the pinned exponent for GTQ
- [passed] getCurrencyExponent resolves the pinned exponent for GYD
- [passed] getCurrencyExponent resolves the pinned exponent for HKD
- [passed] getCurrencyExponent resolves the pinned exponent for HNL
- [passed] getCurrencyExponent resolves the pinned exponent for HTG
- [passed] getCurrencyExponent resolves the pinned exponent for HUF
- [passed] getCurrencyExponent resolves the pinned exponent for IDR
- [passed] getCurrencyExponent resolves the pinned exponent for ILS
- [passed] getCurrencyExponent resolves the pinned exponent for INR
- [passed] getCurrencyExponent resolves the pinned exponent for IQD
- [passed] getCurrencyExponent resolves the pinned exponent for IRR
- [passed] getCurrencyExponent resolves the pinned exponent for ISK
- [passed] getCurrencyExponent resolves the pinned exponent for JMD
- [passed] getCurrencyExponent resolves the pinned exponent for JOD
- [passed] getCurrencyExponent resolves the pinned exponent for JPY
- [passed] getCurrencyExponent resolves the pinned exponent for KES
- [passed] getCurrencyExponent resolves the pinned exponent for KGS
- [passed] getCurrencyExponent resolves the pinned exponent for KHR
- [passed] getCurrencyExponent resolves the pinned exponent for KMF
- [passed] getCurrencyExponent resolves the pinned exponent for KPW
- [passed] getCurrencyExponent resolves the pinned exponent for KRW
- [passed] getCurrencyExponent resolves the pinned exponent for KWD
- [passed] getCurrencyExponent resolves the pinned exponent for KYD
- [passed] getCurrencyExponent resolves the pinned exponent for KZT
- [passed] getCurrencyExponent resolves the pinned exponent for LAK
- [passed] getCurrencyExponent resolves the pinned exponent for LBP
- [passed] getCurrencyExponent resolves the pinned exponent for LKR
- [passed] getCurrencyExponent resolves the pinned exponent for LRD
- [passed] getCurrencyExponent resolves the pinned exponent for LSL
- [passed] getCurrencyExponent resolves the pinned exponent for LYD
- [passed] getCurrencyExponent resolves the pinned exponent for MAD
- [passed] getCurrencyExponent resolves the pinned exponent for MDL
- [passed] getCurrencyExponent resolves the pinned exponent for MGA
- [passed] getCurrencyExponent resolves the pinned exponent for MKD
- [passed] getCurrencyExponent resolves the pinned exponent for MMK
- [passed] getCurrencyExponent resolves the pinned exponent for MNT
- [passed] getCurrencyExponent resolves the pinned exponent for MOP
- [passed] getCurrencyExponent resolves the pinned exponent for MRU
- [passed] getCurrencyExponent resolves the pinned exponent for MUR
- [passed] getCurrencyExponent resolves the pinned exponent for MVR
- [passed] getCurrencyExponent resolves the pinned exponent for MWK
- [passed] getCurrencyExponent resolves the pinned exponent for MXN
- [passed] getCurrencyExponent resolves the pinned exponent for MXV
- [passed] getCurrencyExponent resolves the pinned exponent for MYR
- [passed] getCurrencyExponent resolves the pinned exponent for MZN
- [passed] getCurrencyExponent resolves the pinned exponent for NAD
- [passed] getCurrencyExponent resolves the pinned exponent for NGN
- [passed] getCurrencyExponent resolves the pinned exponent for NIO
- [passed] getCurrencyExponent resolves the pinned exponent for NOK
- [passed] getCurrencyExponent resolves the pinned exponent for NPR
- [passed] getCurrencyExponent resolves the pinned exponent for NZD
- [passed] getCurrencyExponent resolves the pinned exponent for OMR
- [passed] getCurrencyExponent resolves the pinned exponent for PAB
- [passed] getCurrencyExponent resolves the pinned exponent for PEN
- [passed] getCurrencyExponent resolves the pinned exponent for PGK
- [passed] getCurrencyExponent resolves the pinned exponent for PHP
- [passed] getCurrencyExponent resolves the pinned exponent for PKR
- [passed] getCurrencyExponent resolves the pinned exponent for PLN
- [passed] getCurrencyExponent resolves the pinned exponent for PYG
- [passed] getCurrencyExponent resolves the pinned exponent for QAR
- [passed] getCurrencyExponent resolves the pinned exponent for RON
- [passed] getCurrencyExponent resolves the pinned exponent for RSD
- [passed] getCurrencyExponent resolves the pinned exponent for RUB
- [passed] getCurrencyExponent resolves the pinned exponent for RWF
- [passed] getCurrencyExponent resolves the pinned exponent for SAR
- [passed] getCurrencyExponent resolves the pinned exponent for SBD
- [passed] getCurrencyExponent resolves the pinned exponent for SCR
- [passed] getCurrencyExponent resolves the pinned exponent for SDG
- [passed] getCurrencyExponent resolves the pinned exponent for SEK
- [passed] getCurrencyExponent resolves the pinned exponent for SGD
- [passed] getCurrencyExponent resolves the pinned exponent for SHP
- [passed] getCurrencyExponent resolves the pinned exponent for SLE
- [passed] getCurrencyExponent resolves the pinned exponent for SOS
- [passed] getCurrencyExponent resolves the pinned exponent for SRD
- [passed] getCurrencyExponent resolves the pinned exponent for SSP
- [passed] getCurrencyExponent resolves the pinned exponent for STN
- [passed] getCurrencyExponent resolves the pinned exponent for SVC
- [passed] getCurrencyExponent resolves the pinned exponent for SYP
- [passed] getCurrencyExponent resolves the pinned exponent for SZL
- [passed] getCurrencyExponent resolves the pinned exponent for THB
- [passed] getCurrencyExponent resolves the pinned exponent for TJS
- [passed] getCurrencyExponent resolves the pinned exponent for TMT
- [passed] getCurrencyExponent resolves the pinned exponent for TND
- [passed] getCurrencyExponent resolves the pinned exponent for TOP
- [passed] getCurrencyExponent resolves the pinned exponent for TRY
- [passed] getCurrencyExponent resolves the pinned exponent for TTD
- [passed] getCurrencyExponent resolves the pinned exponent for TWD
- [passed] getCurrencyExponent resolves the pinned exponent for TZS
- [passed] getCurrencyExponent resolves the pinned exponent for UAH
- [passed] getCurrencyExponent resolves the pinned exponent for UGX
- [passed] getCurrencyExponent resolves the pinned exponent for USD
- [passed] getCurrencyExponent resolves the pinned exponent for USN
- [passed] getCurrencyExponent resolves the pinned exponent for UYI
- [passed] getCurrencyExponent resolves the pinned exponent for UYU
- [passed] getCurrencyExponent resolves the pinned exponent for UYW
- [passed] getCurrencyExponent resolves the pinned exponent for UZS
- [passed] getCurrencyExponent resolves the pinned exponent for VED
- [passed] getCurrencyExponent resolves the pinned exponent for VES
- [passed] getCurrencyExponent resolves the pinned exponent for VND
- [passed] getCurrencyExponent resolves the pinned exponent for VUV
- [passed] getCurrencyExponent resolves the pinned exponent for WST
- [passed] getCurrencyExponent resolves the pinned exponent for XAD
- [passed] getCurrencyExponent resolves the pinned exponent for XAF
- [passed] getCurrencyExponent resolves the pinned exponent for XCD
- [passed] getCurrencyExponent resolves the pinned exponent for XCG
- [passed] getCurrencyExponent resolves the pinned exponent for XOF
- [passed] getCurrencyExponent resolves the pinned exponent for XPF
- [passed] getCurrencyExponent resolves the pinned exponent for YER
- [passed] getCurrencyExponent resolves the pinned exponent for ZAR
- [passed] getCurrencyExponent resolves the pinned exponent for ZMW
- [passed] getCurrencyExponent resolves the pinned exponent for ZWG
- [passed] getCurrencyExponent uses ISO accounting precision, not CLDR display digits, for AFN
- [passed] getCurrencyExponent uses ISO accounting precision, not CLDR display digits, for COP
- [passed] getCurrencyExponent uses ISO accounting precision, not CLDR display digits, for IRR
- [passed] getCurrencyExponent uses ISO accounting precision, not CLDR display digits, for MGA
- [passed] getCurrencyExponent uses ISO accounting precision, not CLDR display digits, for MRU
- [passed] getCurrencyExponent includes the current code XCG without aliasing a retired code
- [passed] getCurrencyExponent includes the current code ZWG without aliasing a retired code
- [passed] getCurrencyExponent includes the current code XAD without aliasing a retired code
- [passed] getCurrencyExponent includes the current code SLE without aliasing a retired code
- [passed] getCurrencyExponent includes the current code VED without aliasing a retired code
- [passed] getCurrencyExponent fails closed for the ISO N.A. minor units of XAG
- [passed] getCurrencyExponent fails closed for the ISO N.A. minor units of XAU
- [passed] getCurrencyExponent fails closed for the ISO N.A. minor units of XBA
- [passed] getCurrencyExponent fails closed for the ISO N.A. minor units of XBB
- [passed] getCurrencyExponent fails closed for the ISO N.A. minor units of XBC
- [passed] getCurrencyExponent fails closed for the ISO N.A. minor units of XBD
- [passed] getCurrencyExponent fails closed for the ISO N.A. minor units of XDR
- [passed] getCurrencyExponent fails closed for the ISO N.A. minor units of XPD
- [passed] getCurrencyExponent fails closed for the ISO N.A. minor units of XPT
- [passed] getCurrencyExponent fails closed for the ISO N.A. minor units of XSU
- [passed] getCurrencyExponent fails closed for the ISO N.A. minor units of XTS
- [passed] getCurrencyExponent fails closed for the ISO N.A. minor units of XUA
- [passed] getCurrencyExponent fails closed for the ISO N.A. minor units of XXX
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "ZZZ"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "BTC"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "ETH"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "USDT"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "CNH"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "CMD"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "GGP"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "IMP"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "JEP"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "ANG"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "BGN"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "SLL"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "ZWL"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "VEF"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "MRO"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "STD"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "usd"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "Usd"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key " USD"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "USD "
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "USD\n"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key ""
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "840"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "\u0000USD"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "ＵＳＤ"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "toString"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "constructor"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "__proto__"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "prototype"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "valueOf"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "hasOwnProperty"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "__defineGetter__"
- [passed] getCurrencyExponent rejects unknown, noncanonical or inherited key "isPrototypeOf"
- [passed] getCurrencyExponent rejects runtime undefined input without coercion
- [passed] getCurrencyExponent rejects runtime null input without coercion
- [passed] getCurrencyExponent rejects runtime number input without coercion
- [passed] getCurrencyExponent rejects runtime NaN input without coercion
- [passed] getCurrencyExponent rejects runtime infinity input without coercion
- [passed] getCurrencyExponent rejects runtime boolean input without coercion
- [passed] getCurrencyExponent rejects runtime bigint input without coercion
- [passed] getCurrencyExponent rejects runtime symbol input without coercion
- [passed] getCurrencyExponent rejects runtime array input without coercion
- [passed] getCurrencyExponent rejects runtime boxed string input without coercion
- [passed] getCurrencyExponent rejects runtime plain object input without coercion
- [passed] getCurrencyExponent rejects runtime null-prototype object input without coercion
- [passed] getCurrencyExponent rejects runtime string-coercible object input without coercion
- [passed] getCurrencyExponent rejects runtime throwing coercion input without coercion

### `src/features/money/money.test.ts`

- [passed] money bounds exports the signed int64 maximum and bounded decimal text limits
- [passed] money bounds accepts positive bounded bigint amount 1n
- [passed] money bounds accepts positive bounded bigint amount 9007199254740991n
- [passed] money bounds accepts positive bounded bigint amount 9007199254740992n
- [passed] money bounds accepts positive bounded bigint amount 9223372036854775807n
- [passed] money bounds allows zero only for balances
- [passed] money bounds rejects out-of-range amount and balance -1n
- [passed] money bounds rejects out-of-range amount and balance -9223372036854775807n
- [passed] money bounds rejects out-of-range amount and balance 9223372036854775808n
- [passed] money bounds rejects runtime non-bigint minor units 1
- [passed] money bounds rejects runtime non-bigint minor units 0
- [passed] money bounds rejects runtime non-bigint minor units NaN
- [passed] money bounds rejects runtime non-bigint minor units Infinity
- [passed] money bounds rejects runtime non-bigint minor units "1"
- [passed] money bounds rejects runtime non-bigint minor units null
- [passed] money bounds rejects runtime non-bigint minor units undefined
- [passed] money bounds rejects runtime non-bigint minor units {}
- [passed] money bounds rejects runtime non-bigint minor units true
- [passed] parseAmount parses 1 at precision 0 exactly
- [passed] parseAmount parses 123 at precision 0 exactly
- [passed] parseAmount parses 1 at precision 1 exactly
- [passed] parseAmount parses 0.1 at precision 1 exactly
- [passed] parseAmount parses 1 at precision 2 exactly
- [passed] parseAmount parses 1.2 at precision 2 exactly
- [passed] parseAmount parses 1.23 at precision 2 exactly
- [passed] parseAmount parses 0.01 at precision 2 exactly
- [passed] parseAmount parses 1.005 at precision 3 exactly
- [passed] parseAmount parses 0.001 at precision 3 exactly
- [passed] parseAmount parses 1.2345 at precision 4 exactly
- [passed] parseAmount parses 0.0001 at precision 4 exactly
- [passed] parseAmount parses 9007199254740991 at precision 0 exactly
- [passed] parseAmount parses 9007199254740992 at precision 0 exactly
- [passed] parseAmount parses 9007199254740993 at precision 0 exactly
- [passed] parseAmount parses 90071992547409.93 at precision 2 exactly
- [passed] parseAmount rejects noncanonical amount ""
- [passed] parseAmount rejects noncanonical amount " "
- [passed] parseAmount rejects noncanonical amount " 1"
- [passed] parseAmount rejects noncanonical amount "1 "
- [passed] parseAmount rejects noncanonical amount "1 "
- [passed] parseAmount rejects noncanonical amount "1 "
- [passed] parseAmount rejects noncanonical amount "1 "
- [passed] parseAmount rejects noncanonical amount "1 "
- [passed] parseAmount rejects noncanonical amount "1 "
- [passed] parseAmount rejects noncanonical amount "1 "
- [passed] parseAmount rejects noncanonical amount "+1"
- [passed] parseAmount rejects noncanonical amount "-1"
- [passed] parseAmount rejects noncanonical amount "-0"
- [passed] parseAmount rejects noncanonical amount "01"
- [passed] parseAmount rejects noncanonical amount "00.1"
- [passed] parseAmount rejects noncanonical amount ".1"
- [passed] parseAmount rejects noncanonical amount "1."
- [passed] parseAmount rejects noncanonical amount "1..0"
- [passed] parseAmount rejects noncanonical amount "1e2"
- [passed] parseAmount rejects noncanonical amount "1E2"
- [passed] parseAmount rejects noncanonical amount "1_000"
- [passed] parseAmount rejects noncanonical amount "1,000"
- [passed] parseAmount rejects noncanonical amount "0x10"
- [passed] parseAmount rejects noncanonical amount "NaN"
- [passed] parseAmount rejects noncanonical amount "Infinity"
- [passed] parseAmount rejects noncanonical amount "１"
- [passed] parseAmount rejects noncanonical amount "١"
- [passed] parseAmount rejects runtime non-string amount null
- [passed] parseAmount rejects runtime non-string amount undefined
- [passed] parseAmount rejects runtime non-string amount 1
- [passed] parseAmount rejects runtime non-string amount 1n
- [passed] parseAmount rejects runtime non-string amount {}
- [passed] parseAmount rejects runtime non-string amount true
- [passed] parseAmount never rounds excess precision in 1.0
- [passed] parseAmount never rounds excess precision in 1.005
- [passed] parseAmount never rounds excess precision in 1.230
- [passed] parseAmount never rounds excess precision in 0.0010
- [passed] parseAmount never rounds excess precision in 0.00010
- [passed] parseAmount rejects nonpositive amount 0
- [passed] parseAmount rejects nonpositive amount 0.00
- [passed] parseAmount rejects nonpositive amount 0.000
- [passed] parseAmount rejects nonpositive amount 0.0000
- [passed] parseAmount parses maximum 9223372036854775807 without numeric coercion
- [passed] parseAmount parses maximum 92233720368547758.07 without numeric coercion
- [passed] parseAmount parses maximum 9223372036854775.807 without numeric coercion
- [passed] parseAmount parses maximum 922337203685477.5807 without numeric coercion
- [passed] parseAmount rejects bounded overflowing text 9223372036854775808
- [passed] parseAmount rejects bounded overflowing text 92233720368547758.08
- [passed] parseAmount rejects bounded overflowing text 9223372036854775.808
- [passed] parseAmount rejects bounded overflowing text 922337203685477.5808
- [passed] parseAmount rejects bounded overflowing text 999999999999999999999999
- [passed] parseAmount rejects amount text beyond its pre-parse length bound
- [passed] parseAmount rejects amount text beyond its pre-parse length bound
- [passed] parseAmount rejects amount text beyond its pre-parse length bound
- [passed] formatAmount formats 0n at precision 0
- [passed] formatAmount formats 0n at precision 1
- [passed] formatAmount formats 0n at precision 2
- [passed] formatAmount formats 0n at precision 3
- [passed] formatAmount formats 0n at precision 4
- [passed] formatAmount formats 1n at precision 0
- [passed] formatAmount formats 1n at precision 2
- [passed] formatAmount formats 1n at precision 3
- [passed] formatAmount formats 1n at precision 4
- [passed] formatAmount formats 120n at precision 2
- [passed] formatAmount formats -1n at precision 0
- [passed] formatAmount formats -1n at precision 2
- [passed] formatAmount formats -12345n at precision 4
- [passed] formatAmount formats 9007199254740993n at precision 2
- [passed] formatAmount formats 9223372036854775807n at precision 0
- [passed] formatAmount formats 9223372036854775807n at precision 2
- [passed] formatAmount formats 9223372036854775807n at precision 3
- [passed] formatAmount formats 9223372036854775807n at precision 4
- [passed] formatAmount formats -9223372036854775807n at precision 4
- [passed] formatAmount rejects signed out-of-range formatting 9223372036854775808n
- [passed] formatAmount rejects signed out-of-range formatting -9223372036854775808n
- [passed] formatAmount provides decimal text for JSON instead of serializing bigint
- [passed] currency precision validation rejects invalid runtime precision -1 in every operation
- [passed] currency precision validation rejects invalid runtime precision 5 in every operation
- [passed] currency precision validation rejects invalid runtime precision 1.5 in every operation
- [passed] currency precision validation rejects invalid runtime precision NaN in every operation
- [passed] currency precision validation rejects invalid runtime precision Infinity in every operation
- [passed] currency precision validation rejects invalid runtime precision -Infinity in every operation
- [passed] currency precision validation rejects invalid runtime precision "2" in every operation
- [passed] currency precision validation rejects invalid runtime precision 2n in every operation
- [passed] currency precision validation rejects invalid runtime precision null in every operation
- [passed] currency precision validation rejects invalid runtime precision undefined in every operation
- [passed] convertMinorUnits converts 100n from precision 2 to 2 at rate 1.005 exactly
- [passed] convertMinorUnits converts 100n from precision 2 to 2 at rate 1.004999999999999999999999999999999999 exactly
- [passed] convertMinorUnits converts 100n from precision 2 to 2 at rate 1.005000000000000000000000000000000000 exactly
- [passed] convertMinorUnits converts 100n from precision 2 to 2 at rate 1.005000000000000000000000000000000001 exactly
- [passed] convertMinorUnits converts 1n from precision 0 to 0 at rate 1.499999999999999999999999999999999999 exactly
- [passed] convertMinorUnits converts 1n from precision 0 to 0 at rate 1.500000000000000000000000000000000000 exactly
- [passed] convertMinorUnits converts 1n from precision 0 to 0 at rate 1.500000000000000000000000000000000001 exactly
- [passed] convertMinorUnits converts 1n from precision 0 to 0 at rate 2.5 exactly
- [passed] convertMinorUnits converts 1n from precision 0 to 0 at rate 0.5 exactly
- [passed] convertMinorUnits converts 100n from precision 0 to 3 at rate 0.0025 exactly
- [passed] convertMinorUnits converts 1n from precision 0 to 3 at rate 0.0025 exactly
- [passed] convertMinorUnits converts 1n from precision 0 to 3 at rate 0.002499999999999999999999999999999999 exactly
- [passed] convertMinorUnits converts 1001n from precision 3 to 0 at rate 150 exactly
- [passed] convertMinorUnits converts 1n from precision 4 to 0 at rate 5000 exactly
- [passed] convertMinorUnits converts 1n from precision 0 to 4 at rate 1.23456 exactly
- [passed] convertMinorUnits converts 25n from precision 1 to 2 at rate 2 exactly
- [passed] convertMinorUnits converts 9007199254740991n from precision 0 to 0 at rate 1 exactly
- [passed] convertMinorUnits converts 9007199254740992n from precision 0 to 0 at rate 1 exactly
- [passed] convertMinorUnits converts 9007199254740993n from precision 0 to 0 at rate 1 exactly
- [passed] convertMinorUnits converts 1n from precision 0 to 0 at rate 9007199254740993 exactly
- [passed] convertMinorUnits converts 9223372036854775807n from precision 4 to 4 at rate 1.000000000000000000000000000000000000 exactly
- [passed] convertMinorUnits converts 9223372036854775807n from precision 4 to 0 at rate 9999.999999999999999999999999999999999999 exactly
- [passed] convertMinorUnits converts 9223372036854775807n from precision 0 to 0 at rate 1 exactly
- [passed] convertMinorUnits converts 1n from precision 0 to 0 at rate 9223372036854775807.49 exactly
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects invalid, nonpositive, or unbounded rate text
- [passed] convertMinorUnits rejects runtime non-string rate null
- [passed] convertMinorUnits rejects runtime non-string rate undefined
- [passed] convertMinorUnits rejects runtime non-string rate 1
- [passed] convertMinorUnits rejects runtime non-string rate 1n
- [passed] convertMinorUnits rejects runtime non-string rate {}
- [passed] convertMinorUnits rejects runtime non-string rate true
- [passed] convertMinorUnits accepts the maximum rate text shape before enforcing the result bound
- [passed] convertMinorUnits rejects a positive conversion rounded to zero at rate 0.49
- [passed] convertMinorUnits rejects a positive conversion rounded to zero at rate 0.499999999999999999999999999999999999
- [passed] convertMinorUnits rejects a positive conversion rounded to zero at rate 0.000000000000000000000000000000000001
- [passed] convertMinorUnits rejects invalid source amount 0n before conversion
- [passed] convertMinorUnits rejects invalid source amount -1n before conversion
- [passed] convertMinorUnits rejects invalid source amount 9223372036854775808n before conversion
- [passed] convertMinorUnits rejects final overflow for 1n at precision 0 to 0 and rate 9223372036854775807.5
- [passed] convertMinorUnits rejects final overflow for 1n at precision 0 to 0 and rate 9223372036854775808
- [passed] convertMinorUnits rejects final overflow for 9223372036854775807n at precision 2 to 2 and rate 2
- [passed] convertMinorUnits rejects final overflow for 9223372036854775807n at precision 0 to 4 and rate 1
- [passed] exactness properties round-trips positive minor units at precision 0
- [passed] exactness properties round-trips positive minor units at precision 1
- [passed] exactness properties round-trips positive minor units at precision 2
- [passed] exactness properties round-trips positive minor units at precision 3
- [passed] exactness properties round-trips positive minor units at precision 4
- [passed] exactness properties round-trips input 1 into fixed precision
- [passed] exactness properties round-trips input 1.2 into fixed precision
- [passed] exactness properties round-trips input 1.005 into fixed precision
- [passed] exactness properties round-trips input 0.0001 into fixed precision
- [passed] exactness properties preserves exact and monotonic small samples across all precision pairs

### `src/features/portfolio/service.test.ts`

- [passed] recorded USD portfolio observations records an actual zero baseline without requesting rates for zero foreign wallets
- [passed] recorded USD portfolio observations adds exact USD equivalents, using one catalog and the requested foreign→USD pair
- [passed] recorded USD portfolio observations records new committed balance revisions after deposits and withdrawals, not reloads or replay
- [passed] recorded USD portfolio observations keeps snapshots immutable when current reference rates subsequently change
- [passed] recorded USD portfolio observations does not invent past totals from existing transaction times or current rates
- [passed] recorded USD portfolio observations values inspect-only destinations independently and never mixes main balances
- [passed] recorded USD portfolio observations rounds each foreign wallet half-up using its actual exponent before summing
- [passed] recorded USD portfolio observations values a small nonzero foreign balance with rate 0.0049, including a zero-cent contribution
- [passed] recorded USD portfolio observations values a small nonzero foreign balance with rate 0.005, including a zero-cent contribution
- [passed] recorded USD portfolio observations makes the entire total unavailable for a missing rate, without dropping balances or recording a point
- [passed] recorded USD portfolio observations tries fresh first, labels eligible cached data, and rejects the exact 24-hour boundary
- [passed] recorded USD portfolio observations never synthesizes a reciprocal from the cached USD→GBP pair
- [passed] recorded USD portfolio observations rejects overflowing aggregate totals without changing any wallet
- [passed] recorded USD portfolio observations does not display a stale current total when the ledger changes during FX work
- [passed] recorded USD portfolio observations retains the observed balance rather than reading changed wallets after yielding
- [passed] recorded USD portfolio observations preserves confirmed monetary results even when snapshot storage is unavailable
- [passed] recorded USD portfolio observations persists historical totals across a new database connection
- [passed] recorded USD portfolio observations coalesces same-millisecond observations by committed revision, not asynchronous arrival order
- [passed] recorded USD portfolio observations bounds the rendered series to 240 actual records, coalescing same-millisecond observations
- [passed] recorded USD portfolio observations fails closed on mismatched client response: account
- [passed] recorded USD portfolio observations fails closed on mismatched client response: total
- [passed] recorded USD portfolio observations fails closed on mismatched client response: time
- [passed] recorded USD portfolio observations fails closed on mismatched client response: historyAccount
- [passed] recorded USD portfolio observations fails closed on mismatched client response: rate
- [passed] recorded USD portfolio observations fails closed on mismatched client response: count

### `src/features/portfolio/usd-value.test.ts`

- [passed] values one foreign unit at 0.0049 without weakening payment conversion
- [passed] values one foreign unit at 0.005 without weakening payment conversion
- [passed] values one foreign unit at 0.015 without weakening payment conversion
- [passed] does not swallow input, rate, precision or overflow errors 0
- [passed] does not swallow input, rate, precision or overflow errors 1
- [passed] does not swallow input, rate, precision or overflow errors 2
- [passed] does not swallow input, rate, precision or overflow errors 3
- [passed] does not swallow input, rate, precision or overflow errors 4
- [passed] does not swallow input, rate, precision or overflow errors 5

### `src/features/portfolio/use-portfolio.test.tsx`

- [passed] scoped portfolio lifecycle uses scoped no-store GETs and removes totals immediately under privacy
- [passed] scoped portfolio lifecycle ignores late foreign-account results even when the transport ignores abort
- [passed] scoped portfolio lifecycle rejects unmatched amounts and requires explicit retry, never a previous total
- [passed] scoped portfolio lifecycle times out without automatically sending another request

### `src/features/quotes/concurrency.test.ts`

- [passed] serialized successful quote use allows only one independent writer to use a quote; money and consumption commit together

### `src/features/quotes/service.test.ts`

- [passed] immutable server-owned quote lifecycle returns exact rounded amounts/provenance and reserves or moves no funds
- [passed] immutable server-owned quote lifecycle starts the hold after slow network work, not when the preview was requested
- [passed] immutable server-owned quote lifecycle has strict expiry at elapsed 0 ms
- [passed] immutable server-owned quote lifecycle has strict expiry at elapsed 59999 ms
- [passed] immutable server-owned quote lifecycle has strict expiry at elapsed 60000 ms
- [passed] immutable server-owned quote lifecycle has strict expiry at elapsed 60001 ms
- [passed] immutable server-owned quote lifecycle preserves the full issued minute across the cache's 24-hour boundary, without issuing a stale new quote
- [passed] immutable server-owned quote lifecycle rechecks cache eligibility at issuance after waiting for the writer
- [passed] immutable server-owned quote lifecycle rechecks the cache boundary inside the writer reservation, not just in the rate fetch
- [passed] immutable server-owned quote lifecycle rejects changed input while reusing an issued quote: {"amount":"9.00"}
- [passed] immutable server-owned quote lifecycle rejects changed input while reusing an issued quote: {"amount":"10"}
- [passed] immutable server-owned quote lifecycle rejects changed input while reusing an issued quote: {"sourceWalletId":"main-gbp"}
- [passed] immutable server-owned quote lifecycle rejects changed input while reusing an issued quote: {"targetCurrency":"JPY"}
- [passed] immutable server-owned quote lifecycle rejects changed input while reusing an issued quote: {"operation":"transfer","recipientAccountId":"recipient"}
- [passed] immutable server-owned quote lifecycle ignores object property order but not exact input spelling
- [passed] immutable server-owned quote lifecycle rejects malformed/client-owned quote terms before network: null
- [passed] immutable server-owned quote lifecycle rejects malformed/client-owned quote terms before network: []
- [passed] immutable server-owned quote lifecycle rejects malformed/client-owned quote terms before network: {}
- [passed] immutable server-owned quote lifecycle rejects malformed/client-owned quote terms before network: {"operation":"conversion","sourceWalletId":"main-usd","amount":"10.00","targetCurrency":"GBP","rate":"2"}
- [passed] immutable server-owned quote lifecycle rejects malformed/client-owned quote terms before network: {"operation":"conversion","sourceWalletId":"main-usd","amount":"10.00","targetCurrency":"GBP","expiresAt":"2099"}
- [passed] immutable server-owned quote lifecycle rejects malformed/client-owned quote terms before network: {"operation":"conversion","sourceWalletId":"main-usd","amount":1,"targetCurrency":"GBP"}
- [passed] immutable server-owned quote lifecycle rejects malformed/client-owned quote terms before network: {"operation":"conversion","sourceWalletId":"main-usd","amount":"1e2","targetCurrency":"GBP"}
- [passed] immutable server-owned quote lifecycle rejects malformed/client-owned quote terms before network: {"operation":{"toString":"conversion"},"sourceWalletId":"main-usd","amount":"10.00","targetCurrency":"GBP"}
- [passed] immutable server-owned quote lifecycle rejects invalid monetary amount 0
- [passed] immutable server-owned quote lifecycle rejects invalid monetary amount 1.001
- [passed] immutable server-owned quote lifecycle rejects invalid monetary amount 92233720368547758.08
- [passed] immutable server-owned quote lifecycle rejects unaffordable/inspect-only/missing sources and identity FX before network
- [passed] immutable server-owned quote lifecycle rechecks funds after network work and again at confirmation, without consuming failure
- [passed] immutable server-owned quote lifecycle checks rounded zero and final monetary bounds
- [passed] immutable server-owned quote lifecycle persists through a new connection, rejects clock rollback, and never fetches on readback
- [passed] immutable server-owned quote lifecycle has immutable terms and use records; success consumes once atomically
- [passed] immutable server-owned quote lifecycle does not reserve balances when several quotes review the same available funds
- [passed] immutable server-owned quote lifecycle cannot attach a past completed transaction outside its active scoped hook
- [passed] immutable server-owned quote lifecycle rolls back money when a late consumption error is swallowed (inside hook: false)
- [passed] immutable server-owned quote lifecycle rolls back money when a late consumption error is swallowed (inside hook: true)
- [passed] immutable server-owned quote lifecycle rejects a recorded transaction whose actual terms differ from the quote
- [passed] immutable server-owned quote lifecycle does not create recipients, currencies or wallets while quoting arbitrary new IDs
- [passed] immutable server-owned quote lifecycle binds existing recipient defaults and rejects self/new-recipient ambiguity
- [passed] immutable server-owned quote lifecycle copies immutable original input before any async work
- [passed] immutable server-owned quote lifecycle fails closed on corrupted stored arithmetic without fetching new terms
- [passed] immutable server-owned quote lifecycle leaves no quote or monetary write when quote persistence fails

### `src/features/rates/frankfurter.test.ts`

- [passed] Frankfurter exact reference adapter filters to eligible fiat and pinned accounting precision, without seeding wallets
- [passed] Frankfurter exact reference adapter preserves original decimal lexemes rather than parsing rates as JSON numbers
- [passed] Frankfurter exact reference adapter rejects unsupported rate text "0"
- [passed] Frankfurter exact reference adapter rejects unsupported rate text "-1"
- [passed] Frankfurter exact reference adapter rejects unsupported rate text "1e-6"
- [passed] Frankfurter exact reference adapter rejects unsupported rate text "1.0\n"
- [passed] Frankfurter exact reference adapter rejects unsupported rate text "\"1.23\""
- [passed] Frankfurter exact reference adapter rejects unsupported rate text "01.2"
- [passed] Frankfurter exact reference adapter rejects unsupported rate text "1.1111111111111111111111111111111111111"
- [passed] Frankfurter exact reference adapter rejects unsupported rate text "1111111111111111111111111111111111111"
- [passed] Frankfurter exact reference adapter refuses malformed, missing, future or unexpected pairs: date,base,quote,rate 2026-11-11,EUR,USD,1
- [passed] Frankfurter exact reference adapter refuses malformed, missing, future or unexpected pairs: date,base,quote,rate 2026-11-11,USD,GBP,1
- [passed] Frankfurter exact reference adapter refuses malformed, missing, future or unexpected pairs: date,base,quote,rate 2026-02-30,USD,EUR,1
- [passed] Frankfurter exact reference adapter refuses malformed, missing, future or unexpected pairs: date,base,quote,rate 2026-11-13,USD,EUR,1
- [passed] Frankfurter exact reference adapter refuses malformed, missing, future or unexpected pairs: date,base,quote,rate 2026-11-11,USD,EUR,1 2026-11-11,USD,GBP,1
- [passed] Frankfurter exact reference adapter refuses malformed, missing, future or unexpected pairs: date,base,quote,rate
- [passed] Frankfurter exact reference adapter refuses malformed, missing, future or unexpected pairs: other,header 1,2
- [passed] Frankfurter exact reference adapter accepts documented CRLF and a source date older than fetch day
- [passed] Frankfurter exact reference adapter rejects invalid catalog rather than fabricating an eligible list: null
- [passed] Frankfurter exact reference adapter rejects invalid catalog rather than fabricating an eligible list: {}
- [passed] Frankfurter exact reference adapter rejects invalid catalog rather than fabricating an eligible list: []
- [passed] Frankfurter exact reference adapter rejects invalid catalog rather than fabricating an eligible list: [{"iso_code":"USD","name":"US Dollar","type":"currency"},{"iso_code":"USD","name":"US Dollar","type":"currency"}]
- [passed] Frankfurter exact reference adapter rejects invalid catalog rather than fabricating an eligible list: [{"iso_code":"USD","name":"","type":"currency"}]
- [passed] Frankfurter exact reference adapter rejects invalid catalog rather than fabricating an eligible list: [{"iso_code":"USD","name":"Dollar","type":"surprise"}]
- [passed] Frankfurter exact reference adapter rejects invalid catalog rather than fabricating an eligible list: [{"iso_code":"BTC","name":"Bitcoin","type":"crypto"}]
- [passed] Frankfurter exact reference adapter rejects upstream status 404
- [passed] Frankfurter exact reference adapter rejects upstream status 429
- [passed] Frankfurter exact reference adapter rejects upstream status 500
- [passed] Frankfurter exact reference adapter bounds bodies without trusting Content-Length and rejects wrong media type
- [passed] Frankfurter exact reference adapter times out a pending upstream request without automatic retries
- [passed] Frankfurter exact reference adapter rejects ineligible code "usd" before network access
- [passed] Frankfurter exact reference adapter rejects ineligible code "USD\n" before network access
- [passed] Frankfurter exact reference adapter rejects ineligible code "BTC" before network access
- [passed] Frankfurter exact reference adapter rejects ineligible code "XAU" before network access
- [passed] Frankfurter exact reference adapter rejects ineligible code "CLF" before network access
- [passed] Frankfurter exact reference adapter rejects ineligible code "ZZZ" before network access
- [passed] Frankfurter exact reference adapter rejects ineligible code "__proto__" before network access
- [passed] Frankfurter exact reference adapter rejects an identity pair instead of inventing a fetched observation
- [passed] Frankfurter exact reference adapter evaluates exact 24-hour and future boundary 1794484800000
- [passed] Frankfurter exact reference adapter evaluates exact 24-hour and future boundary 1794398400001
- [passed] Frankfurter exact reference adapter evaluates exact 24-hour and future boundary 1794398400000
- [passed] Frankfurter exact reference adapter evaluates exact 24-hour and future boundary 1794398399999
- [passed] Frankfurter exact reference adapter evaluates exact 24-hour and future boundary 1794484800001
- [passed] Frankfurter exact reference adapter rejects malformed cached timestamp null
- [passed] Frankfurter exact reference adapter rejects malformed cached timestamp "not-a-time"
- [passed] Frankfurter exact reference adapter rejects malformed cached timestamp "2026"
- [passed] Frankfurter exact reference adapter rejects malformed cached timestamp "2026-11-12"
- [passed] Frankfurter exact reference adapter rejects malformed cached timestamp "2026-02-30T00:00:00.000Z"
- [passed] Frankfurter exact reference adapter rejects malformed cached timestamp "1960-01-01T00:00:00.000Z"

### `src/features/rates/service.test.ts`

- [passed] fresh-first persistent reference metadata requests a fresh catalog every time, then falls back only after failure
- [passed] fresh-first persistent reference metadata retains exact pair/rate/source/fetch dates across a new database connection
- [passed] fresh-first persistent reference metadata never uses reverse or unrelated cached pairs, even when both codes are listed
- [passed] fresh-first persistent reference metadata checks fallback age at resolution, boundary 86399999
- [passed] fresh-first persistent reference metadata checks fallback age at resolution, boundary 86400000
- [passed] fresh-first persistent reference metadata checks fallback age at resolution, boundary 86400001
- [passed] fresh-first persistent reference metadata does not refresh the age of cached data while replaying a fallback
- [passed] fresh-first persistent reference metadata can recover an eligible previously validated pair when the catalog is unavailable
- [passed] fresh-first persistent reference metadata honors fresh catalog removals instead of allowing an obsolete cached pair
- [passed] fresh-first persistent reference metadata cannot silently serve future or corrupt cache data
- [passed] fresh-first persistent reference metadata preserves prior valid cache when fresh data is malformed
- [passed] fresh-first persistent reference metadata cannot use corrupted or ineligible cached catalog {bad
- [passed] fresh-first persistent reference metadata cannot use corrupted or ineligible cached catalog [{"code":"BTC","name":"Crypto","exponent":2}]
- [passed] fresh-first persistent reference metadata cannot use corrupted or ineligible cached catalog [{"code":"USD","name":"Dollar","exponent":3}]
- [passed] fresh-first persistent reference metadata rejects future-dated catalog fallback
- [passed] fresh-first persistent reference metadata never fetches inside a database transaction or mutates accounting rows
- [passed] fresh-first persistent reference metadata reports storage failure without pretending the new rate was cached
- [passed] fresh-first persistent reference metadata does not return a fresh rate as cached if persistence fails after catalog validation
- [passed] fresh-first persistent reference metadata checks cache expiry after the failed network request, not before it began
- [passed] fresh-first persistent reference metadata does not let an older delayed response overwrite newer cache on another connection

### `src/features/submissions/submission-panel.test.tsx`

- [passed] shows a concise green-check success and no recovery key, quote, timestamp or post-balance facts
- [passed] removes confirmed monetary data in private success
- [passed] retains original-key recovery rather than claiming success for an unknown outcome

### `src/features/theme/theme-menu.test.tsx`

- [passed] server-rendered theme control does not offer an interactive selector before its handlers hydrate

### `src/features/theme/theme.test.ts`

- [passed] theme preferences recognizes light
- [passed] theme preferences recognizes dark
- [passed] theme preferences recognizes system
- [passed] theme preferences rejects an invalid preference: undefined
- [passed] theme preferences rejects an invalid preference: null
- [passed] theme preferences rejects an invalid preference: ""
- [passed] theme preferences rejects an invalid preference: "DARK"
- [passed] theme preferences rejects an invalid preference: "<script>"
- [passed] theme preferences rejects an invalid preference: 1
- [passed] theme preferences rejects an invalid preference: {}
- [passed] theme preferences resolves system with system dark=true
- [passed] theme preferences resolves system with system dark=false
- [passed] theme preferences resolves dark with system dark=false
- [passed] theme preferences resolves light with system dark=true
- [passed] theme preferences bootstraps before paint from "dark"
- [passed] theme preferences bootstraps before paint from "light"
- [passed] theme preferences bootstraps before paint from "system"
- [passed] theme preferences bootstraps before paint from "invalid"
- [passed] theme preferences bootstraps before paint from null
- [passed] theme preferences respects the system even when browser storage is unavailable

### `src/features/transfers/concurrency.test.ts`

- [passed] independent transfer writers and global money keys identical keys create one recipient/wallet/transfer and replay its original receipt
- [passed] independent transfer writers and global money keys different keys cannot consume one transfer quote twice
- [passed] independent transfer writers and global money keys different quotes/keys cannot overspend one source
- [passed] independent transfer writers and global money keys compatible creation races reuse the same exact destination and wallet
- [passed] independent transfer writers and global money keys a conflicting new-recipient default loses without overwriting the winner or creating partial money
- [passed] independent transfer writers and global money keys same-key changed input cannot both commit
- [passed] independent transfer writers and global money keys serializes transfer versus funding (same key: true)
- [passed] independent transfer writers and global money keys serializes transfer versus funding (same key: false)
- [passed] independent transfer writers and global money keys serializes transfer versus conversion (same key: true)
- [passed] independent transfer writers and global money keys serializes transfer versus conversion (same key: false)

### `src/features/transfers/receipt.test.ts`

- [passed] retained transfer receipt validation rejects corrupted request key without depending on current state
- [passed] retained transfer receipt validation rejects corrupted transaction ID without depending on current state
- [passed] retained transfer receipt validation rejects corrupted source wallet without depending on current state
- [passed] retained transfer receipt validation rejects corrupted recipient account without depending on current state
- [passed] retained transfer receipt validation rejects corrupted own account without depending on current state
- [passed] retained transfer receipt validation rejects corrupted same wallet without depending on current state
- [passed] retained transfer receipt validation rejects corrupted target currency without depending on current state
- [passed] retained transfer receipt validation rejects corrupted recipient binding without depending on current state
- [passed] retained transfer receipt validation rejects corrupted default precision without depending on current state
- [passed] retained transfer receipt validation rejects corrupted default name without depending on current state
- [passed] retained transfer receipt validation rejects corrupted creation flag without depending on current state
- [passed] retained transfer receipt validation rejects corrupted source precision without depending on current state
- [passed] retained transfer receipt validation rejects corrupted source amount without depending on current state
- [passed] retained transfer receipt validation rejects corrupted target amount without depending on current state
- [passed] retained transfer receipt validation rejects corrupted noncanonical amount without depending on current state
- [passed] retained transfer receipt validation rejects corrupted negative balance without depending on current state
- [passed] retained transfer receipt validation rejects corrupted source prior overflow without depending on current state
- [passed] retained transfer receipt validation rejects corrupted target prior underflow without depending on current state
- [passed] retained transfer receipt validation rejects corrupted invalid timestamp without depending on current state
- [passed] retained transfer receipt validation requires explicit null quoteId for a same-currency receipt
- [passed] retained transfer receipt validation requires explicit null rate for a same-currency receipt
- [passed] retained transfer receipt validation requires explicit null issuedAt for a same-currency receipt
- [passed] retained transfer receipt validation requires explicit null expiresAt for a same-currency receipt
- [passed] retained transfer receipt validation rejects corrupted FX quote ID
- [passed] retained transfer receipt validation rejects corrupted FX missing rate
- [passed] retained transfer receipt validation rejects corrupted FX rate arithmetic
- [passed] retained transfer receipt validation rejects corrupted FX rate source
- [passed] retained transfer receipt validation rejects corrupted FX rate provider
- [passed] retained transfer receipt validation rejects corrupted FX rate fetched time
- [passed] retained transfer receipt validation rejects corrupted FX rate source date
- [passed] retained transfer receipt validation rejects corrupted FX quote lifetime
- [passed] retained transfer receipt validation rejects corrupted FX quote issuance
- [passed] retained transfer receipt validation rejects a damaged retained business rejection

### `src/features/transfers/service.test.ts`

- [passed] atomic simulated transfer service moves identical minor units to an existing nondefault wallet without any provider/quote request
- [passed] atomic simulated transfer service creates arbitrary exact recipient ID __proto__ with its chosen default and selected wallet only
- [passed] atomic simulated transfer service creates arbitrary exact recipient ID constructor with its chosen default and selected wallet only
- [passed] atomic simulated transfer service creates arbitrary exact recipient ID a with its chosen default and selected wallet only
- [passed] atomic simulated transfer service creates arbitrary exact recipient ID recipient with its chosen default and selected wallet only
- [passed] atomic simulated transfer service creates arbitrary exact recipient ID وجهة-💰 with its chosen default and selected wallet only
- [passed] atomic simulated transfer service defaults the target to an existing recipient's recorded default without changing it
- [passed] atomic simulated transfer service creates a new default/target currency, recipient and exact FX credit only inside successful confirmation
- [passed] atomic simulated transfer service fetches only missing default-currency catalog metadata outside the writer, never an FX rate for a same-currency transfer
- [passed] atomic simulated transfer service uses fresh-first eligible catalog fallback only for missing default metadata
- [passed] atomic simulated transfer service keeps unavailable absent catalog nondefinitive and recovers with the original key
- [passed] atomic simulated transfer service keeps unavailable expired catalog nondefinitive and recovers with the original key
- [passed] atomic simulated transfer service keeps unavailable corrupt catalog nondefinitive and recovers with the original key
- [passed] atomic simulated transfer service rechecks metadata age under the writer rather than granting a quote-like hold
- [passed] atomic simulated transfer service retains an eligible catalog's unsupported-default rejection without creating anything
- [passed] atomic simulated transfer service revalidates current funds after catalog work without orphaning default metadata, account or wallet
- [passed] atomic simulated transfer service revalidates a newly appearing recipient/default after catalog work
- [passed] atomic simulated transfer service replays the winning same-key result before a delayed catalog error, without a second credit
- [passed] atomic simulated transfer service copies exact input before awaits, including recipient/default and amount
- [passed] atomic simulated transfer service replays after restart/expiry and later spending without quote reads, metadata calls or the clock
- [passed] atomic simulated transfer service retains an original funds rejection after funding, while a deliberate new key may succeed
- [passed] atomic simulated transfer service rejects changed accepted input under an existing key: {"amount":"10"}
- [passed] atomic simulated transfer service rejects changed accepted input under an existing key: {}
- [passed] atomic simulated transfer service rejects changed accepted input under an existing key: {"recipientAccountId":"elsewhere"}
- [passed] atomic simulated transfer service rejects changed accepted input under an existing key: {"recipientDefaultCurrency":"GBP"}
- [passed] atomic simulated transfer service rejects changed accepted input under an existing key: {"quoteId":"1092dbbd-78ff-4576-8577-24ce3a00ec87"}
- [passed] atomic simulated transfer service records a pre-write business rejection without completed history: {"sourceWalletId":"main-usd","recipientAccountId":"main","amount":"10.00","targetCurrency":"USD"}
- [passed] atomic simulated transfer service records a pre-write business rejection without completed history: {"sourceWalletId":"recipient-usd","recipientAccountId":"recipient","amount":"10.00","targetCurrency":"USD"}
- [passed] atomic simulated transfer service records a pre-write business rejection without completed history: {"sourceWalletId":"missing","recipientAccountId":"recipient","amount":"10.00","targetCurrency":"USD"}
- [passed] atomic simulated transfer service records a pre-write business rejection without completed history: {"sourceWalletId":"main-usd","recipientAccountId":"new","amount":"10.00","targetCurrency":"USD"}
- [passed] atomic simulated transfer service records a pre-write business rejection without completed history: {"sourceWalletId":"main-usd","recipientAccountId":"recipient","amount":"10.00","targetCurrency":"USD","recipientDefaultCurrency":"USD"}
- [passed] atomic simulated transfer service records a pre-write business rejection without completed history: {"sourceWalletId":"main-usd","recipientAccountId":"recipient","amount":"10.00","targetCurrency":"GBP"}
- [passed] atomic simulated transfer service records a pre-write business rejection without completed history: {"sourceWalletId":"main-usd","recipientAccountId":"recipient","amount":"10.00","targetCurrency":"USD","quoteId":"9435224d-c9c7-4932-96e7-fc4d551226a4"}
- [passed] atomic simulated transfer service records a pre-write business rejection without completed history: {"sourceWalletId":"main-usd","recipientAccountId":"recipient","amount":"10.00","targetCurrency":"ZZZ"}
- [passed] atomic simulated transfer service records a pre-write business rejection without completed history: {"sourceWalletId":"main-usd","recipientAccountId":"recipient","amount":"0","targetCurrency":"USD"}
- [passed] atomic simulated transfer service records a pre-write business rejection without completed history: {"sourceWalletId":"main-usd","recipientAccountId":"recipient","amount":"1.001","targetCurrency":"USD"}
- [passed] atomic simulated transfer service records a pre-write business rejection without completed history: {"sourceWalletId":"main-usd","recipientAccountId":"recipient","amount":"92233720368547758.08","targetCurrency":"USD"}
- [passed] atomic simulated transfer service does not accept malformed input or client-owned terms: null
- [passed] atomic simulated transfer service does not accept malformed input or client-owned terms: []
- [passed] atomic simulated transfer service does not accept malformed input or client-owned terms: {}
- [passed] atomic simulated transfer service does not accept malformed input or client-owned terms: {"sourceWalletId":"main-usd","recipientAccountId":"recipient","amount":1,"targetCurrency":"USD"}
- [passed] atomic simulated transfer service does not accept malformed input or client-owned terms: {"sourceWalletId":"main-usd","recipientAccountId":"recipient","amount":"1e2","targetCurrency":"USD"}
- [passed] atomic simulated transfer service does not accept malformed input or client-owned terms: {"sourceWalletId":"main-usd","recipientAccountId":"recipient","amount":"10.00","targetCurrency":"USD","rate":"9"}
- [passed] atomic simulated transfer service does not accept malformed input or client-owned terms: {"sourceWalletId":"main-usd","recipientAccountId":"\u0000","amount":"10.00","targetCurrency":"USD"}
- [passed] atomic simulated transfer service does not accept malformed input or client-owned terms: {"sourceWalletId":"main-usd","recipientAccountId":"recipient","amount":"10.00","targetCurrency":"USD"}
- [passed] atomic simulated transfer service does not accept malformed input or client-owned terms: {"sourceWalletId":"main-usd","recipientAccountId":"recipient","amount":"10.00","targetCurrency":"USD","quoteId":"bad"}
- [passed] atomic simulated transfer service uses strict quote expiry, full-minute cached holds and successful-use exclusivity
- [passed] atomic simulated transfer service accepts newly appearing compatible recipients without silently changing their defaults
- [passed] atomic simulated transfer service rolls back recipient creation and journal if the quote expires at final consumption
- [passed] atomic simulated transfer service never consumes a conversion quote for a transfer
- [passed] atomic simulated transfer service rolls back all creation/accounting/use after default-currency insertion failure
- [passed] atomic simulated transfer service rolls back all creation/accounting/use after target-currency insertion failure
- [passed] atomic simulated transfer service rolls back all creation/accounting/use after accounts insertion failure
- [passed] atomic simulated transfer service rolls back all creation/accounting/use after wallets insertion failure
- [passed] atomic simulated transfer service rolls back all creation/accounting/use after transactions insertion failure
- [passed] atomic simulated transfer service rolls back all creation/accounting/use after debit insertion failure
- [passed] atomic simulated transfer service rolls back all creation/accounting/use after credit insertion failure
- [passed] atomic simulated transfer service rolls back all creation/accounting/use after fx_quote_uses insertion failure
- [passed] atomic simulated transfer service rolls back all creation/accounting/use after transfer_attempts insertion failure
- [passed] atomic simulated transfer service rolls back same-currency account creation if the retained result cannot be stored
- [passed] atomic simulated transfer service does not claim a definitive error if failure persistence is unavailable
- [passed] atomic simulated transfer service retains immutable outcomes and enforces key ownership across all three features
- [passed] atomic simulated transfer service checks exact int64 bounds and original target capacity for same-currency sends
- [passed] atomic simulated transfer service fails closed on corrupted retained receipts and quotes without another operation
- [passed] atomic simulated transfer service refuses a caller-owned transaction for same without accepting a key
- [passed] atomic simulated transfer service refuses a caller-owned transaction for fx without accepting a key
- [passed] atomic simulated transfer service moves whole zero-decimal units without an FX request and rejects fractional units
- [passed] atomic simulated transfer service uses reviewed exact half-up FX with a zero-decimal source
- [passed] atomic simulated transfer service uses reviewed exact half-up FX with a zero-decimal target
- [passed] atomic simulated transfer service cannot use a quote with changed amount input
- [passed] atomic simulated transfer service cannot use a quote with changed recipient input
- [passed] atomic simulated transfer service cannot use a quote with changed default input
- [passed] atomic simulated transfer service cannot use a quote with changed target input
- [passed] atomic simulated transfer service cannot use a quote with changed source input
- [passed] atomic simulated transfer service retains a missing quote rejection and does not create the recipient
- [passed] atomic simulated transfer service returns unknown on a lock timeout and safely retries the identical key after unlock

### `src/features/wallet/amount-entry.test.ts`

- [passed] groups 1000 exactly without numeric coercion
- [passed] groups 12000 exactly without numeric coercion
- [passed] groups 1234567.8900 exactly without numeric coercion
- [passed] groups 0. exactly without numeric coercion
- [passed] groups exactly without numeric coercion
- [passed] groups 92233720368547758.07 exactly without numeric coercion
- [passed] rejects unsafe/invalid edit 1e3 instead of silently changing its value
- [passed] rejects unsafe/invalid edit -10 instead of silently changing its value
- [passed] rejects unsafe/invalid edit +10 instead of silently changing its value
- [passed] rejects unsafe/invalid edit $10 instead of silently changing its value
- [passed] rejects unsafe/invalid edit 1.2.3 instead of silently changing its value
- [passed] rejects unsafe/invalid edit NaN instead of silently changing its value
- [passed] rejects unsafe/invalid edit Infinity instead of silently changing its value
- [passed] rejects unsafe/invalid edit 10 instead of silently changing its value
- [passed] rejects unsafe/invalid edit 10 instead of silently changing its value
- [passed] rejects unsafe/invalid edit 1234567890123456789012345 instead of silently changing its value
- [passed] keeps precision validation in the monetary parser rather than truncating or rounding input
- [passed] normalizes only redundant leading zeroes and permits a decimal-first edit

### `src/features/wallet/balance-history-interactions.test.tsx`

- [passed] pages all exact observations six at a time, preserves the whole chart and hides all data under privacy

### `src/features/wallet/balance-history.test.tsx`

- [passed] BalanceHistory shows disconnected history without a fictional zero chart or date range
- [passed] BalanceHistory distinguishes a supplied empty series from disconnected history
- [passed] BalanceHistory privacy omits every record, chart, time, and table for payload 0
- [passed] BalanceHistory privacy omits every record, chart, time, and table for payload 1
- [passed] BalanceHistory privacy omits every record, chart, time, and table for payload 2
- [passed] BalanceHistory privacy omits every record, chart, time, and table for payload 3
- [passed] BalanceHistory privacy omits every record, chart, time, and table for payload 4
- [passed] BalanceHistory does not inspect sensitive records while private
- [passed] BalanceHistory rejects malformed series metadata or records 0
- [passed] BalanceHistory rejects malformed series metadata or records 1
- [passed] BalanceHistory rejects malformed series metadata or records 2
- [passed] BalanceHistory rejects malformed series metadata or records 3
- [passed] BalanceHistory rejects malformed series metadata or records 4
- [passed] BalanceHistory rejects malformed series metadata or records 5
- [passed] BalanceHistory rejects malformed series metadata or records 6
- [passed] BalanceHistory rejects malformed series metadata or records 7
- [passed] BalanceHistory rejects malformed series metadata or records 8
- [passed] BalanceHistory rejects malformed series metadata or records 9
- [passed] BalanceHistory rejects malformed series metadata or records 10
- [passed] BalanceHistory rejects malformed series metadata or records 11
- [passed] BalanceHistory rejects malformed series metadata or records 12
- [passed] BalanceHistory rejects an invalid minor-unit value without exposing valid records: "-1"
- [passed] BalanceHistory rejects an invalid minor-unit value without exposing valid records: "+1"
- [passed] BalanceHistory rejects an invalid minor-unit value without exposing valid records: "01"
- [passed] BalanceHistory rejects an invalid minor-unit value without exposing valid records: "00"
- [passed] BalanceHistory rejects an invalid minor-unit value without exposing valid records: "1.00"
- [passed] BalanceHistory rejects an invalid minor-unit value without exposing valid records: "1e2"
- [passed] BalanceHistory rejects an invalid minor-unit value without exposing valid records: " 1"
- [passed] BalanceHistory rejects an invalid minor-unit value without exposing valid records: "1 "
- [passed] BalanceHistory rejects an invalid minor-unit value without exposing valid records: "1 "
- [passed] BalanceHistory rejects an invalid minor-unit value without exposing valid records: ""
- [passed] BalanceHistory rejects an invalid minor-unit value without exposing valid records: "9223372036854775808"
- [passed] BalanceHistory rejects an invalid minor-unit value without exposing valid records: "1000000000000000000000000000000000000000000"
- [passed] BalanceHistory rejects an invalid minor-unit value without exposing valid records: 12345
- [passed] BalanceHistory rejects an invalid minor-unit value without exposing valid records: null
- [passed] BalanceHistory rejects an invalid minor-unit value without exposing valid records: undefined
- [passed] BalanceHistory rejects noncanonical or invalid UTC timestamps: "2026-01-11"
- [passed] BalanceHistory rejects noncanonical or invalid UTC timestamps: "2026-01-11T00:00:00Z"
- [passed] BalanceHistory rejects noncanonical or invalid UTC timestamps: "2026-01-11T00:00:00.00Z"
- [passed] BalanceHistory rejects noncanonical or invalid UTC timestamps: "2026-01-11T00:00:00.000+00:00"
- [passed] BalanceHistory rejects noncanonical or invalid UTC timestamps: "2026-01-11t00:00:00.000z"
- [passed] BalanceHistory rejects noncanonical or invalid UTC timestamps: "2026-02-30T00:00:00.000Z"
- [passed] BalanceHistory rejects noncanonical or invalid UTC timestamps: "2026-13-11T00:00:00.000Z"
- [passed] BalanceHistory rejects noncanonical or invalid UTC timestamps: "2026-01-11T24:00:00.000Z"
- [passed] BalanceHistory rejects noncanonical or invalid UTC timestamps: "2026-01-11T00:00:60.000Z"
- [passed] BalanceHistory rejects noncanonical or invalid UTC timestamps: "2026-01-11T00:00:00.000Z "
- [passed] BalanceHistory rejects noncanonical or invalid UTC timestamps: "+010000-01-11T00:00:00.000Z"
- [passed] BalanceHistory rejects noncanonical or invalid UTC timestamps: "not-a-date"
- [passed] BalanceHistory rejects noncanonical or invalid UTC timestamps: 1768089600000
- [passed] BalanceHistory rejects noncanonical or invalid UTC timestamps: null
- [passed] BalanceHistory rejects noncanonical or invalid UTC timestamps: undefined
- [passed] BalanceHistory rejects duplicate or descending timestamps without sorting: "2026-01-01T00:00:00.000Z"
- [passed] BalanceHistory rejects duplicate or descending timestamps without sorting: "2026-01-11T00:00:00.000Z"
- [passed] BalanceHistory rejects duplicate or descending timestamps without sorting: "2026-01-01T00:00:00.000Z"
- [passed] BalanceHistory never leaks main-account history when inspecting destination
- [passed] BalanceHistory never leaks destination history when inspecting main-account
- [passed] BalanceHistory never leaks main-account history when inspecting MAIN-ACCOUNT
- [passed] BalanceHistory never leaks main-account history when inspecting main-account
- [passed] BalanceHistory never leaks main-account history when inspecting
- [passed] BalanceHistory rejects supplied history without an active account, even when empty
- [passed] BalanceHistory allows the exact matching destination account's own supplied history
- [passed] BalanceHistory renders only recorded markers with straight segments and timestamp-spaced x coordinates
- [passed] BalanceHistory renders a real all-zero series as a finite horizontal baseline
- [passed] BalanceHistory shows one actual 0 snapshot without inventing a connecting line
- [passed] BalanceHistory shows one actual 1 snapshot without inventing a connecting line
- [passed] BalanceHistory shows one actual 9223372036854775807 snapshot without inventing a connecting line
- [passed] BalanceHistory preserves amounts beyond Number precision and max signed-64-bit minor units
- [passed] BalanceHistory labels same-day endpoints with human UTC times while preserving exact machine timestamps
- [passed] BalanceHistory renders canonical UTC endpoints outside the usual epoch range
- [passed] BalanceHistory does not mutate supplied metadata, records, or their ordering
- [passed] BalanceHistory keeps every dense-series segment and exact record without markers obscuring the line

### `src/features/wallet/currency-flag.test.tsx`

- [passed] currency flag markers keeps EU star positions fixed across server and browser math engines
- [passed] currency flag markers renders a self-contained decorative USD vector
- [passed] currency flag markers renders a self-contained decorative EUR vector
- [passed] currency flag markers renders a self-contained decorative GBP vector
- [passed] currency flag markers uses the US, EU and UK marker geometry rather than platform emoji

### `src/features/wallet/dashboard.test.tsx`

- [passed] wallet presentation interactions switches account-scoped balances and makes destinations inspect-only
- [passed] wallet presentation interactions does not reuse main-account balances for a destination without data
- [passed] wallet presentation interactions hides every balance and restores values without changing the model
- [passed] wallet presentation interactions does not invent preview history or choose an ambiguous duplicate series
- [passed] wallet presentation interactions labels connected balances truthfully without pretending writes or history are connected
- [passed] wallet presentation interactions isolates completed funding, filters withdrawals and removes records during privacy

### `src/features/wallet/operation-model.test.ts`

- [passed] preview operation validation reviews an exact deposit without a mutation or fabricated outcome
- [passed] preview operation validation blocks withdraw against the zero preview balance
- [passed] preview operation validation blocks convert against the zero preview balance
- [passed] preview operation validation blocks transfer against the zero preview balance
- [passed] preview operation validation rejects noncanonical or unsupported amount 0
- [passed] preview operation validation rejects noncanonical or unsupported amount -1
- [passed] preview operation validation rejects noncanonical or unsupported amount 01
- [passed] preview operation validation rejects noncanonical or unsupported amount 1,000
- [passed] preview operation validation rejects noncanonical or unsupported amount 1.00
- [passed] preview operation validation rejects noncanonical or unsupported amount 1e2
- [passed] preview operation validation rejects noncanonical or unsupported amount 1.001
- [passed] preview operation validation rejects noncanonical or unsupported amount 1.000
- [passed] preview operation validation rejects noncanonical or unsupported amount 9999999999999999999999999
- [passed] preview operation validation enforces main-only actions even if a client attempts validation directly
- [passed] preview operation validation does not invent a source wallet or make an invalid balance spendable
- [passed] preview operation validation accepts only the three explicitly fictional providers
- [passed] preview operation validation requires a distinct bounded recipient ID without claiming to verify it
- [passed] preview operation validation accepts exact arbitrary recipient a with an explicit new default
- [passed] preview operation validation accepts exact arbitrary recipient a b with an explicit new default
- [passed] preview operation validation accepts exact arbitrary recipient __proto__ with an explicit new default
- [passed] preview operation validation accepts exact arbitrary recipient constructor with an explicit new default
- [passed] preview operation validation accepts exact arbitrary recipient وجهة-💰 with an explicit new default
- [passed] preview operation validation accepts exact arbitrary recipient aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa with an explicit new default
- [passed] preview operation validation resolves stored defaults without overwriting them and permits same-currency overrides
- [passed] preview operation validation requires eligible new-recipient defaults and valid targets before review
- [passed] preview operation validation requires different conversion currencies and never returns a rate
- [passed] preview operation validation checks the final deposit balance bound with exact integers
- [passed] preview operation validation explains amount "" without a generic parser lecture
- [passed] preview operation validation explains amount "0" without a generic parser lecture
- [passed] preview operation validation explains amount "0.00" without a generic parser lecture
- [passed] preview operation validation explains amount "abc" without a generic parser lecture
- [passed] preview operation validation does not default conversion to the same currency when only one wallet exists
- [passed] preview operation validation never validates another account’s source or target wallets

### `src/features/wallet/presentation.test.ts`

- [passed] wallet presentation scopes every displayed balance to the selected account
- [passed] wallet presentation shows exact fixed-precision text without floating-point conversion
- [passed] wallet presentation formats supplied USD totals exactly and preserves unavailable state
- [passed] wallet presentation only allows a rate-free total for complete, valid zero balances
- [passed] wallet presentation does not turn invalid balance invalid into zero
- [passed] wallet presentation does not turn invalid balance -1 into zero
- [passed] wallet presentation does not turn invalid balance 01 into zero
- [passed] wallet presentation does not turn invalid balance 1.0 into zero
- [passed] wallet presentation does not turn invalid balance 0 into zero
- [passed] wallet presentation does not turn invalid balance 1 into zero
- [passed] wallet presentation does not turn invalid balance 1 into zero
- [passed] wallet presentation does not turn invalid balance 9223372036854775808 into zero
- [passed] wallet presentation does not turn invalid balance 00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000 into zero
- [passed] wallet presentation rejects an invalid integration exponent
- [passed] wallet presentation does not coerce runtime non-string balance 0
- [passed] wallet presentation does not coerce runtime non-string balance 1n
- [passed] wallet presentation does not coerce runtime non-string balance null
- [passed] wallet presentation does not coerce runtime non-string balance undefined
- [passed] wallet presentation does not coerce runtime non-string balance {"toString": [Function toString]}

### `src/features/wallet/types.test.ts`

- [passed] interface-first presentation model labels presentation data as preview, not stored wallet state
- [passed] interface-first presentation model does not share mutable presentation state across requests

### `src/features/wallet/use-money-step-motion.test.tsx`

- [passed] resizes a single live dialog, cancels interrupted work, and bypasses privacy/closing/reduced motion

### `src/features/wallet/use-route-content-motion.test.tsx`

- [passed] animates committed sibling navigation only and cancels interruption, privacy, preference, resize and unmount

### `src/lib/contracts.test.ts`

- [passed] shared contract definitions retains exact arbitrary nonblank identifier __proto__
- [passed] shared contract definitions retains exact arbitrary nonblank identifier constructor
- [passed] shared contract definitions retains exact arbitrary nonblank identifier recipient
- [passed] shared contract definitions retains exact arbitrary nonblank identifier وجهة-💰
- [passed] shared contract definitions retains exact arbitrary nonblank identifier a b
- [passed] shared contract definitions rejects invalid identifier null
- [passed] shared contract definitions rejects invalid identifier 1
- [passed] shared contract definitions rejects invalid identifier ""
- [passed] shared contract definitions rejects invalid identifier " \n\t"
- [passed] shared contract definitions rejects invalid identifier "\u0000"
- [passed] shared contract definitions rejects invalid identifier "a\u0000b"
- [passed] shared contract definitions rejects invalid identifier "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
- [passed] shared contract definitions retains the existing UTF-16 code-unit length limit for identifiers
- [passed] shared contract definitions does not preempt business range/precision checks for 0
- [passed] shared contract definitions does not preempt business range/precision checks for 0.00
- [passed] shared contract definitions does not preempt business range/precision checks for 1
- [passed] shared contract definitions does not preempt business range/precision checks for 1.00
- [passed] shared contract definitions does not preempt business range/precision checks for 92233720368547758.08
- [passed] shared contract definitions rejects non-plain amount 1
- [passed] shared contract definitions rejects non-plain amount "01"
- [passed] shared contract definitions rejects non-plain amount "1e2"
- [passed] shared contract definitions rejects non-plain amount "-1"
- [passed] shared contract definitions rejects non-plain amount "+1"
- [passed] shared contract definitions rejects non-plain amount ".1"
- [passed] shared contract definitions rejects non-plain amount "1."
- [passed] shared contract definitions rejects non-plain amount "1\n"
- [passed] shared contract definitions rejects non-plain amount "1.00\r\n"
- [passed] shared contract definitions rejects non-plain amount " 1"
- [passed] shared contract definitions rejects non-plain amount "1 "
- [passed] shared contract definitions rejects non-plain amount "1111111111111111111111111"
- [passed] shared contract definitions rejects invalid currency syntax "USD\n"
- [passed] shared contract definitions rejects invalid currency syntax "usd"
- [passed] shared contract definitions rejects invalid currency syntax "USDD"
- [passed] shared contract definitions rejects invalid currency syntax "US"
- [passed] shared contract definitions rejects invalid currency syntax " USD"
- [passed] shared contract definitions retains case-insensitive standard UUID 12345678-1234-4123-8123-123456789ABC
- [passed] shared contract definitions retains case-insensitive standard UUID 12345678-1234-8123-a123-123456789012
- [passed] shared contract definitions rejects inherited, unknown and explicitly undefined optional fields
- [passed] shared contract definitions publishes the same runtime request schema objects rather than divergent copies
- [passed] shared contract definitions keeps service guards aligned with structural schemas without normalization

### `src/lib/date-presentation.test.ts`

- [passed] presents calendar dates without a timezone shift
- [passed] formats UTC timestamps consistently with readable times and explicit zone
- [passed] has an honest missing-date fallback rather than Invalid Date

### `src/lib/use-motion-open.test.tsx`

- [passed] interruptible presence motion captures the rendered exit frame instead of assuming fully open
- [passed] interruptible presence motion captures an interrupted exit when a still-mounted layer reopens
- [passed] interruptible presence motion does not read or write animated frames under reduced motion
- [passed] interruptible presence motion normalizes no translation without replacing a valid zero scale
- [passed] interruptible presence motion preserves controlled open state and reports the requested change
- [passed] interruptible presence motion preserves uncontrolled default-open and change behavior

### `src/lib/utils.test.ts`

- [passed] cn combines conditional classes and resolves Tailwind conflicts

### `src/server/db/connection.test.ts`

- [passed] SQLite foundation enables foreign keys and WAL for file-backed connections
- [passed] SQLite foundation preserves distinct integers above JavaScript's safe-number limit
- [passed] SQLite foundation applies versioned migrations repeatedly without duplicating schema
- [passed] SQLite foundation persists data when a file is reopened by a new connection
- [passed] SQLite foundation rolls back failed write transactions
- [passed] SQLite foundation never opens the configured runtime database from Jest

### `src/server/db/schema.test.ts`

- [passed] wallet and journal schema enforces one main account and one wallet per account and currency
- [passed] wallet and journal schema enforces account, currency, wallet and transaction references
- [passed] wallet and journal schema maps bounded currency exponents to numbers and money to exact bigint
- [passed] wallet and journal schema rejects an invalid raw journal amount: 0
- [passed] wallet and journal schema rejects an invalid raw journal amount: 0.5
- [passed] wallet and journal schema rejects an invalid raw journal amount: not a number
- [passed] wallet and journal schema rejects an invalid raw journal amount: null
- [passed] wallet and journal schema rejects an invalid raw journal amount: -9223372036854775808n
- [passed] wallet and journal schema rejects fractional raw currency precision
- [passed] wallet and journal schema requires journal direction and wallet to match the completed transaction
- [passed] wallet and journal schema prevents duplicate entries and edits to completed accounting history
- [passed] wallet and journal schema preserves wallet identity and historical currency precision
- [passed] wallet and journal schema rejects malformed completed-transaction shapes

### `src/server/http/confirmation-delay.test.ts`

- [passed] waits exactly one second asynchronously
- [passed] deposit waits before any database access without changing unknown-outcome handling
- [passed] withdrawal waits before any database access without changing unknown-outcome handling
- [passed] conversion waits before any database access without changing unknown-outcome handling
- [passed] transfer waits before any database access without changing unknown-outcome handling

### `src/server/http/funding-handler.test.ts`

- [passed] funding HTTP boundary returns exact receipts and replay headers from both thin handlers
- [passed] funding HTTP boundary rejects malformed/cross-origin request before storage: {"Content-Type":"text/plain"}
- [passed] funding HTTP boundary rejects malformed/cross-origin request before storage: {"Idempotency-Key":"invalid"}
- [passed] funding HTTP boundary rejects malformed/cross-origin request before storage: {"Origin":"http://evil.example"}
- [passed] funding HTTP boundary rejects malformed/cross-origin request before storage: {"sec-fetch-site":"cross-site"}
- [passed] funding HTTP boundary rejects malformed/cross-origin request before storage: {}
- [passed] funding HTTP boundary rejects malformed/cross-origin request before storage: {}
- [passed] funding HTTP boundary redacts unavailable storage and explicitly leaves the outcome unknown
- [passed] funding HTTP boundary rejects malformed structural input before database acquisition: null
- [passed] funding HTTP boundary rejects malformed structural input before database acquisition: []
- [passed] funding HTTP boundary rejects malformed structural input before database acquisition: {}
- [passed] funding HTTP boundary rejects malformed structural input before database acquisition: {"walletId":"main-usd","amount":1,"provider":"demo_bank"}
- [passed] funding HTTP boundary rejects malformed structural input before database acquisition: {"walletId":"main-usd","amount":"1\n","provider":"demo_bank"}
- [passed] funding HTTP boundary rejects malformed structural input before database acquisition: {"walletId":" ","amount":"10.00","provider":"demo_bank"}
- [passed] funding HTTP boundary rejects malformed structural input before database acquisition: {"walletId":"main-usd","amount":"10.00","provider":"unknown"}
- [passed] funding HTTP boundary rejects malformed structural input before database acquisition: {"walletId":"main-usd","amount":"10.00","provider":"demo_bank","rate":"1"}
- [passed] funding HTTP boundary uses the shared malformed-authority guard before storage: wallet.test/path
- [passed] funding HTTP boundary uses the shared malformed-authority guard before storage: user@wallet.test
- [passed] funding HTTP boundary uses the shared malformed-authority guard before storage: wallet.test?query
- [passed] funding HTTP boundary returns unknown after post-commit serialization failure and recovers the original stored result
- [passed] funding HTTP boundary uses the direct Host authority rather than Next's internal bind-address URL

### `src/server/http/history-handler.test.ts`

- [passed] history HTTP boundary returns exact no-store numbered-page and detail bodies matching their published schemas
- [passed] history HTTP boundary rejects malformed list query before database acquisition:
- [passed] history HTTP boundary rejects malformed list query before database acquisition: accountId=
- [passed] history HTTP boundary rejects malformed list query before database acquisition: accountId=main&accountId=recipient
- [passed] history HTTP boundary rejects malformed list query before database acquisition: accountId=main&page=0
- [passed] history HTTP boundary rejects malformed list query before database acquisition: accountId=main&pageSize=101
- [passed] history HTTP boundary rejects malformed list query before database acquisition: accountId=main&page=9007199254740992
- [passed] history HTTP boundary rejects malformed list query before database acquisition: accountId=main&from=2026-02-30
- [passed] history HTTP boundary rejects malformed list query before database acquisition: accountId=main&from=2026-11-13&to=2026-11-12
- [passed] history HTTP boundary rejects malformed list query before database acquisition: accountId=main&currency=ZZZ
- [passed] history HTTP boundary rejects malformed list query before database acquisition: accountId=main&cursor=abc
- [passed] history HTTP boundary rejects malformed list query before database acquisition: accountId=main&__proto__=other
- [passed] history HTTP boundary rejects malformed detail query before storage:
- [passed] history HTTP boundary rejects malformed detail query before storage: accountId=main&page=1
- [passed] history HTTP boundary rejects malformed detail query before storage: accountId=main&accountId=recipient
- [passed] history HTTP boundary rejects malformed transaction ID before storage
- [passed] history HTTP boundary rejects malformed transaction ID before storage
- [passed] history HTTP boundary rejects malformed transaction ID before storage
- [passed] history HTTP boundary rejects malformed transaction ID before storage
- [passed] history HTTP boundary returns 404 for missing accounts and missing/unrelated transaction IDs without disclosing records
- [passed] history HTTP boundary redacts unexpected storage and parameter-resolution errors
- [passed] history HTTP boundary returns unavailable data rather than fabricated history for a damaged selected transaction
- [passed] history HTTP boundary never seeds an uninitialized database

### `src/server/http/quote-responses.test.ts`

- [passed] quote HTTP preview and immutable readback returns the exact server terms without needing a money key or moving funds
- [passed] quote HTTP preview and immutable readback rejects malformed/foreign input before database access
- [passed] quote HTTP preview and immutable readback rejects malformed/foreign input before database access
- [passed] quote HTTP preview and immutable readback rejects malformed/foreign input before database access
- [passed] quote HTTP preview and immutable readback rejects malformed/foreign input before database access
- [passed] quote HTTP preview and immutable readback rejects malformed/foreign input before database access
- [passed] quote HTTP preview and immutable readback rejects invalid IDs before database access and returns safe 404 for unknown quotes
- [passed] quote HTTP preview and immutable readback redacts unexpected storage failures without claiming a monetary outcome
- [passed] quote HTTP preview and immutable readback returns unavailable without fabricating terms when no eligible rate exists

### `src/server/http/rate-responses.test.ts`

- [passed] reference-data HTTP boundary returns documented fresh catalog and exact string rates without cached HTTP responses
- [passed] reference-data HTTP boundary tries fresh first on each HTTP request, then labels fallback without changing fetch age
- [passed] reference-data HTTP boundary rejects invalid query before database/network access
- [passed] reference-data HTTP boundary rejects invalid query ?base=USD before database/network access
- [passed] reference-data HTTP boundary rejects invalid query ?base=usd&quote=EUR before database/network access
- [passed] reference-data HTTP boundary rejects invalid query ?base=USD&quote=USD before database/network access
- [passed] reference-data HTTP boundary rejects invalid query ?base=BTC&quote=USD before database/network access
- [passed] reference-data HTTP boundary rejects invalid query ?base=USD&quote=EUR&provider=other before database/network access
- [passed] reference-data HTTP boundary rejects invalid query ?base=USD&base=GBP&quote=EUR before database/network access
- [passed] reference-data HTTP boundary returns safe 503 on outage without eligible data and never fabricates a rate
- [passed] reference-data HTTP boundary redacts unexpected storage failures

### `src/server/http/request-input.test.ts`

- [passed] shared write-request policy accepts direct same-origin JSON or CLI requests: {}
- [passed] shared write-request policy accepts direct same-origin JSON or CLI requests: {"Origin":"http://wallet.test:3000"}
- [passed] shared write-request policy accepts direct same-origin JSON or CLI requests: {"Content-Type":"Application/JSON; charset=utf-8"}
- [passed] shared write-request policy accepts direct same-origin JSON or CLI requests: {"Host":"[::1]:3000","Origin":"http://[::1]:3000"}
- [passed] shared write-request policy accepts direct same-origin JSON or CLI requests: {"Origin":"http://wallet.test:3000","X-Forwarded-Host":"evil.test","X-Forwarded-Proto":"https"}
- [passed] shared write-request policy rejects explicit foreign browser context: {"Origin":"https://wallet.test:3000"}
- [passed] shared write-request policy rejects explicit foreign browser context: {"Origin":"http://wallet.test:3001"}
- [passed] shared write-request policy rejects explicit foreign browser context: {"Origin":"null"}
- [passed] shared write-request policy rejects explicit foreign browser context: {"Origin":"http://evil.test","X-Forwarded-Host":"evil.test"}
- [passed] shared write-request policy rejects explicit foreign browser context: {"Sec-Fetch-Site":"cross-site"}
- [passed] shared write-request policy rejects malformed direct Host authority "wallet.test/path"
- [passed] shared write-request policy rejects malformed direct Host authority "wallet.test?query"
- [passed] shared write-request policy rejects malformed direct Host authority "wallet.test#fragment"
- [passed] shared write-request policy rejects malformed direct Host authority "user@wallet.test"
- [passed] shared write-request policy rejects malformed direct Host authority "wallet.test\\path"
- [passed] shared write-request policy rejects malformed direct Host authority "wallet.test:invalid"
- [passed] shared write-request policy rejects malformed direct Host authority ""
- [passed] shared write-request policy rejects malformed direct Host authority "http://wallet.test"
- [passed] shared write-request policy rejects non-JSON content type "text/plain"
- [passed] shared write-request policy rejects non-JSON content type "application/problem+json"
- [passed] shared write-request policy rejects non-JSON content type "application/jsonx"
- [passed] shared write-request policy rejects non-JSON content type ""
- [passed] shared write-request policy does not require a Host header when the URL already has the direct authority
- [passed] bounded UTF-8 JSON input counts bytes, accepts exactly 16 KiB, and ignores misleading Content-Length
- [passed] bounded UTF-8 JSON input decodes split multi-byte UTF-8 only after bounded assembly
- [passed] bounded UTF-8 JSON input rejects a multi-byte body beyond the byte limit even if its character count is smaller
- [passed] bounded UTF-8 JSON input cancels an oversized open stream and releases its lock
- [passed] bounded UTF-8 JSON input releases the reader on invalid JSON "{"
- [passed] bounded UTF-8 JSON input releases the reader on invalid JSON ""
- [passed] bounded UTF-8 JSON input releases the reader on invalid JSON "\"unterminated"
- [passed] bounded UTF-8 JSON input rejects malformed UTF-8 instead of replacing it
- [passed] bounded UTF-8 JSON input rejects absent, already-consumed and aborted bodies
- [passed] bounded UTF-8 JSON input preserves stream failure and releases its lock
- [passed] bounded UTF-8 JSON input interrupts a pending stream read on abort and releases its reader
- [passed] bounded UTF-8 JSON input validates structural input without normalizing exact strings

### `src/server/http/responses.test.ts`

- [passed] shared lossless HTTP responses preserves exact large amount/rate strings without inventing replay headers
- [passed] shared lossless HTTP responses uses public Problem Details for 400
- [passed] shared lossless HTTP responses uses public Problem Details for 404
- [passed] shared lossless HTTP responses uses public Problem Details for 409
- [passed] shared lossless HTTP responses uses public Problem Details for 503
- [passed] shared lossless HTTP responses retains the original monetary body/status and replay flag true
- [passed] shared lossless HTTP responses retains the original monetary body/status and replay flag false
- [passed] shared lossless HTTP responses refuses lossy JSON values without coercion: 1n
- [passed] shared lossless HTTP responses refuses lossy JSON values without coercion: NaN
- [passed] shared lossless HTTP responses refuses lossy JSON values without coercion: Infinity
- [passed] shared lossless HTTP responses refuses lossy JSON values without coercion: -Infinity
- [passed] shared lossless HTTP responses refuses lossy JSON values without coercion: -0
- [passed] shared lossless HTTP responses refuses lossy JSON values without coercion: 9007199254740992
- [passed] shared lossless HTTP responses refuses lossy JSON values without coercion: undefined
- [passed] shared lossless HTTP responses refuses lossy JSON values without coercion: ()=>0
- [passed] shared lossless HTTP responses refuses lossy JSON values without coercion: Symbol(private)
- [passed] shared lossless HTTP responses refuses cyclic responses
- [passed] shared lossless HTTP responses does not invoke custom serialization/getters or drop non-JSON objects and properties
- [passed] shared lossless HTTP responses allows shared plain schema objects without confusing aliases with cycles
- [passed] shared lossless HTTP responses accepts genuine cross-realm plain objects/arrays such as native SQLite results
- [passed] shared lossless HTTP responses still rejects custom prototypes and array subclasses across realms

### `src/server/portfolio-observation.test.ts`

- [passed] defers snapshot work until after success, and never adds work to original-result replay
- [passed] cannot turn confirmed success into an error if scheduling fails

### `src/server/wallet-overview.test.ts`

- [passed] database-backed wallet overview uses stored IDs and true zero journal balances, never preview identities or history
- [passed] database-backed wallet overview shows an exact USD-only total without demanding unnecessary FX rates
- [passed] database-backed wallet overview does not omit nonzero foreign balances from an apparent USD total
- [passed] database-backed wallet overview leaves destination valuation policy unresolved without reusing the main total
- [passed] database-backed wallet overview keeps account ID __proto__ as an own data key in a serializable plain object
- [passed] database-backed wallet overview keeps account ID constructor as an own data key in a serializable plain object
- [passed] database-backed wallet overview keeps account ID toString as an own data key in a serializable plain object
- [passed] database-backed wallet overview retains newly converted fiat currencies without a false flag or lost balance
- [passed] database-backed wallet overview refreshes newly created wallets and retained conversion history from one snapshot, without a provider call

### `src/test/json-contract.test.ts`

- [passed] test-only contract assertion limits enforces maximum length, item bounds and prohibited values
- [passed] test-only contract assertion limits requires exactly one discriminator branch and own properties
- [passed] test-only contract assertion limits does not silently accept unsupported assertions or unknown component references

## Playwright cases

### `e2e/accounts-api.spec.ts`

- the overview uses persistent account IDs and journal-derived API balances across reloads (chromium)
- read APIs document exact amounts, return safe errors and expose no mutation handler (chromium)

### `e2e/balance-card.spec.ts`

- currency flags and the gradient retain contrast, hierarchy and honest history across themes and sizes (chromium)
- recorded-history fixtures render an accessible chart, never become preview data, and hide all records (chromium)
- forced colors preserves balance labels, focus and currency markers without a gradient (chromium)

### `e2e/branding-motion.spec.ts`

- dismissing actively progressing dialog, scrim and menu arrivals preserves the rendered frame (chromium)
- applies the approved CocoWallet vectors, title and favicon at narrow widths and explicit themes (chromium)
- real dialog, review, edit, menu and select motion completes without retaining animation work (chromium)
- interrupted arrivals and mobile menu-to-dialog handoffs preserve focus and drafts (chromium)
- reduced motion removes spatial choreography while forms, menus and focus remain usable (chromium)

### `e2e/foundation.spec.ts`

- the app exposes a healthy, uncached foundation endpoint (chromium)
- a real browser can reach the wallet interface (chromium)

### `e2e/project-guide.spec.ts`

- the guide opens offline and renders the file tree from bundled Markdown (chromium)
- file search opens matching folders and identifies individual files (chromium)
- test catalogue searches individual Jest and Playwright cases (chromium)
- the illustrated guide loads all application screenshots and chapter links (chromium)
- navigation and search remain usable on a narrow screen (chromium)
- HTTP rendering prefers the current Markdown over the offline snapshot (chromium)

### `e2e/wallet-interactions.spec.ts`

- the overview has two columns and no permanent form or conflicting conversion teaser (chromium)
- Deposit opens a named shadcn dialog and returns focus to its trigger (chromium)
- Withdraw opens a named shadcn dialog and returns focus to its trigger (chromium)
- Convert opens a named shadcn dialog and returns focus to its trigger (chromium)
- Send money opens a named shadcn dialog and returns focus to its trigger (chromium)
- the desktop Send money rail has a real tooltip, focus trap, and Escape recovery (chromium)
- reviews a deposit without submitting money or losing draft input (chromium)
- missing, zero and precision errors are specific, focused and preserve text (chromium)
- conversion prevents identical currencies and clears dependent errors on source changes (chromium)
- zero balances cannot be withdrawn or converted and service guidance precedes entry (chromium)
- self-transfer is rejected without creating a destination or claiming success (chromium)
- privacy hides amounts in the overview and reopened drafts without credential fields (chromium)
- history filters use shadcn Select and have a useful reset (chromium)
- clipboard failure offers a selectable ID inside the shadcn account menu (chromium)
- mobile labelled Actions opens Send money and restores focus to its stable menu trigger (chromium)
- popup currency selection is keyboard-operable and stays above the dialog (chromium)
- menus and dialogs fit narrow viewports in both themes (chromium)

### `e2e/wallet-shell.spec.ts`

- uses system theme, saves an explicit preference, and restores system behavior (chromium)
- keeps theme controls usable when browser storage is blocked (chromium)
- starts with a keyboard-accessible skip link and no browser errors (chromium)
- unknown routes offer a working way back to the overview (chromium)
- the wallet shell fits a 320px viewport (chromium)
- the wallet shell fits a 390px viewport (chromium)
- the wallet shell fits a 820px viewport (chromium)
- the wallet shell fits a 1280px viewport (chromium)
- the wallet shell fits a 1440px viewport (chromium)
- the wallet shell fits a 1688px viewport (chromium)
- the wallet shell fits a 1769px viewport (chromium)
- reduced motion disables skeleton and control animation (chromium)

### `e2e/wallet-visual.spec.ts`

- captures the rendered overview at its shipping sizes and themes (chromium)
- captures the actual loading and error components without artificial application delays (chromium)

### `e2e/zz-funding.spec.ts`

- explicit deposit/withdrawal confirmations update balances and show persistent completed receipts (chromium)
- lost committed response survives reload; explicit recovery reuses original key without a second credit (chromium)
- blocked recovery storage prevents any submission and keeps the draft (chromium)
- a stale withdrawal review receives a definitive server rejection without a completed transaction (chromium)
- funding receipts fit 320px in light with keyboard confirmation and focus recovery (chromium)
- funding receipts fit 1440px in light with keyboard confirmation and focus recovery (chromium)
- funding receipts fit 320px in dark with keyboard confirmation and focus recovery (chromium)
- funding receipts fit 1440px in dark with keyboard confirmation and focus recovery (chromium)

### `e2e/zzz-quotes.spec.ts`

- browser-created server quotes bind exact terms without moving or reserving funds (chromium)
- transfer previews do not create recipients and cannot accept client rate or expiry overrides (chromium)

### `e2e/zzzz-conversions.spec.ts`

- review moves no funds; explicit confirmation records exact balances and persistent conversion history once (chromium)
- the backend still creates eligible extra currencies while Convert exposes only USD, GBP and EUR (chromium)
- expiry never auto-submits: fresh terms need an explicit request and a separate confirmation (chromium)
- unavailable quote cannot move money and editing preserves the exact draft (chromium)
- lost committed conversion survives reload, blocks new funding and recovers the identical original key/quote (chromium)
- blocked recovery storage sends no conversion and keeps the draft (chromium)
- conversion review/receipt fit 320px in light, support keyboard focus and privacy (chromium)
- conversion review/receipt fit 320px in dark, support keyboard focus and privacy (chromium)
- conversion review/receipt fit 1440px in light, support keyboard focus and privacy (chromium)
- conversion review/receipt fit 1440px in dark, support keyboard focus and privacy (chromium)

### `e2e/zzzzz-history.spec.ts`

- account-scoped history preserves exact confirmed facts and either-side UTC-day filtering (chromium)
- numbered history pages, errors and documented GET-only contracts never mutate the wallet (chromium)

### `e2e/zzzzzz-transfers.spec.ts`

- reviewed USD→GBP creates a destination once, refreshes balances and exposes only its incoming history (chromium)
- same-currency review sends identical minor units without quotes or rates and preserves exact IDs (chromium)
- existing destination defaults stay immutable while an explicit target override creates a missing wallet (chromium)
- lost committed transfer survives reload and blocks funding/conversion replacements while replaying original key and quote (chromium)
- blocked recovery storage prevents any transfer and retains the input draft (chromium)
- expired FX terms require an explicit fresh quote and a separate confirmation (chromium)
- self-ID validation and unavailable quotes preserve drafts without creating destinations (chromium)
- stale funded review is definitively rejected without creating a destination (chromium)
- privacy blocks hidden transfer review and removes monetary receipt details without losing the draft (chromium)
- transfer form/review/receipt and incoming inspection fit 320px light with keyboard focus and privacy (chromium)
- transfer form/review/receipt and incoming inspection fit 320px dark with keyboard focus and privacy (chromium)
- transfer form/review/receipt and incoming inspection fit 1440px light with keyboard focus and privacy (chromium)
- transfer form/review/receipt and incoming inspection fit 1440px dark with keyboard focus and privacy (chromium)

### `e2e/zzzzzzz-history-ui.spec.ts`

- the supplied History reference has visible lookup, signed completion rows and one responsive paging group (chromium)
- numbered pages and exact detail/back navigation preserve the applied filters and focused row (chromium)
- type/either-side currency and inclusive UTC days apply explicitly; validation and clearing preserve honest results (chromium)
- every completed operation has recorded details; rejected attempts never become records (chromium)
- account switches discard open details/filters and show only inspect-only incoming history with the original FX direction (chromium)
- missing records, read failures and malformed responses offer safe read-only recovery (chromium)
- privacy removes all history records, counts and timestamps; reload clears ordinary browsing (chromium)
- history browsing cannot submit money or replace unresolved monetary recovery (chromium)
- history filters/list/details fit 320px light and preserve keyboard focus (chromium)
- history filters/list/details fit 320px dark and preserve keyboard focus (chromium)
- history filters/list/details fit 1440px light and preserve keyboard focus (chromium)
- history filters/list/details fit 1440px dark and preserve keyboard focus (chromium)

### `e2e/zzzzzzzz-presentation.spec.ts`

- Frankfurter-backed totals sum every wallet exactly and record observations without replay/reload duplicates (chromium)
- History is a real menu page; account/privacy persist and reopening resets ordinary money amounts (chromium)
- success is a focused green-check summary without technical keys; incoming totals remain read-only (chromium)
- unavailable or mismatched valuation never becomes a partial total and leaves individual balances visible (chromium)
- compact balance and signed recent rows fit 320px light (chromium)
- compact balance and signed recent rows fit 320px dark (chromium)
- compact balance and signed recent rows fit 820px light (chromium)
- compact balance and signed recent rows fit 820px dark (chromium)
- compact balance and signed recent rows fit 1440px light (chromium)
- compact balance and signed recent rows fit 1440px dark (chromium)

### `e2e/zzzzzzzzz-workflow.spec.ts`

- Done-only transfer success resets safely on every dismissal and the next action is the intended form (chromium)
- numeric amounts group exactly, reject invalid edits and submit only ungrouped decimals (chromium)
- saved/new addresses constrain both choices without overwriting a legacy default or creating during review (chromium)
- API confirmation has disabled animated loading and unknown outcomes survive dismissal (chromium)
- review, amount entry and centered empty activity fit 320px light (chromium)
- review, amount entry and centered empty activity fit 320px dark (chromium)
- review, amount entry and centered empty activity fit 820px light (chromium)
- review, amount entry and centered empty activity fit 820px dark (chromium)
- review, amount entry and centered empty activity fit 1440px light (chromium)
- review, amount entry and centered empty activity fit 1440px dark (chromium)

### `e2e/zzzzzzzzzz-continuity.spec.ts`

- all four operations reset ordinary/review/completed amounts on reopen, while Edit keeps exact masked input (chromium)
- pending dismissal and blocked confirmed cleanup retain original recovery rather than a zero draft (chromium)
- step continuity is bounded, interruptible and reduced-motion safe at 320px light (chromium)
- step continuity is bounded, interruptible and reduced-motion safe at 320px dark (chromium)
- step continuity is bounded, interruptible and reduced-motion safe at 820px light (chromium)
- step continuity is bounded, interruptible and reduced-motion safe at 820px dark (chromium)
- step continuity is bounded, interruptible and reduced-motion safe at 1440px light (chromium)
- step continuity is bounded, interruptible and reduced-motion safe at 1440px dark (chromium)

### `e2e/zzzzzzzzzzzz-details.spec.ts`

- all four server confirmations and original-key replay really await one second (chromium)
- search stays in the list; detail hero and real ID-copy fallback retain immutable facts (chromium)
- library range calendar keeps UTC selection, same-day, clear and keyboard focus in America/Los_Angeles (chromium)
- library range calendar keeps UTC selection, same-day, clear and keyboard focus in Pacific/Auckland (chromium)

### `e2e/zzzzzzzzzzzzz-navigation-polish.spec.ts`

- History removes auxiliary controls and centers the exact bold empty guidance; modal titles have decorative purpose icons (chromium)
- content navigation is bidirectional, bounded and interruption-safe without moving the shell or retaining old content (chromium)

## Refresh this catalogue

Playwright discovery found 130 cases. On a Node 26 environment with the project dependencies installed, run the following from the project root. Jest executes the tests; Playwright only discovers cases. Use temporary paths, and never target the ordinary wallet with monetary browser tests.

```sh
mkdir -p /tmp/opencode
DATABASE_PATH=/tmp/opencode/guide-jest-unused.sqlite npm test -- --json --outputFile=/tmp/opencode/guide-jest.json
npx playwright test --list --reporter=json > /tmp/opencode/guide-playwright.json
node scripts/update-project-guide.mjs --jest /tmp/opencode/guide-jest.json --playwright /tmp/opencode/guide-playwright.json
```
