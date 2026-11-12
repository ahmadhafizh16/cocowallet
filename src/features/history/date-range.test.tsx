import { renderToStaticMarkup } from "react-dom/server";
import { Calendar } from "@/components/ui/calendar";
import { utcCalendarDate, utcCalendarDay } from "./date-range";

it.each(["America/Los_Angeles", "Pacific/Auckland", "UTC"])(
  "keeps inclusive calendar days stable in %s",
  (zone) => {
    const prior = process.env.TZ;
    try {
      process.env.TZ = zone;
      for (const day of [
        "2026-11-12",
        "2024-02-29",
        "0000-01-01",
        "9999-12-31",
      ])
        expect(utcCalendarDay(utcCalendarDate(day))).toBe(day);
      expect(utcCalendarDate("2026-02-30")).toBeUndefined();
      expect(utcCalendarDay(undefined)).toBe("");
    } finally {
      if (prior === undefined) delete process.env.TZ;
      else process.env.TZ = prior;
    }
  },
);
it("uses the library's semantic range calendar with explicit UTC endpoint modifiers", () => {
  const from = utcCalendarDate("2026-11-12")!,
    to = utcCalendarDate("2026-11-14")!;
  const html = renderToStaticMarkup(
    <Calendar
      mode="range"
      timeZone="UTC"
      defaultMonth={from}
      selected={{ from, to }}
    />,
  );
  expect(html).toContain('role="grid"');
  expect(html).toContain('data-day="2026-11-12"');
  expect(html).toContain('data-range-start="true"');
  expect(html).toContain('data-range-end="true"');
});
