// Deterministic provider fixtures for the guarded disposable production server.
// Never load this into the ordinary wallet or the optional live-provider smoke.
if (
  globalThis.process.env.WALLET_E2E_ISOLATED !== "1" ||
  globalThis.process.env.DATABASE_PATH !== "/tmp/opencode/funding-e2e.sqlite"
)
  throw new Error("Reference fixtures require the isolated browser database.");

const nativeFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const text =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  const url = new URL(text);
  if (url.origin !== "https://api.frankfurter.dev")
    return nativeFetch(input, init);
  if (url.pathname === "/v2/currencies")
    return Response.json([
      { iso_code: "USD", name: "US Dollar", type: "currency" },
      { iso_code: "EUR", name: "Euro", type: "currency" },
      { iso_code: "GBP", name: "Pound Sterling", type: "currency" },
      { iso_code: "JPY", name: "Yen", type: "currency" },
    ]);
  if (
    url.pathname === "/v2/rates.csv" &&
    url.searchParams.get("quotes") === "USD" &&
    ["GBP", "EUR", "JPY"].includes(url.searchParams.get("base"))
  ) {
    const date = new Date().toISOString().slice(0, 10);
    const base = url.searchParams.get("base");
    const rate = base === "GBP" ? "1.25" : base === "EUR" ? "1.1" : "0.0067";
    return new Response(`date,base,quote,rate\n${date},${base},USD,${rate}\n`, {
      headers: { "Content-Type": "text/csv" },
    });
  }
  if (
    url.pathname === "/v2/rates.csv" &&
    url.searchParams.get("base") === "USD" &&
    ["GBP", "EUR", "JPY"].includes(url.searchParams.get("quotes"))
  ) {
    const date = new Date().toISOString().slice(0, 10);
    const quote = url.searchParams.get("quotes");
    const rate = quote === "JPY" ? "150" : quote === "EUR" ? "0.9" : "0.8";
    return new Response(
      `date,base,quote,rate\n${date},USD,${quote},${rate}\n`,
      {
        headers: { "Content-Type": "text/csv" },
      },
    );
  }
  return Response.json(
    { status: 404, message: "No fixture for this pair" },
    { status: 404 },
  );
};
