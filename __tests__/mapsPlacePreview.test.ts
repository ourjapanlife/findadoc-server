import { describe, expect, it } from 'vitest'
import { readPlacePreview, searchPlacePreview } from '../src/places/placesClient.js'
import {
    allowPreviewCall,
    canonicalMapsFields,
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

    it('does not follow a redirect away from Maps', async () => {
        let calls = 0
        const fetchImpl = (async () => {
            calls += 1
            return new Response(null, {
                status: 302,
                headers: { location: 'https://example.com/track' }
            })
        }) as typeof fetch

        const target = await resolveMapsPlace('https://maps.app.goo.gl/abc123XYZ', fetchImpl)
        expect(target).toBeNull()
        expect(calls).toBe(1)
    })

    it('does not look up a name that is not a Maps URL', () => {
        expect(previewTargetFromMapsUrl('Tokyo Station International Clinic')).toBeNull()
        expect(previewTargetFromMapsUrl('https://maps.app.goo.gl/abc123XYZ')).toBeNull()
        expect(previewTargetFromMapsUrl('https://www.google.com/maps')).toBeNull()
    })

    it('reads the place id from an iPhone share redirect that has no slash', () => {
        const url = 'https://maps.google.com?q=A-ONE%20Dental&ftid=0x6b12ae37b47f5b37:0x8eaddfcd1b32ca52&g_st=ic'
        const target = previewTargetFromMapsUrl(url)
        expect(target?.name).toBe('A-ONE Dental')
        expect(target?.placeId).toBe('ChIJN1t_tDeuEmsRUsoyG83frY4')
        expect(canonicalMapsLink(target!)).toBe(
            'https://www.google.com/maps/search/?api=1&query=A-ONE+Dental&query_place_id=ChIJN1t_tDeuEmsRUsoyG83frY4'
        )
    })

    it('follows an iPhone share link to the feature id', async () => {
        const destination = 'https://maps.google.com?q=A-ONE+Dental&ftid=0x6b12ae37b47f5b37:0x8eaddfcd1b32ca52&g_st=ic'
        const fetchImpl = (async () => new Response(null, {
            status: 302,
            headers: { location: destination }
        })) as typeof fetch

        const target = await resolveMapsPlace('https://maps.app.goo.gl/RvxrTbJibf9CqX917?g_st=ic', fetchImpl)
        expect(target?.placeId).toBe('ChIJN1t_tDeuEmsRUsoyG83frY4')
        expect(target?.name).toBe('A-ONE Dental')
    })
})

describe('canonicalMapsFields', () => {
    it('rewrites a place id already in the link and does not open it', async () => {
        let calls = 0
        const fetchImpl = (async () => {
            calls += 1
            return new Response(null, { status: 500 })
        }) as typeof fetch

        const maps = await canonicalMapsFields(
            'https://maps.google.com?q=A-ONE+Dental&ftid=0x6b12ae37b47f5b37:0x8eaddfcd1b32ca52',
            fetchImpl
        )

        expect(calls).toBe(0)
        expect(maps.placeId).toBe('ChIJN1t_tDeuEmsRUsoyG83frY4')
        expect(maps.url).toBe(
            'https://www.google.com/maps/search/?api=1&query=A-ONE+Dental&query_place_id=ChIJN1t_tDeuEmsRUsoyG83frY4'
        )
    })

    it('leaves a long Maps link unchanged when it has no place id', async () => {
        let calls = 0
        const fetchImpl = (async () => {
            calls += 1
            return new Response(null, { status: 500 })
        }) as typeof fetch
        const stored = 'https://www.google.com/maps/search/A-ONE+Dental+Clinic/@35.7140477,139.6668954,17z'

        const maps = await canonicalMapsFields(stored, fetchImpl)

        expect(calls).toBe(0)
        expect(maps).toEqual({ url: stored, placeId: null })
    })

    it('opens a short share link once', async () => {
        let calls = 0
        const fetchImpl = (async () => {
            calls += 1
            return new Response(null, {
                status: 302,
                headers: { location: 'https://maps.google.com?q=A-ONE+Dental&ftid=0x6b12ae37b47f5b37:0x8eaddfcd1b32ca52' }
            })
        }) as typeof fetch

        const maps = await canonicalMapsFields('https://maps.app.goo.gl/RvxrTbJibf9CqX917?g_st=ic', fetchImpl)

        expect(calls).toBe(1)
        expect(maps.placeId).toBe('ChIJN1t_tDeuEmsRUsoyG83frY4')
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
