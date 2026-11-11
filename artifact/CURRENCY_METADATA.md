# Currency accounting precision

## Pinned source and license

`src/features/money/currency-precision.json` is a minimal, alphabetically sorted
`alphabeticCode -> minorUnits` extraction of all 178 active entries in
`package/src/data.ts` from **`@financica/iso4217@0.2.0`**. It is vendored static
data, not a runtime dependency. No package code, install scripts, or generators
were executed during extraction.

- Package: <https://www.npmjs.com/package/@financica/iso4217/v/0.2.0>
- Exact archive: <https://registry.npmjs.org/@financica/iso4217/-/iso4217-0.2.0.tgz>
- Archive SHA-256: `ef7548b1d648c889482800ad96ebeef683c4fef45e488506b73d3aec4161daec`
- Package repository: <https://github.com/financica/ts-libs/tree/main/packages/iso4217>
- Embedded `PUBLISHED_AT` and README revision: **2026-01-01**.
- Acquisition and verification date: **2026-11-11**.
- License: the package declares MIT; its actual `package/LICENSE`, copyright
  **2026 Financica**, is preserved verbatim in
  `src/features/money/LICENSE.currency-precision.txt`. The inspected package has
  no separate exclusion for its generated data.

The package states that its data is generated from SIX Group's ISO 4217
`list-one.xml`. The read-only research for this extraction compared all 178
alphabetic/numeric/minor-unit tuples with the official list, publication date
**2026-09-17**, on **2026-11-11**, and found zero mismatches. Official reference:
<https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml>.
This cross-check does **not** change the package's embedded publication date to
September. No raw SIX XML is redistributed here.

The MIT package is a clearer explicitly licensed artifact than copying raw SIX
XML, but its license is **not proof of upstream SIX permission** or a legal
conclusion about upstream database or redistribution rights. Preserve the notice
and provenance; downstream distributors must assess any applicable upstream
terms independently. Neither the data nor its verification is a warranty of
future currency status.

## Extraction and integrity

1. Download only the pinned `.tgz`, then verify its archive SHA-256 before use.
2. Inspect `package/package.json`, `package/LICENSE`, `package/README.md`, and
   `package/src/data.ts` as text; do not import or run the package.
3. Parse each adjacent `alphabeticCode`, `numericCode`, and `minorUnits` field
   from the generated active-currency records. Assert 178 unique uppercase
   three-letter codes and one match per source `alphabeticCode` field.
4. Keep only alphabetic codes and `minorUnits`, preserving numeric values and
   explicit `null`; sort by code. Do not extract names, numeric codes, countries,
   `kind`, or `isFund`. Classification is not trusted: for example, the source
   record classifies UYW as `fiat`, whereas its README lists it as a fund unit.
5. Preserve the actual license text alongside the JSON. Run the dedicated tests
   and review any changes to codes, exception lists, and the canonical checksum.

Canonical content is the UTF-8 encoding of compact `JSON.stringify` of the
code-sorted object, without a trailing newline. Its SHA-256 is
`314b8d0367c9ad7ee2796d8c598d287effaaa18cb6d8ee6daf59d56164908ddd`.
The tests lock this checksum, the 178-entry count, every exceptional precision,
and lookup behavior for all entries. JSON whitespace is not part of the checksum.

| Minor-unit exponent | Entry count |
| --- | ---: |
| 0 | 17 |
| 2 | 139 |
| 3 | 7 |
| 4 | 2 |
| `null` (ISO N.A.) | 13 |

This is **ISO accounting precision**, not CLDR/`Intl.NumberFormat` display
digits, cash rounding, payment-processor rules, or exchange-rate precision.
In particular AFN, COP, IRR, MGA, and MRU have accounting exponent 2; CLF and UYW
have exponent 4. XCG, ZWG, XAD, SLE, and VED are included with exponent 2.
ANG and BGN are absent from this active snapshot. CNH, CMD, GGP, IMP, and JEP
are not substituted or assigned invented ISO precision.

## Fail-closed support boundary

`getCurrencyExponent(code: string): number` accepts only exact, own uppercase
keys with numeric precision. Unknown codes, case/whitespace variations,
inherited object keys, non-string runtime input, and all 13 `null` entries throw
`CurrencyPrecisionError` with `code = "unsupported_currency"` and the original
`currencyCode`. It never defaults to 2, normalizes input, or aliases a code.
`null` is not zero: XAG, XAU, XBA, XBB, XBC, XBD, XDR, XPD, XPT, XSU, XTS, XUA,
and XXX are blocked.

Knowing a precision does **not** make a code a supported wallet currency.
Product support must be the intersection of the future Frankfurter-derived
fiat eligibility list and this known-numeric-precision set. A rate-provider code
with unknown precision must be blocked rather than guessed or aliased. Fund,
metal, special-unit, and fiat eligibility must not be inferred from this map.

## Updates must preserve stored money

Future metadata refreshes require a new pinned version/archive checksum,
reviewed provenance and license, comparison with the official list, and explicit
updates to the canonical checksum/count/exception tests. Do not silently fetch
new precision at runtime.

Existing wallet precision is frozen by database triggers once used; metadata
updates must not reinterpret previously stored journal entries or balances.
Keep persisted wallet/currency accounting precision authoritative for existing
amounts. Any necessary currency transition requires an explicit, reviewed
migration or new wallet/currency representation rather than re-scaling history.
