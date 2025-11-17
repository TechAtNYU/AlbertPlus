CREATE TABLE `error_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text,
	`error_type` text NOT NULL,
	`error_message` text NOT NULL,
	`stack_trace` text,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`job_type` text NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	`started_at` integer,
	`completed_at` integer
);
