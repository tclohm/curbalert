CREATE TABLE `reporters` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`token` text NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reporter_email_idx` ON `reporters` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `reporter_token_idx` ON `reporters` (`token`);--> statement-breakpoint
DROP INDEX `edit_token_idx`;--> statement-breakpoint
ALTER TABLE `reports` DROP COLUMN `edit_token`;