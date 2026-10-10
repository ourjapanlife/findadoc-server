const PLACE_ID_TOKEN = /^[A-Za-z0-9_-]{8,}$/
const COORDINATE_PAIR = /^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/

export type MapsPreviewTarget = {
    name: string | null
    latitude: number | null
    longitude: number | null
    placeId: string | null
}

/**
 * A Maps URL that is worth one Places call.
 * A free-text name, a short share link, or a URL with no pin and no place id is not.
 */
export function previewTargetFromMapsUrl(url: string): MapsPreviewTarget | null {
    const trimmed = url.trim()
    if (trimmed.length > 2000 || !isGoogleMapsUrl(trimmed)) { return null }

    let parsed: URL
    try {
        parsed = new URL(trimmed)
    } catch {
        return null
    }

    const placeMatch = parsed.pathname.match(/\/(?:place|search)\/([^/]+)/)
    const queryName = parsed.searchParams.get('q') ?? parsed.searchParams.get('query')
    const pin = mapPin(parsed)
    const target: MapsPreviewTarget = {
        name: placeName(placeMatch?.[1]) ?? placeName(queryName, true),
        latitude: pin?.latitude ?? null,
        longitude: pin?.longitude ?? null,
        placeId: googlePlaceIdFromUrl(parsed)
    }

    if (target.placeId) { return target }
    if (target.name && target.latitude != null && target.longitude != null) { return target }
    return null
}

function isGoogleMapsUrl(url: string): boolean {
    return url.startsWith('https://www.google.com/maps')
        || url.startsWith('https://www.google.co.jp/maps')
        || url.startsWith('https://maps.google.com/')
        || url.startsWith('https://maps.google.co.jp/')
}

function placeName(value: string | null | undefined, rejectCoordinates = false): string | null {
    if (!value) { return null }
    let label: string
    try {
        label = decodeURIComponent(value).replace(/\+/g, ' ').trim()
    } catch {
        return null
    }
    if (!label || label.startsWith('@') || (rejectCoordinates && readCoordinatePair(label))) { return null }
    return label
}

function googlePlaceIdFromUrl(parsed: URL): string | null {
    const explicit = placeIdToken(parsed.searchParams.get('query_place_id'))
        ?? placeIdToken(parsed.searchParams.get('place_id'))
    if (explicit) { return explicit }

    const query = parsed.searchParams.get('q') ?? parsed.searchParams.get('query') ?? ''
    const fromQuery = query.match(/place_id:([A-Za-z0-9_-]{8,})/)
    const queryToken = placeIdToken(fromQuery?.[1])
    if (queryToken) { return queryToken }

    const embedded = `${parsed.pathname}${parsed.search}`.match(/!1s([A-Za-z0-9_-]{8,})/)
    const embeddedToken = placeIdToken(embedded?.[1])
    if (embeddedToken && !embeddedToken.startsWith('0x')) { return embeddedToken }
    return null
}

function placeIdToken(value: string | null | undefined): string | null {
    if (!value) { return null }
    const trimmed = value.trim().replace(/^places\//, '')
    return PLACE_ID_TOKEN.test(trimmed) ? trimmed : null
}

function mapPin(parsed: URL): { latitude: number, longitude: number } | null {
    const dataPin = parsed.pathname.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/)
    const atPin = parsed.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)
    const queryPin = parsed.searchParams.get('ll')
        ?? parsed.searchParams.get('q')
        ?? parsed.searchParams.get('query')
    return readCoordinatePair(dataPin ? `${dataPin[1]},${dataPin[2]}` : null)
        ?? readCoordinatePair(atPin ? `${atPin[1]},${atPin[2]}` : null)
        ?? readCoordinatePair(queryPin)
}

function readCoordinatePair(value: string | null | undefined): { latitude: number, longitude: number } | null {
    if (!value) { return null }
    const match = value.trim().match(COORDINATE_PAIR)
    if (!match?.[1] || !match[2]) { return null }
    const latitude = Number(match[1])
    const longitude = Number(match[2])
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) { return null }
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) { return null }
    return { latitude, longitude }
}

const IP_LIMIT = 8
const IP_WINDOW_MS = 10 * 60 * 1000
const GLOBAL_LIMIT = 30
const GLOBAL_WINDOW_MS = 60 * 1000

/** Eight lookups per address each 10 minutes, and thirty for the whole process each minute. */
export function allowPreviewCall(
    ipHits: Map<string, number[]>,
    globalHits: number[],
    ip: string,
    now: number
): boolean {
    const recentGlobal = globalHits.filter(at => now - at < GLOBAL_WINDOW_MS)
    globalHits.length = 0
    globalHits.push(...recentGlobal)
    if (globalHits.length >= GLOBAL_LIMIT) { return false }

    const recentIp = (ipHits.get(ip) ?? []).filter(at => now - at < IP_WINDOW_MS)
    if (recentIp.length >= IP_LIMIT) {
        ipHits.set(ip, recentIp)
        return false
    }

    recentIp.push(now)
    ipHits.set(ip, recentIp)
    globalHits.push(now)
    return true
}
