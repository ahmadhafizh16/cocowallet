/** @jest-environment jsdom */
import { act, useRef } from "react";
import { createRoot } from "react-dom/client";
import { useMoneyStepMotion } from "./use-money-step-motion";

it("resizes a single live dialog, cancels interrupted work, and bypasses privacy/closing/reduced motion", async () => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let reduced = false,
    preferenceChange: () => void = () => {};
  const media = Object.getOwnPropertyDescriptor(window, "matchMedia");
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      get matches() {
        return reduced;
      },
      addEventListener: (_event: string, handler: () => void) => {
        preferenceChange = handler;
      },
      removeEventListener: jest.fn(),
    }),
  });
  let animatedHeight: number | null = null;
  const bounds = jest
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockImplementation(function (this: HTMLElement) {
      return {
        height: animatedHeight ?? Number(this.dataset.height),
      } as DOMRect;
    });
  const animations: Array<{
    cancel: jest.Mock;
    onfinish?: () => void;
    id?: string;
  }> = [];
  const animate = jest.fn((frames: Array<{ height: string }>) => {
    animatedHeight =
      (Number.parseFloat(frames[0]!.height) +
        Number.parseFloat(frames[1]!.height)) /
      2;
    const animation = {
      cancel: jest.fn(() => {
        animatedHeight = null;
      }),
    };
    animations.push(animation);
    return animation;
  });
  Object.defineProperty(HTMLElement.prototype, "animate", {
    configurable: true,
    value: animate,
  });
  function Surface({
    height,
    hidden = false,
    open = true,
  }: {
    height: number;
    hidden?: boolean;
    open?: boolean;
  }) {
    const ref = useRef<HTMLDivElement>(null);
    useMoneyStepMotion(ref, open, hidden);
    return (
      <div
        ref={ref}
        data-height={height}
        style={
          {
            "--motion-overlay": ".24s",
            "--ease-settle": "cubic-bezier(0.16, 1, 0.3, 1)",
          } as React.CSSProperties
        }
      />
    );
  }
  const render = (height: number, hidden = false, open = true) =>
    act(() =>
      root.render(<Surface height={height} hidden={hidden} open={open} />),
    );
  try {
    await render(300);
    expect(animate).not.toHaveBeenCalled();
    await render(500);
    expect(animate).toHaveBeenLastCalledWith(
      [{ height: "300px" }, { height: "500px" }],
      { duration: 240, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
    expect(animations[0]!.id).toBe("wallet-step-resize");
    await render(420);
    expect(animations[0]!.cancel).toHaveBeenCalledTimes(1);
    expect(animate).toHaveBeenCalledTimes(2);
    await render(260, true);
    expect(animations[1]!.cancel).toHaveBeenCalledTimes(1);
    expect(animate).toHaveBeenCalledTimes(2);
    await render(300);
    expect(animate).toHaveBeenCalledTimes(2);
    await render(440);
    expect(animate).toHaveBeenCalledTimes(3);
    reduced = true;
    await act(() => preferenceChange());
    expect(animations[2]!.cancel).toHaveBeenCalledTimes(1);
    await render(550);
    expect(animate).toHaveBeenCalledTimes(3);
    reduced = false;
    await render(330, false, false);
    await render(450);
    expect(animate).toHaveBeenCalledTimes(3);
    await render(460);
    await act(() => window.dispatchEvent(new Event("resize")));
    expect(animations[3]!.cancel).toHaveBeenCalledTimes(1);
  } finally {
    await act(() => root.unmount());
    bounds.mockRestore();
    delete (HTMLElement.prototype as { animate?: unknown }).animate;
    if (media) Object.defineProperty(window, "matchMedia", media);
    else delete (window as { matchMedia?: unknown }).matchMedia;
    host.remove();
    delete (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
      .IS_REACT_ACT_ENVIRONMENT;
  }
});
