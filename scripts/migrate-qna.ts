import postgres from 'postgres'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in .env.local')
}

// Suppress NOTICE level messages (e.g. "already exists, skipping") from polluting output
const client = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => { } })

const migrations = [
    {
        name: 'create qna_source_type enum',
        sql: `
            DO $$ BEGIN
                CREATE TYPE "public"."qna_source_type" AS ENUM('gpt', 'blog', 'youtube', 'other');
            EXCEPTION WHEN duplicate_object THEN
                RAISE NOTICE 'qna_source_type enum already exists, skipping.';
            END $$;
        `
    },
    {
        name: 'create topic_qna table',
        sql: `
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
        `
    },
    {
        name: 'add foreign key: topic_qna -> roadmap_days',
        sql: `
            ALTER TABLE "topic_qna"
                DROP CONSTRAINT IF EXISTS "topic_qna_day_id_roadmap_days_id_fk";
            ALTER TABLE "topic_qna"
                ADD CONSTRAINT "topic_qna_day_id_roadmap_days_id_fk"
                FOREIGN KEY ("day_id") REFERENCES "public"."roadmap_days"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        `
    },
    {
        name: 'add foreign key: topic_qna -> roadmap_topics',
        sql: `
            ALTER TABLE "topic_qna"
                DROP CONSTRAINT IF EXISTS "topic_qna_topic_id_roadmap_topics_id_fk";
            ALTER TABLE "topic_qna"
                ADD CONSTRAINT "topic_qna_topic_id_roadmap_topics_id_fk"
                FOREIGN KEY ("topic_id") REFERENCES "public"."roadmap_topics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        `
    },
    {
        name: 'add foreign key: topic_qna -> roadmap_subtopics',
        sql: `
            ALTER TABLE "topic_qna"
                DROP CONSTRAINT IF EXISTS "topic_qna_subtopic_id_roadmap_subtopics_id_fk";
            ALTER TABLE "topic_qna"
                ADD CONSTRAINT "topic_qna_subtopic_id_roadmap_subtopics_id_fk"
                FOREIGN KEY ("subtopic_id") REFERENCES "public"."roadmap_subtopics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        `
    },
    {
        name: 'add indexes on topic_qna',
        sql: `
            CREATE INDEX IF NOT EXISTS "topic_qna_user_day_idx" ON "topic_qna" ("user_id", "day_id");
            CREATE INDEX IF NOT EXISTS "topic_qna_topic_idx" ON "topic_qna" ("topic_id");
            CREATE INDEX IF NOT EXISTS "topic_qna_created_at_idx" ON "topic_qna" ("created_at" DESC);
        `
    },
]

async function runMigrations() {
    console.log('\n🔧 Running Q&A feature migration...\n')

    for (const migration of migrations) {
        try {
            process.stdout.write(`  ⏳ ${migration.name}... `)
            await client.unsafe(migration.sql)
            console.log('✅')
        } catch (err: any) {
            console.log('❌')
            console.error(`\n  Failed on: "${migration.name}"`)
            console.error(`  Error: ${err.message}\n`)
            await client.end()
            process.exit(1)
        }
    }

    console.log('\n✨ Migration complete! topic_qna table is ready.\n')
    await client.end()
    process.exit(0)
}

runMigrations().catch(async (err) => {
    console.error('Unexpected error:', err)
    await client.end()
    process.exit(1)
})
