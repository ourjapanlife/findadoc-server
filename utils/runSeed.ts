// runSeed.ts (DA CREARE)
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

        const seedFile = path.join(__dirname, 'seed_data.sql')
        const sql = fs.readFileSync(seedFile, 'utf8')

        console.log('🌱 Running seed script...')
        await client.query(sql)

        console.log('✅ Database seeded successfully!')
    } catch (error) {
        console.error('❌ Error seeding database:', error)
        process.exit(1)
    } finally {
        await client.end()
    }
}

runSeed()
