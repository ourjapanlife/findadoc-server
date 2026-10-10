import { describe, expect, it } from 'vitest'
import { namesAgree } from '../src/places/facilityPlaceMatch.js'
import { featureIdToPlaceId, previewTargetFromMapsUrl } from '../src/places/mapsLink.js'

const TOKYO_CLINIC = 'https://www.google.com/maps/place/Tokyo+Clinic/@35.6847897,139.766725,17z/data=!3m1!4b1!4m6!3m5!1s0x60188bf8b8139c29:0x87605178006ba000!8m2!3d35.6847897!4d139.766725'

describe('namesAgree', () => {
    it('matches the same clinic name and rejects a shorter shared city word', () => {
        expect(namesAgree(['Tokyo Clinic', '東京クリニック'], 'Tokyo Clinic')).toBe(true)
        expect(namesAgree(['Tokyo Station International Clinic'], 'Tokyo Clinic')).toBe(false)
        expect(namesAgree(['Clinic'], 'Clinic')).toBe(false)
    })
})

describe('stored maps links', () => {
    it('reads the place id encoded in the stored clinic link', () => {
        expect(previewTargetFromMapsUrl(TOKYO_CLINIC)).toEqual({
            name: 'Tokyo Clinic',
            latitude: 35.6847897,
            longitude: 139.766725,
            placeId: featureIdToPlaceId('0x60188bf8b8139c29', '0x87605178006ba000')
        })
    })
})
