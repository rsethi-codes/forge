import postgres from 'postgres'
import fs from 'fs'
import path from 'path'

// Manually load .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars: any = {}
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim()
    }
})

const connectionString = envVars.DATABASE_URL
const client = postgres(connectionString, { prepare: false, onnotice: () => { } })

async function runSql(name: string, sql: string) {
    try {
        console.log(`Executing: ${name}...`)
        await client.unsafe(sql)
        console.log(`  Success: ${name}`)
    } catch (e: any) {
        console.warn(`  Warning/Error on ${name}:`, e.message)
    }
}

async function nuclearFix() {
    try {
        console.log('=== NUCLEAR SCHEMA FIX START ===')

        // 1. Enums
        await runSql('task_type enum', "DO $$ BEGIN CREATE TYPE task_type AS ENUM ('study', 'build', 'review', 'mock'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
        await runSql('application_status enum', "DO $$ BEGIN CREATE TYPE application_status AS ENUM ('wishlist', 'applied', 'interviewing', 'offer', 'rejected', 'ghosted'); EXCEPTION WHEN duplicate_object THEN null; END $$;")

        // 2. roadmap_programs
        await runSql('roadmap_programs user_id', "ALTER TABLE roadmap_programs ADD COLUMN IF NOT EXISTS user_id UUID;")

        // 3. discipline_scores
        await runSql('discipline_scores user_id', "ALTER TABLE discipline_scores ADD COLUMN IF NOT EXISTS user_id UUID;")

        // 4. daily_progress
        await runSql('daily_progress user_id', "ALTER TABLE daily_progress ADD COLUMN IF NOT EXISTS user_id UUID;")

        // 5. milestones
        await runSql('milestones user_id', "ALTER TABLE milestones ADD COLUMN IF NOT EXISTS user_id UUID;")

        // 6. blog_posts
        await runSql('blog_posts user_id', "ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS user_id UUID;")

        // 7. pomodoro_sessions
        await runSql('pomodoro_sessions full reconstruct', `
            CREATE TABLE IF NOT EXISTS pomodoro_sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                daily_progress_id UUID,
                type TEXT DEFAULT 'work' NOT NULL,
                duration_minutes INTEGER NOT NULL,
                completed BOOLEAN DEFAULT FALSE NOT NULL,
                started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                completed_at TIMESTAMP WITH TIME ZONE,
                task_id UUID
            );
        `)
        // Add missing columns to pomodoro if it already existed partially
        await runSql('pomodoro daily_progress_id', "ALTER TABLE pomodoro_sessions ADD COLUMN IF NOT EXISTS daily_progress_id UUID;")
        await runSql('pomodoro completed_at', "ALTER TABLE pomodoro_sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;")
        await runSql('pomodoro task_id', "ALTER TABLE pomodoro_sessions ADD COLUMN IF NOT EXISTS task_id UUID;")

        // 8. Profiles (consistency check)
        await runSql('profiles email unique', "ALTER TABLE profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);")

        // 9. Data Linkage (if profiles exist)
        const profiles = await client`SELECT id FROM profiles LIMIT 1`
        if (profiles.length > 0) {
            const firstId = profiles[0].id
            console.log(`\nLinking orphaned data to profile: ${firstId}`)
            const tables = ['roadmap_programs', 'discipline_scores', 'daily_progress', 'milestones', 'blog_posts', 'pomodoro_sessions']
            for (const table of tables) {
                await runSql(`Link ${table}`, `UPDATE ${table} SET user_id = '${firstId}' WHERE user_id IS NULL;`)
            }
        }

        console.log('\n=== NUCLEAR SCHEMA FIX COMPLETED ===')

    } catch (e) {
        console.error('Fatal nuclear fix error:', e)
    } finally {
        await client.end()
        process.exit(0)
    }
}

nuclearFix()
