import type { WalletDatabase } from "../../server/db/connection";
import type { FundingIntent, FundingReceipt } from "./contracts";
import { confirmedResult } from "./recovery";

/** Bounded completed-funding visibility, not FX/history valuation or pagination. */
export function readRecentFunding(database: WalletDatabase): FundingReceipt[] {
  const rows = database.sqlite
    .prepare<
      [],
      { key: string; request: string; response: string; transaction_id: string }
    >(
      "SELECT key, request, response, transaction_id FROM funding_attempts WHERE status = '200' ORDER BY created_at DESC, key DESC LIMIT 50",
    )
    .all();
  return rows.map((row) => {
    const [kind, walletId, amount, provider] = JSON.parse(row.request);
    const intent: FundingIntent = {
      version: 1,
      key: row.key,
      kind,
      request: { walletId, amount, provider },
    };
    const receipt = confirmedResult(JSON.parse(row.response), 200, intent);
    if (
      !receipt ||
      !("transactionId" in receipt) ||
      receipt.transactionId !== row.transaction_id
    )
      throw new Error("Invalid stored funding receipt.");
    return receipt;
  });
}
