import { after } from "next/server";
import { capturePortfolio, valuePortfolio } from "@/features/portfolio/service";
import type { WalletDatabase } from "./db/connection";

/** Presentation metadata is deliberately outside money's commit/replay boundary.
 * Capture before yielding; resolve FX after the response, without delaying or
 * relabeling a known result. GET recovers the current observation after a crash. */
export function observeCompletedSubmission(
  database: WalletDatabase,
  result: { status: number; replayed: boolean; body: unknown },
) {
  if (
    result.status !== 200 ||
    result.replayed ||
    !result.body ||
    typeof result.body !== "object" ||
    !("transactionId" in result.body)
  )
    return;
  try {
    const body = result.body as {
      accountId?: string;
      source?: { accountId: string };
      target?: { accountId: string };
    };
    const ids = [
      ...new Set(
        [body.accountId, body.source?.accountId, body.target?.accountId].filter(
          (id): id is string => typeof id === "string",
        ),
      ),
    ];
    const observations = ids.map((id) => capturePortfolio(database, id));
    after(async () => {
      await Promise.allSettled(
        observations.map((value) => valuePortfolio(database, value)),
      );
    });
  } catch {
    /* Valuation must never change a known monetary outcome. */
  }
}
