-- Completed accounting records are append-only. Corrections require a new operation.
CREATE TRIGGER journal_entries_no_update
BEFORE UPDATE ON journal_entries
BEGIN
  SELECT RAISE(ABORT, 'journal entries are immutable');
END;
--> statement-breakpoint
CREATE TRIGGER journal_entries_no_delete
BEFORE DELETE ON journal_entries
BEGIN
  SELECT RAISE(ABORT, 'journal entries are immutable');
END;
--> statement-breakpoint
CREATE TRIGGER transactions_no_update
BEFORE UPDATE ON transactions
BEGIN
  SELECT RAISE(ABORT, 'completed transactions are immutable');
END;
--> statement-breakpoint
CREATE TRIGGER transactions_no_delete
BEFORE DELETE ON transactions
BEGIN
  SELECT RAISE(ABORT, 'completed transactions are immutable');
END;
--> statement-breakpoint
CREATE TRIGGER journal_entry_matches_transaction_side
BEFORE INSERT ON journal_entries
WHEN NOT EXISTS (
  SELECT 1 FROM transactions AS t
  WHERE t.id = NEW.transaction_id
    AND ((NEW.amount_minor > 0 AND NEW.wallet_id = t.target_wallet_id)
      OR (NEW.amount_minor < 0 AND NEW.wallet_id = t.source_wallet_id))
)
BEGIN
  SELECT RAISE(ABORT, 'journal entry does not match transaction side');
END;
--> statement-breakpoint
CREATE TRIGGER wallet_identity_no_update
BEFORE UPDATE OF id, account_id, currency_code ON wallets
BEGIN
  SELECT RAISE(ABORT, 'wallet identity is immutable');
END;
--> statement-breakpoint
CREATE TRIGGER account_identity_no_update
BEFORE UPDATE OF id, role ON accounts
BEGIN
  SELECT RAISE(ABORT, 'account identity is immutable');
END;
--> statement-breakpoint
CREATE TRIGGER destination_default_no_update
BEFORE UPDATE OF default_currency ON accounts
WHEN OLD.role = 'destination'
BEGIN
  SELECT RAISE(ABORT, 'destination accounts are inspect-only');
END;
--> statement-breakpoint
CREATE TRIGGER used_currency_precision_no_update
BEFORE UPDATE OF code, minor_unit ON currencies
WHEN EXISTS (SELECT 1 FROM wallets WHERE currency_code = OLD.code)
BEGIN
  SELECT RAISE(ABORT, 'used currency precision is immutable');
END;
