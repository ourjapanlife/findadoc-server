import pg from 'pg'
import { pathToFileURL } from 'node:url'
import { envVariables } from './environmentVariables.js'
import { namesAgree } from '../src/places/facilityPlaceMatch.js'
import { previewTargetFromMapsUrl } from '../src/places/mapsLink.js'
import { confirmPlaceId, searchPlacePreview } from '../src/places/placesClient.js'

/**
 * Fill google_place_id from the Maps link already stored on a facility.
 * Dry-run unless `--write` is passed.
 * A clear match stores the place id only. Name and address are never changed.
 * A weak match or a link with no place stays unset so a moderator can confirm it.
 */

type FacilityRow = {
    id: string
    name_en: string
    name_ja: string
    google_maps_url: string | null
}

const SEARCH_GAP_MS = 2100

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

export async function main(write = process.argv.includes('--write')) {
    const apiKey = envVariables.googleAPIKey()
    if (!apiKey) {
        throw new Error('GOOGLE_API_KEY is unset')
    }

    const client = new pg.Client(clientConfig())
    await client.connect()

    const counts = { written: 0, low: 0, unmatched: 0, missing: 0 }
    try {
        const facilities = await client.query<FacilityRow>(`
            select id, name_en, name_ja, contact #>> '{googleMapsUrl}' as google_maps_url
            from facilities
            where google_place_id is null
              and coalesce(contact #>> '{googleMapsUrl}', '') <> ''
            order by updated_date desc
        `)

        for (const facility of facilities.rows) {
            const url = facility.google_maps_url ?? ''
            const target = previewTargetFromMapsUrl(url)
            if (!target) {
                counts.unmatched += 1
                console.log(`unmatched ${facility.id} ${facility.name_en}`)
                continue
            }

            let placeId: string | null = null
            try {
                if (target.placeId) {
                    const check = await confirmPlaceId(target.placeId, apiKey)
                    placeId = check === 'confirmed' ? target.placeId : null
                    if (check === 'missing') { counts.missing += 1 }
                    if (check === 'unavailable') { counts.unmatched += 1 }
                    await sleep(200)
                } else if (target.name) {
                    const preview = await searchPlacePreview(
                        target.name,
                        target.latitude,
                        target.longitude,
                        apiKey,
                        'ja'
                    )
                    await sleep(SEARCH_GAP_MS)
                    if (preview?.placeId && namesAgree([facility.name_ja, facility.name_en], preview.name)) {
                        placeId = preview.placeId
                    } else {
                        counts.low += 1
                        console.log(`low ${facility.id} ${facility.name_en} -> ${preview?.name ?? 'none'}`)
                    }
                }
            } catch (error) {
                counts.unmatched += 1
                console.log(`unmatched ${facility.id} ${facility.name_en} ${error}`)
                continue
            }

            if (!placeId) {
                if (!target.placeId && !target.name) { counts.unmatched += 1 }
                continue
            }

            if (!write) {
                counts.written += 1
                console.log(`would write ${facility.id} ${placeId}`)
                continue
            }

            const result = await client.query(
                `update facilities
                 set google_place_id = $1, updated_date = now()
                 where id = $2 and google_place_id is null`,
                [placeId, facility.id]
            )
            if ((result.rowCount ?? 0) > 0) {
                counts.written += 1
                console.log(`write ${facility.id} ${placeId}`)
            }
        }
    } finally {
        await client.end()
    }

    console.log(counts)
    return counts
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch(error => {
        console.error(error)
        process.exitCode = 1
    })
}
