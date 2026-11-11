import { identifierContract } from "@/lib/contracts";
import { problemDetails } from "@/lib/problem-details";
import { AccountDataError } from "@/features/accounts/errors";
import {
  HistoryError,
  historyFailures,
  parseHistoryAccount,
  parseHistoryQuery,
} from "@/features/history/contracts";
import {
  listTransactionHistory,
  readTransactionHistory,
} from "@/features/history/read";
import { getRuntimeDatabase } from "../db/runtime";
import { jsonResponse, problemResponse } from "./responses";

function historyProblem(error: unknown) {
  let code: keyof typeof historyFailures =
    error instanceof HistoryError ? error.code : "HISTORY_DATA_UNAVAILABLE";
  if (error instanceof AccountDataError) {
    if (error.code === "account_not_found") code = "ACCOUNT_NOT_FOUND";
    if (error.code === "account_not_initialized")
      code = "ACCOUNT_NOT_INITIALIZED";
  }
  const failure = historyFailures[code];
  return problemResponse(problemDetails(failure.status, code, failure.detail));
}
export function handleHistoryList(request: Request) {
  try {
    const query = parseHistoryQuery(new URL(request.url).searchParams);
    return jsonResponse(listTransactionHistory(getRuntimeDatabase(), query));
  } catch (error) {
    return historyProblem(error);
  }
}
export async function handleHistoryDetail(
  request: Request,
  parameters: Promise<{ transactionId: string }>,
) {
  try {
    const { transactionId } = await parameters;
    const accountId = parseHistoryAccount(new URL(request.url).searchParams);
    if (!identifierContract.is(transactionId))
      throw new HistoryError("INVALID_TRANSACTION_ID");
    return jsonResponse(
      readTransactionHistory(getRuntimeDatabase(), accountId, transactionId),
    );
  } catch (error) {
    return historyProblem(error);
  }
}
