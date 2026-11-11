"use client";

import { useState } from "react";

export const DIALOG_MOTION_SELECTOR =
  '[data-slot="dialog-content"], [data-slot="dialog-overlay"]';

/** Read once at a presence-state change, never on animation frames. */
export function captureMotionFrame(selector: string, opening: boolean) {
  if (
    typeof document === "undefined" ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  )
    return;
  const snapshots = Array.from(document.querySelectorAll<HTMLElement>(selector))
    .filter((element) =>
      opening
        ? element.dataset.state === "closed"
        : element.dataset.state !== "closed",
    )
    .map((element) => {
      const style = getComputedStyle(element);
      const [x = "0", y = "0"] = style.translate.split(/\s+/);
      const scale = Number.parseFloat(style.scale);
      return {
        element,
        opacity: style.opacity || "1",
        x: Number.parseFloat(x) || 0,
        y: Number.parseFloat(y) || 0,
        scale: Number.isFinite(scale) ? scale : 1,
      };
    });
  // Batch reads before writes to avoid repeated style/layout recalculation.
  for (const { element, opacity, x, y, scale } of snapshots) {
    const phase = opening ? "enter" : "exit";
    element.style.setProperty(`--motion-${phase}-opacity`, opacity);
    element.style.setProperty(`--motion-${phase}-x`, `${x}px`);
    element.style.setProperty(`--motion-${phase}-y`, `${y}px`);
    element.style.setProperty(`--motion-${phase}-scale`, `${scale}`);
  }
}

/** Keep Radix in controlled mode so the snapshot precedes its DOM state change. */
export function useMotionOpen(
  {
    open: controlledOpen,
    defaultOpen = false,
    onOpenChange,
  }: {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
  },
  selector: string,
) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? localOpen;
  function changeOpen(next: boolean) {
    if (next === open) return;
    captureMotionFrame(selector, next);
    if (controlledOpen === undefined) setLocalOpen(next);
    onOpenChange?.(next);
  }
  return { open, onOpenChange: changeOpen };
}
