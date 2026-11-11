import { customType } from "drizzle-orm/sqlite-core";

/** Native SQLite INTEGER values are read as bigint, never rounded JS numbers. */
export const signedInteger = customType<{ data: bigint; driverData: bigint }>({
  dataType: () => "integer",
  toDriver(value) {
    if (typeof value !== "bigint") {
      throw new Error("SQLite minor-unit writes must use bigint.");
    }
    return value;
  },
  fromDriver(value) {
    if (typeof value !== "bigint") {
      throw new Error("SQLite integer reads must use safe-integer mode.");
    }
    return value;
  },
});

/** Currency exponents are deliberately small, checked integers. */
export const currencyExponent = customType<{
  data: number;
  driverData: bigint;
}>({
  dataType: () => "integer",
  toDriver(value) {
    if (!Number.isInteger(value) || value < 0 || value > 4) {
      throw new Error("Currency minor-unit exponent must be between 0 and 4.");
    }
    return BigInt(value);
  },
  fromDriver(value) {
    if (typeof value !== "bigint" || value < 0n || value > 4n) {
      throw new Error("Invalid stored currency minor-unit exponent.");
    }
    return Number(value);
  },
});
