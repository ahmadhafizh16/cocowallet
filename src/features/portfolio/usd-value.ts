import { convertMinorUnits, MoneyError } from "../money/money";

/** A valued balance may contribute zero USD cents. Monetary credits still use
 * convertMinorUnits directly and must remain strictly positive after rounding. */
export function portfolioUsdMinor(input: {
  sourceMinor: bigint;
  sourceExponent: number;
  rate: string;
}): bigint {
  try {
    return convertMinorUnits({ ...input, targetExponent: 2 });
  } catch (error) {
    if (error instanceof MoneyError && error.code === "rounded_to_zero")
      return 0n;
    throw error;
  }
}
