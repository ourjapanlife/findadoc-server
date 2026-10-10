import { envVariables } from '../../utils/environmentVariables.js'
import { logger } from '../logger.js'
import { Result } from '../result.js'
import { allowSharedPreviewCall, previewTargetFromMapsUrl } from '../places/mapsLink.js'
import {
    loadPlacePreview,
    searchPlacePreview,
    type PlacePreview
} from '../places/placesClient.js'

const inflight = new Map<string, Promise<Result<PlacePreview | null>>>()

/**
 * One Places call for a real Maps URL.
 * The name and address are for the open form and are not stored.
 * A shared in-flight request is joined so two identical calls do not bill twice.
 */
export function previewMapsPlace(
    url: string,
    languageCode: string | null | undefined,
    clientIp: string | null | undefined
): Promise<Result<PlacePreview | null>> {
    const language = languageCode === 'ja' ? 'ja' : 'en'
    const key = `${language}\n${url.trim()}`
    const pending = inflight.get(key)
    if (pending) { return pending }

    const promise = lookupMapsPlace(url, language, clientIp || 'unknown')
    inflight.set(key, promise)
    promise.finally(() => {
        inflight.delete(key)
    })
    return promise
}

async function lookupMapsPlace(
    url: string,
    languageCode: 'ja' | 'en',
    clientIp: string
): Promise<Result<PlacePreview | null>> {
    const target = previewTargetFromMapsUrl(url)
    if (!target) {
        return { data: null, hasErrors: false }
    }

    const apiKey = envVariables.googleAPIKey()
    if (!apiKey) {
        logger.warn('mapsPlacePreview skipped because GOOGLE_API_KEY is unset')
        return { data: null, hasErrors: false }
    }

    if (!allowSharedPreviewCall(clientIp)) {
        logger.warn(`mapsPlacePreview skipped because the lookup limit was reached for ${clientIp}`)
        return { data: null, hasErrors: false }
    }

    try {
        let preview: PlacePreview | null = null
        if (target.placeId) {
            preview = await loadPlacePreview(target.placeId, apiKey, languageCode)
        } else if (target.name) {
            preview = await searchPlacePreview(
                target.name,
                target.latitude,
                target.longitude,
                apiKey,
                languageCode
            )
        }
        return { data: preview, hasErrors: false }
    } catch (error) {
        logger.error(`ERROR: mapsPlacePreview ${error}`)
        return { data: null, hasErrors: false }
    }
}
