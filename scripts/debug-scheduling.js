
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function debug() {
    console.log('--- DIAGNOSTIC START ---');

    const now = new Date();
    console.log('Current Server Time:', now.toISOString());
    console.log('Today (UTC-ish):', now.toISOString().split('T')[0]);

    const profiles = await sql`SELECT id, email, last_login_at, has_started_roadmap FROM profiles`;
    console.log('Profiles:', profiles);

    const programs = await sql`SELECT id, user_id, start_date, is_active FROM roadmap_programs WHERE is_active = true`;
    console.log('Active Programs:', programs);

    if (programs.length > 0) {
        const programId = programs[0].id;
        const userId = programs[0].user_id;

        const adjustments = await sql`SELECT * FROM roadmap_adjustments WHERE program_id = ${programId}`;
        console.log('Adjustments:', adjustments);

        const progress = await sql`SELECT id, date, day_id, status FROM daily_progress WHERE user_id = ${userId} ORDER BY date DESC`;
        console.log('Daily Progress:', progress);

        const day1 = await sql`SELECT id, day_number, title FROM roadmap_days WHERE day_number = '1' LIMIT 1`;
        console.log('Day 1 Definition:', day1);
    }

    console.log('--- DIAGNOSTIC END ---');
    await sql.end();
}

debug();
