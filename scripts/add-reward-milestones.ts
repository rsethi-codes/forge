import postgres from 'postgres'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in .env.local')
}

const client = postgres(process.env.DATABASE_URL, { max: 1 })

async function addRewardColumn() {
    console.log('🔧 Adding reward column to milestones...')
    try {
        await client.unsafe(`
            ALTER TABLE "milestones" 
            ADD COLUMN IF NOT EXISTS "reward" text;
        `)
        console.log('✅ Reward column added successfully.')
    } catch (err: any) {
        console.error('❌ Failed to add reward column:', err.message)
    } finally {
        await client.end()
    }
}

addRewardColumn()
