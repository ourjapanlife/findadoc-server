const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete'
const AUTOCOMPLETE_FIELD_MASK = [
    'suggestions.placePrediction.placeId',
    'suggestions.placePrediction.text.text',
    'suggestions.placePrediction.structuredFormat.mainText.text',
    'suggestions.placePrediction.structuredFormat.secondaryText.text'
].join(',')
const PLACE_ID_FIELD_MASK = 'id'
const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000

export type PlacesPrediction = {
    placeId: string
    label: string
    mainText: string
    secondaryText: string
}

export type PlaceIdCheck = 'confirmed' | 'missing' | 'unavailable'

/** A stored place id with no check time, or a check older than 12 months, needs a refresh. */
export function placeIdIsStale(checkedAt: string | null | undefined, now = Date.now()): boolean {
    if (!checkedAt) return true

    const checked = Date.parse(checkedAt)
    if (Number.isNaN(checked)) return true

    return now - checked > TWELVE_MONTHS_MS
}

export function normalizePlaceId(value: string): string | null {
    const trimmed = value.trim().replace(/^places\//, '')
    if (!/^[A-Za-z0-9_-]{8,}$/.test(trimmed)) return null
    return trimmed
}

export function parseAutocomplete(body: unknown): PlacesPrediction[] {
    if (!body || typeof body !== 'object' || !('suggestions' in body)) return []

    const suggestions = (body as { suggestions?: unknown }).suggestions
    if (!Array.isArray(suggestions)) return []

    const predictions: PlacesPrediction[] = []
    for (const suggestion of suggestions) {
        if (!suggestion || typeof suggestion !== 'object' || !('placePrediction' in suggestion)) continue
        const prediction = (suggestion as { placePrediction?: unknown }).placePrediction
        if (!prediction || typeof prediction !== 'object') continue

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
        if (!placeId || !mainText) continue

        const secondaryText = textOf(record.structuredFormat?.secondaryText?.text)
        const label = secondaryText ? `${mainText}, ${secondaryText}` : mainText
        predictions.push({ placeId, label, mainText, secondaryText })
    }

    return predictions
}

export function parsePlaceDetailsId(body: unknown): string | null {
    if (!body || typeof body !== 'object' || !('id' in body)) return null
    const id = (body as { id?: unknown }).id
    return typeof id === 'string' ? normalizePlaceId(id) : null
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

    if (response.status === 404) return 'missing'
    if (!response.ok) return 'unavailable'

    return parsePlaceDetailsId(await response.json()) ? 'confirmed' : 'unavailable'
}

function textOf(value: unknown): string {
    return typeof value === 'string' ? value.trim() : ''
}
