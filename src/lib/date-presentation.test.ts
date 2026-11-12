import { readableDate, readableTime } from "./date-presentation";

it("presents calendar dates without a timezone shift", () => {
  expect(readableDate("2026-11-12")).toBe("Nov 12, 2026");
});
it("formats UTC timestamps consistently with readable times and explicit zone", () => {
  expect(readableTime("2026-11-12T07:01:19.123Z")).toBe(
    "Nov 12, 2026, 7:01:19 AM UTC",
  );
  expect(readableTime("2026-11-12T07:01:19.123Z", true)).toBe(
    "Nov 12, 2026, 7:01 AM UTC",
  );
});
it("has an honest missing-date fallback rather than Invalid Date", () => {
  expect(readableDate("invalid")).toBe("Date unavailable");
  expect(readableTime("invalid")).toBe("Date unavailable");
});
