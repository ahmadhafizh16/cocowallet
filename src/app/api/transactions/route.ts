import { handleHistoryList } from "@/server/http/history-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(request: Request) {
  return handleHistoryList(request);
}
