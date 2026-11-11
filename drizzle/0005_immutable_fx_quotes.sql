CREATE TABLE `fx_quote_uses` (
	`quote_id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`used_at` text NOT NULL,
	FOREIGN KEY (`quote_id`) REFERENCES `fx_quotes`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fx_quote_uses_transaction_id_unique` ON `fx_quote_uses` (`transaction_id`);--> statement-breakpoint
CREATE TABLE `fx_quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`operation` text NOT NULL,
	`source_account_id` text NOT NULL,
	`source_wallet_id` text NOT NULL,
	`request` text NOT NULL,
	`terms` text NOT NULL,
	`issued_at` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`source_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`source_wallet_id`) REFERENCES `wallets`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "fx_quote_operation" CHECK("fx_quotes"."operation" IN ('conversion','transfer'))
);
--> statement-breakpoint
CREATE TRIGGER fx_quotes_no_update BEFORE UPDATE ON fx_quotes
BEGIN
  SELECT RAISE(ABORT, 'quote terms are immutable');
END;
--> statement-breakpoint
CREATE TRIGGER fx_quotes_no_delete BEFORE DELETE ON fx_quotes
BEGIN
  SELECT RAISE(ABORT, 'quote terms are retained');
END;
--> statement-breakpoint
CREATE TRIGGER fx_quote_uses_no_update BEFORE UPDATE ON fx_quote_uses
BEGIN
  SELECT RAISE(ABORT, 'successful quote use is immutable');
END;
--> statement-breakpoint
CREATE TRIGGER fx_quote_uses_no_delete BEFORE DELETE ON fx_quote_uses
BEGIN
  SELECT RAISE(ABORT, 'successful quote use is retained');
END;
