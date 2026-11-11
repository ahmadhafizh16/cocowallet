import type { WalletDatabase } from "../../server/db/connection";
import { accounts, currencies, wallets } from "../../server/db/schema";
import { getCurrencyExponent } from "../money/currency-precision";
import { AccountDataError } from "./errors";

const initialCurrencies = [
  { code: "USD", name: "US dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British pound" },
] as const;

function findMainAccount(database: WalletDatabase): string | undefined {
  const rows = database.sqlite
    .prepare<[], { id: unknown }>("SELECT id FROM accounts WHERE role = 'main'")
    .all();
  const main = rows[0];
  if (rows.length > 1) {
    throw new AccountDataError(
      "invalid_account_data",
      "Exactly one main account is required.",
    );
  }
  if (!main) return undefined;
  if (typeof main.id !== "string" || !main.id.trim()) {
    throw new AccountDataError(
      "invalid_account_data",
      "Stored main account is invalid.",
    );
  }
  return main.id;
}

/** Explicit startup operation, never called from a read or request handler. */
export function seedMainAccount(database: WalletDatabase): string {
  if (database.sqlite.inTransaction) {
    throw new AccountDataError(
      "invalid_account_data",
      "Account initialization requires a top-level immediate transaction.",
    );
  }

  return database.sqlite
    .transaction(() => {
      const metadata = initialCurrencies.map((currency) => ({
        ...currency,
        minorUnit: getCurrencyExponent(currency.code),
      }));
      database.db
        .insert(currencies)
        .values(metadata)
        .onConflictDoNothing({ target: currencies.code })
        .run();

      const storedPrecision = database.sqlite.prepare<
        [string],
        { minor_unit: unknown }
      >("SELECT minor_unit FROM currencies WHERE code = ?");
      for (const currency of metadata) {
        const stored = storedPrecision.get(currency.code);
        if (stored?.minor_unit !== BigInt(currency.minorUnit)) {
          throw new AccountDataError(
            "invalid_account_data",
            `Stored precision for ${currency.code} does not match pinned metadata.`,
          );
        }
      }

      if (findMainAccount(database) === undefined) {
        database.db
          .insert(accounts)
          .values({ role: "main", defaultCurrency: "USD" })
          .onConflictDoNothing()
          .run();
      }
      const mainId = findMainAccount(database);
      if (mainId === undefined) {
        throw new AccountDataError(
          "invalid_account_data",
          "Main account initialization did not create an account.",
        );
      }

      database.db
        .insert(wallets)
        .values(
          metadata.map(({ code }) => ({
            accountId: mainId,
            currencyCode: code,
          })),
        )
        .onConflictDoNothing({
          target: [wallets.accountId, wallets.currencyCode],
        })
        .run();
      return mainId;
    })
    .immediate();
}
