
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function syncProfileTable() {
    try {
        console.log('Synchronizing profiles table...');

        // Add new columns if they don't exist
        await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vanity_handle TEXT UNIQUE`;
        await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS headline TEXT`;
        await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_url TEXT`;
        await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT`;
        await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter_url TEXT`;
        await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url TEXT`;
        await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE NOT NULL`;
        await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_roadmap BOOLEAN DEFAULT TRUE NOT NULL`;
        await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_blogs BOOLEAN DEFAULT TRUE NOT NULL`;
        await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role_interested TEXT`;
        await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb`;

        console.log('Profiles table updated successfully.');
    } catch (e) {
        console.error('Error syncing profiles:', e);
    } finally {
        await sql.end();
        process.exit();
    }
}

syncProfileTable();
