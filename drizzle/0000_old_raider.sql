CREATE TABLE `leads` (
	`submission_id` text PRIMARY KEY NOT NULL,
	`journey_id` text NOT NULL,
	`received_at` text NOT NULL,
	`name` text NOT NULL,
	`company` text NOT NULL,
	`email` text NOT NULL,
	`whatsapp` text NOT NULL,
	`payload` text NOT NULL,
	`classification` text NOT NULL,
	`rate_key` text NOT NULL
);
