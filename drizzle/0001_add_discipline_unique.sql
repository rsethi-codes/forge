-- Add missing unique constraint on discipline_scores(user_id, date)
-- This is required for the ON CONFLICT upsert in discipline.ts to work

ALTER TABLE "discipline_scores"
ADD CONSTRAINT "discipline_scores_user_id_date_unique" UNIQUE ("user_id", "date");
