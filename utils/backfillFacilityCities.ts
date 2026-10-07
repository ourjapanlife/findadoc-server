import pg from 'pg'
import { envVariables } from './environmentVariables.js'
import {
    meetsPublishedCityBar,
    planFacilityCity,
    reportFacilityCities,
    type CityRecord,
    type WeightedFacilityCity
} from '../src/vocabulary/facilityCityBackfill.js'

/**
 * Point stored facilities at a city row (#1011).
 * Dry-run unless `--write` is passed. Unmatched rows are left unresolved.
 * A confirmed facility keeps the name and address a moderator already saved.
 */

type FacilityRow = {
    id: string
    verification_status: string
    city_id: string | null
    prefecture_en: string | null
    city_en: string | null
    city_ja: string | null
}

const write = process.argv.includes('--write')

function clientConfig() {
    const password = envVariables.pgPassword()
    const host = envVariables.pgHost() || '127.0.0.1'
    const port = Number(envVariables.pgPort() || (envVariables.isProduction() ? 5432 : 54322))

    if (port === 6543) {
        throw new Error('Use the session database port 5432. The transaction pooler cannot apply this backfill.')
    }

    return {
        host,
        port,
        user: envVariables.pgUser() || 'postgres',
        password: password || 'postgres',
        database: 'postgres'
    }
}

async function main() {
    const client = new pg.Client(clientConfig())
    await client.connect()

    try {
        const cityResult = await client.query<{
            id: string
            name_en: string
            name_ja: string
            prefecture_en: string
        }>(`
            select cities.id, cities.name_en, cities.name_ja, prefectures.name_en as prefecture_en
            from cities
            join prefectures on prefectures.id = cities.prefecture_id
        `)
        const cities: CityRecord[] = cityResult.rows.map(row => ({
            id: row.id,
            prefectureEn: row.prefecture_en,
            nameEn: row.name_en,
            nameJa: row.name_ja
        }))
        const facilities = await client.query<FacilityRow>(`
            select id,
                   verification_status,
                   city_id,
                   contact #>> '{address,prefectureEn}' as prefecture_en,
                   contact #>> '{address,cityEn}' as city_en,
                   contact #>> '{address,cityJa}' as city_ja
            from facilities
        `)
        const weighted: WeightedFacilityCity[] = facilities.rows.map(row => ({
            weight: 1,
            verificationStatus: row.verification_status,
            cityId: row.city_id,
            prefectureEn: row.prefecture_en ?? '',
            cityEn: row.city_en ?? '',
            cityJa: row.city_ja ?? ''
        }))
        const report = reportFacilityCities(weighted, cities)

        console.log(JSON.stringify({
            write,
            total: report.total,
            mapped: report.mapped,
            unmatched: report.unmatched,
            rate: Number(report.rate.toFixed(4)),
            genericPublished: report.genericPublished,
            reviewReasons: report.reviewReasons,
            tokyo: report.tokyo,
            redirects: report.redirects
        }, null, 2))

        if (!meetsPublishedCityBar(report)) {
            console.error('Backfill does not meet the published-city bar. No rows were written.')
            process.exitCode = 1
            return
        }

        if (!write) {
            return
        }

        await client.query('begin')

        try {
            for (const row of facilities.rows) {
                const plan = planFacilityCity({
                    verificationStatus: row.verification_status,
                    cityId: row.city_id,
                    prefectureEn: row.prefecture_en ?? '',
                    cityEn: row.city_en ?? '',
                    cityJa: row.city_ja ?? ''
                }, cities)

                if (plan.action !== 'assign') {
                    continue
                }

                if (plan.rewriteCityNames) {
                    await client.query(
                        `update facilities
                         set city_id = $1,
                             verification_status = $2,
                             contact = jsonb_set(
                                 jsonb_set(contact, '{address,cityEn}', to_jsonb($3::text), false),
                                 '{address,cityJa}',
                                 to_jsonb($4::text),
                                 false
                             )
                         where id = $5 and city_id is null`,
                        [plan.cityId, plan.verificationStatus, plan.nameEn, plan.nameJa, row.id]
                    )
                } else {
                    await client.query(
                        `update facilities
                         set city_id = $1,
                             verification_status = $2
                         where id = $3 and city_id is null`,
                        [plan.cityId, plan.verificationStatus, row.id]
                    )
                }
            }

            await client.query('commit')
        } catch (error) {
            await client.query('rollback')
            throw error
        }
    } finally {
        await client.end()
    }
}

main().catch(error => {
    console.error(error instanceof Error ? error.message : 'City backfill failed')
    process.exit(1)
})
