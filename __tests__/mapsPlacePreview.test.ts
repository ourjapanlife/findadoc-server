import { describe, expect, it } from 'vitest'
import { readPlacePreview, searchPlacePreview } from '../src/places/placesClient.js'

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
