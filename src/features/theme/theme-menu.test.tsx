import { renderToStaticMarkup } from "react-dom/server";
import { ThemeMenu } from "./theme-menu";

describe("server-rendered theme control", () => {
  it("does not offer an interactive selector before its handlers hydrate", () => {
    const html = renderToStaticMarkup(<ThemeMenu />);
    expect(html).toContain("Color theme");
    expect(html).toContain("<select disabled");
    expect(html).toContain('value="system" selected');
    expect(html).toContain('value="light"');
    expect(html).toContain('value="dark"');
  });
});
