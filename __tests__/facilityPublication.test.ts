import { describe, expect, it } from 'vitest'
import { FacilityVerificationStatus } from '../src/typeDefs/gqlTypes.js'
import { resolveFacilityPublication } from '../src/services/facilityPublication.js'

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

    it('does not mark a chosen city as unresolved', () => {
        const result = resolveFacilityPublication({
            cityId: 'city-1',
            verificationStatus: FacilityVerificationStatus.UnverifiedLocation
        })

        expect(result.hasErrors).toBe(true)
        expect(result.errors?.[0]?.field).toBe('verificationStatus')
    })
})
