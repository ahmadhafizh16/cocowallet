export type AccountDataErrorCode =
  "account_not_found" | "account_not_initialized" | "invalid_account_data";

export class AccountDataError extends Error {
  constructor(
    public readonly code: AccountDataErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AccountDataError";
  }
}
