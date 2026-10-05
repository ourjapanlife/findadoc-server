import { ErrorCode, Result } from '../result.js'
import { FacilityVerificationStatus } from '../typeDefs/gqlTypes.js'

const CITY_RECORD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** True when the value can be compared to cities.id without a database cast error. */
export function isCityRecordId(cityId: string): boolean {
    return CITY_RECORD_ID.test(cityId)
}

/**
 * Status to store when an update omits verificationStatus.
 * Resending the same city keeps the current status. A different city, including a
 * blank value, lets resolveFacilityPublication choose the status.
 */
export function verificationStatusForUpdate(
    currentCityId: string | null,
    currentStatus: FacilityVerificationStatus,
    cityId: string | null | undefined,
    verificationStatus: FacilityVerificationStatus | null | undefined
): FacilityVerificationStatus | null {
    if (verificationStatus !== undefined) {
        return verificationStatus ?? null
    }

    if (cityId === undefined) {
        return currentStatus
    }

    const nextCityId = cityId?.trim() ? cityId.trim() : null

    return nextCityId === currentCityId ? currentStatus : null
}

export type FacilityPublication = {
    cityId: string | null
    verificationStatus: FacilityVerificationStatus
}

/**
 * A facility with no city stays unresolved. CONFIRMED requires a city we own.
 * The city id itself is checked against the cities table by the caller.
 */
export function resolveFacilityPublication(input: {
    cityId?: string | null
    verificationStatus?: FacilityVerificationStatus | null
}): Result<FacilityPublication> {
    const cityId = input.cityId?.trim() ? input.cityId.trim() : null
    const requested = input.verificationStatus ?? null

    if (!cityId) {
        if (requested === FacilityVerificationStatus.Confirmed) {
            return {
                data: { cityId: null, verificationStatus: FacilityVerificationStatus.UnverifiedLocation },
                hasErrors: true,
                errors: [{
                    field: 'cityId',
                    errorCode: ErrorCode.INVALID_INPUT,
                    httpStatus: 400
                }]
            }
        }

        return {
            data: { cityId: null, verificationStatus: FacilityVerificationStatus.UnverifiedLocation },
            hasErrors: false
        }
    }

    if (requested === FacilityVerificationStatus.UnverifiedLocation) {
        return {
            data: { cityId, verificationStatus: FacilityVerificationStatus.UnverifiedLocation },
            hasErrors: true,
            errors: [{
                field: 'verificationStatus',
                errorCode: ErrorCode.INVALID_INPUT,
                httpStatus: 400
            }]
        }
    }

    return {
        data: {
            cityId,
            verificationStatus: requested === FacilityVerificationStatus.Confirmed
                ? FacilityVerificationStatus.Confirmed
                : FacilityVerificationStatus.Unverified
        },
        hasErrors: false
    }
}
