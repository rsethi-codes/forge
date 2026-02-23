
import * as dotenv from 'dotenv';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const sql_url = process.env.DATABASE_URL;

if (!sql_url) {
    console.error('DATABASE_URL is not set in .env.local');
    process.exit(1);
}

const sql = postgres(sql_url);

async function runMigration() {
    try {
        const migrationPath = path.join(process.cwd(), 'drizzle', '0003_behavior_engine.sql');
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migration: 0003_behavior_engine.sql...');

        // Split by semicolon and run each statement if possible, or run as a whole block
        // Since it's Postgres, running the whole block should be fine if there are no dollar-quoted issues that break simple splitting
        // But better to just run the whole content.
        await sql.unsafe(migrationSql);

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sql.end();
    }
}

runMigration();
