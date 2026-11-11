import { readAccountWallets } from "@/features/accounts/read";
import { getRuntimeDatabase } from "@/server/db/runtime";
import {
  accountJson,
  accountProblem,
  accountReadError,
} from "@/server/http/account-responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ accountId: string }> },
) {
  try {
    const { accountId } = await context.params;
    if (
      typeof accountId !== "string" ||
      !accountId ||
      accountId.includes("\0")
    ) {
      return accountProblem(
        400,
        "INVALID_ACCOUNT_ID",
        "Supply a nonempty account ID without null characters.",
      );
    }
    return accountJson(readAccountWallets(getRuntimeDatabase(), accountId));
  } catch (error) {
    return accountReadError(error);
  }
}
