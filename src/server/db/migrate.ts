import { resolve } from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { WalletDatabase } from "./connection";

export function migrateDatabase(
  database: WalletDatabase,
  migrationsFolder = resolve("drizzle"),
) {
  migrate(database.db, { migrationsFolder });
}
