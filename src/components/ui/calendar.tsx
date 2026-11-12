"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "./button";

// Adapted from the MIT shadcn Calendar registry; see LICENSE.shadcn.
// DayPicker owns range selection, grid semantics, keyboard navigation and dates.
export function Calendar({
  className,
  classNames,
  components,
  showOutsideDays = false,
  ...props
}: ComponentProps<typeof DayPicker>) {
  const defaults = getDefaultClassNames();
  const themed = Object.fromEntries(
    Object.entries(defaults).map(([key, value]) => [
      key,
      cn(value, `ui-calendar-${key.replaceAll("_", "-")}`),
    ]),
  );
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("ui-calendar", className)}
      classNames={{
        ...themed,
        button_previous: cn(
          themed.button_previous,
          buttonVariants({ variant: "ghost", size: "icon" }),
        ),
        button_next: cn(
          themed.button_next,
          buttonVariants({ variant: "ghost", size: "icon" }),
        ),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className, ...rest }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeft
              : orientation === "right"
                ? ChevronRight
                : ChevronDown;
          return <Icon className={cn("size-4", className)} {...rest} />;
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  );
}
function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: ComponentProps<typeof DayButton>) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      {...props}
      className={cn("ui-calendar-day-button", className)}
      data-day={day.date.toISOString().slice(0, 10)}
      data-selected={modifiers.selected || undefined}
      data-range-start={modifiers.range_start || undefined}
      data-range-end={modifiers.range_end || undefined}
      data-range-middle={modifiers.range_middle || undefined}
    />
  );
}
