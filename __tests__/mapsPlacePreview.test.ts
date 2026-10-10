import { describe, expect, it } from 'vitest'
import { readPlacePreview, searchPlacePreview } from '../src/places/placesClient.js'
import {
    allowPreviewCall,
    canonicalMapsLink,
    featureIdToPlaceId,
    previewTargetFromMapsUrl,
    resolveMapsPlace
} from '../src/places/mapsLink.js'

const TOKYO_STATION = 'https://www.google.com/maps/place/Tokyo+Station+International+Clinic/@35.6791006,139.767714,17z/data=!3m1!4b1!4m6!3m5!1s0x60188bf5d2aa2fe7:0xe80be270a19ad1f8!8m2!3d35.6791006!4d139.767714!16s%2Fg%2F11l6yc1_d0?entry=ttu'

describe('readPlacePreview', () => {
    it('reads the name, address, and category and ignores everything else', () => {
        expect(readPlacePreview({
            id: 'ChIJtokyoStationClinic',
            displayName: { text: 'Tokyo Station International Clinic' },
            formattedAddress: '〒100-0005 Tokyo, Chiyoda City, Marunouchi, 1-chome−9−1 グランルーフ 1F',
            primaryTypeDisplayName: { text: 'Medical clinic' },
            rating: 4.5,
            location: { latitude: 35.67, longitude: 139.76 }
        })).toEqual({
            placeId: 'ChIJtokyoStationClinic',
            name: 'Tokyo Station International Clinic',
            address: '〒100-0005 Tokyo, Chiyoda City, Marunouchi, 1-chome−9−1 グランルーフ 1F',
            category: 'Medical clinic'
        })
    })

    it('returns null when the place has no name or address', () => {
        expect(readPlacePreview({ id: 'ChIJonlyAnId123' })).toBeNull()
        expect(readPlacePreview(null)).toBeNull()
    })
})

describe('featureIdToPlaceId', () => {
    it('rewrites the hex pair in a Maps link as the canonical place id', () => {
        expect(featureIdToPlaceId('0x6b12ae37b47f5b37', '0x8eaddfcd1b32ca52'))
            .toBe('ChIJN1t_tDeuEmsRUsoyG83frY4')
    })
})

describe('previewTargetFromMapsUrl', () => {
    it('reads the clinic name, pin, and place id from the stored link', () => {
        const target = previewTargetFromMapsUrl(TOKYO_STATION)
        expect(target).toEqual({
            name: 'Tokyo Station International Clinic',
            latitude: 35.6791006,
            longitude: 139.767714,
            placeId: featureIdToPlaceId('0x60188bf5d2aa2fe7', '0xe80be270a19ad1f8')
        })
        const link = canonicalMapsLink(target!)
        expect(link?.startsWith('https://www.google.com/maps/search/?api=1&')).toBe(true)
        expect(link).toContain('query=Tokyo+Station+International+Clinic')
        expect(link).toContain(`query_place_id=${target!.placeId}`)
    })

    it('reads the place id after a short link redirects', async () => {
        const fetchImpl = (async () => new Response(null, {
            status: 302,
            headers: { location: TOKYO_STATION }
        })) as typeof fetch

        const target = await resolveMapsPlace('https://maps.app.goo.gl/abc123XYZ', fetchImpl)
        expect(target?.placeId).toBe(featureIdToPlaceId('0x60188bf5d2aa2fe7', '0xe80be270a19ad1f8'))
        expect(target?.name).toBe('Tokyo Station International Clinic')
    })

    it('does not look up a name that is not a Maps URL', () => {
        expect(previewTargetFromMapsUrl('Tokyo Station International Clinic')).toBeNull()
        expect(previewTargetFromMapsUrl('https://maps.app.goo.gl/abc123XYZ')).toBeNull()
        expect(previewTargetFromMapsUrl('https://www.google.com/maps')).toBeNull()
    })
})

describe('allowPreviewCall', () => {
    it('allows eight lookups for one address and stops the ninth', () => {
        const ipHits = new Map<string, number[]>()
        const globalHits: number[] = []
        const now = Date.parse('2026-10-08T08:00:00.000Z')

        for (let attempt = 0; attempt < 8; attempt++) {
            expect(allowPreviewCall(ipHits, globalHits, '203.0.113.4', now + attempt)).toBe(true)
        }
        expect(allowPreviewCall(ipHits, globalHits, '203.0.113.4', now + 8)).toBe(false)
        expect(allowPreviewCall(ipHits, globalHits, '203.0.113.5', now + 9)).toBe(true)
    })
})

describe('searchPlacePreview', () => {
    it('asks Places for the clinic at the pin and returns the first match', async () => {
        const fetchImpl = (async (_url: string, init?: Parameters<typeof fetch>[1]) => {
            const body = JSON.parse(String(init?.body)) as {
                textQuery: string
                locationBias: { circle: { center: { latitude: number, longitude: number }, radius: number } }
            }
            expect(body.textQuery).toBe('Tokyo Station International Clinic')
            expect(body.locationBias.circle.center).toEqual({ latitude: 35.6791006, longitude: 139.767714 })
            expect(body.locationBias.circle.radius).toBe(500)
            expect(init?.headers).toMatchObject({
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.primaryTypeDisplayName'
            })

            return new Response(JSON.stringify({
                places: [{
                    id: 'ChIJtokyoStationClinic',
                    displayName: { text: 'Tokyo Station International Clinic' },
                    formattedAddress: '〒100-0005 Tokyo, Chiyoda City, Marunouchi, 1-chome−9−1',
                    primaryTypeDisplayName: { text: 'Medical clinic' }
                }]
            }), { status: 200 })
        }) as typeof fetch

        await expect(searchPlacePreview(
            'Tokyo Station International Clinic',
            35.6791006,
            139.767714,
            'test-key',
            'en',
            fetchImpl
        )).resolves.toEqual({
            placeId: 'ChIJtokyoStationClinic',
            name: 'Tokyo Station International Clinic',
            address: '〒100-0005 Tokyo, Chiyoda City, Marunouchi, 1-chome−9−1',
            category: 'Medical clinic'
        })
    })
})
