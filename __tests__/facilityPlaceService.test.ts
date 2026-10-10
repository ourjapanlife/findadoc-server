import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { confirmFacilityPlaceId, suggestFacilityPlaces } from '../src/services/facilityPlaceService.js'

import type { Facility } from '../src/typeDefs/gqlTypes.js'
import { ErrorCode } from '../src/result.js'
import { logger } from '../src/logger.js'
import * as facilityService from '../src/services/facilityService.js'

vi.mock('../src/services/facilityService.js', () => ({ updateFacility: vi.fn() }))
vi.mock('../src/logger.js', () => ({ logger: { warn: vi.fn(), error: vi.fn() } }))

beforeEach(() => {
    vi.stubEnv('GOOGLE_API_KEY', 'test-key')
    vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.clearAllMocks()
})

const PLACE_ID = 'ChIJabcdefghijklmnop'

describe('suggestFacilityPlaces', () => {
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
    it.each(['network rejection', 'JSON parse failure'])('returns a structured error for %s', async failure => {
        if (failure === 'network rejection') {
            vi.mocked(fetch).mockRejectedValue(new Error('Network failed'))
        } else {
            vi.mocked(fetch).mockResolvedValue(new Response('invalid JSON', { status: 200 }))
        }
        await expect(confirmFacilityPlaceId('facility-id', PLACE_ID, 'moderator-id')).resolves.toEqual({
            data: null,
            hasErrors: true,
            errors: [{ field: 'placeId', errorCode: ErrorCode.INTERNAL_SERVER_ERROR, httpStatus: 500 }]
        })
        expect(logger.error).toHaveBeenCalledOnce()
        expect(facilityService.updateFacility).not.toHaveBeenCalled()
    })

    it('updates only the confirmed Google place ID', async () => {
        vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ id: PLACE_ID }), { status: 200 }))
        const updated = { data: { id: 'facility-id', googlePlaceId: PLACE_ID } as Facility, hasErrors: false }
        vi.mocked(facilityService.updateFacility).mockResolvedValue(updated)
        await expect(confirmFacilityPlaceId('facility-id', PLACE_ID, 'moderator-id')).resolves.toEqual(updated)
        expect(facilityService.updateFacility).toHaveBeenCalledOnce()
        expect(facilityService.updateFacility).toHaveBeenCalledWith(
            'facility-id', { googlePlaceId: PLACE_ID }, 'moderator-id'
        )
    })
})
