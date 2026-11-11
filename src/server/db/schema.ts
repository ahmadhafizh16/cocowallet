import { sqliteTable, text } from "drizzle-orm/sqlite-core";

// Operational metadata only. Wallet/account/journal tables belong to PRD-02.
export const applicationMetadata = sqliteTable("application_metadata", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
