CREATE TABLE "job_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_name" varchar(255) NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text DEFAULT 'running' NOT NULL,
	"duration_ms" integer,
	"result" jsonb,
	"error" text,
	"instance_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"cron" varchar(100) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"timeout_ms" integer DEFAULT 30000 NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "job_executions_job_name_idx" ON "job_executions" USING btree ("job_name");--> statement-breakpoint
CREATE INDEX "job_executions_started_at_idx" ON "job_executions" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "job_executions_status_idx" ON "job_executions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "scheduled_jobs_name_idx" ON "scheduled_jobs" USING btree ("name");