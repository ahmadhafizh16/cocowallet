import { getCurrencyCatalog } from "@/features/rates/service";
import { getRuntimeDatabase } from "@/server/db/runtime";
import { rateJson, rateProblem } from "@/server/http/rate-responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return rateJson(await getCurrencyCatalog(getRuntimeDatabase()));
  } catch (error) {
    return rateProblem(error);
  }
}
