export const runtime = "nodejs";

export function GET() {
  return Response.json(
    {
      name: "Simulated multi-currency wallet",
      milestone: "foundation",
      message: "The application foundation is running. Wallet features and UI are not implemented yet.",
      health: "/api/health",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
