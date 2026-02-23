import postgres from 'postgres'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in .env.local')
}

const client = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => { } })

const migrations = [
    {
        name: 'add timer columns to task_completions',
        sql: `
            ALTER TABLE task_completions
                ADD COLUMN IF NOT EXISTS time_spent_net integer DEFAULT 0,
                ADD COLUMN IF NOT EXISTS started_at timestamp,
                ADD COLUMN IF NOT EXISTS timer_sessions jsonb DEFAULT '[]'::jsonb;
        `
    },
    {
        name: 'add timer columns to topic_completions',
        sql: `
            ALTER TABLE topic_completions
                ADD COLUMN IF NOT EXISTS time_spent_net integer DEFAULT 0,
                ADD COLUMN IF NOT EXISTS started_at timestamp,
                ADD COLUMN IF NOT EXISTS timer_sessions jsonb DEFAULT '[]'::jsonb;
        `
    },
    {
        name: 'convert task_completions.time_spent to seconds (was minutes, now seconds)',
        sql: `
            -- Update existing rows: multiply minutes by 60 to convert to seconds
            -- Only update rows where time_spent is plausibly in minutes (< 480 which would be 8 hours in minutes)
            UPDATE task_completions
            SET time_spent = time_spent * 60
            WHERE time_spent > 0 AND time_spent < 480;
        `
    },
    {
        name: 'convert topic_completions.time_spent to seconds',
        sql: `
            UPDATE topic_completions
            SET time_spent = time_spent * 60
            WHERE time_spent > 0 AND time_spent < 480;
        `
    },
]

async function runMigrations() {
    console.log('\n🔧 Running timer feature migration...\n')
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
    console.log('\n✨ Timer migration complete!\n')
    await client.end()
    process.exit(0)
}

runMigrations().catch(async (err) => {
    console.error('Unexpected error:', err)
    await client.end()
    process.exit(1)
})
