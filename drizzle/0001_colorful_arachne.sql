CREATE TABLE `lead_events` (
	`id` text PRIMARY KEY NOT NULL,
	`journey_id` text NOT NULL,
	`created_at` text NOT NULL,
	`actor` text NOT NULL,
	`status` text NOT NULL,
	`note` text NOT NULL,
	`next_contact` text
);
--> statement-breakpoint
CREATE INDEX `lead_events_journey` ON `lead_events` (`journey_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `lead_management` (
	`journey_id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'Novo' NOT NULL,
	`next_contact` text,
	`updated_at` text NOT NULL,
	`revision` text NOT NULL
);
