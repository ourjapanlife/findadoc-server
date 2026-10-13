import pg from 'pg'
import { pathToFileURL } from 'node:url'
import { envVariables } from './environmentVariables.js'
import {
    planStoredLicense,
    reportStoredLicenses,
    type StoredLicenseRow
} from '../src/licenses/professionalLicense.js'

/**
 * Split a stored degree list into one primary license and extra credentials (#1014).
 * Dry-run unless `--write` is passed.
 * Degrees are not rewritten. MD+DO and DDS+DMD are queued with a suggestion.
 * A new professional is not given a license. The moderator chooses one.
 * A confirmed dual license, and any row that already has a primary license, is left alone.
 * The 18 Sep notes disagree about the DDS+DMD count. This run counts the rows it reads.
 */

type ProfessionalRow = {
    id: string
    degrees: string[] | null
    primary_license: string | null
    additional_credentials: string[] | null
    license_review: string | null
    license_recommendation: string | null
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

function storedRow(professional: ProfessionalRow): StoredLicenseRow {
    return {
        degrees: professional.degrees,
        primaryLicense: professional.primary_license,
        additionalCredentials: professional.additional_credentials,
        licenseReview: professional.license_review,
        licenseRecommendation: professional.license_recommendation
    }
}

export async function main(write = process.argv.includes('--write')) {
    const client = new pg.Client(clientConfig())
    await client.connect()

    const counts = { split: 0, needsReview: 0, unchanged: 0 }
    try {
        const professionals = await client.query<ProfessionalRow>(`
            select id,
                   degrees,
                   primary_license,
                   additional_credentials,
                   license_review,
                   license_recommendation
            from hps
            order by updated_date desc
        `)
        const report = reportStoredLicenses(professionals.rows.map(storedRow))

        console.log(JSON.stringify({ write, ...report }, null, 2))

        for (const professional of professionals.rows) {
            const plan = planStoredLicense(storedRow(professional))

            if (plan.action === 'keep') {
                counts.unchanged += 1
                continue
            }

            const credentials = JSON.stringify(plan.columns.additionalCredentials)

            if (!write) {
                if (plan.action === 'needs_review') {
                    counts.needsReview += 1
                    console.log(`would queue ${professional.id} ${plan.columns.licenseRecommendation ?? ''}`)
                } else {
                    counts.split += 1
                    console.log(`would split ${professional.id} ${plan.columns.primaryLicense ?? ''}`)
                }
                continue
            }

            if (plan.action === 'needs_review') {
                const result = await client.query(
                    `update hps
                     set license_review = $1,
                         license_recommendation = $2,
                         additional_credentials = $3::jsonb
                     where id = $4
                       and license_review is distinct from 'CONFIRMED'
                       and primary_license is null`,
                    [
                        plan.columns.licenseReview,
                        plan.columns.licenseRecommendation,
                        credentials,
                        professional.id
                    ]
                )
                if ((result.rowCount ?? 0) > 0) {
                    counts.needsReview += 1
                    console.log(`queue ${professional.id} ${plan.columns.licenseRecommendation ?? ''}`)
                }
                continue
            }

            const result = await client.query(
                `update hps
                 set primary_license = $1,
                     additional_credentials = $2::jsonb,
                     license_review = null,
                     license_recommendation = null
                 where id = $3
                   and license_review is distinct from 'CONFIRMED'
                   and primary_license is null`,
                [plan.columns.primaryLicense, credentials, professional.id]
            )
            if ((result.rowCount ?? 0) > 0) {
                counts.split += 1
                console.log(`split ${professional.id} ${plan.columns.primaryLicense ?? ''}`)
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
