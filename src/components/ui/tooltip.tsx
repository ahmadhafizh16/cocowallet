"use client";

import type { ComponentProps } from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { useMotionOpen } from "@/lib/use-motion-open";

export function TooltipProvider({
  delayDuration = 200,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />;
}
export function Tooltip({
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Root>) {
  const motion = useMotionOpen(
    { open, defaultOpen, onOpenChange },
    '[data-slot="tooltip-content"]',
  );
  return <TooltipPrimitive.Root {...props} {...motion} />;
}
export function TooltipTrigger(
  props: ComponentProps<typeof TooltipPrimitive.Trigger>,
) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}
export function TooltipContent({
  className,
  sideOffset = 8,
  children,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        collisionPadding={12}
        className={cn(
          "z-80 w-fit max-w-64 rounded-md bg-foreground px-3 py-2 text-sm text-background shadow-md",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-foreground" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
