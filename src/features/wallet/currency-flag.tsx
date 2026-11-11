import type { WalletCurrency } from "./types";

// Locally authored vector markers. Codes/names alongside them remain authoritative;
// flags identify currencies, never the account holder's nationality.
const STAR =
  "M0-1 0.225-0.309 0.951-0.309 0.363 0.118 0.588 0.809 0 0.382-0.588 0.809-0.363 0.118-0.951-0.309-0.225-0.309Z";
// Fixed vector coordinates avoid engine-dependent trigonometric rounding at hydration.
const EURO_STARS = [
  [30, 8],
  [36, 9.608],
  [40.392, 14],
  [42, 20],
  [40.392, 26],
  [36, 30.392],
  [30, 32],
  [24, 30.392],
  [19.608, 26],
  [18, 20],
  [19.608, 14],
  [24, 9.608],
];

export function CurrencyFlag({ currency }: { currency: WalletCurrency }) {
  return (
    <svg
      className="wallet-currency-flag"
      data-currency={currency}
      viewBox="0 0 60 40"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      stroke="none"
    >
      {currency === "USD" ? (
        <>
          <path fill="#ffffff" d="M0 0h60v40H0z" />
          {Array.from({ length: 7 }, (_, row) => (
            <rect
              key={row}
              x="0"
              y={(row * 80) / 13}
              width="60"
              height={40 / 13}
              fill="#b22234"
            />
          ))}
          <path fill="#3c3b6e" d="M0 0h25v21.54H0z" />
          {Array.from({ length: 9 }, (_, row) =>
            Array.from({ length: row % 2 === 0 ? 6 : 5 }, (_, column) => (
              <path
                key={`${row}-${column}`}
                d={STAR}
                fill="#ffffff"
                transform={`translate(${2.1 + column * 4.16 + (row % 2) * 2.08} ${2.1 + row * 2.15}) scale(.9)`}
              />
            )),
          )}
        </>
      ) : currency === "EUR" ? (
        <>
          <path fill="#003399" d="M0 0h60v40H0z" />
          {EURO_STARS.map(([x, y], index) => (
            <path
              key={index}
              d={STAR}
              fill="#ffcc00"
              transform={`translate(${x} ${y}) scale(1.8)`}
            />
          ))}
        </>
      ) : (
        <>
          <path fill="#012169" d="M0 0h60v40H0z" />
          <path d="m0 0 60 40m0-40L0 40" stroke="#ffffff" strokeWidth="9" />
          <path
            fill="#c8102e"
            d="m0 0 27 18h6L6 0Zm60 0L33 18v4L60 4ZM0 40l27-18v-4L0 36Zm60 0L33 22h-6l27 18Z"
          />
          <path d="M30 0v40M0 20h60" stroke="#ffffff" strokeWidth="13" />
          <path d="M30 0v40M0 20h60" stroke="#c8102e" strokeWidth="7" />
        </>
      )}
    </svg>
  );
}
