/** @jest-environment jsdom */
import { act, useRef } from "react";
import { createRoot } from "react-dom/client";
import { useRouteContentMotion } from "./use-route-content-motion";

it("animates committed sibling navigation only and cancels interruption, privacy, preference, resize and unmount", async () => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host),
    media = Object.getOwnPropertyDescriptor(window, "matchMedia"),
    originalAnimate = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "animate",
    );
  let reduced = false,
    change = () => {};
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      get matches() {
        return reduced;
      },
      addEventListener: (_event: string, handler: () => void) => {
        change = handler;
      },
      removeEventListener: jest.fn(),
    }),
  });
  const animations: Array<{
    id?: string;
    cancel: jest.Mock;
    onfinish: (() => void) | null;
  }> = [];
  const animate = jest.fn(() => {
    const a = { cancel: jest.fn(), onfinish: null };
    animations.push(a);
    return a;
  });
  Object.defineProperty(HTMLElement.prototype, "animate", {
    configurable: true,
    value: animate,
  });
  function Surface({
    history,
    hidden,
    account,
  }: {
    history: boolean;
    hidden: boolean;
    account: string;
  }) {
    const ref = useRef<HTMLElement>(null);
    useRouteContentMotion(ref, history, hidden, account);
    return (
      <main
        ref={ref}
        style={
          {
            "--motion-overlay": ".24s",
            "--ease-settle": "cubic-bezier(0.16, 1, 0.3, 1)",
          } as React.CSSProperties
        }
      />
    );
  }
  const render = (history = false, hidden = false, account = "main") =>
    act(() =>
      root.render(
        <Surface history={history} hidden={hidden} account={account} />,
      ),
    );
  try {
    await render();
    expect(animate).not.toHaveBeenCalled();
    await render(true);
    expect(animate).toHaveBeenLastCalledWith(
      [
        { opacity: "0.8", transform: "translateX(10px)" },
        { opacity: "1", transform: "translateX(0)" },
      ],
      { duration: 240, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
    expect(animations[0]!.id).toBe("wallet-route-content");
    await render(false);
    expect(animations[0]!.cancel).toHaveBeenCalledTimes(1);
    expect(animate).toHaveBeenCalledTimes(2);
    await act(() => animations[1]!.onfinish?.());
    expect(animations[1]!.cancel).toHaveBeenCalledTimes(1);
    await render(false);
    expect(animate).toHaveBeenCalledTimes(2);
    await render(true);
    expect(animate).toHaveBeenCalledTimes(3);
    await render(true, true);
    expect(animations[2]!.cancel).toHaveBeenCalledTimes(1);
    await render(false, true);
    await render(true);
    expect(animate).toHaveBeenCalledTimes(3);
    await render(false);
    reduced = true;
    await act(() => change());
    expect(animations[3]!.cancel).toHaveBeenCalledTimes(1);
    await render(true);
    expect(animate).toHaveBeenCalledTimes(4);
    reduced = false;
    await render(false);
    await act(() => window.dispatchEvent(new Event("resize")));
    expect(animations[4]!.cancel).toHaveBeenCalledTimes(1);
    await render(true, false, "destination");
    expect(animate).toHaveBeenCalledTimes(5);
    await render(false, false, "destination");
    await act(() => root.unmount());
    expect(animations[5]!.cancel).toHaveBeenCalledTimes(1);
  } finally {
    await act(() => root.unmount());
    host.remove();
    if (media) Object.defineProperty(window, "matchMedia", media);
    else delete (window as { matchMedia?: unknown }).matchMedia;
    if (originalAnimate)
      Object.defineProperty(HTMLElement.prototype, "animate", originalAnimate);
    else delete (HTMLElement.prototype as { animate?: unknown }).animate;
    delete (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
      .IS_REACT_ACT_ENVIRONMENT;
  }
});
