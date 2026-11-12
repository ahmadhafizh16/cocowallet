"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

/** One bounded resize per layout change; never retain a snapshot of money DOM. */
export function useMoneyStepMotion(
  dialog: RefObject<HTMLDivElement | null>,
  open: boolean,
  hidden: boolean,
) {
  const previous = useRef<{
    element: HTMLDivElement;
    height: number;
    hidden: boolean;
  } | null>(null);
  const active = useRef<Animation | null>(null);

  function cancel() {
    active.current?.cancel();
    active.current = null;
  }

  useLayoutEffect(() => {
    const element = dialog.current;
    if (!open || !element) {
      cancel();
      previous.current = null;
      return;
    }
    const before = previous.current;
    const from = active.current
      ? element.getBoundingClientRect().height
      : before?.height;
    cancel();
    const height = element.getBoundingClientRect().height;
    previous.current = { element, height, hidden };
    if (
      !before ||
      before.element !== element ||
      hidden ||
      before.hidden ||
      from === undefined ||
      Math.abs(from - height) < 1 ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
      !element.animate
    )
      return;
    const style = getComputedStyle(element);
    // Optimized CSS may serialize 240ms as .24s. WAAPI always takes milliseconds.
    const time = style.getPropertyValue("--motion-overlay").trim();
    const milliseconds =
      Number.parseFloat(time) * (time.endsWith("ms") ? 1 : 1000);
    const animation = element.animate(
      [{ height: `${from}px` }, { height: `${height}px` }],
      {
        duration:
          Number.isFinite(milliseconds) && milliseconds > 0
            ? milliseconds
            : 240,
        easing:
          style.getPropertyValue("--ease-settle").trim() ||
          "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    );
    animation.id = "wallet-step-resize";
    active.current = animation;
    animation.onfinish = () => {
      if (active.current === animation) active.current = null;
    };
  });

  useEffect(() => {
    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    function stop() {
      cancel();
      const element = dialog.current;
      if (element)
        previous.current = {
          element,
          height: element.getBoundingClientRect().height,
          hidden: previous.current?.hidden ?? false,
        };
    }
    function reduce() {
      if (preference?.matches) stop();
    }
    preference?.addEventListener?.("change", reduce);
    window.addEventListener("resize", stop);
    return () => {
      cancel();
      preference?.removeEventListener?.("change", reduce);
      window.removeEventListener("resize", stop);
    };
  }, [dialog]);
}
