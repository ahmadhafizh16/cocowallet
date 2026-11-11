import { AccountDataError } from "@/features/accounts/errors";
import { problemDetails } from "@/lib/problem-details";
import { jsonResponse, problemResponse } from "./responses";

export function accountJson(body: unknown) {
  return jsonResponse(body);
}

export function accountProblem(
  status: 400 | 404 | 503,
  code: string,
  detail: string,
) {
  return problemResponse(problemDetails(status, code, detail));
}

/** Never return SQLite errors, storage paths or stack traces to a caller. */
export function accountReadError(error: unknown) {
  if (error instanceof AccountDataError) {
    if (error.code === "account_not_found") {
      return accountProblem(
        404,
        "ACCOUNT_NOT_FOUND",
        "The requested account does not exist.",
      );
    }
    if (error.code === "account_not_initialized") {
      return accountProblem(
        503,
        "ACCOUNT_NOT_INITIALIZED",
        "Initialize the database with the documented migration and seed commands.",
      );
    }
  }
  return accountProblem(
    503,
    "WALLET_DATA_UNAVAILABLE",
    "Wallet data is unavailable. Check database setup and storage before retrying.",
  );
}
