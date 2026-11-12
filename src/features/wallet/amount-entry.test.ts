import { amountEdit, groupedAmount } from "./amount-entry";
import { parseAmount } from "../money/money";

it.each([
  ["1000", "1,000"],
  ["12000", "12,000"],
  ["1234567.8900", "1,234,567.8900"],
  ["0.", "0."],
  ["", ""],
  ["92233720368547758.07", "92,233,720,368,547,758.07"],
])("groups %s exactly without numeric coercion", (raw, display) => {
  expect(groupedAmount(raw)).toBe(display);
  expect(amountEdit(display)).toBe(raw);
});
it.each([
  "1e3",
  "-10",
  "+10",
  "$10",
  "1.2.3",
  "NaN",
  "Infinity",
  " 10",
  "10 ",
  "1234567890123456789012345",
])(
  "rejects unsafe/invalid edit %s instead of silently changing its value",
  (value) => {
    expect(amountEdit(value)).toBeNull();
  },
);
it("keeps precision validation in the monetary parser rather than truncating or rounding input", () => {
  expect(amountEdit("12,000.000")).toBe("12000.000");
  expect(() => parseAmount(amountEdit("12,000.000")!, 2)).toThrow();
  expect(parseAmount(amountEdit("12,000.00")!, 2)).toBe(1200000n);
});
it("normalizes only redundant leading zeroes and permits a decimal-first edit", () => {
  expect(amountEdit("00012.00")).toBe("12.00");
  expect(amountEdit(".5")).toBe("0.5");
});
