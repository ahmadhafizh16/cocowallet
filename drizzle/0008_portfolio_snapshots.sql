CREATE TABLE portfolio_snapshots (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  balance_revision TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  valued_at TEXT NOT NULL,
  total_usd_minor INTEGER NOT NULL CONSTRAINT portfolio_total_nonnegative CHECK (typeof(total_usd_minor) = 'integer' AND total_usd_minor >= 0),
  balances TEXT NOT NULL,
  rates TEXT NOT NULL,
  PRIMARY KEY (account_id, balance_revision)
);
--> statement-breakpoint
CREATE INDEX portfolio_snapshot_time ON portfolio_snapshots(account_id, recorded_at);
--> statement-breakpoint
CREATE TRIGGER immutable_portfolio_snapshot_update BEFORE UPDATE ON portfolio_snapshots
BEGIN SELECT RAISE(ABORT, 'Recorded USD snapshots are immutable'); END;
--> statement-breakpoint
CREATE TRIGGER immutable_portfolio_snapshot_delete BEFORE DELETE ON portfolio_snapshots
BEGIN SELECT RAISE(ABORT, 'Recorded USD snapshots are immutable'); END;
