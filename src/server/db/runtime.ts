import "server-only";
import { openDatabase, type WalletDatabase } from "./connection";

const runtime = globalThis as typeof globalThis & {
  walletDatabase?: WalletDatabase;
};

export function getRuntimeDatabase() {
  if (process.env.NODE_ENV === "test") {
    throw new Error(
      "Tests must use an explicitly isolated database connection.",
    );
  }

  const filename = process.env.DATABASE_PATH;
  if (!filename) {
    throw new Error("DATABASE_PATH is required; use the Docker configuration.");
  }

  runtime.walletDatabase ??= openDatabase(filename);
  return runtime.walletDatabase;
}
