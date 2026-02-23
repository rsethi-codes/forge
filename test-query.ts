import postgres from 'postgres'
import fs from 'fs'
import path from 'path'

// Manually load .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars: any = {}
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim()
    }
})

const connectionString = envVars.DATABASE_URL
const client = postgres(connectionString, { prepare: false })

async function testQuery() {
    try {
        console.log('--- Testing Query from Roadmap.ts ---')
        const res = await client.unsafe(`select "id", "user_id", "title", "description", "total_days", "start_date" from "roadmap_programs" limit 1`)
        console.log('Result:', res)

        console.log('\n--- Testing Query from Jane.ts ---')
        const janeRes = await client.unsafe(`select "id", "user_id", "role_title" from "jane_applications" limit 1`)
        console.log('Result:', janeRes)

    } catch (e: any) {
        console.error('Test failed:', e.message)
        console.error('Error details:', e)
    } finally {
        await client.end()
        process.exit(0)
    }
}

testQuery()
