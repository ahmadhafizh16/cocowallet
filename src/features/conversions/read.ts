import type { WalletDatabase } from "../../server/db/connection";
import { isConversionRequest, type ConversionReceipt } from "./contracts";
import { confirmedConversionResult } from "./receipt";

/** Bounded completed conversion receipts, not the full history/filter API. */
export function readRecentConversions(
  database: WalletDatabase,
): ConversionReceipt[] {
  const rows = database.sqlite
    .prepare<
      [],
      { key: string; request: string; response: string; transaction_id: string }
    >(
      "SELECT key,request,response,transaction_id FROM conversion_attempts WHERE status='200' ORDER BY created_at DESC,key DESC LIMIT 50",
    )
    .all();
  return rows.map((row) => {
    const [kind, quoteId, sourceWalletId, amount, targetCurrency] = JSON.parse(
      row.request,
    );
    const input = { quoteId, sourceWalletId, amount, targetCurrency };
    if (kind !== "conversion" || !isConversionRequest(input))
      throw new Error("Invalid stored conversion request.");
    const result = confirmedConversionResult(
      JSON.parse(row.response),
      "200",
      row.transaction_id,
      row.key,
      input,
    );
    if (!("transactionId" in result))
      throw new Error("Invalid conversion receipt.");
    return result;
  });
}
