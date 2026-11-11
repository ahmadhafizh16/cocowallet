import { handleTransfer } from "@/server/http/transfer-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function POST(request: Request) {
  return handleTransfer(request);
}
