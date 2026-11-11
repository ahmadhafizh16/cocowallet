import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "./button";
import { Input } from "./input";
import { Skeleton } from "./skeleton";

describe("shared UI primitives", () => {
  it("does not accidentally submit a surrounding form", () => {
    expect(renderToStaticMarkup(<Button>Action</Button>)).toContain(
      'type="button"',
    );
    expect(
      renderToStaticMarkup(<Button type="submit">Review</Button>),
    ).toContain('type="submit"');
  });
  it("composes link buttons without nesting interactive elements", () => {
    const html = renderToStaticMarkup(
      <Button asChild>
        <a href="#overview">Overview</a>
      </Button>,
    );
    expect(html).toContain('<a href="#overview"');
    expect(html).not.toContain("<button");
    expect(html).not.toContain('type="button"');
  });
  it("preserves accessible input attributes", () => {
    const html = renderToStaticMarkup(
      <Input
        id="amount"
        inputMode="decimal"
        aria-invalid="true"
        aria-describedby="amount-error"
      />,
    );
    expect(html).toContain('inputMode="decimal"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="amount-error"');
  });
  it("keeps skeletons decorative so loading is announced only by the region", () => {
    const html = renderToStaticMarkup(
      <Skeleton className="skeleton-balance" />,
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("skeleton-balance");
    expect(html).not.toContain("tabindex");
  });
});
