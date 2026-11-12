"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

/** Animate only incoming content. Never keep an old monetary DOM or delay routing. */
export function useRouteContentMotion(
  content: RefObject<HTMLElement | null>,
  history: boolean,
  hidden: boolean,
  accountId: string | undefined,
) {
  const previous = useRef<{
    history: boolean;
    hidden: boolean;
    accountId?: string;
  } | null>(null);
  const active = useRef<Animation | null>(null);
  function cancel() {
    if (active.current) {
      active.current.onfinish = null;
      active.current.cancel();
      active.current = null;
    }
  }
  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = { history, hidden, accountId };
    const element = content.current;
    const interrupted =
      active.current && element ? getComputedStyle(element) : null;
    const opacity = interrupted?.opacity ?? "0.8";
    const transform =
      interrupted?.transform ?? `translateX(${history ? 10 : -10}px)`;
    cancel();
    if (
      !element ||
      !before ||
      before.history === history ||
      hidden ||
      before.hidden ||
      before.accountId !== accountId ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
      !element.animate
    )
      return;
    const style = getComputedStyle(element),
      time = style.getPropertyValue("--motion-overlay").trim();
    const milliseconds =
      Number.parseFloat(time) * (time.endsWith("ms") ? 1 : 1000);
    const animation = element.animate(
      [
        { opacity, transform },
        { opacity: "1", transform: "translateX(0)" },
      ],
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
    animation.id = "wallet-route-content";
    active.current = animation;
    animation.onfinish = () => {
      if (active.current === animation) cancel();
    };
  }, [content, history, hidden, accountId]);
  useEffect(() => {
    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    function reduce() {
      if (preference?.matches) cancel();
    }
    preference?.addEventListener?.("change", reduce);
    window.addEventListener("resize", cancel);
    return () => {
      cancel();
      preference?.removeEventListener?.("change", reduce);
      window.removeEventListener("resize", cancel);
    };
  }, []);
}
