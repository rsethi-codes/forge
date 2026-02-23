import { db } from './src/lib/db'
import * as schema from './src/lib/supabase/schema'

async function debugDb() {
    try {
        console.log('--- Database Audit ---')
        const allPrograms = await db.select().from(schema.roadmapPrograms)
        console.log(`Found ${allPrograms.length} programs.`)
        allPrograms.forEach(p => {
            console.log(`- ID: ${p.id}, UserID: ${p.userId}, Title: ${p.title}, Active: ${p.isActive}`)
        })

        const allUsers = await db.select({ id: schema.profiles.id, email: schema.profiles.email }).from(schema.profiles)
        console.log(`\nFound ${allUsers.length} profiles.`)
        allUsers.forEach(u => {
            console.log(`- ID: ${u.id}, Email: ${u.email}`)
        })

    } catch (e) {
        console.error('Audit failed:', e)
    } finally {
        process.exit(0)
    }
}

debugDb()
