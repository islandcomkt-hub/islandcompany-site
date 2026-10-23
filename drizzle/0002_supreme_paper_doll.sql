CREATE INDEX `leads_journey_received` ON `leads` (`journey_id`,`received_at`);--> statement-breakpoint
CREATE INDEX `leads_rate_received` ON `leads` (`rate_key`,`received_at`);