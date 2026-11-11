import { handleHistoryDetail } from "@/server/http/history-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(
  request: Request,
  context: { params: Promise<{ transactionId: string }> },
) {
  return handleHistoryDetail(request, context.params);
}
