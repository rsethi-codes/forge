import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function migrate() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('DATABASE_URL is not set');
    }

    const sql = postgres(databaseUrl);

    try {
        console.log('Adding docs_base_url to roadmap_metadata...');
        await sql`
            ALTER TABLE roadmap_metadata 
            ADD COLUMN IF NOT EXISTS docs_base_url TEXT;
        `;
        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sql.end();
    }
}

migrate();
