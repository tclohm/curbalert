CREATE TABLE `votes` (
	`id` text PRIMARY KEY NOT NULL,
	`report_id` text NOT NULL,
	`voter_token` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_vote_idx` ON `votes` (`report_id`,`voter_token`);