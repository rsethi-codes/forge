import postgres from 'postgres'
import fs from 'fs'
import path from 'path'

// Manually load .env.local because tsx context is tricky
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

async function inspectAllTables() {
    try {
        console.log('--- Full Database Audit ---')

        const res = await client`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `
        const tables = res.map(r => r.table_name)

        for (const table of tables) {
            console.log(`\nTable: ${table}`)
            const columns = await client`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = ${table}
                ORDER BY ordinal_position;
            `
            columns.forEach(c => {
                console.log(`  - ${c.column_name} (${c.data_type}) ${c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
            })
        }

    } catch (e) {
        console.error('Inspection failed:', e)
    } finally {
        await client.end()
        process.exit(0)
    }
}

inspectAllTables()
