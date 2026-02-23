import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/lib/supabase/schema'

const connectionString = process.env.DATABASE_URL!

// Use a lazy initialization pattern.
// This prevents the "Cannot read properties of undefined (reading 'workers')" error
// because the 'postgres' client is not created during the module evaluation phase
// (cold start), but only when the first database query is actually made.

let queryClient: postgres.Sql | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getClient() {
    if (!queryClient) {
        // ... (rest of the logic remains same)
        queryClient = postgres(connectionString, {
            prepare: false,
            max: process.env.NODE_ENV === 'production' ? 5 : 1,
            idle_timeout: 20,
            connect_timeout: 10,
            connection: {
                application_name: 'forge-app',
            },
        });
    }
    return queryClient;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
    get(target, prop, receiver) {
        if (!dbInstance) {
            dbInstance = drizzle(getClient(), { schema });
        }
        return Reflect.get(dbInstance, prop, receiver);
    }
});

export { queryClient as client };
