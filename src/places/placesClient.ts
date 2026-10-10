const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete'
const AUTOCOMPLETE_FIELD_MASK = [
    'suggestions.placePrediction.placeId',
    'suggestions.placePrediction.text.text',
    'suggestions.placePrediction.structuredFormat.mainText.text',
    'suggestions.placePrediction.structuredFormat.secondaryText.text'
].join(',')
const PLACE_ID_FIELD_MASK = 'id'
const PLACE_MATCH_FIELD_MASK = 'addressComponents,formattedAddress,types'
const PLACE_PREVIEW_FIELD_MASK = 'id,displayName,formattedAddress,primaryTypeDisplayName'
const PLACE_SEARCH_FIELD_MASK = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.primaryTypeDisplayName'
].join(',')
const PLACE_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText'
const CITY_COMPONENT_TYPES = ['sublocality_level_1', 'administrative_area_level_3', 'locality'] as const
const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000

export type PlacesPrediction = {
    placeId: string
    label: string
    mainText: string
    secondaryText: string
}

export type PlaceIdCheck = 'confirmed' | 'missing' | 'unavailable'

/** Live name and address for the submit form. Do not store this. */
export type PlacePreview = {
    placeId: string | null
    name: string | null
    address: string | null
    category: string | null
}

/** Text used to match a place onto a city. It is not stored. */
export type PlaceMatchText = {
    mainText: string
    secondaryText: string
}

export type PlaceMatchCheck = PlaceMatchText | 'missing' | 'unavailable'

/** A stored place id with no check time, or a check older than 12 months, needs a refresh. */
export function placeIdIsStale(checkedAt: string | null | undefined, now = Date.now()): boolean {
    if (!checkedAt) { return true }

    const checked = Date.parse(checkedAt)
    if (Number.isNaN(checked)) { return true }

    return now - checked > TWELVE_MONTHS_MS
}

export function normalizePlaceId(value: string): string | null {
    const trimmed = value.trim().replace(/^places\//, '')
    if (!/^[A-Za-z0-9_-]{8,}$/.test(trimmed)) { return null }
    return trimmed
}

export function parseAutocomplete(body: unknown): PlacesPrediction[] {
    if (!body || typeof body !== 'object' || !('suggestions' in body)) { return [] }

    const suggestions = (body as { suggestions?: unknown }).suggestions
    if (!Array.isArray(suggestions)) { return [] }

    const predictions: PlacesPrediction[] = []
    for (const suggestion of suggestions) {
        if (!suggestion || typeof suggestion !== 'object' || !('placePrediction' in suggestion)) { continue }
        const prediction = (suggestion as { placePrediction?: unknown }).placePrediction
        if (!prediction || typeof prediction !== 'object') { continue }

        const record = prediction as {
            placeId?: unknown
            text?: { text?: unknown }
            structuredFormat?: {
                mainText?: { text?: unknown }
                secondaryText?: { text?: unknown }
            }
        }
        const placeId = typeof record.placeId === 'string' ? normalizePlaceId(record.placeId) : null
        const mainText = textOf(record.structuredFormat?.mainText?.text) || textOf(record.text?.text)
        if (!placeId || !mainText) { continue }

        const secondaryText = textOf(record.structuredFormat?.secondaryText?.text)
        const label = secondaryText ? `${mainText}, ${secondaryText}` : mainText
        predictions.push({ placeId, label, mainText, secondaryText })
    }

    return predictions
}

export function parsePlaceDetailsId(body: unknown): string | null {
    if (!body || typeof body !== 'object' || !('id' in body)) { return null }
    const id = (body as { id?: unknown }).id
    return typeof id === 'string' ? normalizePlaceId(id) : null
}

/** Read the city name and the address around it. Both are discarded after matching. */
export function parsePlaceMatchText(body: unknown): PlaceMatchText | null {
    if (!body || typeof body !== 'object') { return null }

    const record = body as {
        formattedAddress?: unknown
        types?: unknown
        addressComponents?: unknown
    }
    if (!Array.isArray(record.addressComponents)) { return null }

    const components = record.addressComponents.flatMap(component => {
        if (!component || typeof component !== 'object') { return [] }
        const item = component as { longText?: unknown, types?: unknown }
        const longText = textOf(item.longText)
        const types = Array.isArray(item.types)
            ? item.types.filter((type): type is string => typeof type === 'string')
            : []
        if (!longText) { return [] }
        return [{ longText, types }]
    })
    const placeTypes = Array.isArray(record.types)
        ? record.types.filter((type): type is string => typeof type === 'string')
        : []
    const preferred = CITY_COMPONENT_TYPES.find(type => placeTypes.includes(type))
        ?? CITY_COMPONENT_TYPES.find(type => components.some(component => component.types.includes(type)))
    const main = preferred
        ? components.find(component => component.types.includes(preferred))
        : undefined
    if (!main) { return null }

    const formatted = textOf(record.formattedAddress)
    const secondary = formatted || components
        .map(component => component.longText)
        .filter(text => text !== main.longText)
        .join(', ')

    return { mainText: main.longText, secondaryText: secondary }
}

export async function autocompleteCities(
    input: string,
    apiKey: string,
    fetchImpl: typeof fetch = fetch
): Promise<PlacesPrediction[]> {
    const response = await fetchImpl(AUTOCOMPLETE_URL, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': AUTOCOMPLETE_FIELD_MASK
        },
        body: JSON.stringify({
            input,
            includedRegionCodes: ['jp'],
            includedPrimaryTypes: ['locality', 'administrative_area_level_3', 'sublocality_level_1'],
            languageCode: 'ja'
        })
    })

    if (!response.ok) {
        throw new Error(`Places autocomplete failed (${response.status})`)
    }

    return parseAutocomplete(await response.json())
}

/** Confirm a place id still exists. Asks only for the id, which is the unbilled refresh. */
export async function confirmPlaceId(
    placeId: string,
    apiKey: string,
    fetchImpl: typeof fetch = fetch
): Promise<PlaceIdCheck> {
    const response = await fetchImpl(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
        headers: {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': PLACE_ID_FIELD_MASK
        }
    })

    if (response.status === 404) { return 'missing' }
    if (!response.ok) { return 'unavailable' }

    return parsePlaceDetailsId(await response.json()) ? 'confirmed' : 'unavailable'
}

/**
 * Read enough of a place to match it to a city. A 404 means the id is gone.
 * The name and address are for that comparison and are not persisted.
 */
export async function loadPlaceMatch(
    placeId: string,
    apiKey: string,
    fetchImpl: typeof fetch = fetch
): Promise<PlaceMatchCheck> {
    const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`)
    url.searchParams.set('languageCode', 'ja')

    const response = await fetchImpl(url, {
        headers: {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': PLACE_MATCH_FIELD_MASK
        }
    })

    if (response.status === 404) { return 'missing' }
    if (!response.ok) { return 'unavailable' }

    return parsePlaceMatchText(await response.json()) ?? 'unavailable'
}

/** Place Details for a known id. The result is for the open form and is not stored. */
export async function loadPlacePreview(
    placeId: string,
    apiKey: string,
    languageCode: string,
    fetchImpl: typeof fetch = fetch
): Promise<PlacePreview | null> {
    const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`)
    url.searchParams.set('languageCode', languageCode)

    const response = await fetchImpl(url, {
        headers: {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': PLACE_PREVIEW_FIELD_MASK
        }
    })

    if (response.status === 404) { return null }
    if (!response.ok) {
        throw new Error(`Places details failed (${response.status})`)
    }

    return readPlacePreview(await response.json())
}

/**
 * Find the place named in a Maps URL, biased to its pin.
 * The result is for the open form and is not stored.
 */
export async function searchPlacePreview(
    name: string,
    latitude: number | null,
    longitude: number | null,
    apiKey: string,
    languageCode: string,
    fetchImpl: typeof fetch = fetch
): Promise<PlacePreview | null> {
    const body: Record<string, unknown> = {
        textQuery: name,
        languageCode,
        regionCode: 'JP',
        maxResultCount: 1
    }
    if (latitude != null && longitude != null) {
        body.locationBias = {
            circle: {
                center: { latitude, longitude },
                radius: 500
            }
        }
    }

    const response = await fetchImpl(PLACE_SEARCH_URL, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': PLACE_SEARCH_FIELD_MASK
        },
        body: JSON.stringify(body)
    })

    if (!response.ok) {
        throw new Error(`Places search failed (${response.status})`)
    }

    const payload = await response.json() as { places?: unknown }
    const first = Array.isArray(payload.places) ? payload.places[0] : null
    return readPlacePreview(first)
}

export function readPlacePreview(body: unknown): PlacePreview | null {
    if (!body || typeof body !== 'object') { return null }

    const place = body as {
        id?: unknown
        displayName?: { text?: unknown }
        formattedAddress?: unknown
        primaryTypeDisplayName?: { text?: unknown }
    }
    const name = textOf(place.displayName?.text)
    const address = textOf(place.formattedAddress)
    const category = textOf(place.primaryTypeDisplayName?.text)
    const placeId = typeof place.id === 'string' ? normalizePlaceId(place.id) : null
    if (!name && !address) { return null }

    return {
        placeId,
        name: name || null,
        address: address || null,
        category: category || null
    }
}

function textOf(value: unknown): string {
    return typeof value === 'string' ? value.trim() : ''
}
