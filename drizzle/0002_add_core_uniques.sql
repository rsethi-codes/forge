-- Add missing unique constraints across core tables to support upsert (ON CONFLICT) operations

-- 1. Daily Progress (One record per user, per day, per date)
ALTER TABLE "daily_progress" DROP CONSTRAINT IF EXISTS "daily_progress_user_day_date_unique";
ALTER TABLE "daily_progress" ADD CONSTRAINT "daily_progress_user_day_date_unique" UNIQUE ("user_id", "day_id", "date");

-- 2. Task Completions (One record per task per daily progress log)
ALTER TABLE "task_completions" DROP CONSTRAINT IF EXISTS "task_completions_task_daily_progress_unique";
ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_task_daily_progress_unique" UNIQUE ("task_id", "daily_progress_id");

-- 3. Topic Completions (One record per topic per daily progress log)
ALTER TABLE "topic_completions" DROP CONSTRAINT IF EXISTS "topic_completions_topic_daily_progress_unique";
ALTER TABLE "topic_completions" ADD CONSTRAINT "topic_completions_topic_daily_progress_unique" UNIQUE ("topic_id", "daily_progress_id");

-- 4. Knowledge Check Results (One record per question per daily progress log)
ALTER TABLE "knowledge_check_results" DROP CONSTRAINT IF EXISTS "knowledge_check_results_kc_daily_progress_unique";
ALTER TABLE "knowledge_check_results" ADD CONSTRAINT "knowledge_check_results_kc_daily_progress_unique" UNIQUE ("knowledge_check_id", "daily_progress_id");
