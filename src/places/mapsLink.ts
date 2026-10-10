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
    if (target.name && target.latitude !== null && target.longitude !== null) { return target }
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

    const haystack = decodedMapsPath(parsed)
    const embedded = haystack.match(/!1s([A-Za-z0-9_-]{8,})/)
    const embeddedToken = placeIdToken(embedded?.[1])
    if (embeddedToken && !embeddedToken.startsWith('0x')) { return embeddedToken }

    const feature = haystack.match(/(?:!1s|[?&]ftid=)(0x[0-9a-f]{1,16}):(0x[0-9a-f]{1,16})/i)
    if (feature?.[1] && feature[2]) { return featureIdToPlaceId(feature[1], feature[2]) }
    return null
}

/**
 * The 0x:0x pair in a Maps link is the same place as a ChIJ place id.
 * It is a 20-byte id written as two little-endian numbers.
 */
export function featureIdToPlaceId(highHex: string, lowHex: string): string {
    const bytes = [
        0x0a,
        0x12,
        0x09,
        ...hexToLittleEndianBytes(highHex),
        0x11,
        ...hexToLittleEndianBytes(lowHex)
    ]
    return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

/** Stable Maps URL whose query carries the place id explicitly. */
export function canonicalMapsLink(target: MapsPreviewTarget): string | null {
    if (!target.placeId) { return null }

    const query = target.name
        ?? (target.latitude !== null && target.longitude !== null
            ? `${target.latitude},${target.longitude}`
            : target.placeId)
    const params = new URLSearchParams({
        api: '1',
        query,
        query_place_id: target.placeId
    })
    return `https://www.google.com/maps/search/?${params.toString()}`
}

function decodedMapsPath(parsed: URL): string {
    const raw = `${parsed.pathname}${parsed.search}`
    try {
        return decodeURIComponent(raw)
    } catch {
        return raw
    }
}

function hexToLittleEndianBytes(hex: string): number[] {
    const normalized = hex.replace(/^0x/i, '').padStart(16, '0')
    const bytes: number[] = []
    for (let index = 14; index >= 0; index -= 2) {
        bytes.push(Number.parseInt(normalized.slice(index, index + 2), 16))
    }
    return bytes
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
const sharedIpHits = new Map<string, number[]>()
const sharedGlobalHits: number[] = []

const moderatorIpHits = new Map<string, number[]>()
const moderatorGlobalHits: number[] = []

/** Public-preview budget. */
export function allowSharedPreviewCall(ip: string, now = Date.now(), ipLimit = IP_LIMIT): boolean {
    return allowPreviewCall(sharedIpHits, sharedGlobalHits, ip, now, ipLimit)
}

/** Twenty moderator lookups per address each ten minutes, and thirty globally each minute. */
export function allowModeratorPreviewCall(ip: string, now = Date.now()): boolean {
    return allowPreviewCall(moderatorIpHits, moderatorGlobalHits, ip, now, 20)
}

export function allowPreviewCall(
    ipHits: Map<string, number[]>,
    globalHits: number[],
    ip: string,
    now: number,
    ipLimit = IP_LIMIT
): boolean {
    const recentGlobal = globalHits.filter(at => now - at < GLOBAL_WINDOW_MS)
    globalHits.length = 0
    globalHits.push(...recentGlobal)
    if (globalHits.length >= GLOBAL_LIMIT) { return false }

    const recentIp = (ipHits.get(ip) ?? []).filter(at => now - at < IP_WINDOW_MS)
    if (recentIp.length >= ipLimit) {
        ipHits.set(ip, recentIp)
        return false
    }

    recentIp.push(now)
    ipHits.set(ip, recentIp)
    globalHits.push(now)
    return true
}
