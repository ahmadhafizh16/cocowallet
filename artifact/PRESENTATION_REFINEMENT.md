# Interview presentation and recorded USD totals

**Status:** Implemented, reviewed and verified (T11-08 / T03-03 complete).
**Decisions:** [D-035](DECISIONS.md#d-035), [D-036](DECISIONS.md#d-036).

## User-pinned interface

The user supplied recent-transaction and compact balance-card screenshots:

- Recent activity is a compact row list: transaction/income/outgoing icons,
  name/time, exact signed amount, completed status. Credits are green; debits red.
  Conversion shows both legs, not a fabricated single net amount. Do not invent
  merchant logos, merchants, per-transaction price charts or transactions.
- Remove the demo badge and large connection/simulation banner. Preserve the
  prototype truth with one discreet footer: **Prototype · Local ledger only.
  No real funds move.** No banking, blockchain or real-provider connection claim.
- Successful submissions show a large green check, **Deposit complete / Transfer
  complete / Withdrawal complete / Conversion complete**, a concise exact summary,
  and Done. No retry key, quote ID, balance/debug table or timestamp on success.
  Recovery/error states retain original-key protections; internal receipts and
  indefinite identical-result replay are unchanged.
- Full history moves to the left/bottom **History** navigation at `/history`.
  No Browse full history button in Recent transactions. A persistent route-group
  shell keeps account selection, privacy and money drafts/recovery mounted across
  navigation. Recent rows can open the record's scoped details on History.
- The balance card places a small recorded USD-total sparkline alongside the
  amount, above the four actions. No separate large disconnected chart or lines
  behind placeholder text. Single/empty/unavailable/private states stay truthful;
  opening the sparkline provides exact recorded values.
- Currency wallets retain flags/codes/amounts with tighter vertical spacing.
  Branding, palette, themes, motion, focus and responsive touch controls remain.

## USD valuation and recording

The user explicitly requested account-scoped USD-total observations after money
operations and approved independent read-only destination totals. Existing exact
journal wallet balances remain the source; only nonzero foreign balances need
direct foreign→USD Frankfurter reference rates. Each wallet rounds half-up to USD
cents before exact bigint summation, including valid sub-cent contributions that
round to zero (without relaxing positive monetary-credit requirements).
A missing/expired/invalid rate or overflow
makes the **entire total unavailable**, while individual balances remain visible.

The existing server-only Frankfurter integration already supplies quotes. This
slice connects portfolio valuation to it; it is not a new payment integration.
Official [documentation](https://frankfurter.dev/llms.txt) was checked on November
12, 2026. Jina rejected anonymous access; its documented fallback chain ended in
direct reading of the official guide. Keep the fixed `/v2/` origin, exact CSV rate
lexemes, fresh-first requests and original-time eligible <24h fallback. Never
synthesize reciprocal/cross rates. Only currency codes are sent upstream.

Migration 0008 adds immutable `portfolio_snapshots`: account, committed balance
revision, observation/calculation UTC times, exact total USD minor units and the
exact balances/rate provenance used. This is presentation metadata, not journal
money, a retained monetary result or a historical market-price reconstruction.
One successful observation per account/revision prevents reload/replay duplicates.
Only actual recorded observations are plotted; existing past transactions are
not backfilled using today's FX. The current total may refresh with rates without
rewriting the original recorded total. The graph describes recorded observations,
not continuous tracking; its expanded view has a zero baseline, compact view uses
the recorded min/max range. Same-millisecond points share one rendered coordinate.
Dense expanded plots retain every segment and exact table record, showing only
endpoint markers above 24 observations so markers do not erase the line.

Successful HTTP submissions capture a coherent committed balance snapshot before
yielding; Next.js post-response work values it independently. An FX/storage/
scheduling failure cannot roll back, delay or relabel confirmed money. Original
replay schedules no new observation. A scoped uncached `GET /api/portfolio`
calculates the current total, can record its current observation, and returns up
to 240 real points. GET may update technical rates/snapshots, never money or
wallet/account metadata. Post-response work is best effort under process failure;
a later GET can recover only the current observation, not invent missed past FX.

Client guards bind totals to the selected account and exact current wallet
fingerprint, recheck arithmetic/provenance/series, cancel stale reads and remove
amounts/history under privacy. Server checks a balance revision race after FX work
instead of showing a stale current total.

## Verification and operational evidence

Full corrected Docker check/build passes **1,507 Jest tests in 67 suites**,
formatting/lint/TypeScript and **58 artifact documents / 37 tasks**. All **99/99
production Chromium checks** pass on a newly recreated guarded disposable server,
including ten presentation/valuation journeys. The browser correction batch checks
portal plot height, dense markers, the complete exact table, mobile completion
visibility/accessible names and dedicated History results as well as details.
The same independent reviewer scored all four material fixes resolved,
**`disposition: ship` at fix-list scope**. T03-03/T11-08 are closed. No push.
The current user's data was backed up before changes to
`/app/data/wallet.sqlite.pre-presentation-1794463420155.bak`: 1 account, 3 wallets,
2 funding attempts, 2 completed transactions and 2 journal entries. These are
user activity, not test fixtures, and must remain unchanged. Integrity was `ok`.

Migration 0008 was subsequently applied explicitly to the stopped normal wallet.
All 13 previous non-migration tables remained bigint-safely row-identical to the
verified backup; the eight existing migration rows remained and exactly one was
added. The new snapshot table was empty immediately after migration. Integrity
remained `ok`, foreign-key violations zero. No seed or monetary submission ran.

An optional live-provider diagnostic ran only in a new disposable database,
`/tmp/opencode/portfolio-smoke-1794465000000.sqlite`: direct EUR→USD text `1.1172`,
source date `2026-11-12`, original fetch `2026-11-12T06:30:49.134Z`. An isolated
1.00 EUR balance valued to 112 USD minor units; intentional offline fallback
retained that same rate/time/value and the same single recorded observation.
These are observed diagnostics, not seeded runtime funds or a live-price promise.
Reproduce with `scripts/smoke-portfolio.ts`, `WALLET_PORTFOLIO_SMOKE=1`, a **new**
`/tmp/opencode/portfolio-smoke-<digits>.sqlite` path and Node's react-server condition.
The script refuses the ordinary wallet and any existing file.

The independent full finish review returned **`fix`**: allow portfolio-only
zero-cent rounding, make the expanded plot portal-aware/readable under dense data,
retain a visible mobile completion indication, and refresh stale design guidance.
The source corrections add a narrowly scoped valuation wrapper (only
`rounded_to_zero` becomes zero), portal sizing and endpoint-only dense markers,
and a mobile check with an accessible Completed label. The user chose **Refresh
affected sections** for DESIGN.md, preserving unrelated guidance and core tokens.
Affected tests/captures pass; the same reviewer scored **4/4 fixes resolved** and
returned **`ship`**, with all 33 supplied captures valid and no fix-batch regressions
observed. This verdict scores the four fixes, not a new whole-surface or exhaustive
accounting/security/accessibility certification. See [DESIGN_REVIEW.md](DESIGN_REVIEW.md).

The approved documentation refresh updates DESIGN.md and the valid v2 sidecar's
affected descriptions/examples. Normative frontmatter, palette ramps/card colors,
shadows, motion and breakpoints remain unchanged; all ten previews are retained.
Unrelated pre-existing illustrative review/input copy was not repaired or canonized.

Corrected overview, History details and History results capture matrices cover
**320/820/1440 in light/dark**, full-document from the top. Native-size results
first viewports, scrolled recent rows at 320, expanded charts at 320 light/dark
and 1440 dark, successes, unavailable valuation and a keyboard rate tooltip
supplement them. Every refreshed capture was opened by the parent before handoff.
The fresh inspection now actually exercises chart keyboard disclosure in all three
recorded branches; it replaces the earlier unexercised 320-dark claim. It records
zero page/console errors and monetary/quote POSTs.

Development resumed with `.next/dev.pre-presentation-1794466974003` retained.
The actual normal main account and its **two existing transactions** render; the
displayed USD total matches the exact API, privacy and in-memory draft navigation
work, and only **one new current observation** exists (no historical backfill).
A real Chromium probe passed **300 stable frames**, zero extra document
navigations/page/console errors and zero financial/quote POSTs. Its metadata is
`.impeccable/review/presentation/restored-development.json`.

After that normal-wallet inspection, all **11 prior non-cache/non-migration
tables** remained row-identical to the verified backup, including accounts,
currencies/wallets, attempts, quote/use tables, transactions and journal entries.
Counts remain **1 account / 3 wallets / 2 funding attempts / 2 transactions /
2 journal entries**. Only legitimate technical metadata differs: ninth migration,
one catalog cache, one direct rate cache and one account-scoped observation made
after the existing transactions. Integrity `ok`; foreign-key violations zero.
No normal-wallet seed, money test, restore drill, dependency change or push ran.
