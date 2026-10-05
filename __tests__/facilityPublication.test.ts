import { describe, expect, it } from 'vitest'
import { FacilityVerificationStatus } from '../src/typeDefs/gqlTypes.js'
import {
    isCityRecordId,
    resolveFacilityPublication,
    verificationStatusForUpdate
} from '../src/services/facilityPublication.js'

const CITY = '11111111-1111-4111-8111-111111111111'
const OTHER_CITY = '22222222-2222-4222-8222-222222222222'

describe('resolveFacilityPublication', () => {
    it('leaves a facility with no city unresolved', () => {
        expect(resolveFacilityPublication({})).toEqual({
            data: { cityId: null, verificationStatus: FacilityVerificationStatus.UnverifiedLocation },
            hasErrors: false
        })
    })

    it('refuses to confirm a facility that has no city', () => {
        const result = resolveFacilityPublication({
            verificationStatus: FacilityVerificationStatus.Confirmed
        })

        expect(result.hasErrors).toBe(true)
        expect(result.errors?.[0]?.field).toBe('cityId')
    })

    it('accepts a confirmed city we will look up', () => {
        expect(resolveFacilityPublication({
            cityId: 'city-1',
            verificationStatus: FacilityVerificationStatus.Confirmed
        })).toEqual({
            data: { cityId: 'city-1', verificationStatus: FacilityVerificationStatus.Confirmed },
            hasErrors: false
        })
    })

    it('keeps the current status when the same city is sent again', () => {
        expect(verificationStatusForUpdate(
            CITY,
            FacilityVerificationStatus.Confirmed,
            `  ${CITY}  `,
            undefined
        )).toBe(FacilityVerificationStatus.Confirmed)
    })

    it('drops the current status when the city changes or is cleared', () => {
        expect(verificationStatusForUpdate(
            CITY,
            FacilityVerificationStatus.Confirmed,
            OTHER_CITY,
            undefined
        )).toBeNull()
        expect(verificationStatusForUpdate(
            CITY,
            FacilityVerificationStatus.Confirmed,
            '   ',
            undefined
        )).toBeNull()
    })

    it('accepts only a city id that can be stored in the uuid column', () => {
        expect(isCityRecordId(CITY)).toBe(true)
        expect(isCityRecordId('city-1')).toBe(false)
        expect(isCityRecordId(`${CITY};drop`)).toBe(false)
    })

    it('does not mark a chosen city as unresolved', () => {
        const result = resolveFacilityPublication({
            cityId: 'city-1',
            verificationStatus: FacilityVerificationStatus.UnverifiedLocation
        })

        expect(result.hasErrors).toBe(true)
        expect(result.errors?.[0]?.field).toBe('verificationStatus')
    })
})
