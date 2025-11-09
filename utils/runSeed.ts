import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const { Client } = pg

async function runSeed() {
    const client = new Client({
        host: '127.0.0.1',
        port: 54322,
        user: 'postgres',
        password: 'postgres',
        database: 'postgres'
    })

    try {
        console.log('🌱 Connecting to database...')
        await client.connect()
        console.log('✅ Connected!')

        const seedFile = path.join(__dirname, 'seed_data.sql')
        console.log(`📄 Reading seed file: ${seedFile}`)
        
        if (!fs.existsSync(seedFile)) {
            throw new Error(`Seed file not found: ${seedFile}`)
        }
        
        const sql = fs.readFileSync(seedFile, 'utf8')
        console.log(`📝 SQL file size: ${sql.length} characters`)

        console.log('🌱 Running seed script...')
        const result = await client.query(sql)
        console.log('📊 Query result:', result)

        const count = await client.query('SELECT COUNT(*) FROM facilities')
        console.log(`✅ Facilities count after seed: ${count.rows[0].count}`)

        console.log('✅ Database seeded successfully!')
    } catch (error) {
        console.error('❌ Error seeding database:', error)
        process.exit(1)
    } finally {
        await client.end()
    }
}

runSeed()