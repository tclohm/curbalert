CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_email` text NOT NULL,
	`license_plate` text NOT NULL,
	`plate_state` text NOT NULL,
	`vehicle_make` text NOT NULL,
	`vehicle_model` text,
	`vehicle_color` text NOT NULL,
	`latitude` real,
	`longitude` real,
	`address` text,
	`reason` text NOT NULL,
	`notes` text,
	`photo_url` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
