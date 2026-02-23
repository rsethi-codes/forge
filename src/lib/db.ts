import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './supabase/schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
    throw new Error(
        'DATABASE_URL environment variable is not set. ' +
        'Please set it in your Vercel project settings or .env.local.'
    )
}

// In production (Vercel), Node.js module cache persists between warm invocations.
// We create ONE client per module load — this is safe and correct for serverless.
// Do NOT use the globalForDb pattern: it causes "Cannot read properties of undefined
// (reading 'workers')" errors when the global is partially initialized on cold starts.

const isProduction = process.env.NODE_ENV === 'production'

const client = postgres(connectionString, {
    prepare: false,
    // In production, allow more connections for concurrency. Vercel scales functions
    // horizontally, so each function instance has its own pool — keep it small to
    // avoid exhausting Supabase connection limits.
    max: isProduction ? 3 : 1,
    idle_timeout: isProduction ? 30 : 5,
    connect_timeout: 10,
    // Required for Supabase pooler (Transaction mode)
    connection: {
        application_name: 'forge-app',
    },
})

export const db = drizzle(client, { schema })
export { client }
