import { spawn } from "node:child_process";
import { openDatabase } from "../src/server/db/connection";
import { migrateDatabase } from "../src/server/db/migrate";
import { seedMainAccount } from "../src/features/accounts/seed";

// This disposable container must never use the configured wallet-data database.
if (
  process.env.WALLET_E2E_ISOLATED !== "1" ||
  process.env.DATABASE_PATH !== "/tmp/opencode/funding-e2e.sqlite"
)
  throw new Error("Explicit isolated browser database required.");
const database = openDatabase(process.env.DATABASE_PATH);
try {
  migrateDatabase(database);
  seedMainAccount(database);
} finally {
  database.close();
}
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0"],
  { stdio: "inherit", env: { ...process.env, NODE_ENV: "production" } },
);
for (const signal of ["SIGTERM", "SIGINT"] as const)
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
