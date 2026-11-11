CREATE TABLE `funding_attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`request` text NOT NULL,
	`status` text NOT NULL,
	`response` text NOT NULL,
	`transaction_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "funding_status" CHECK("funding_attempts"."status" IN ('200', '400', '404', '409')),
	CONSTRAINT "funding_result_shape" CHECK(("funding_attempts"."status" = '200' AND "funding_attempts"."transaction_id" IS NOT NULL) OR ("funding_attempts"."status" != '200' AND "funding_attempts"."transaction_id" IS NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `funding_attempts_transaction_id_unique` ON `funding_attempts` (`transaction_id`);
--> statement-breakpoint
CREATE TRIGGER funding_attempts_no_update BEFORE UPDATE ON funding_attempts
BEGIN
  SELECT RAISE(ABORT, 'funding outcomes are immutable');
END;
--> statement-breakpoint
CREATE TRIGGER funding_attempts_no_delete BEFORE DELETE ON funding_attempts
BEGIN
  SELECT RAISE(ABORT, 'funding outcomes are retained indefinitely');
END;
