import { readApiDocument } from "@/server/http/openapi";
import { jsonResponse } from "@/server/http/responses";

export function GET() {
  return jsonResponse(readApiDocument);
}
