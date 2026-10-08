import { envVariables } from '../../utils/environmentVariables.js'
import { ErrorCode, Result } from '../result.js'
import { logger } from '../logger.js'
import type { City, CitySuggestion } from '../typeDefs/gqlTypes.js'
import { matchCitySuggestion } from '../places/matchCitySuggestion.js'
import {
    autocompleteCities,
    confirmPlaceId,
    normalizePlaceId,
    placeIdIsStale
} from '../places/placesClient.js'
import {
    clearCityPlaceId,
    getCityById,
    listCityPlaceRecords,
    setCityPlaceId,
    type CityPlaceRecord
} from './cityService.js'

const MIN_INPUT_LENGTH = 2

/**
 * Live city suggestions. The returned label is for the open screen.
 * Nothing here writes a Places name, address, or coordinate.
 */
export async function suggestCities(input: string): Promise<Result<CitySuggestion[]>> {
    const query = input.trim()
    if (query.length < MIN_INPUT_LENGTH) {
        return { data: [], hasErrors: false }
    }

    const apiKey = envVariables.googleAPIKey()
    if (!apiKey) {
        return placesError('suggestCities')
    }

    try {
        const [predictions, records] = await Promise.all([
            autocompleteCities(query, apiKey),
            listCityPlaceRecords()
        ])

        const suggestions: CitySuggestion[] = []
        const refreshed = new Set<string>()

        for (const prediction of predictions.slice(0, 5)) {
            const match = matchCitySuggestion(records, prediction.mainText, prediction.secondaryText)
            let city: City | null = null

            if (match) {
                if (!refreshed.has(match.id)) {
                    refreshed.add(match.id)
                    await refreshStoredPlaceId(match, apiKey)
                }
                city = await getCityById(match.id)
            }

            suggestions.push({
                placeId: prediction.placeId,
                label: prediction.label,
                city
            })
        }

        return { data: suggestions, hasErrors: false }
    } catch (error) {
        logger.error(`ERROR: suggestCities ${error}`)
        return placesError('suggestCities')
    }
}

/** Persist the city place id after an id-only confirmation. A missing id is cleared, not replaced. */
export async function recordCityPlaceId(cityId: string, placeId: string): Promise<Result<City | null>> {
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
        return placesError('recordCityPlaceId')
    }

    try {
        const existing = await getCityById(cityId)
        if (!existing) {
            return {
                data: null,
                hasErrors: true,
                errors: [{ field: 'cityId', errorCode: ErrorCode.NOT_FOUND, httpStatus: 404 }]
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

        const checkedAt = check === 'confirmed' ? new Date().toISOString() : null
        const city = await setCityPlaceId(cityId, normalized, checkedAt)
        return { data: city, hasErrors: false }
    } catch (error) {
        logger.error(`ERROR: recordCityPlaceId ${error}`)
        return placesError('recordCityPlaceId')
    }
}

async function refreshStoredPlaceId(record: CityPlaceRecord, apiKey: string): Promise<void> {
    if (!record.googlePlaceId || !placeIdIsStale(record.googlePlaceIdCheckedAt)) { return }

    try {
        const check = await confirmPlaceId(record.googlePlaceId, apiKey)
        if (check === 'missing') {
            await clearCityPlaceId(record.id)
            return
        }
        if (check === 'confirmed') {
            await setCityPlaceId(record.id, record.googlePlaceId, new Date().toISOString())
        }
    } catch (error) {
        logger.error(`ERROR: refreshStoredPlaceId ${error}`)
    }
}

function placesError<T>(field: string): Result<T> {
    return {
        data: null as T,
        hasErrors: true,
        errors: [{ field, errorCode: ErrorCode.SERVER_ERROR, httpStatus: 500 }]
    }
}
