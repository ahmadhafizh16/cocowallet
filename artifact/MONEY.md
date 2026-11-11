# Exact money contract

Implements [PRD-02 requirements 2–3](prd/PRD-02-journal.md#requirements),
[T02-01](tasks/TASKS-02.md#t02-01), and [D-023](DECISIONS.md#d-023).

## Units and bounds

- Runtime amounts and journal deltas are `bigint` minor units. SQLite reads use
  native safe-integer mode and the ORM mappings refuse numeric money values.
- `M = 9223372036854775807` (SQLite's positive signed-64-bit maximum).
  Operation amounts are `1..M`, balances `0..M`, and journal deltas `-M..M`.
  The asymmetric SQLite minimum is intentionally excluded.
- Precision is an explicit integer exponent `0..4`. The pinned accounting map
  and fail-closed rules are described in [CURRENCY_METADATA.md](CURRENCY_METADATA.md).
  Knowing precision does not grant wallet eligibility.
- Intermediate rational calculations and journal subtotals are arbitrary-precision
  bigint. Check final bounds, not temporary int64 subtotals; never use SQL
  `SUM()` or floating-point `TOTAL()` for balances.

## User input and serialization

`parseAmount(text, exponent)` accepts a positive plain decimal, at most 24
characters, with no signs, leading zeros (except `0.x`), whitespace, separators,
or exponent notation. Reject fractional digits beyond the currency exponent,
including trailing zeros. **User input never rounds**: `1.005` is invalid USD input.

`formatAmount(minor, exponent)` returns fixed-precision decimal text, including
zero balances and negative journal deltas. API amounts and rates must be strings;
do not convert bigint to `Number` or serialize it directly to JSON. Examples:

| Exponent | Input | Minor units | Formatted |
| --- | --- | --- | --- |
| 0 | `123` | `123` | `123` |
| 2 | `1.2` | `120` | `1.20` |
| 3 | `1.234` | `1234` | `1.234` |
| 4 | `1.2345` | `12345` | `1.2345` |

The zero/three/four-place examples test accounting arithmetic; they are not a
promise that every corresponding fund/special-unit code is a wallet currency.

## FX arithmetic

For positive source minor amount `a`, source exponent `s`, target exponent `t`,
and decimal rate `C / 10^k`:

```text
N = a * C * 10^t
D = 10^(s+k)
q = N / D
r = N % D
targetMinor = q + (2*r >= D ? 1 : 0)
```

Only the computed target rounds, once, positive half up. Converting `100` USD
minor units at `1.005` into a two-place target credits `101` target minor units.
Reject rounded-zero credits and final amount/balance overflow atomically.

Rates must be positive plain decimal strings, at most 36 integer digits and 36
fractional digits (73 characters including a dot). Reject unsupported precision
or notation rather than truncate it. No decimal library or floating-point money
calculation is needed. The future adapter must preserve original provider numeric
lexemes, or use a documented text/CSV representation; converting a parsed JSON
number back to a string cannot recover lost precision. If reciprocal rates become
necessary, invert an exact rational, never a floating-point number.

## Verification

Docker Jest tests live beside `money.ts` and `currency-precision.ts`: 437 tests
cover all pinned code/precision lookups, unsupported metadata, input bounds,
0/2/3/4-place arithmetic, half-up ties, large intermediates, monotonicity, exact
format/parse round trips, and values around both JavaScript and SQLite limits.
Journal snapshot/aggregation and write tests belong to T02-02/T02-03 separately.
