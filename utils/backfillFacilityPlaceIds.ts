import pg from 'pg'
import { pathToFileURL } from 'node:url'
import { envVariables } from './environmentVariables.js'
import { canonicalMapsLink, resolveMapsPlace } from '../src/places/mapsLink.js'

/**
 * Fill google_place_id from the Maps link already stored on a facility.
 * Dry-run unless `--write` is passed.
 * A short link is opened once so its redirect can be read. Places Text Search is not called.
 * The stored Maps URL is rewritten to the normalized form that carries the place id.
 * Name and address are never changed.
 */

type FacilityRow = {
    id: string
    name_en: string
    name_ja: string
    google_maps_url: string | null
}

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
    const client = new pg.Client(clientConfig())
    await client.connect()

    const counts = { written: 0, unmatched: 0 }
    try {
        const facilities = await client.query<FacilityRow>(`
            select id, name_en, name_ja, contact #>> '{googleMapsUrl}' as google_maps_url
            from facilities
            where google_place_id is null
              and coalesce(contact #>> '{googleMapsUrl}', '') <> ''
            order by updated_date desc
        `)

        for (const facility of facilities.rows) {
            const storedUrl = facility.google_maps_url ?? ''
            const target = await resolveMapsPlace(storedUrl)
            const canonical = target ? canonicalMapsLink(target) : null
            if (!target?.placeId || !canonical) {
                counts.unmatched += 1
                console.log(`unmatched ${facility.id} ${facility.name_en} ${storedUrl}`)
                continue
            }

            if (!write) {
                counts.written += 1
                console.log(`would write ${facility.id} ${target.placeId} ${canonical}`)
                continue
            }

            const result = await client.query(
                `update facilities
                 set google_place_id = $1,
                     contact = jsonb_set(contact, '{googleMapsUrl}', to_jsonb($2::text), true),
                     updated_date = now()
                 where id = $3 and google_place_id is null`,
                [target.placeId, canonical, facility.id]
            )
            if ((result.rowCount ?? 0) > 0) {
                counts.written += 1
                console.log(`write ${facility.id} ${target.placeId}`)
            }
        }
    } finally {
        await client.end()
    }

    console.log(counts)
    return counts
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch(error => {
        console.error(error)
        process.exitCode = 1
    })
}
