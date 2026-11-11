import { runInNewContext } from "node:vm";
import { isThemePreference, resolveTheme, themeBootstrap } from "./theme";

describe("theme preferences", () => {
  it.each(["light", "dark", "system"])("recognizes %s", (value) => {
    expect(isThemePreference(value)).toBe(true);
  });

  it.each([undefined, null, "", "DARK", "<script>", 1, {}])(
    "rejects an invalid preference: %p",
    (value) => {
      expect(isThemePreference(value)).toBe(false);
    },
  );

  it.each([
    ["system", true, "dark"],
    ["system", false, "light"],
    ["dark", false, "dark"],
    ["light", true, "light"],
  ] as const)(
    "resolves %s with system dark=%s",
    (preference, dark, expected) => {
      expect(resolveTheme(preference, dark)).toBe(expected);
    },
  );

  it.each([
    ["dark", false, "dark"],
    ["light", true, "light"],
    ["system", true, "dark"],
    ["invalid", true, "dark"],
    [null, false, "light"],
  ] as const)(
    "bootstraps before paint from %p",
    (stored, systemDark, expected) => {
      const toggle = jest.fn();
      const element = {
        dataset: { theme: "" },
        classList: { toggle },
        style: { colorScheme: "" },
      };
      runInNewContext(themeBootstrap, {
        localStorage: { getItem: () => stored },
        window: { matchMedia: () => ({ matches: systemDark }) },
        document: { documentElement: element },
      });
      expect(element.dataset.theme).toBe(expected);
      expect(element.style.colorScheme).toBe(expected);
      expect(toggle).toHaveBeenCalledWith("dark", expected === "dark");
    },
  );

  it("respects the system even when browser storage is unavailable", () => {
    const element = {
      dataset: { theme: "" },
      classList: { toggle: jest.fn() },
      style: {},
    };
    expect(() =>
      runInNewContext(themeBootstrap, {
        localStorage: {
          getItem() {
            throw new Error("Storage blocked");
          },
        },
        window: { matchMedia: () => ({ matches: true }) },
        document: { documentElement: element },
      }),
    ).not.toThrow();
    expect(element.dataset.theme).toBe("dark");
  });
});
