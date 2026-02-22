import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../src/lib/supabase/schema'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
}

const client = postgres(process.env.DATABASE_URL)
const db = drizzle(client, { schema })

const predefinedMilestones = [
    { title: "First Day Done", description: "Complete Day 1", icon: "🚀", criteriaType: "days_complete", criteriaValue: 1 },
    { title: "First Week Warrior", description: "Complete all 7 days of Week 1", icon: "⚔️", criteriaType: "days_complete", criteriaValue: 7 },
    { title: "Double Digits", description: "Complete Day 10", icon: "🔟", criteriaType: "days_complete", criteriaValue: 10 },
    { title: "Halfway There", description: "Complete Day 30", icon: "🏃", criteriaType: "days_complete", criteriaValue: 30 },
    { title: "7-Day Streak", description: "Maintain 7 consecutive complete days", icon: "🔥", criteriaType: "streak", criteriaValue: 7 },
    { title: "30-Day Streak", description: "Maintain 30 consecutive complete days", icon: "💀", criteriaType: "streak", criteriaValue: 30 },
    { title: "First Blog Post", description: "Publish first public blog post", icon: "✍️", criteriaType: "blog_posts", criteriaValue: 1 },
    { title: "5 Blog Posts", description: "Publish 5 public blog posts", icon: "📚", criteriaType: "blog_posts", criteriaValue: 5 },
    { title: "Knowledge Champion", description: "90%+ KC pass rate across 10 days", icon: "🧠", criteriaType: "kc_score", criteriaValue: 90 },
    { title: "Iron Discipline", description: "Discipline score above 85 for 7 consecutive days", icon: "🛡️", criteriaType: "manual", criteriaValue: 85 },
    { title: "Month 1 Complete", description: "Complete all days in Month 1", icon: "🗓️", criteriaType: "days_complete", criteriaValue: 30 },
    { title: "Program Complete", description: "Complete all 60 days", icon: "👑", criteriaType: "days_complete", criteriaValue: 60 },
]

async function seed() {
    console.log('🌱 Seeding milestones...')

    for (const milestone of predefinedMilestones) {
        await db.insert(schema.milestones).values(milestone as any).onConflictDoNothing()
    }

    console.log('✅ Seeding complete!')
    process.exit(0)
}

seed().catch((err) => {
    console.error('❌ Seeding failed!')
    console.error(err)
    process.exit(1)
})
