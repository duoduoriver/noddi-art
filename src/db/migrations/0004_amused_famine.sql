CREATE TABLE `admin_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_user_id` text,
	`case_id` text,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`metadata` text,
	`subject_hash` text,
	`retain_until` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`admin_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`case_id`) REFERENCES `admin_cases`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `admin_actions_target_created_idx` ON `admin_actions` (`target_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `admin_cases` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`type` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`summary` text NOT NULL,
	`assigned_to` text,
	`resolved_by` text,
	`resolved_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`assigned_to`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`resolved_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `admin_cases_status_created_idx` ON `admin_cases` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `credit_accounts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`plan_balance` integer DEFAULT 0 NOT NULL,
	`purchased_balance` integer DEFAULT 0 NOT NULL,
	`refund_debt` integer DEFAULT 0 NOT NULL,
	`plan_code` text DEFAULT 'free' NOT NULL,
	`plan_allowance` integer DEFAULT 2 NOT NULL,
	`period_end` integer,
	`paid_access_at` integer,
	`issued_total` integer DEFAULT 0 NOT NULL,
	`consumed_total` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`last_operation_id` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `credit_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`operation_id` text NOT NULL,
	`user_id` text,
	`subject_hash` text,
	`plan_delta` integer DEFAULT 0 NOT NULL,
	`purchased_delta` integer DEFAULT 0 NOT NULL,
	`debt_delta` integer DEFAULT 0 NOT NULL,
	`type` text NOT NULL,
	`job_id` text,
	`payment_id` text,
	`period_key` text,
	`admin_action_id` text,
	`metadata` text,
	`retain_until` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `credit_ledger_operation_unique` ON `credit_ledger` (`operation_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `credit_ledger_job_type_unique` ON `credit_ledger` (`job_id`,`type`);--> statement-breakpoint
CREATE UNIQUE INDEX `credit_ledger_payment_period_type_unique` ON `credit_ledger` (`payment_id`,`period_key`,`type`);--> statement-breakpoint
CREATE INDEX `credit_ledger_user_created_idx` ON `credit_ledger` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `download_events` (
	`id` text PRIMARY KEY NOT NULL,
	`export_id` text NOT NULL,
	`user_id` text,
	`downloaded_at` integer NOT NULL,
	FOREIGN KEY (`export_id`) REFERENCES `exports`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `download_events_export_idx` ON `download_events` (`export_id`);--> statement-breakpoint
CREATE TABLE `exports` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`version_id` text NOT NULL,
	`format` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`manifest_schema_version` integer DEFAULT 1 NOT NULL,
	`output_file_id` text,
	`failure_code` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`version_id`) REFERENCES `project_versions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`output_file_id`) REFERENCES `user_files`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `exports_user_created_idx` ON `exports` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `generated_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`version_id` text,
	`job_id` text,
	`user_file_id` text NOT NULL,
	`role` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`sha256` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`purge_after` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`version_id`) REFERENCES `project_versions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`job_id`) REFERENCES `generation_jobs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_file_id`) REFERENCES `user_files`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `generated_assets_version_idx` ON `generated_assets` (`version_id`);--> statement-breakpoint
CREATE TABLE `generation_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`channel` text NOT NULL,
	`model` text NOT NULL,
	`base_host` text NOT NULL,
	`estimated_cost_micros` integer NOT NULL,
	`status` text NOT NULL,
	`http_status` integer,
	`latency_ms` integer,
	`error_summary` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `generation_jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `generation_attempts_job_created_idx` ON `generation_attempts` (`job_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `generation_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`request_id` text NOT NULL,
	`operation` text NOT NULL,
	`input_version_id` text,
	`candidate` text,
	`quality` text,
	`credit_cost` integer NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`plan_debited` integer DEFAULT 0 NOT NULL,
	`purchased_debited` integer DEFAULT 0 NOT NULL,
	`failure_code` text,
	`output_version_id` text,
	`claimed_at` integer,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `generation_jobs_user_request_unique` ON `generation_jobs` (`user_id`,`request_id`);--> statement-breakpoint
CREATE INDEX `generation_jobs_project_created_idx` ON `generation_jobs` (`project_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `generation_jobs_status_idx` ON `generation_jobs` (`status`);--> statement-breakpoint
CREATE TABLE `image_budget_months` (
	`month` text PRIMARY KEY NOT NULL,
	`budget_micros` integer NOT NULL,
	`reserved_micros` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`last_operation_id` text,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payment_webhooks` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`order_id` text,
	`payment_id` text,
	`period_key` text,
	`product_id` text,
	`type` text NOT NULL,
	`payload_hash` text NOT NULL,
	`status` text NOT NULL,
	`error_summary` text,
	`subject_hash` text,
	`retain_until` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_webhooks_event_unique` ON `payment_webhooks` (`event_id`);--> statement-breakpoint
CREATE INDEX `payment_webhooks_order_idx` ON `payment_webhooks` (`order_id`);--> statement-breakpoint
CREATE TABLE `project_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`type` text NOT NULL,
	`parent_version_id` text,
	`parent_final_id` text,
	`candidate` text,
	`quality` text,
	`user_instruction` text,
	`prompt_template_version` text NOT NULL,
	`version_number` integer NOT NULL,
	`quality_warnings` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_versions_project_number_unique` ON `project_versions` (`project_id`,`version_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `project_versions_one_revision_per_final` ON `project_versions` (`parent_final_id`);--> statement-breakpoint
CREATE INDEX `project_versions_project_created_idx` ON `project_versions` (`project_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`brief` text NOT NULL,
	`active_version_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `projects_user_updated_idx` ON `projects` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `system_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL,
	`updated_by` text,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `usage_daily` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`utc_date` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usage_daily_user_date_unique` ON `usage_daily` (`user_id`,`utc_date`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_payment` (
	`id` text PRIMARY KEY NOT NULL,
	`price_id` text NOT NULL,
	`user_id` text,
	`customer_id` text NOT NULL,
	`subscription_id` text,
	`session_id` text,
	`invoice_id` text,
	`type` text NOT NULL,
	`scene` text,
	`interval` text,
	`status` text NOT NULL,
	`paid` integer DEFAULT false NOT NULL,
	`period_start` integer,
	`period_end` integer,
	`cancel_at_period_end` integer,
	`trial_start` integer,
	`trial_end` integer,
	`subject_hash` text,
	`retain_until` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_payment`("id", "price_id", "user_id", "customer_id", "subscription_id", "session_id", "invoice_id", "type", "scene", "interval", "status", "paid", "period_start", "period_end", "cancel_at_period_end", "trial_start", "trial_end", "subject_hash", "retain_until", "created_at", "updated_at") SELECT "id", "price_id", "user_id", "customer_id", "subscription_id", "session_id", "invoice_id", "type", "scene", "interval", "status", "paid", "period_start", "period_end", "cancel_at_period_end", "trial_start", "trial_end", NULL, NULL, "created_at", "updated_at" FROM `payment`;--> statement-breakpoint
DROP TABLE `payment`;--> statement-breakpoint
ALTER TABLE `__new_payment` RENAME TO `payment`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `payment_invoice_id_unique` ON `payment` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `payment_user_id_idx` ON `payment` (`user_id`);--> statement-breakpoint
CREATE INDEX `payment_customer_id_idx` ON `payment` (`customer_id`);--> statement-breakpoint
CREATE INDEX `payment_subscription_id_idx` ON `payment` (`subscription_id`);--> statement-breakpoint
CREATE INDEX `payment_session_id_idx` ON `payment` (`session_id`);--> statement-breakpoint
CREATE INDEX `payment_invoice_id_idx` ON `payment` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `payment_paid_idx` ON `payment` (`paid`);--> statement-breakpoint
CREATE INDEX `payment_user_paid_idx` ON `payment` (`user_id`,`paid`);--> statement-breakpoint
DROP INDEX `user_files_r2_key_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_files_r2_key_unique` ON `user_files` (`r2_key`);--> statement-breakpoint
-- Operational defaults intentionally fail closed until an administrator enters
-- model costs, a monthly hard cap, and a daily user limit.
INSERT OR IGNORE INTO `system_settings` (`key`, `value`, `updated_at`) VALUES
  ('generationEnabled', 'false', unixepoch() * 1000),
  ('gridCost', '2', unixepoch() * 1000),
  ('finalMediumCost', '10', unixepoch() * 1000),
  ('finalHighCost', '40', unixepoch() * 1000),
  ('revisionCost', '12', unixepoch() * 1000),
  ('dailyLimit', '0', unixepoch() * 1000),
  ('monthlyBudgetMicros', '0', unixepoch() * 1000),
  ('primaryGenerationLowMicros', '0', unixepoch() * 1000),
  ('primaryEditMediumMicros', '0', unixepoch() * 1000),
  ('primaryEditHighMicros', '0', unixepoch() * 1000),
  ('fallbackGenerationLowMicros', '0', unixepoch() * 1000),
  ('fallbackEditMediumMicros', '0', unixepoch() * 1000),
  ('fallbackEditHighMicros', '0', unixepoch() * 1000);