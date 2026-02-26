
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function syncSchedulingLogic() {
    try {
        console.log('Updating profiles and creating roadmap_adjustments...');

        // 1. Update profiles table
        await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reminder_email_time TEXT DEFAULT '20:00' NOT NULL`;
        await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP WITH TIME ZONE`;

        // 2. Create roadmap_adjustments table
        await sql`
            CREATE TABLE IF NOT EXISTS roadmap_adjustments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                program_id UUID NOT NULL,
                date DATE NOT NULL,
                adjustment_type TEXT NOT NULL, -- 'day_off', 'extra_day'
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                UNIQUE(user_id, date)
            )
        `;

        console.log('Database synced successfully.');
    } catch (e) {
        console.error('Error syncing database:', e);
    } finally {
        await sql.end();
        process.exit();
    }
}

syncSchedulingLogic();
