DO $$ BEGIN
 CREATE TYPE "public"."application_status" AS ENUM('wishlist', 'applied', 'interviewing', 'offer', 'rejected', 'ghosted');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."criteria_type" AS ENUM('streak', 'days_complete', 'blog_posts', 'kc_score', 'manual');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."qna_source_type" AS ENUM('gpt', 'blog', 'youtube', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."status" AS ENUM('not_started', 'in_progress', 'complete', 'skipped');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."task_type" AS ENUM('study', 'build', 'review', 'mock');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."visibility" AS ENUM('private', 'public');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"context_type" text DEFAULT 'general' NOT NULL,
	"context_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"event" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid,
	"user_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"event_meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blog_post_series" (
	"post_id" uuid NOT NULL,
	"series_id" uuid NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blog_post_tags" (
	"post_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" jsonb NOT NULL,
	"content_html" text,
	"excerpt" text,
	"cover_image_url" text,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"reading_time_minutes" integer,
	"view_count" integer DEFAULT 0 NOT NULL,
	"technologies" jsonb DEFAULT '[]'::jsonb,
	"resources" jsonb DEFAULT '[]'::jsonb,
	"user_id" uuid NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blog_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"cover_image_url" text,
	"sort_order" integer,
	CONSTRAINT "blog_series_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blog_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"color" text,
	CONSTRAINT "blog_tags_name_unique" UNIQUE("name"),
	CONSTRAINT "blog_tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_id" uuid NOT NULL,
	"date" date NOT NULL,
	"status" "status" DEFAULT 'not_started' NOT NULL,
	"hours_logged" numeric DEFAULT '0' NOT NULL,
	"session_notes" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"user_id" uuid NOT NULL,
	CONSTRAINT "daily_progress_user_id_day_id_date_unique" UNIQUE("user_id","day_id","date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "discipline_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"streak_days" integer NOT NULL,
	"tasks_completion_rate" numeric NOT NULL,
	"hours_logged" numeric NOT NULL,
	"hours_target" numeric DEFAULT '8' NOT NULL,
	"kc_pass_rate" numeric NOT NULL,
	"discipline_score" numeric NOT NULL,
	"motivation_message" text,
	CONSTRAINT "discipline_scores_user_id_date_unique" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "end_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metadata_id" uuid NOT NULL,
	"skill" text NOT NULL,
	"outcome" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "execution_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metadata_id" uuid NOT NULL,
	"block" text NOT NULL,
	"focus" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jane_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"role_title" text NOT NULL,
	"job_url" text,
	"salary_range" text,
	"status" "application_status" DEFAULT 'wishlist' NOT NULL,
	"applied_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jane_companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"website" text,
	"logo_url" text,
	"industry" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jane_interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"round_name" text NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"feedback" text,
	"prep_material" text,
	"linked_roadmap_day" uuid,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_check_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"knowledge_check_id" uuid NOT NULL,
	"daily_progress_id" uuid NOT NULL,
	"attempted" boolean DEFAULT false NOT NULL,
	"passed" boolean DEFAULT false NOT NULL,
	"notes" text,
	"answer" text,
	"ai_score" integer,
	"ai_feedback" text,
	"missed_points" jsonb DEFAULT '[]'::jsonb,
	"understanding_level" text,
	CONSTRAINT "knowledge_check_results_knowledge_check_id_daily_progress_id_unique" UNIQUE("knowledge_check_id","daily_progress_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_check_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"check_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"answer_text" text NOT NULL,
	"ai_score" integer,
	"ai_feedback" text,
	"missed_points" jsonb DEFAULT '[]'::jsonb,
	"understanding_level" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_id" uuid NOT NULL,
	"question_number" integer NOT NULL,
	"question_text" text NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "linked_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp,
	"profile_data" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "linked_accounts_user_id_provider_unique" UNIQUE("user_id","provider")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"icon" text,
	"reward" text,
	"achieved_at" timestamp,
	"criteria_type" "criteria_type" NOT NULL,
	"criteria_value" integer NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nudges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid,
	"nudge_type" text NOT NULL,
	"nudge_text" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	"response" text,
	"meta" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pomodoro_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"daily_progress_id" uuid,
	"type" text DEFAULT 'work' NOT NULL,
	"duration_minutes" integer NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"task_id" uuid,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"bio" text,
	"avatar_url" text,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"morning_digest_time" text DEFAULT '08:00' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resume_gaps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metadata_id" uuid NOT NULL,
	"area" text NOT NULL,
	"what_resume_shows" text,
	"brutal_gap" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resume_strengths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metadata_id" uuid NOT NULL,
	"content" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rewards_wallet" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"coins_balance" integer DEFAULT 0 NOT NULL,
	"last_earned_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roadmap_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_id" uuid NOT NULL,
	"day_number" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"title" text NOT NULL,
	"focus" text,
	"estimated_hours" numeric DEFAULT '8' NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roadmap_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"subtitle" text,
	"target_package" text,
	"daily_commitment" text,
	"total_days" integer,
	"blunt_truth" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roadmap_months" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"month_number" integer NOT NULL,
	"title" text NOT NULL,
	"objective" text,
	"outcome" text,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roadmap_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"total_days" integer NOT NULL,
	"start_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"raw_content" text,
	"file_url" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roadmap_subtopics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"content" text NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roadmap_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"sort_order" integer NOT NULL,
	"task_type" "task_type" DEFAULT 'study' NOT NULL,
	"showcase_url" text,
	"showcase_image" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roadmap_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_id" uuid NOT NULL,
	"topic_number" text NOT NULL,
	"title" text NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roadmap_weeks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"month_id" uuid NOT NULL,
	"week_number" integer NOT NULL,
	"title" text NOT NULL,
	"goal" text,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"daily_progress_id" uuid NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"time_spent" integer DEFAULT 0,
	"time_spent_net" integer DEFAULT 0,
	"started_at" timestamp,
	"timer_sessions" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"timer_status" text DEFAULT 'idle',
	"last_timer_pulse" timestamp,
	CONSTRAINT "task_completions_task_id_daily_progress_id_unique" UNIQUE("task_id","daily_progress_id")
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "topic_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"daily_progress_id" uuid NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"time_spent" integer DEFAULT 0,
	"time_spent_net" integer DEFAULT 0,
	"started_at" timestamp,
	"timer_sessions" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"timer_status" text DEFAULT 'idle',
	"last_timer_pulse" timestamp,
	CONSTRAINT "topic_completions_topic_id_daily_progress_id_unique" UNIQUE("topic_id","daily_progress_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "topic_qna" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"day_id" uuid NOT NULL,
	"topic_id" uuid,
	"subtopic_id" uuid,
	"question" text NOT NULL,
	"answer_text" text,
	"source_type" "qna_source_type" DEFAULT 'gpt' NOT NULL,
	"source_url" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "app_events" ADD CONSTRAINT "app_events_session_id_time_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."time_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blog_post_series" ADD CONSTRAINT "blog_post_series_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blog_post_series" ADD CONSTRAINT "blog_post_series_series_id_blog_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."blog_series"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_tag_id_blog_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."blog_tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily_progress" ADD CONSTRAINT "daily_progress_day_id_roadmap_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."roadmap_days"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "end_goals" ADD CONSTRAINT "end_goals_metadata_id_roadmap_metadata_id_fk" FOREIGN KEY ("metadata_id") REFERENCES "public"."roadmap_metadata"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "execution_blocks" ADD CONSTRAINT "execution_blocks_metadata_id_roadmap_metadata_id_fk" FOREIGN KEY ("metadata_id") REFERENCES "public"."roadmap_metadata"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "jane_applications" ADD CONSTRAINT "jane_applications_company_id_jane_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."jane_companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "jane_interviews" ADD CONSTRAINT "jane_interviews_application_id_jane_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."jane_applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "jane_interviews" ADD CONSTRAINT "jane_interviews_linked_roadmap_day_roadmap_days_id_fk" FOREIGN KEY ("linked_roadmap_day") REFERENCES "public"."roadmap_days"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_check_results" ADD CONSTRAINT "knowledge_check_results_knowledge_check_id_knowledge_checks_id_fk" FOREIGN KEY ("knowledge_check_id") REFERENCES "public"."knowledge_checks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_check_results" ADD CONSTRAINT "knowledge_check_results_daily_progress_id_daily_progress_id_fk" FOREIGN KEY ("daily_progress_id") REFERENCES "public"."daily_progress"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_check_submissions" ADD CONSTRAINT "knowledge_check_submissions_check_id_knowledge_checks_id_fk" FOREIGN KEY ("check_id") REFERENCES "public"."knowledge_checks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_checks" ADD CONSTRAINT "knowledge_checks_day_id_roadmap_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."roadmap_days"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nudges" ADD CONSTRAINT "nudges_session_id_time_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."time_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pomodoro_sessions" ADD CONSTRAINT "pomodoro_sessions_daily_progress_id_daily_progress_id_fk" FOREIGN KEY ("daily_progress_id") REFERENCES "public"."daily_progress"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pomodoro_sessions" ADD CONSTRAINT "pomodoro_sessions_task_id_roadmap_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."roadmap_tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resume_gaps" ADD CONSTRAINT "resume_gaps_metadata_id_roadmap_metadata_id_fk" FOREIGN KEY ("metadata_id") REFERENCES "public"."roadmap_metadata"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resume_strengths" ADD CONSTRAINT "resume_strengths_metadata_id_roadmap_metadata_id_fk" FOREIGN KEY ("metadata_id") REFERENCES "public"."roadmap_metadata"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "roadmap_days" ADD CONSTRAINT "roadmap_days_week_id_roadmap_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."roadmap_weeks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "roadmap_metadata" ADD CONSTRAINT "roadmap_metadata_program_id_roadmap_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."roadmap_programs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "roadmap_months" ADD CONSTRAINT "roadmap_months_program_id_roadmap_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."roadmap_programs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "roadmap_subtopics" ADD CONSTRAINT "roadmap_subtopics_topic_id_roadmap_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."roadmap_topics"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "roadmap_tasks" ADD CONSTRAINT "roadmap_tasks_day_id_roadmap_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."roadmap_days"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "roadmap_topics" ADD CONSTRAINT "roadmap_topics_day_id_roadmap_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."roadmap_days"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "roadmap_weeks" ADD CONSTRAINT "roadmap_weeks_month_id_roadmap_months_id_fk" FOREIGN KEY ("month_id") REFERENCES "public"."roadmap_months"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_task_id_roadmap_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."roadmap_tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_daily_progress_id_daily_progress_id_fk" FOREIGN KEY ("daily_progress_id") REFERENCES "public"."daily_progress"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "time_sessions" ADD CONSTRAINT "time_sessions_day_id_roadmap_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."roadmap_days"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "topic_completions" ADD CONSTRAINT "topic_completions_topic_id_roadmap_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."roadmap_topics"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "topic_completions" ADD CONSTRAINT "topic_completions_daily_progress_id_daily_progress_id_fk" FOREIGN KEY ("daily_progress_id") REFERENCES "public"."daily_progress"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "topic_qna" ADD CONSTRAINT "topic_qna_day_id_roadmap_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."roadmap_days"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "topic_qna" ADD CONSTRAINT "topic_qna_topic_id_roadmap_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."roadmap_topics"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "topic_qna" ADD CONSTRAINT "topic_qna_subtopic_id_roadmap_subtopics_id_fk" FOREIGN KEY ("subtopic_id") REFERENCES "public"."roadmap_subtopics"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;