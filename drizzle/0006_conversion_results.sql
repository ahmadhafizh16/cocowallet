CREATE TABLE `conversion_attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`request` text NOT NULL,
	`status` text NOT NULL,
	`response` text NOT NULL,
	`transaction_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "conversion_status" CHECK("conversion_attempts"."status" IN ('200', '400', '404', '409')),
	CONSTRAINT "conversion_result_shape" CHECK(("conversion_attempts"."status" = '200' AND "conversion_attempts"."transaction_id" IS NOT NULL) OR ("conversion_attempts"."status" != '200' AND "conversion_attempts"."transaction_id" IS NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `conversion_attempts_transaction_id_unique` ON `conversion_attempts` (`transaction_id`);
--> statement-breakpoint
CREATE TRIGGER conversion_attempts_no_update BEFORE UPDATE ON conversion_attempts
BEGIN
  SELECT RAISE(ABORT, 'conversion outcomes are immutable');
END;
--> statement-breakpoint
CREATE TRIGGER conversion_attempts_no_delete BEFORE DELETE ON conversion_attempts
BEGIN
  SELECT RAISE(ABORT, 'conversion outcomes are retained indefinitely');
END;
--> statement-breakpoint
CREATE TRIGGER conversion_key_not_funding BEFORE INSERT ON conversion_attempts
WHEN EXISTS (SELECT 1 FROM funding_attempts WHERE key = NEW.key)
BEGIN
  SELECT RAISE(ABORT, 'money key already belongs to funding');
END;
--> statement-breakpoint
CREATE TRIGGER funding_key_not_conversion BEFORE INSERT ON funding_attempts
WHEN EXISTS (SELECT 1 FROM conversion_attempts WHERE key = NEW.key)
BEGIN
  SELECT RAISE(ABORT, 'money key already belongs to conversion');
END;
