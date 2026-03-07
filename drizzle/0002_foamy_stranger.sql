CREATE TABLE "docs_section_rollup" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"day_id" uuid NOT NULL,
	"doc_id" text NOT NULL,
	"section_id" text NOT NULL,
	"section_title" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "docs_section_rollup_user_id_day_id_doc_id_section_id_unique" UNIQUE("user_id","day_id","doc_id","section_id")
);
--> statement-breakpoint
ALTER TABLE "docs_section_rollup" ADD CONSTRAINT "docs_section_rollup_day_id_roadmap_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."roadmap_days"("id") ON DELETE cascade ON UPDATE no action;