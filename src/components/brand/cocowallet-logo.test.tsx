import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { CocoWalletLogo } from "./cocowallet-logo";

describe("CocoWallet branding", () => {
  it("renders an accessible, font-independent vector logo", () => {
    const html = renderToStaticMarkup(<CocoWalletLogo />);

    expect(html).toContain('viewBox="0 0 360 72"');
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="CocoWallet"');
    expect(html).toContain('focusable="false"');
    expect(html).toContain('data-slot="brand-logo"');
    expect(html).toContain('class="cocowallet-logo"');
    expect(html).toContain("<path");
    expect(html).toContain("<ellipse");
    expect(html).not.toMatch(
      /<(?:text|image|foreignObject)\b|font-family|href=/i,
    );
  });

  it("inherits the wordmark color while retaining the approved icon palette", () => {
    const html = renderToStaticMarkup(<CocoWalletLogo />);

    expect(html).toContain('<g stroke="currentColor" stroke-width="4"');
    expect(html).toContain('fill="#405e87"');
    expect(html).toContain('stroke="#ffffff" stroke-width="6"');
    expect(html).toContain('stroke="#a7c4e9" stroke-width="4"');
    expect(html).toContain('fill="#ffffff"');
    expect(html).not.toContain("#223349");
  });

  it("supports decorative use and merges caller SVG props", () => {
    const html = renderToStaticMarkup(
      <CocoWalletLogo
        aria-hidden="true"
        className="header-logo"
        width={220}
        height={44}
        data-testid="header-brand"
      />,
    );

    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('aria-label="CocoWallet"');
    expect(html).not.toContain('role="img"');
    expect(html).toContain('class="cocowallet-logo header-logo"');
    expect(html).toContain('width="220" height="44"');
    expect(html).toContain('data-testid="header-brand"');
  });

  it("preserves every approved vector shape and the matching favicon", () => {
    const approvedLogo = readFileSync(
      join(process.cwd(), "public/brand/cocowallet-logo.svg"),
      "utf8",
    );
    const shapes = (svg: string) =>
      svg
        .match(/<(?:rect|path|circle|ellipse)\b[^>]*>/g)
        ?.map((shape) => shape.replace(/\s*\/>$/, ">"));
    const html = renderToStaticMarkup(<CocoWalletLogo />);

    expect(shapes(html)).toEqual(shapes(approvedLogo));
    expect(readFileSync(join(process.cwd(), "src/app/icon.svg"), "utf8")).toBe(
      readFileSync(
        join(process.cwd(), "public/brand/cocowallet-icon.svg"),
        "utf8",
      ),
    );
  });
});
