import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase } from "./connection";
import { migrateDatabase } from "./migrate";
import { accounts, currencies, wallets } from "./schema";

/** Explicit isolated fixtures, never the configured runtime wallet database. */
export function createJournalFixture() {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Journal fixtures may only be created in tests.");
  }
  const directory = mkdtempSync(join(tmpdir(), "wallet-journal-test-"));
  const filename = join(directory, "isolated.sqlite");
  const database = openDatabase(filename);
  try {
    migrateDatabase(database);
    database.db
      .insert(currencies)
      .values([
        { code: "USD", name: "US Dollar", minorUnit: 2 },
        { code: "GBP", name: "Pound Sterling", minorUnit: 2 },
        { code: "JPY", name: "Yen", minorUnit: 0 },
      ])
      .run();
    database.db
      .insert(accounts)
      .values([
        { id: "main", role: "main", defaultCurrency: "USD" },
        { id: "recipient", role: "destination", defaultCurrency: "GBP" },
      ])
      .run();
    database.db
      .insert(wallets)
      .values([
        { id: "main-usd", accountId: "main", currencyCode: "USD" },
        { id: "main-gbp", accountId: "main", currencyCode: "GBP" },
        { id: "recipient-usd", accountId: "recipient", currencyCode: "USD" },
        { id: "recipient-gbp", accountId: "recipient", currencyCode: "GBP" },
      ])
      .run();
    return {
      database,
      filename,
      cleanup() {
        database.close();
        rmSync(directory, { recursive: true, force: true });
      },
    };
  } catch (error) {
    database.close();
    rmSync(directory, { recursive: true, force: true });
    throw error;
  }
}
