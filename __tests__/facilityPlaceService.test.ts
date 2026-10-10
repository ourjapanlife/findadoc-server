import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sharedFacilityIds } from './testSetup.test.js'
import { getFacilityById } from '../src/services/facilityService.js'
import { confirmFacilityPlaceId, suggestFacilityPlaces } from '../src/services/facilityPlaceService.js'

const PLACE_ID = 'ChIJabcdefghijklmnop'

describe('suggestFacilityPlaces', () => {
    beforeEach(() => {
        process.env.GOOGLE_API_KEY = 'test-key'
        vi.stubGlobal('fetch', vi.fn())
    })

    it('does not search when the only hint is a coordinate', async () => {
        const result = await suggestFacilityPlaces({
            latitude: 35.68,
            longitude: 139.76
        }, '203.0.113.10')

        expect(result.data).toEqual([])
        expect(fetch).not.toHaveBeenCalled()
    })

    it('marks a different clinic name as low confidence', async () => {
        vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
            places: [{
                id: PLACE_ID,
                displayName: { text: 'Tokyo Station International Clinic' },
                formattedAddress: '1 Marunouchi',
                primaryTypeDisplayName: { text: 'Medical clinic' }
            }]
        }), { status: 200 }))

        const result = await suggestFacilityPlaces({
            nameEn: 'Tokyo Clinic',
            address: 'Marunouchi'
        }, '203.0.113.11')

        expect(result.data).toEqual([{
            placeId: PLACE_ID,
            name: 'Tokyo Station International Clinic',
            address: '1 Marunouchi',
            category: 'Medical clinic',
            confidence: 'LOW'
        }])
    })
})

describe('confirmFacilityPlaceId', () => {
    beforeEach(() => {
        process.env.GOOGLE_API_KEY = 'test-key'
    })

    it('stores the confirmed place id and leaves the name and address alone', async () => {
        const facilityId = sharedFacilityIds[0]
        const before = await getFacilityById(facilityId)
        expect(before.hasErrors).toBe(false)

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
            JSON.stringify({ id: PLACE_ID }),
            { status: 200 }
        )))

        const result = await confirmFacilityPlaceId(facilityId, PLACE_ID, 'moderator-1')

        expect(result.hasErrors).toBe(false)
        expect(result.data?.googlePlaceId).toBe(PLACE_ID)
        expect(result.data?.nameEn).toBe(before.data.nameEn)
        expect(result.data?.nameJa).toBe(before.data.nameJa)
        expect(result.data?.contact.address).toEqual(before.data.contact.address)
    })
})
