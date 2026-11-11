CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`default_currency` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`default_currency`) REFERENCES `currencies`(`code`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "account_role" CHECK("accounts"."role" IN ('main', 'destination'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_main_account` ON `accounts` (`role`) WHERE "accounts"."role" = 'main';--> statement-breakpoint
CREATE TABLE `currencies` (
	`code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`minor_unit` integer NOT NULL,
	CONSTRAINT "currency_code_format" CHECK("currencies"."code" GLOB '[A-Z][A-Z][A-Z]'),
	CONSTRAINT "currency_minor_unit_range" CHECK(typeof("currencies"."minor_unit") = 'integer' AND "currencies"."minor_unit" BETWEEN 0 AND 4)
);
--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`wallet_id` text NOT NULL,
	`amount_minor` integer NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "journal_integer_nonzero" CHECK(typeof("journal_entries"."amount_minor") = 'integer' AND "journal_entries"."amount_minor" != 0 AND "journal_entries"."amount_minor" >= -9223372036854775807)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `journal_transaction_wallet` ON `journal_entries` (`transaction_id`,`wallet_id`);--> statement-breakpoint
CREATE INDEX `journal_wallet` ON `journal_entries` (`wallet_id`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`source_wallet_id` text,
	`target_wallet_id` text,
	`provider` text,
	`rate` text,
	`rate_date` text,
	`rate_fetched_at` text,
	`rate_source` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`source_wallet_id`) REFERENCES `wallets`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`target_wallet_id`) REFERENCES `wallets`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "transaction_type" CHECK("transactions"."type" IN ('deposit', 'withdrawal', 'conversion', 'transfer')),
	CONSTRAINT "transaction_completed" CHECK("transactions"."status" = 'completed'),
	CONSTRAINT "transaction_wallet_shape" CHECK(("transactions"."type" = 'deposit' AND "transactions"."source_wallet_id" IS NULL AND "transactions"."target_wallet_id" IS NOT NULL)
        OR ("transactions"."type" = 'withdrawal' AND "transactions"."source_wallet_id" IS NOT NULL AND "transactions"."target_wallet_id" IS NULL)
        OR ("transactions"."type" IN ('conversion', 'transfer') AND "transactions"."source_wallet_id" IS NOT NULL AND "transactions"."target_wallet_id" IS NOT NULL AND "transactions"."source_wallet_id" != "transactions"."target_wallet_id")),
	CONSTRAINT "transaction_provider_shape" CHECK(("transactions"."type" IN ('deposit', 'withdrawal') AND "transactions"."provider" IS NOT NULL AND "transactions"."provider" IN ('demo_bank', 'community_bank', 'crypto_gateway'))
        OR ("transactions"."type" IN ('conversion', 'transfer') AND "transactions"."provider" IS NULL)),
	CONSTRAINT "transaction_rate_shape" CHECK(("transactions"."rate" IS NULL AND "transactions"."rate_date" IS NULL AND "transactions"."rate_fetched_at" IS NULL AND "transactions"."rate_source" IS NULL)
        OR ("transactions"."rate" IS NOT NULL AND "transactions"."rate_date" IS NOT NULL AND "transactions"."rate_fetched_at" IS NOT NULL AND "transactions"."rate_source" IS NOT NULL AND "transactions"."rate_source" IN ('fresh', 'cached')))
);
--> statement-breakpoint
CREATE INDEX `transactions_created_at` ON `transactions` (`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `transactions_source_wallet` ON `transactions` (`source_wallet_id`);--> statement-breakpoint
CREATE INDEX `transactions_target_wallet` ON `transactions` (`target_wallet_id`);--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`currency_code` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`currency_code`) REFERENCES `currencies`(`code`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wallet_account_currency` ON `wallets` (`account_id`,`currency_code`);