
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function check() {
    const users = await sql`SELECT id, email, last_login_at, has_started_roadmap FROM profiles`;
    const programs = await sql`SELECT id, user_id, start_date, is_active FROM roadmap_programs WHERE is_active = true`;
    const adjustments = await sql`SELECT * FROM roadmap_adjustments`;

    console.log('Users:', users);
    console.log('Programs:', programs);
    console.log('Adjustments:', adjustments);

    await sql.end();
}

check();
