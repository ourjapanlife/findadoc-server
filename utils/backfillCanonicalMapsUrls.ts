import pg from 'pg'
import { pathToFileURL } from 'node:url'
import { envVariables } from './environmentVariables.js'
import { canonicalMapsFields } from '../src/places/mapsLink.js'

/**
 * Rewrite stored Maps links to one canonical URL.
 * Dry-run unless `--write` is passed.
 * A short link is opened once. A link that does not identify one place is left unchanged.
 * Facility name, address, and other contact fields are not changed.
 * google_place_id is filled only when it is still empty.
 */

type FacilityRow = {
    id: string
    google_maps_url: string | null
    google_place_id: string | null
}

type SubmissionRow = {
    id: string
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

    const counts = { facilities: 0, submissions: 0, unchanged: 0 }
    try {
        const facilities = await client.query<FacilityRow>(`
            select id,
                   contact #>> '{googleMapsUrl}' as google_maps_url,
                   google_place_id
            from facilities
            where coalesce(contact #>> '{googleMapsUrl}', '') <> ''
            order by updated_date desc
        `)

        for (const facility of facilities.rows) {
            const storedUrl = facility.google_maps_url ?? ''
            const maps = await canonicalMapsFields(storedUrl)
            const urlChanges = maps.url !== storedUrl
            const placeIdChanges = !facility.google_place_id && Boolean(maps.placeId)
            if (!urlChanges && !placeIdChanges) {
                counts.unchanged += 1
                continue
            }

            if (!write) {
                counts.facilities += 1
                console.log(`would write facility ${facility.id} ${maps.placeId ?? facility.google_place_id ?? ''} ${maps.url}`)
                continue
            }

            const result = await client.query(
                `update facilities
                 set google_place_id = coalesce(google_place_id, $1),
                     contact = jsonb_set(contact, '{googleMapsUrl}', to_jsonb($2::text), true)
                 where id = $3
                   and (
                     contact #>> '{googleMapsUrl}' is distinct from $2
                     or (google_place_id is null and $1::text is not null)
                   )`,
                [maps.placeId, maps.url, facility.id]
            )
            if ((result.rowCount ?? 0) > 0) {
                counts.facilities += 1
                console.log(`write facility ${facility.id} ${maps.placeId ?? ''}`)
            }
        }

        const submissions = await client.query<SubmissionRow>(`
            select id, google_maps_url
            from submissions
            where coalesce(google_maps_url, '') <> ''
            order by updated_date desc
        `)

        for (const submission of submissions.rows) {
            const storedUrl = submission.google_maps_url ?? ''
            const maps = await canonicalMapsFields(storedUrl)
            if (maps.url === storedUrl) {
                counts.unchanged += 1
                continue
            }

            if (!write) {
                counts.submissions += 1
                console.log(`would write submission ${submission.id} ${maps.placeId ?? ''} ${maps.url}`)
                continue
            }

            const result = await client.query(
                `update submissions
                 set google_maps_url = $1
                 where id = $2
                   and google_maps_url is distinct from $1`,
                [maps.url, submission.id]
            )
            if ((result.rowCount ?? 0) > 0) {
                counts.submissions += 1
                console.log(`write submission ${submission.id} ${maps.placeId ?? ''}`)
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
