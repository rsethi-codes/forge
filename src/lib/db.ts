import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './supabase/schema'

const connectionString = process.env.DATABASE_URL!

// Use a global variable to store the database instance across hot-reloads in development
const globalForDb = global as unknown as {
    client: postgres.Sql | undefined
    db: any | undefined
}

if (!globalForDb.client) {
    // We use a very strict limit of 1 connection in development 
    // because Next.js HMR and multiple processes can easily exhaust Supabase Free tier slots.
    globalForDb.client = postgres(connectionString, {
        prepare: false,
        max: 1,
        idle_timeout: 5,   // Close idle connections almost immediately
        connect_timeout: 10,
    })
}

if (!globalForDb.db) {
    globalForDb.db = drizzle(globalForDb.client, { schema })
}

export const db = globalForDb.db
export const client = globalForDb.client
