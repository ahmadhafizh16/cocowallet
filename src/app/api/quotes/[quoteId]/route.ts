import { readQuote } from "@/features/quotes/service";
import { QuoteError } from "@/features/quotes/contracts";
import { normalizeRequestKey } from "@/features/funding/contracts";
import { getRuntimeDatabase } from "@/server/db/runtime";
import { quoteJson, quoteProblem } from "@/server/http/quote-responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  context: { params: Promise<{ quoteId: string }> },
) {
  try {
    const { quoteId } = await context.params;
    if (!normalizeRequestKey(quoteId))
      throw new QuoteError("INVALID_QUOTE_ID", 400);
    return quoteJson(readQuote(getRuntimeDatabase(), quoteId));
  } catch (error) {
    return quoteProblem(error);
  }
}
