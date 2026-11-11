import { renderToStaticMarkup } from "react-dom/server";
import WalletError from "./error";
import NotFound from "./not-found";
import Loading from "./loading";

describe("wallet route boundaries", () => {
  it("provides a polite loading region without fabricated balances", () => {
    const html = renderToStaticMarkup(<Loading />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Loading wallet overview");
    expect(html).toContain("ui-skeleton");
    expect(html).not.toContain("$12,480.50");
    expect(html).not.toContain('type="submit"');
  });

  it("does not leak internal error messages or suggest a fresh uncertain attempt", () => {
    const html = renderToStaticMarkup(
      <WalletError
        error={new Error("private database details")}
        reset={() => undefined}
      />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("We couldn’t load your wallet");
    expect(html).toContain("same key");
    expect(html).not.toContain("private database details");
  });

  it("gives an unknown route a semantic path back", () => {
    const html = renderToStaticMarkup(<NotFound />);
    expect(html).toContain('href="/"');
    expect(html).toContain("Back to overview");
    expect(html).toContain('id="main-content"');
  });
});
