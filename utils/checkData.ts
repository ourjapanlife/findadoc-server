import pg from 'pg'

const { Client } = pg

async function checkData() {
    const client = new Client({
        host: '127.0.0.1',
        port: 54322,
        user: 'postgres',
        password: 'postgres',
        database: 'postgres'
    })

    try {
        await client.connect()
        
        const facilities = await client.query('SELECT COUNT(*) FROM facilities')
        const hps = await client.query('SELECT COUNT(*) FROM hps')
        const submissions = await client.query('SELECT COUNT(*) FROM submissions')
        
        console.log('📊 Database counts:')
        console.log(`  Facilities: ${facilities.rows[0].count}`)
        console.log(`  HPs: ${hps.rows[0].count}`)
        console.log(`  Submissions: ${submissions.rows[0].count}`)
        
        const someFacilities = await client.query('SELECT id, "nameEn", "nameJa" FROM facilities LIMIT 3')
        console.log('\n🏥 Sample facilities:')
        someFacilities.rows.forEach(f => {
            console.log(`  ${f.id} - ${f.nameEn} / ${f.nameJa}`)
        })
        
    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await client.end()
    }
}

checkData()