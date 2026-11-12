# Money modal continuity

**Status:** Complete — T11-10. **Decision:** D-038.

The user requests three follow-ups to D-037: reset masked amounts to zero whenever
a money modal reopens; smooth input → review → done transitions (motion choice
delegated); limit Convert's source/receiving UI choices to USD/GBP/EUR.
The user approved refreshing only affected DESIGN.md guidance/examples.

- A fresh explicit opening resets the current ordinary amount to `0`, clears its
  stale review/errors and invalidates its old quote. Keep provider, recipient and
  permitted currency choices. Edit details within an open modal retains the amount.
- Pending/unknown outcomes, definitive error context and blocked recovery storage
  retain their original request/key/quote. Never reset recovery into an editable
  zero draft or infer that dismissing a pending request cancels money movement.
- Both Convert choices use USD/GBP/EUR; source choices require an existing wallet,
  same-currency targets remain disabled. Other balances and backend currency/
  conversion capabilities remain unchanged; the server still validates quotes.

## Motion thesis

**Focal moment:** the verified result settles into the same protected task surface.
**Continuity:** short directional input/review/edit motion and measured dialog
resizing carry the visitor between steps, rather than jumping between heights.
**Feedback:** pending/recovery remain immediate and truthful; success appears only
after a definitive receipt. No amount tween, delayed request, fake progress or old
monetary DOM snapshot is retained. **Budget:** one bounded dialog resize, existing
180/240ms timing/easing, CSS content entry, no dependency/per-frame JS loop or
animated blur. Interruption/closing/privacy cancel resizing; reduced motion is
immediate and keeps focus, busy feedback and recovery intact.

## Operational baseline

Development stopped before changes. SQLite backup verified row-for-row across all
15 tables: `/app/data/wallet.sqlite.pre-modal-motion-1794474651486.bak`.
Integrity `ok`, no FK violations. The user added activity since D-037: **3 accounts /
5 wallets / 5 funding attempts / 1 conversion attempt / 2 transfer attempts /
8 transactions / 11 journal entries / 9 observations**, plus **5 quotes / 3 quote
uses / 1 catalog cache / 7 rate caches**. Preserve all of it; do not restore the
older three-transaction baseline. Monetary checks use disposable wallets only.
No migration, dependency change or push is authorized or needed.

## Verification

Full Docker `npm run check` passes **1,530 tests in 71 suites**, formatting, lint,
TypeScript, production build and **60 artifact documents / 39 tasks**. The new
motion-unit test models active interpolated height, then checks interruption,
privacy/close/resize cancellation and live reduced-motion preference changes.
The corrected fresh disposable Chromium run passes **117/117**. Existing backend
JPY coverage remains through quote/confirmation
APIs, with explicit UI assertions that the extra balance is visible but absent
from both Convert selectors; no backend monetary capability was removed.

The first rendered run caught optimized CSS serializing `240ms` as `.24s`:
passing its numeric prefix directly to WAAPI made resizing nearly instant. The
hook now converts either unit to milliseconds, with a `.24s` unit regression.
The first complete browser run passed 111/117 (all financial/reset/recovery and
existing journeys); six new timing checks exposed this same duration mismatch.
The corrected batched capture run passes all six **320/820/1440 light/dark**
combinations with actual **240ms WAAPI** resizing, reduced-motion cancellation and
zero page errors. The parent opened all eight contact sheets covering **48 current
originals**: input/review/done/reset, both Convert selectors and explicitly paused
midpoint supplements. Settled originals remain the layout evidence. The one
changed-target detector reports **1 inherited square-input bottom-border warning /
29 font-radius advisories**; no blanket suppressions or repeated scan.
The fresh independent read-only finish review returned **`ship`** at the bounded
D-038 scope, all five contract sections and **no material fixes**. It verified all
48 originals and inspected eight matrices plus six originals spanning every
viewport/theme combination. Parent-run checks are not reviewer-run browser tests;
this is not exhaustive backend/security/performance or WCAG certification. The
approved affected design refresh is complete; normal development is restored.
Each explicit opening also remounts ordinary entry-local caret/hint state, even
when reopening an exiting dialog; protected recovery is not remounted/reset by it.

## Normal-development restoration

Both disposable previews are stopped. All **15 tables were row-identical** to the
current backup before restoration. The prior development cache is retained at
`.next/dev.pre-modal-motion-1794477888265`; the normal Compose app is healthy.
The read-only Chromium probe passes **300 stable frames**, the actual eight-record
full History and five recent rows, three accounts, exact available portfolio total,
grouped entry, zero-on-reopen across soft navigation and privacy. It records one
initial document navigation, no extra reload, zero page/console errors and **zero
monetary or quote POSTs**. The parent opened the restoration capture.

Afterwards all **13 non-cache tables remain bigint-safely row-identical**, including
every account/wallet, attempt, transaction/journal entry, quote/use and observation.
Only catalog/rate caches refreshed; counts remain the current baseline above.
Integrity is `ok`, with zero FK violations. No normal-wallet seed, money test,
migration, dependency change, restore drill or push ran. The read-only probe and
before/after comparison reports live under `.impeccable/review/continuity/`.

## Design handoff

The approved documenter refreshed only `DESIGN.md` and `.impeccable/design.json`:
current reset/Edit/recovery rules, three-currency Convert selectors, bounded task
motion and inert zero/grouped-entry/selector examples. The parent verified valid
v2 JSON, byte-identical normative frontmatter, unchanged color metadata/ramps,
shadows, motion names/values, breakpoints and all 12 preview entries retained.
Affected descriptions changed, not core identity/tokens. This documentation check
is not another independent visual review. Final task/artifact checks and a local
commit close this follow-up; no push.
