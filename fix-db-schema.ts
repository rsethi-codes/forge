import postgres from 'postgres'
import fs from 'fs'
import path from 'path'

// Manually load .env.local because tsx context is tricky
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

async function runSql(name: string, sql: any) {
    try {
        console.log(`Running: ${name}...`)
        await sql
    } catch (e: any) {
        console.warn(`Warning/Error on ${name}:`, e.message)
    }
}

async function fixSchema() {
    try {
        console.log('--- Fixing Database Schema v3 ---')

        await runSql('task_type enum', client`DO $$ BEGIN CREATE TYPE task_type AS ENUM ('study', 'build', 'review', 'mock'); EXCEPTION WHEN duplicate_object THEN null; END $$;`)
        await runSql('status enum', client`DO $$ BEGIN CREATE TYPE status AS ENUM ('not_started', 'in_progress', 'complete', 'skipped'); EXCEPTION WHEN duplicate_object THEN null; END $$;`)
        await runSql('visibility enum', client`DO $$ BEGIN CREATE TYPE visibility AS ENUM ('private', 'public'); EXCEPTION WHEN duplicate_object THEN null; END $$;`)
        await runSql('criteria_type enum', client`DO $$ BEGIN CREATE TYPE criteria_type AS ENUM ('streak', 'days_complete', 'blog_posts', 'kc_score', 'manual'); EXCEPTION WHEN duplicate_object THEN null; END $$;`)
        await runSql('application_status enum', client`DO $$ BEGIN CREATE TYPE application_status AS ENUM ('wishlist', 'applied', 'interviewing', 'offer', 'rejected', 'ghosted'); EXCEPTION WHEN duplicate_object THEN null; END $$;`)

        const tables = [
            'roadmap_programs',
            'discipline_scores',
            'daily_progress',
            'milestones',
            'blog_posts',
            'analytics_events'
        ]

        for (const table of tables) {
            await runSql(`Add user_id to ${table}`, client.unsafe(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS user_id UUID;`))
        }

        await runSql('Create jane_companies', client`
            CREATE TABLE IF NOT EXISTS jane_companies (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                name TEXT NOT NULL,
                website TEXT,
                logo_url TEXT,
                industry TEXT,
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            );
        `)

        await runSql('Create jane_applications', client`
            CREATE TABLE IF NOT EXISTS jane_applications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                company_id UUID NOT NULL REFERENCES jane_companies(id) ON DELETE CASCADE,
                role_title TEXT NOT NULL,
                job_url TEXT,
                salary_range TEXT,
                status application_status DEFAULT 'wishlist' NOT NULL,
                applied_at TIMESTAMP WITH TIME ZONE,
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            );
        `)

        await runSql('Create jane_interviews', client`
            CREATE TABLE IF NOT EXISTS jane_interviews (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                application_id UUID NOT NULL REFERENCES jane_applications(id) ON DELETE CASCADE,
                round_name TEXT NOT NULL,
                scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
                feedback TEXT,
                prep_material TEXT,
                linked_roadmap_day UUID,
                status TEXT DEFAULT 'scheduled' NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            );
        `)

        await runSql('Create pomodoro_sessions', client`
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

        const profiles = await client`SELECT id FROM profiles LIMIT 1`
        if (profiles.length > 0) {
            const firstId = profiles[0].id
            console.log(`Linking orphaned data to profile: ${firstId}`)
            for (const table of tables) {
                await runSql(`Update ${table} owner`, client.unsafe(`UPDATE ${table} SET user_id = '${firstId}' WHERE user_id IS NULL;`))
            }
        }

        console.log('Schema fix v3 completed successfully.')

    } catch (e) {
        console.error('Fatal schema fix error:', e)
    } finally {
        await client.end()
        process.exit(0)
    }
}

fixSchema()
