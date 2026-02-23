-- Migration: Add FORGE Behavioral Tracking & Reward Engine

CREATE TABLE IF NOT EXISTS "time_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"day_id" uuid,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"total_active_minutes" integer DEFAULT 0 NOT NULL,
	"interruptions_count" integer DEFAULT 0 NOT NULL,
	"distractions_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "app_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid,
	"user_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"event_meta" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "nudges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid,
	"nudge_type" text NOT NULL,
	"nudge_text" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	"response" text,
	"meta" jsonb DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS "behavior_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"focus_score" integer NOT NULL,
	"procrastination_score" integer NOT NULL,
	"switch_rate" numeric NOT NULL,
	"pomodoro_success_rate" numeric NOT NULL,
	"productive_minutes" integer NOT NULL,
	"peak_productivity_window" text,
	CONSTRAINT "behavior_profile_user_id_date_unique" UNIQUE("user_id","date")
);

CREATE TABLE IF NOT EXISTS "rewards_wallet" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"coins_balance" integer DEFAULT 0 NOT NULL,
	"last_earned_at" timestamp
);

-- Add Foreign Key Constraints
DO $$ BEGIN
 ALTER TABLE "time_sessions" ADD CONSTRAINT "time_sessions_day_id_roadmap_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "roadmap_days"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "app_events" ADD CONSTRAINT "app_events_session_id_time_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "time_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "nudges" ADD CONSTRAINT "nudges_session_id_time_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "time_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
