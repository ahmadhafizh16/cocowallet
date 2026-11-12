"use client";

import { Popover as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

// Registry-derived shadcn Popover using the incumbent Radix foundation.
export const Popover = Primitive.Root;
export const PopoverTrigger = Primitive.Trigger;
export const PopoverClose = Primitive.Close;
export function PopoverContent({
  className,
  align = "center",
  sideOffset = 8,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        collisionPadding={8}
        className={cn("ui-popover-content", className)}
        {...props}
      />
    </Primitive.Portal>
  );
}
