import { getHealth } from "@/features/health/service";

export const runtime = "nodejs";

export function GET() {
  return Response.json(getHealth(), {
    headers: { "Cache-Control": "no-store" },
  });
}
