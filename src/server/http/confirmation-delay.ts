/** Demo pacing only. Await before acquiring a database or opening a transaction. */
export function waitForConfirmation(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 1000));
}
