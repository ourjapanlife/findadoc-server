import { envVariables } from '../../utils/environmentVariables.js'
import { logger } from '../logger.js'
import { ErrorCode, Result } from '../result.js'
import type { Facility } from '../typeDefs/gqlTypes.js'
import { namesAgree } from '../places/facilityPlaceMatch.js'
import { allowSharedPreviewCall, previewTargetFromMapsUrl } from '../places/mapsLink.js'
import {
    confirmPlaceId,
    loadPlacePreview,
    normalizePlaceId,
    searchPlaceCandidates,
    type PlacePreview
} from '../places/placesClient.js'
import * as facilityService from './facilityService.js'

export type FacilityPlaceCandidate = {
    placeId: string
    name: string | null
    address: string | null
    category: string | null
    confidence: 'HIGH' | 'LOW'
}

export type SuggestFacilityPlacesInput = {
    url?: string | null
    nameEn?: string | null
    nameJa?: string | null
    address?: string | null
    latitude?: number | null
    longitude?: number | null
    languageCode?: string | null
}

/**
 * Live candidates for the moderation screen.
 * A pin alone is not searched. Nothing returned here is written.
 */
export async function suggestFacilityPlaces(
    input: SuggestFacilityPlacesInput,
    clientIp: string
): Promise<Result<FacilityPlaceCandidate[]>> {
    const languageCode = input.languageCode === 'ja' ? 'ja' : 'en'
    const names = [input.nameJa, input.nameEn]
    const target = input.url ? previewTargetFromMapsUrl(input.url) : null
    const latitude = coordinate(input.latitude, 90) ?? target?.latitude ?? null
    const longitude = coordinate(input.longitude, 180) ?? target?.longitude ?? null
    const query = searchQuery(target?.name, names, input.address)

    if (!target?.placeId && !query) {
        return { data: [], hasErrors: false }
    }

    const apiKey = envVariables.googleAPIKey()
    if (!apiKey) {
        logger.warn('suggestFacilityPlaces skipped because GOOGLE_API_KEY is unset')
        return { data: [], hasErrors: false }
    }

    if (!allowSharedPreviewCall(clientIp, Date.now(), 20)) {
        logger.warn(`suggestFacilityPlaces skipped because the lookup limit was reached for ${clientIp}`)
        return { data: [], hasErrors: false }
    }

    try {
        if (target?.placeId) {
            const preview = await loadPlacePreview(target.placeId, apiKey, languageCode)
            const candidate = toCandidate(preview, 'HIGH')
            return { data: candidate ? [candidate] : [], hasErrors: false }
        }

        const previews = await searchPlaceCandidates(query ?? '', latitude, longitude, apiKey, languageCode)
        const comparedWith = target?.name ? [...names, target.name] : names
        return {
            data: previews.flatMap(preview => {
                const confidence = namesAgree(comparedWith, preview.name) ? 'HIGH' as const : 'LOW' as const
                const candidate = toCandidate(preview, confidence)
                return candidate ? [candidate] : []
            }),
            hasErrors: false
        }
    } catch (error) {
        logger.error(`ERROR: suggestFacilityPlaces ${error}`)
        return { data: [], hasErrors: false }
    }
}

/**
 * Save only the place id the moderator confirmed.
 * A missing Google id is rejected. Name and address stay as they are.
 */
export async function confirmFacilityPlaceId(
    facilityId: string,
    placeId: string,
    updatedBy: string
): Promise<Result<Facility | null>> {
    const normalized = normalizePlaceId(placeId)
    if (!normalized) {
        return {
            data: null,
            hasErrors: true,
            errors: [{ field: 'placeId', errorCode: ErrorCode.INVALID_INPUT, httpStatus: 400 }]
        }
    }

    const apiKey = envVariables.googleAPIKey()
    if (!apiKey) {
        return {
            data: null,
            hasErrors: true,
            errors: [{ field: 'placeId', errorCode: ErrorCode.INTERNAL_SERVER_ERROR, httpStatus: 500 }]
        }
    }

    const check = await confirmPlaceId(normalized, apiKey)
    if (check === 'missing') {
        return {
            data: null,
            hasErrors: true,
            errors: [{ field: 'placeId', errorCode: ErrorCode.NOT_FOUND, httpStatus: 404 }]
        }
    }
    if (check !== 'confirmed') {
        return {
            data: null,
            hasErrors: true,
            errors: [{ field: 'placeId', errorCode: ErrorCode.INTERNAL_SERVER_ERROR, httpStatus: 500 }]
        }
    }

    return facilityService.updateFacility(facilityId, { googlePlaceId: normalized }, updatedBy)
}

function toCandidate(preview: PlacePreview | null, confidence: 'HIGH' | 'LOW'): FacilityPlaceCandidate | null {
    if (!preview?.placeId) { return null }
    return {
        placeId: preview.placeId,
        name: preview.name,
        address: preview.address,
        category: preview.category,
        confidence
    }
}

function searchQuery(
    urlName: string | null | undefined,
    names: Array<string | null | undefined>,
    address: string | null | undefined
): string | null {
    const name = urlName?.trim() || names.map(value => value?.trim()).find(Boolean) || ''
    const line = address?.trim() ?? ''
    const query = [name, line].filter(Boolean).join(' ')
    return query.length >= 2 ? query.slice(0, 200) : null
}

function coordinate(value: number | null | undefined, limit: number): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > limit) { return null }
    return value
}
