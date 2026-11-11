import { readApiDocument } from "@/server/http/openapi";

export function GET() {
  return Response.json(readApiDocument, {
    headers: { "Cache-Control": "no-store" },
  });
}
