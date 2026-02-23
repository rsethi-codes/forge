-- Topic Q&A Feature Migration
-- Run this in your Supabase SQL Editor

-- 1. Create the enum type
CREATE TYPE "public"."qna_source_type" AS ENUM('gpt', 'blog', 'youtube', 'other');

-- 2. Create the topic_qna table
CREATE TABLE "topic_qna" (
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

-- 3. Add foreign key constraints
ALTER TABLE "topic_qna" ADD CONSTRAINT "topic_qna_day_id_roadmap_days_id_fk" 
    FOREIGN KEY ("day_id") REFERENCES "public"."roadmap_days"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "topic_qna" ADD CONSTRAINT "topic_qna_topic_id_roadmap_topics_id_fk" 
    FOREIGN KEY ("topic_id") REFERENCES "public"."roadmap_topics"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "topic_qna" ADD CONSTRAINT "topic_qna_subtopic_id_roadmap_subtopics_id_fk" 
    FOREIGN KEY ("subtopic_id") REFERENCES "public"."roadmap_subtopics"("id") ON DELETE cascade ON UPDATE no action;

-- 4. Add indexes for common query patterns
CREATE INDEX "topic_qna_user_day_idx" ON "topic_qna" ("user_id", "day_id");
CREATE INDEX "topic_qna_topic_idx" ON "topic_qna" ("topic_id");
CREATE INDEX "topic_qna_created_at_idx" ON "topic_qna" ("created_at" DESC);
