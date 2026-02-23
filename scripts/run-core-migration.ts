import postgres from 'postgres'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: '.env.local' })

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in .env.local')
}

const client = postgres(process.env.DATABASE_URL, { max: 1 })

async function runManualMigration() {
    const migrationPath = path.join(process.cwd(), 'drizzle', '0002_add_core_uniques.sql')
    console.log(`🔧 Running manual migration: ${migrationPath}`)

    try {
        const sql = fs.readFileSync(migrationPath, 'utf8')
        // Split by statement-breakpoint if needed, but here we can just run the whole thing
        await client.unsafe(sql)
        console.log('✅ Core unique constraints added successfully.')
    } catch (err: any) {
        console.error('❌ Migration failed:', err.message)
    } finally {
        await client.end()
    }
}

runManualMigration()
