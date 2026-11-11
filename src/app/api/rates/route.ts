import { getReferenceRate } from "@/features/rates/service";
import { RateDataError } from "@/features/rates/contracts";
import { fiatExponent } from "@/features/rates/validation";
import { getRuntimeDatabase } from "@/server/db/runtime";
import { rateJson, rateProblem } from "@/server/http/rate-responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    if (
      [...params.keys()].some((key) => !["base", "quote"].includes(key)) ||
      params.getAll("base").length !== 1 ||
      params.getAll("quote").length !== 1
    )
      throw new RateDataError("INVALID_CURRENCY_PAIR", 400);
    try {
      fiatExponent(params.get("base"));
      fiatExponent(params.get("quote"));
      if (params.get("base") === params.get("quote"))
        throw new Error("Identity pair.");
    } catch {
      throw new RateDataError("INVALID_CURRENCY_PAIR", 400);
    }
    return rateJson(
      await getReferenceRate(
        getRuntimeDatabase(),
        params.get("base")!,
        params.get("quote")!,
      ),
    );
  } catch (error) {
    return rateProblem(error);
  }
}
