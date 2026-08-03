ALTER TABLE `reports` ADD `edit_token` text NOT NULL;--> statement-breakpoint
CREATE INDEX `plate_index` ON `reports` (`license_plate`,`plate_state`);--> statement-breakpoint
CREATE UNIQUE INDEX `edit_token_idx` ON `reports` (`edit_token`);