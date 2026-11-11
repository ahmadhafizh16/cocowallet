import { listAccounts } from "@/features/accounts/read";
import { getRuntimeDatabase } from "@/server/db/runtime";
import { accountJson, accountReadError } from "@/server/http/account-responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  try {
    return accountJson({ accounts: listAccounts(getRuntimeDatabase()) });
  } catch (error) {
    return accountReadError(error);
  }
}
