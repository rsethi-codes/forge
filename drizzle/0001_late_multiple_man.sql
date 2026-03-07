CREATE TABLE "docs_event_dedup" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "docs_event_dedup_user_id_idempotency_key_unique" UNIQUE("user_id","idempotency_key")
);