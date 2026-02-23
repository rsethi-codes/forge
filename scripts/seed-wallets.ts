
import * as dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config({ path: '.env.local' });

const sql_url = process.env.DATABASE_URL;

if (!sql_url) {
    console.error('DATABASE_URL is not set in .env.local');
    process.exit(1);
}

const sql = postgres(sql_url);

async function seedWallets() {
    try {
        console.log('Fetching active users...');
        const users = await sql`SELECT DISTINCT user_id FROM roadmap_programs`;

        for (const user of users) {
            console.log(`Seeding wallet for user ${user.user_id}...`);
            await sql`
            INSERT INTO rewards_wallet (user_id, coins_balance, last_earned_at)
            VALUES (${user.user_id}, 10, now())
            ON CONFLICT (user_id) DO NOTHING
          `;
        }

        console.log('Seeding completed.');
    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await sql.end();
    }
}

seedWallets();
