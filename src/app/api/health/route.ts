import { getHealth } from "@/features/health/service";
import { jsonResponse } from "@/server/http/responses";

export const runtime = "nodejs";

export function GET() {
  return jsonResponse(getHealth());
}
