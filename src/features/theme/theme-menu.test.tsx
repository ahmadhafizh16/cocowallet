import { renderToStaticMarkup } from "react-dom/server";
import { ThemeMenu } from "./theme-menu";

describe("server-rendered theme control", () => {
  it("does not offer an interactive selector before its handlers hydrate", () => {
    const html = renderToStaticMarkup(<ThemeMenu />);
    expect(html).toContain("Color theme");
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('disabled=""');
    expect(html).toContain("System");
    expect(html).not.toContain("<select");
  });
});
