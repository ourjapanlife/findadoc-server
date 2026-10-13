import { Degree } from '../typeDefs/gqlTypes.js'

/**
 * One clinical license, with extra credentials stored separately (#1014).
 * MD+DO and DDS+DMD stay in the moderator queue. A confirmed dual is left alone.
 * The snapshot notes disagree (90 vs 86 DDS+DMD). This counts stored rows and does not collapse them.
 */

export const CLINICAL_LICENSES: readonly Degree[] = [
    Degree.Cnm,
    Degree.Dc,
    Degree.Dds,
    Degree.Dmd,
    Degree.Dnp,
    Degree.Do,
    Degree.Dpm,
    Degree.Dpt,
    Degree.Md,
    Degree.Np,
    Degree.Od,
    Degree.Pa,
    Degree.PharmD,
    Degree.PsyD
]

export const ADDITIONAL_CREDENTIALS: readonly Degree[] = [
    Degree.DSc,
    Degree.Mph,
    Degree.PhD
]

/** Offered in the enum, hidden from the moderation picker until there is a use case. */
export const HIDDEN_FROM_PICKER: readonly Degree[] = [
    Degree.Dsw,
    Degree.Dvm,
    Degree.EdD
]

export const LicenseReview = {
    NeedsReview: 'NEEDS_REVIEW',
    Confirmed: 'CONFIRMED'
} as const

export type LicenseReviewValue = typeof LicenseReview[keyof typeof LicenseReview]

export const LicenseRecommendation = {
    Md: 'MD',
    OneDentalLicense: 'one_dental_license',
    ConfirmPrimary: 'confirm_primary'
} as const

export type LicenseRecommendationValue = typeof LicenseRecommendation[keyof typeof LicenseRecommendation]

export type LicenseColumns = {
    degrees: Degree[]
    primaryLicense: Degree | null
    additionalCredentials: Degree[]
    licenseReview: LicenseReviewValue | null
    licenseRecommendation: LicenseRecommendationValue | null
}

export type StoredLicenseRow = {
    degrees: readonly string[] | null
    primaryLicense: string | null
    additionalCredentials: readonly string[] | null
    licenseReview: string | null
    licenseRecommendation: string | null
}

export type StoredLicensePlan =
    | { action: 'keep', reason: 'confirmed_dual' | 'unchanged' }
    | { action: 'split', columns: LicenseColumns }
    | { action: 'needs_review', columns: LicenseColumns }

const DEGREE_VALUES = new Set<string>(Object.values(Degree))

function asList(value: readonly string[] | null | undefined): string[] {
    return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}

/** Known degrees in the submitted order, including repeats. The public list stores this array. */
export function listedDegrees(degrees: readonly string[] | null | undefined): Degree[] {
    return asList(degrees).filter((degree): degree is Degree => DEGREE_VALUES.has(degree))
}

export function knownDegrees(degrees: readonly string[] | null | undefined): Degree[] {
    const seen = new Set<string>()
    const unique: Degree[] = []

    for (const degree of listedDegrees(degrees)) {
        if (seen.has(degree)) {
            continue
        }
        seen.add(degree)
        unique.push(degree)
    }

    return unique
}

export function clinicalLicensesIn(degrees: readonly Degree[]): Degree[] {
    return degrees.filter(degree => CLINICAL_LICENSES.includes(degree))
}

export function credentialsIn(degrees: readonly Degree[]): Degree[] {
    return degrees.filter(degree => ADDITIONAL_CREDENTIALS.includes(degree))
}

export function recommendationFor(clinical: readonly Degree[]): LicenseRecommendationValue | null {
    const present = new Set(clinical)

    if (present.has(Degree.Md) && present.has(Degree.Do)) {
        return LicenseRecommendation.Md
    }

    if (present.has(Degree.Dds) && present.has(Degree.Dmd) && clinical.length === 2) {
        return LicenseRecommendation.OneDentalLicense
    }

    if (clinical.length > 1) {
        return LicenseRecommendation.ConfirmPrimary
    }

    return null
}

function storedReview(value: string | null | undefined): LicenseReviewValue | null {
    if (value === LicenseReview.NeedsReview || value === LicenseReview.Confirmed) {
        return value
    }

    return null
}

export function licenseColumnsForDegrees(
    degrees: readonly string[] | null | undefined,
    options?: {
        confirmed?: boolean
        primaryLicense?: string | null
        licenseReview?: string | null
    }
): LicenseColumns {
    const listed = listedDegrees(degrees)
    const unique = knownDegrees(degrees)
    const clinical = clinicalLicensesIn(unique)
    const additionalCredentials = credentialsIn(unique)
    const recommendation = recommendationFor(clinical)
    const keptPrimary = options?.primaryLicense && clinical.includes(options.primaryLicense as Degree)
        ? options.primaryLicense as Degree
        : null

    if (keptPrimary) {
        return {
            degrees: listed,
            primaryLicense: keptPrimary,
            additionalCredentials,
            licenseReview: options?.confirmed ? LicenseReview.Confirmed : storedReview(options?.licenseReview),
            licenseRecommendation: null
        }
    }

    if (options?.confirmed && recommendation) {
        return {
            degrees: listed,
            primaryLicense: null,
            additionalCredentials,
            licenseReview: LicenseReview.Confirmed,
            licenseRecommendation: null
        }
    }

    if (recommendation) {
        return {
            degrees: listed,
            primaryLicense: null,
            additionalCredentials,
            licenseReview: LicenseReview.NeedsReview,
            licenseRecommendation: recommendation
        }
    }

    return {
        degrees: listed,
        primaryLicense: clinical[0] ?? null,
        additionalCredentials,
        licenseReview: null,
        licenseRecommendation: null
    }
}

function sameMembers(left: readonly string[], right: readonly string[]): boolean {
    if (left.length !== right.length) {
        return false
    }

    const sortedLeft = [...left].sort()
    const sortedRight = [...right].sort()

    return sortedLeft.every((value, index) => value === sortedRight[index])
}

function columnsMatch(row: StoredLicenseRow, columns: LicenseColumns): boolean {
    return row.primaryLicense === columns.primaryLicense
        && (row.licenseReview ?? null) === columns.licenseReview
        && (row.licenseRecommendation ?? null) === columns.licenseRecommendation
        && sameMembers(asList(row.additionalCredentials), columns.additionalCredentials)
}

/**
 * Decision for one stored professional.
 * Degrees are not part of the write. A chosen primary or a confirmed dual stays.
 */
export function planStoredLicense(row: StoredLicenseRow): StoredLicensePlan {
    if (row.licenseReview === LicenseReview.Confirmed) {
        return { action: 'keep', reason: 'confirmed_dual' }
    }

    if (row.primaryLicense) {
        return { action: 'keep', reason: 'unchanged' }
    }

    const columns = licenseColumnsForDegrees(row.degrees)

    if (columnsMatch(row, columns)) {
        return { action: 'keep', reason: 'unchanged' }
    }

    if (columns.licenseReview === LicenseReview.NeedsReview) {
        return { action: 'needs_review', columns }
    }

    return { action: 'split', columns }
}

export type LicenseBackfillReport = {
    total: number
    split: number
    needsReview: Record<LicenseRecommendationValue, number>
    confirmed: number
    unchanged: number
}

export function reportStoredLicenses(rows: readonly StoredLicenseRow[]): LicenseBackfillReport {
    const report: LicenseBackfillReport = {
        total: rows.length,
        split: 0,
        needsReview: {
            [LicenseRecommendation.Md]: 0,
            [LicenseRecommendation.OneDentalLicense]: 0,
            [LicenseRecommendation.ConfirmPrimary]: 0
        },
        confirmed: 0,
        unchanged: 0
    }

    for (const row of rows) {
        const plan = planStoredLicense(row)

        if (plan.action === 'keep' && plan.reason === 'confirmed_dual') {
            report.confirmed += 1
            continue
        }

        if (plan.action === 'keep') {
            report.unchanged += 1
            continue
        }

        if (plan.action === 'needs_review' && plan.columns.licenseRecommendation) {
            report.needsReview[plan.columns.licenseRecommendation] += 1
            continue
        }

        report.split += 1
    }

    return report
}
