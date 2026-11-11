CREATE TABLE `transfer_attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`request` text NOT NULL,
	`status` text NOT NULL,
	`response` text NOT NULL,
	`transaction_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "transfer_status" CHECK("transfer_attempts"."status" IN ('200', '400', '404', '409')),
	CONSTRAINT "transfer_result_shape" CHECK(("transfer_attempts"."status" = '200' AND "transfer_attempts"."transaction_id" IS NOT NULL) OR ("transfer_attempts"."status" != '200' AND "transfer_attempts"."transaction_id" IS NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transfer_attempts_transaction_id_unique` ON `transfer_attempts` (`transaction_id`);
--> statement-breakpoint
CREATE TRIGGER transfer_attempts_no_update BEFORE UPDATE ON transfer_attempts
BEGIN
  SELECT RAISE(ABORT, 'transfer outcomes are immutable');
END;
--> statement-breakpoint
CREATE TRIGGER transfer_attempts_no_delete BEFORE DELETE ON transfer_attempts
BEGIN
  SELECT RAISE(ABORT, 'transfer outcomes are retained indefinitely');
END;
--> statement-breakpoint
CREATE TRIGGER transfer_key_not_funding BEFORE INSERT ON transfer_attempts
WHEN EXISTS (SELECT 1 FROM funding_attempts WHERE key = NEW.key)
BEGIN
  SELECT RAISE(ABORT, 'money key already belongs to funding');
END;
--> statement-breakpoint
CREATE TRIGGER funding_key_not_transfer BEFORE INSERT ON funding_attempts
WHEN EXISTS (SELECT 1 FROM transfer_attempts WHERE key = NEW.key)
BEGIN
  SELECT RAISE(ABORT, 'money key already belongs to transfer');
END;
--> statement-breakpoint
CREATE TRIGGER transfer_key_not_conversion BEFORE INSERT ON transfer_attempts
WHEN EXISTS (SELECT 1 FROM conversion_attempts WHERE key = NEW.key)
BEGIN
  SELECT RAISE(ABORT, 'money key already belongs to conversion');
END;
--> statement-breakpoint
CREATE TRIGGER conversion_key_not_transfer BEFORE INSERT ON conversion_attempts
WHEN EXISTS (SELECT 1 FROM transfer_attempts WHERE key = NEW.key)
BEGIN
  SELECT RAISE(ABORT, 'money key already belongs to transfer');
END;
