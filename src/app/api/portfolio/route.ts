import { identifierContract } from "@/lib/contracts";
import { AccountDataError } from "@/features/accounts/errors";
import { getPortfolioView } from "@/features/portfolio/service";
import { getRuntimeDatabase } from "@/server/db/runtime";
import { jsonResponse, problemResponse } from "@/server/http/responses";
import { problemDetails } from "@/lib/problem-details";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const accountId = params.get("accountId");
  if (
    [...params.keys()].some((key) => key !== "accountId") ||
    params.getAll("accountId").length !== 1 ||
    !identifierContract.is(accountId)
  )
    return problemResponse(
      problemDetails(
        400,
        "INVALID_PORTFOLIO_QUERY",
        "An explicit accountId is required.",
      ),
    );
  try {
    return jsonResponse(
      await getPortfolioView(getRuntimeDatabase(), accountId),
    );
  } catch (error) {
    return problemResponse(
      problemDetails(
        error instanceof AccountDataError && error.code === "account_not_found"
          ? 404
          : 503,
        "PORTFOLIO_UNAVAILABLE",
        "Portfolio valuation is unavailable.",
      ),
    );
  }
}
