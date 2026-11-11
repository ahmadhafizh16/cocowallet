import { QuoteError, isQuoteRequest } from "@/features/quotes/contracts";
import { createQuote } from "@/features/quotes/service";
import { getRuntimeDatabase } from "@/server/db/runtime";
import { quoteJson, quoteProblem } from "@/server/http/quote-responses";
import { localJsonRequest, readBoundedJson } from "@/server/http/request-input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    if (!localJsonRequest(request))
      throw new QuoteError("INVALID_QUOTE_REQUEST", 400);
    let input: unknown;
    try {
      input = await readBoundedJson(request);
    } catch {
      throw new QuoteError("INVALID_QUOTE_REQUEST", 400);
    }
    if (!isQuoteRequest(input))
      throw new QuoteError("INVALID_QUOTE_REQUEST", 400);
    return quoteJson(await createQuote(getRuntimeDatabase(), input));
  } catch (error) {
    return quoteProblem(error);
  }
}
