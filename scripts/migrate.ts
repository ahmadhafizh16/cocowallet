import { openDatabase } from "../src/server/db/connection";
import { migrateDatabase } from "../src/server/db/migrate";

const filename = process.env.DATABASE_PATH;
if (!filename) {
  throw new Error("DATABASE_PATH is required before running migrations.");
}

const database = openDatabase(filename);
try {
  migrateDatabase(database);
  console.log("SQLite migrations applied successfully.");
} finally {
  database.close();
}
