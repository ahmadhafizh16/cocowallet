import { renderToStaticMarkup } from "react-dom/server";
import { CurrencyFlag } from "./currency-flag";

describe("currency flag markers", () => {
  it("keeps EU star positions fixed across server and browser math engines", () => {
    const sine = jest.spyOn(Math, "sin").mockReturnValue(0);
    const cosine = jest.spyOn(Math, "cos").mockReturnValue(0);
    try {
      const html = renderToStaticMarkup(<CurrencyFlag currency="EUR" />);
      expect(html).toContain('transform="translate(19.608 26) scale(1.8)"');
      expect(html.match(/scale\(1\.8\)/g)).toHaveLength(12);
      expect(sine).not.toHaveBeenCalled();
      expect(cosine).not.toHaveBeenCalled();
    } finally {
      sine.mockRestore();
      cosine.mockRestore();
    }
  });
  it.each(["USD", "EUR", "GBP"] as const)(
    "renders a self-contained decorative %s vector",
    (currency) => {
      const html = renderToStaticMarkup(<CurrencyFlag currency={currency} />);
      expect(html).toContain(`data-currency="${currency}"`);
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain('viewBox="0 0 60 40"');
      expect(html).not.toMatch(
        /<(?:image|text|foreignObject)|href=|<title|<script/,
      );
    },
  );

  it("uses the US, EU and UK marker geometry rather than platform emoji", () => {
    expect(renderToStaticMarkup(<CurrencyFlag currency="USD" />)).toContain(
      "#3c3b6e",
    );
    expect(renderToStaticMarkup(<CurrencyFlag currency="EUR" />)).toContain(
      "#ffcc00",
    );
    expect(renderToStaticMarkup(<CurrencyFlag currency="GBP" />)).toContain(
      "#012169",
    );
  });
});
