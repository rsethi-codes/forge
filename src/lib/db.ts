import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/lib/supabase/schema'

const connectionString = process.env.DATABASE_URL!

// We use the connection string directly from env. 
// If the user wants pooling, they should provide port 6543.
// If they want direct, port 5432.
const client = postgres(connectionString, {
    prepare: false,
    max: process.env.NODE_ENV === 'production' ? 10 : 5,
    idle_timeout: 20,
    connect_timeout: 10,
})

export const db = drizzle(client, { schema })
export { client }
