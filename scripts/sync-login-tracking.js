
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function sync() {
    console.log('Adding more profile and tracking fields...');

    try {
        // 1. Add fields to profiles
        await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE`;
        await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_started_roadmap BOOLEAN DEFAULT FALSE NOT NULL`;

        // 2. Add scheduled date tracking to daily_progress if not already there
        // This helps track "Consistency" by comparing actual date vs target date
        await sql`ALTER TABLE daily_progress ADD COLUMN IF NOT EXISTS target_date DATE`;

        console.log('Database synced successfully.');
    } catch (error) {
        console.error('Error syncing database:', error);
    } finally {
        await sql.end();
    }
}

sync();
