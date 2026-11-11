import { AccountDataError } from "@/features/accounts/errors";

export function accountJson(body: unknown) {
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}

export function accountProblem(
  status: 400 | 404 | 503,
  code: string,
  detail: string,
) {
  return Response.json(
    {
      type: "about:blank",
      title: {
        400: "Bad Request",
        404: "Not Found",
        503: "Service Unavailable",
      }[status],
      status,
      code,
      detail,
    },
    {
      status,
      headers: {
        "Content-Type": "application/problem+json",
        "Cache-Control": "no-store",
      },
    },
  );
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
