"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { TZDate, type DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { historyDateContract } from "./contracts";
import { readableDate } from "@/lib/date-presentation";

export function utcCalendarDate(day: string) {
  return historyDateContract.is(day)
    ? new TZDate(`${day}T12:00:00.000Z`, "UTC")
    : undefined;
}
export function utcCalendarDay(date: Date | undefined) {
  return date?.toISOString().slice(0, 10) ?? "";
}

export function HistoryDateRange({
  id,
  from,
  to,
  onChange,
  errors,
}: {
  id: string;
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  errors: { from?: string; to?: string };
}) {
  const [wide, setWide] = useState(false),
    [open, setOpen] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setWide(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);
  const selected: DateRange | undefined =
    from || to
      ? { from: utcCalendarDate(from), to: utcCalendarDate(to) }
      : undefined;
  const label =
    from && to
      ? `${readableDate(from)} – ${readableDate(to)}`
      : from
        ? `From ${readableDate(from)}`
        : to
          ? `Through ${readableDate(to)}`
          : "All dates";
  const error = errors.from ?? errors.to;
  return (
    <Field className="wallet-history-date-range" data-invalid={!!error}>
      <FieldLabel htmlFor={id}>Date range (UTC)</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className="wallet-date-trigger"
            aria-invalid={!!error}
            aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
          >
            <CalendarDays aria-hidden="true" />
            <span>{label}</span>
            <ChevronDown aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="wallet-date-popover"
          aria-label="Choose UTC date range"
        >
          <div className="wallet-date-heading">
            <strong>Date range</strong>
            <span>Inclusive UTC days</span>
          </div>
          <Calendar
            mode="range"
            timeZone="UTC"
            numberOfMonths={wide ? 2 : 1}
            selected={selected}
            defaultMonth={selected?.from ?? selected?.to}
            onSelect={(range) =>
              onChange(utcCalendarDay(range?.from), utcCalendarDay(range?.to))
            }
            autoFocus
          />
          <details className="wallet-date-manual">
            <summary>Enter UTC days</summary>
            <div>
              {(["from", "to"] as const).map((field) => (
                <Field key={field} data-invalid={!!errors[field]}>
                  <FieldLabel htmlFor={`${id}-${field}`}>
                    {field === "from" ? "From day (UTC)" : "To day (UTC)"}
                  </FieldLabel>
                  <Input
                    id={`${id}-${field}`}
                    value={field === "from" ? from : to}
                    onChange={(e) =>
                      onChange(
                        field === "from" ? e.target.value : from,
                        field === "to" ? e.target.value : to,
                      )
                    }
                    placeholder="YYYY-MM-DD"
                    maxLength={10}
                    autoComplete="off"
                    aria-invalid={!!errors[field]}
                    aria-describedby={`${id}-hint`}
                  />
                </Field>
              ))}
            </div>
          </details>
          <div className="wallet-date-actions">
            <Button variant="ghost" onClick={() => onChange("", "")}>
              Clear dates
            </Button>
            <PopoverClose asChild>
              <Button variant="outline">Done selecting dates</Button>
            </PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
      <p id={`${id}-hint`} className="sr-only">
        Select inclusive UTC calendar days, then apply history filters. Either
        boundary can be empty.
      </p>
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  );
}
