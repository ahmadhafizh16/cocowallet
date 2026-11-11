import { getRuntimeDatabase } from "@/server/db/runtime";
import { applicationMetadata } from "@/server/db/schema";

export const runtime = "nodejs";

export function GET() {
  try {
    // Reading the migrated table verifies more than opening an empty SQLite file.
    getRuntimeDatabase().db.select().from(applicationMetadata).limit(1).all();
    return Response.json(
      { status: "ok", database: "ready" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      {
        type: "about:blank",
        title: "Service Unavailable",
        status: 503,
        detail:
          "Database readiness check failed. Verify migrations and storage.",
        code: "DATABASE_NOT_READY",
      },
      {
        status: 503,
        headers: {
          "Content-Type": "application/problem+json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
