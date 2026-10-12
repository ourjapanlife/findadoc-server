import type { MapsPreviewTarget } from './mapsLink.js'

export type FacilityMapIdentity = {
    id: string
    nameEn: string
    nameJa: string
    latitude: number | null
    longitude: number | null
}

const NAME_MIN_LENGTH = 8
const PIN_MATCH_METERS = 80

/**
 * One clinic for a Maps link that does not already share a stored place id.
 * The longest facility name inside the link wins, so a street token does not beat the clinic.
 * A pin within 80 meters is used only when no name matches. Two different answers are not a match.
 */
export function matchingFacilityId(
    target: Pick<MapsPreviewTarget, 'name' | 'latitude' | 'longitude'>,
    facilities: readonly FacilityMapIdentity[]
): string | null {
    const label = normalizePlaceLabel(target.name ?? '')
    const nameHits = facilities.flatMap(facility => {
        const names = [facility.nameEn, facility.nameJa]
            .map(normalizePlaceLabel)
            .filter(name => name.length >= NAME_MIN_LENGTH && label.includes(name))
        if (!names.length) { return [] }
        return [{ id: facility.id, length: Math.max(...names.map(name => name.length)) }]
    })

    const nameId = longestNameId(nameHits)
    const pinId = only(facilities
        .filter(facility => pinsMatch(target.latitude, target.longitude, facility.latitude, facility.longitude))
        .map(facility => facility.id))

    if (nameId && pinId && nameId !== pinId) { return null }
    return nameId ?? pinId ?? null
}

export function normalizePlaceLabel(value: string): string {
    return value.normalize('NFKC').replace(/[\s\u3000]+/g, '').toLowerCase()
}

function longestNameId(hits: { id: string, length: number }[]): string | null {
    if (!hits.length) { return null }
    const longest = Math.max(...hits.map(hit => hit.length))
    return only(hits.filter(hit => hit.length === longest).map(hit => hit.id))
}

function only(ids: string[]): string | null {
    const unique = [...new Set(ids)]
    return unique.length === 1 ? unique[0] : null
}

function pinsMatch(
    leftLat: number | null,
    leftLng: number | null,
    rightLat: number | null,
    rightLng: number | null
): boolean {
    const left = readPin(leftLat, leftLng)
    const right = readPin(rightLat, rightLng)
    if (!left || !right) { return false }
    return distanceMeters(left.latitude, left.longitude, right.latitude, right.longitude) <= PIN_MATCH_METERS
}

function readPin(
    latitude: number | null,
    longitude: number | null
): { latitude: number, longitude: number } | null {
    if (latitude === null || longitude === null) { return null }
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) { return null }
    if (latitude === 0 && longitude === 0) { return null }
    return { latitude, longitude }
}

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const radians = Math.PI / 180
    const dLat = (lat2 - lat1) * radians
    const dLng = (lng2 - lng1) * radians
    const lat = ((lat1 + lat2) / 2) * radians
    const x = dLng * Math.cos(lat) * 6371000
    const y = dLat * 6371000
    return Math.hypot(x, y)
}
