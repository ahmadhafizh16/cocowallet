import { handleConversion } from "@/server/http/conversion-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  return handleConversion(request);
}
