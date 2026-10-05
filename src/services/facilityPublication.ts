import { ErrorCode, Result } from '../result.js'
import { FacilityVerificationStatus } from '../typeDefs/gqlTypes.js'

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
