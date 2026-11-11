export type JournalErrorCode =
  | "account_not_found"
  | "wallet_not_found"
  | "invalid_journal"
  | "insufficient_funds"
  | "inspect_only"
  | "invalid_operation"
  | "write_scope_closed";

export class JournalError extends Error {
  constructor(
    public readonly code: JournalErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "JournalError";
  }
}
