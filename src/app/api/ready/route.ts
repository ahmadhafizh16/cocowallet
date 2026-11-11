import { getRuntimeDatabase } from "@/server/db/runtime";
import { applicationMetadata } from "@/server/db/schema";
import { problemDetails } from "@/lib/problem-details";
import { jsonResponse, problemResponse } from "@/server/http/responses";

export const runtime = "nodejs";

export function GET() {
  try {
    // Reading the migrated table verifies more than opening an empty SQLite file.
    getRuntimeDatabase().db.select().from(applicationMetadata).limit(1).all();
    return jsonResponse({ status: "ok", database: "ready" });
  } catch {
    return problemResponse(
      problemDetails(
        503,
        "DATABASE_NOT_READY",
        "Database readiness check failed. Verify migrations and storage.",
      ),
    );
  }
}
