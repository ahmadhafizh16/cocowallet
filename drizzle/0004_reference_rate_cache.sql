CREATE TABLE `fx_catalog_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`currencies` text NOT NULL,
	`fetched_at` text NOT NULL,
	CONSTRAINT "fx_catalog_provider" CHECK("fx_catalog_cache"."id" = 'frankfurter-v2')
);
--> statement-breakpoint
CREATE TABLE `fx_rate_cache` (
	`base` text NOT NULL,
	`quote` text NOT NULL,
	`rate` text NOT NULL,
	`source_date` text NOT NULL,
	`fetched_at` text NOT NULL,
	PRIMARY KEY(`base`, `quote`),
	CONSTRAINT "fx_distinct_pair" CHECK("fx_rate_cache"."base" != "fx_rate_cache"."quote")
);
