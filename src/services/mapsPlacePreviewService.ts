import { envVariables } from '../../utils/environmentVariables.js'
import { logger } from '../logger.js'
import { Result } from '../result.js'
import {
    loadPlacePreview,
    normalizePlaceId,
    searchPlacePreview,
    type PlacePreview
} from '../places/placesClient.js'

export type MapsPlacePreviewInput = {
    name?: string | null
    latitude?: number | null
    longitude?: number | null
    placeId?: string | null
    languageCode?: string | null
}

/**
 * Live details for a Maps link the visitor pasted.
 * A missing key or a Google failure returns null so the form can still be sent.
 * The name and address are not written anywhere.
 */
export async function previewMapsPlace(input: MapsPlacePreviewInput): Promise<Result<PlacePreview | null>> {
    const placeId = input.placeId ? normalizePlaceId(input.placeId) : null
    const name = cleanName(input.name)
    const languageCode = input.languageCode === 'ja' ? 'ja' : 'en'
    if (!placeId && !name) {
        return { data: null, hasErrors: false }
    }

    const apiKey = envVariables.googleAPIKey()
    if (!apiKey) {
        logger.warn('mapsPlacePreview skipped because GOOGLE_API_KEY is unset')
        return { data: null, hasErrors: false }
    }

    try {
        const fromId = placeId
            ? await loadPlacePreview(placeId, apiKey, languageCode)
            : null
        const preview = fromId ?? (name
            ? await searchPlacePreview(
                name,
                coordinate(input.latitude, 90),
                coordinate(input.longitude, 180),
                apiKey,
                languageCode
            )
            : null)
        return { data: preview, hasErrors: false }
    } catch (error) {
        logger.error(`ERROR: mapsPlacePreview ${error}`)
        return { data: null, hasErrors: false }
    }
}

function cleanName(value: string | null | undefined): string | null {
    const name = value?.trim().replace(/\s+/g, ' ') ?? ''
    if (name.length < 2 || name.length > 200) { return null }
    return name
}

function coordinate(value: number | null | undefined, limit: number): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > limit) { return null }
    return value
}
