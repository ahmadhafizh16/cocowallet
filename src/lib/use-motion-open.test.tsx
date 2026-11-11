/** @jest-environment jsdom */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { captureMotionFrame, useMotionOpen } from "./use-motion-open";

const environment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

describe("interruptible presence motion", () => {
  let root: Root | undefined;
  beforeEach(() => {
    environment.IS_REACT_ACT_ENVIRONMENT = true;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: jest.fn(() => ({ matches: false })),
    });
    jest.spyOn(window, "getComputedStyle").mockReturnValue({
      opacity: "0.36",
      translate: "0px 7.68px",
      scale: "0.9904",
    } as CSSStyleDeclaration);
  });
  afterEach(() => {
    if (root) act(() => root?.unmount());
    root = undefined;
    document.body.replaceChildren();
    jest.restoreAllMocks();
  });

  function layer(state: "open" | "closed") {
    const element = document.createElement("div");
    element.dataset.state = state;
    element.className = "motion-layer";
    document.body.append(element);
    return element;
  }

  it("captures the rendered exit frame instead of assuming fully open", () => {
    const opening = layer("open");
    const closing = layer("closed");
    captureMotionFrame(".motion-layer", false);
    expect(opening.style.getPropertyValue("--motion-exit-opacity")).toBe(
      "0.36",
    );
    expect(opening.style.getPropertyValue("--motion-exit-y")).toBe("7.68px");
    expect(opening.style.getPropertyValue("--motion-exit-scale")).toBe(
      "0.9904",
    );
    expect(closing.style.length).toBe(0);
  });

  it("captures an interrupted exit when a still-mounted layer reopens", () => {
    const closing = layer("closed");
    const open = layer("open");
    captureMotionFrame(".motion-layer", true);
    expect(closing.style.getPropertyValue("--motion-enter-opacity")).toBe(
      "0.36",
    );
    expect(closing.style.getPropertyValue("--motion-enter-y")).toBe("7.68px");
    expect(open.style.length).toBe(0);
  });

  it("does not read or write animated frames under reduced motion", () => {
    const element = layer("open");
    jest
      .mocked(window.matchMedia)
      .mockReturnValue({ matches: true } as MediaQueryList);
    captureMotionFrame(".motion-layer", false);
    expect(window.getComputedStyle).not.toHaveBeenCalled();
    expect(element.style.length).toBe(0);
  });

  it("normalizes no translation without replacing a valid zero scale", () => {
    const element = layer("open");
    jest.mocked(window.getComputedStyle).mockReturnValue({
      opacity: "0",
      translate: "none",
      scale: "0",
    } as CSSStyleDeclaration);
    captureMotionFrame(".motion-layer", false);
    expect(element.style.getPropertyValue("--motion-exit-opacity")).toBe("0");
    expect(element.style.getPropertyValue("--motion-exit-x")).toBe("0px");
    expect(element.style.getPropertyValue("--motion-exit-y")).toBe("0px");
    expect(element.style.getPropertyValue("--motion-exit-scale")).toBe("0");
  });

  function Fixture({
    open,
    defaultOpen,
    onOpenChange,
  }: {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange: (next: boolean) => void;
  }) {
    const motion = useMotionOpen(
      { open, defaultOpen, onOpenChange },
      ".motion-layer",
    );
    return (
      <button
        data-open={motion.open}
        onClick={() => motion.onOpenChange(!motion.open)}
      >
        Toggle
      </button>
    );
  }

  it("preserves controlled open state and reports the requested change", () => {
    const host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    const onOpenChange = jest.fn();
    act(() =>
      root?.render(<Fixture open={false} onOpenChange={onOpenChange} />),
    );
    act(() => host.querySelector("button")!.click());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(host.querySelector("button")!.dataset.open).toBe("false");
    act(() => root?.render(<Fixture open onOpenChange={onOpenChange} />));
    expect(host.querySelector("button")!.dataset.open).toBe("true");
  });

  it("preserves uncontrolled default-open and change behavior", () => {
    const host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    const onOpenChange = jest.fn();
    act(() =>
      root?.render(<Fixture defaultOpen onOpenChange={onOpenChange} />),
    );
    expect(host.querySelector("button")!.dataset.open).toBe("true");
    act(() => host.querySelector("button")!.click());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(host.querySelector("button")!.dataset.open).toBe("false");
  });
});
