import { seedMainAccount } from "../src/features/accounts/seed";
import { openDatabase } from "../src/server/db/connection";

const filename = process.env.DATABASE_PATH;
if (!filename) throw new Error("DATABASE_PATH is required before seeding.");

const database = openDatabase(filename);
try {
  const accountId = seedMainAccount(database);
  console.log(
    `Main account ${accountId} and startup currency wallets are ready. No funds were created.`,
  );
} finally {
  database.close();
}
