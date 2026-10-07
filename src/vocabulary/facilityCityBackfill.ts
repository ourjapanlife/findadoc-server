import { citySlug, resolveSearchCity, vocabularyCities, type CanonicalCity } from './cityMap.js'

/** A run below this share of facilities must not write. */
export const PUBLISHED_CITY_RATE = 0.95

/**
 * Decision for one stored facility (#1011).
 * A mapped row gets a city we already own. Anything unresolved stays put.
 * A moderator-confirmed row keeps its stored name and address.
 */

export type CityRecord = {
    id: string
    prefectureEn: string
    nameEn: string
    nameJa: string
}

export type FacilityCityInput = {
    verificationStatus: string
    cityId: string | null
    prefectureEn: string
    cityEn: string
    cityJa: string
}

export type FacilityCityPlan =
    | { action: 'keep', reason: 'already_assigned' | 'needs_review', reviewReason?: string }
    | {
        action: 'assign'
        cityId: string
        verificationStatus: 'CONFIRMED' | 'UNVERIFIED'
        rewriteCityNames: boolean
        nameEn: string
        nameJa: string
        fromSlug: string
        toSlug: string
    }

export type CitySlugRedirect = {
    prefecture: string
    from: string
    to: string
}

const GENERIC_WARD = /^(east|west|north|south|chuo) ward$/i

export function isGenericWardLabel(cityEn: string): boolean {
    return GENERIC_WARD.test(cityEn.replace(/\u3000/g, ' ').replace(/\s+/g, ' ').trim())
}

/** City segment used on hub URLs. Punctuation collapses the way the website slug does. */
export function hubCitySlug(cityEn: string): string {
    return cityEn
        .replace(/\u3000/g, ' ')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

export function citiesFromVocabulary(): CityRecord[] {
    return vocabularyCities().map(city => ({
        id: city.lgCode,
        prefectureEn: city.prefectureEn,
        nameEn: city.nameEn,
        nameJa: city.nameJa
    }))
}

function findCity(cities: CityRecord[], canonical: CanonicalCity): CityRecord | undefined {
    return cities.find(city =>
        city.prefectureEn === canonical.prefectureEn && city.nameJa === canonical.nameJa)
        ?? cities.find(city =>
            city.prefectureEn === canonical.prefectureEn && city.nameEn === canonical.nameEn)
}

export function planFacilityCity(input: FacilityCityInput, cities: CityRecord[]): FacilityCityPlan {
    if (input.cityId) {
        return { action: 'keep', reason: 'already_assigned' }
    }

    const outcome = resolveSearchCity({
        prefectureEn: input.prefectureEn,
        cityEn: input.cityEn,
        cityJa: input.cityJa
    })

    if (outcome.status !== 'mapped') {
        return { action: 'keep', reason: 'needs_review', reviewReason: outcome.reason }
    }

    const city = findCity(cities, outcome.value)

    if (!city) {
        return { action: 'keep', reason: 'needs_review', reviewReason: 'missing_city_row' }
    }

    const confirmed = input.verificationStatus === 'CONFIRMED'

    return {
        action: 'assign',
        cityId: city.id,
        verificationStatus: confirmed ? 'CONFIRMED' : 'UNVERIFIED',
        rewriteCityNames: !confirmed,
        nameEn: city.nameEn,
        nameJa: city.nameJa,
        fromSlug: hubCitySlug(input.cityEn),
        toSlug: hubCitySlug(city.nameEn)
    }
}

export type WeightedFacilityCity = FacilityCityInput & { weight: number }

export type FacilityCityReport = {
    total: number
    mapped: number
    unmatched: number
    rate: number
    tokyo: Record<string, number>
    genericPublished: number
    reviewReasons: Record<string, number>
    redirects: CitySlugRedirect[]
}

export function reportFacilityCities(
    rows: WeightedFacilityCity[],
    cities: CityRecord[]
): FacilityCityReport {
    let total = 0
    let mapped = 0
    let genericPublished = 0
    const tokyo: Record<string, number> = {}
    const reviewReasons: Record<string, number> = {}
    const redirectTargets = new Map<string, Set<string>>()

    for (const row of rows) {
        const weight = row.weight
        total += weight
        const plan = planFacilityCity(row, cities)

        if (plan.action === 'assign') {
            mapped += weight
            const publishedName = plan.rewriteCityNames ? plan.nameEn : row.cityEn

            if (isGenericWardLabel(publishedName)) {
                genericPublished += weight
            }

            if (plan.nameEn && row.prefectureEn === 'Tokyo') {
                tokyo[plan.nameEn] = (tokyo[plan.nameEn] ?? 0) + weight
            }

            const prefecture = citySlug(row.prefectureEn)

            if (prefecture && plan.rewriteCityNames && plan.fromSlug && plan.fromSlug !== plan.toSlug) {
                const key = `${prefecture}|${plan.fromSlug}`
                const targets = redirectTargets.get(key) ?? new Set<string>()
                targets.add(`${prefecture}|${plan.toSlug}`)
                redirectTargets.set(key, targets)
            }

            continue
        }

        const reason = plan.reviewReason ?? plan.reason
        reviewReasons[reason] = (reviewReasons[reason] ?? 0) + weight
    }

    const redirects: CitySlugRedirect[] = []

    for (const [key, targets] of redirectTargets) {
        if (targets.size !== 1) {
            continue
        }

        const [prefecture, from] = key.split('|')
        const to = [...targets][0].split('|')[1]

        redirects.push({ prefecture, from, to })
    }

    redirects.sort((left, right) =>
        left.prefecture.localeCompare(right.prefecture) || left.from.localeCompare(right.from))

    return {
        total,
        mapped,
        unmatched: total - mapped,
        rate: total === 0 ? 0 : mapped / total,
        tokyo,
        genericPublished,
        reviewReasons,
        redirects
    }
}

export function meetsPublishedCityBar(report: FacilityCityReport): boolean {
    return report.total > 0 && report.rate >= PUBLISHED_CITY_RATE && report.genericPublished === 0
}
