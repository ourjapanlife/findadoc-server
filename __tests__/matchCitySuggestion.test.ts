import { describe, expect, it } from 'vitest'
import { matchCitySuggestion, type MatchableCity } from '../src/places/matchCitySuggestion.js'
import { parseAutocomplete, parsePlaceDetailsId, parsePlaceMatchText, placeIdIsStale } from '../src/places/placesClient.js'

const cities: MatchableCity[] = [
    { id: 'shibuya', prefectureEn: 'Tokyo', nameEn: 'Shibuya', nameJa: '渋谷区' },
    { id: 'minato', prefectureEn: 'Tokyo', nameEn: 'Minato', nameJa: '港区' },
    { id: 'tokyo-chuo', prefectureEn: 'Tokyo', nameEn: 'Chuo', nameJa: '中央区' },
    { id: 'tokyo-kita', prefectureEn: 'Tokyo', nameEn: 'Kita', nameJa: '北区' },
    { id: 'yamanashi-chuo', prefectureEn: 'Yamanashi', nameEn: 'Chuo', nameJa: '中央市' },
    { id: 'fukuoka', prefectureEn: 'Fukuoka', nameEn: 'Fukuoka', nameJa: '福岡市' },
    { id: 'osaka', prefectureEn: 'Osaka', nameEn: 'Osaka', nameJa: '大阪市' },
    { id: 'sakai', prefectureEn: 'Osaka', nameEn: 'Sakai', nameJa: '堺市' }
]

describe('matchCitySuggestion', () => {
    it('maps a Tokyo ward in Japanese', () => {
        expect(matchCitySuggestion(cities, '渋谷区', '東京都, 日本')?.id).toBe('shibuya')
    })

    it('maps an English city name and drops the City suffix', () => {
        expect(matchCitySuggestion(cities, 'Shibuya City', 'Tokyo, Japan')?.id).toBe('shibuya')
        expect(matchCitySuggestion(cities, 'Minato City', 'Tokyo, Japan')?.id).toBe('minato')
    })

    it('keeps Tokyo Chuo and Yamanashi Chuo apart', () => {
        expect(matchCitySuggestion(cities, '中央区', '東京都, 日本')?.id).toBe('tokyo-chuo')
        expect(matchCitySuggestion(cities, '中央市', '山梨県, 日本')?.id).toBe('yamanashi-chuo')
    })

    it('rolls a named parent ward up to that city', () => {
        expect(matchCitySuggestion(cities, '東区', '福岡市, 福岡県, 日本')?.id).toBe('fukuoka')
        expect(matchCitySuggestion(cities, '北区', '大阪市, 大阪府, 日本')?.id).toBe('osaka')
    })

    it('does not guess a bare ward shared by two cities', () => {
        expect(matchCitySuggestion(cities, '北区', '大阪府, 日本')).toBeNull()
    })

    it('maps Tokyo Kita when the prefecture is Tokyo', () => {
        expect(matchCitySuggestion(cities, '北区', '東京都, 日本')?.id).toBe('tokyo-kita')
    })

    it('stays unmatched when the text has no prefecture', () => {
        expect(matchCitySuggestion(cities, '渋谷区', '日本')).toBeNull()
    })
})

describe('places client parsing', () => {
    it('reads only the masked autocomplete fields', () => {
        const predictions = parseAutocomplete({
            suggestions: [{
                placePrediction: {
                    placeId: 'places/ChIJshibuya',
                    text: { text: '渋谷区, 東京都, 日本' },
                    structuredFormat: {
                        mainText: { text: '渋谷区' },
                        secondaryText: { text: '東京都, 日本' }
                    },
                    formattedAddress: 'must not be required'
                }
            }]
        })

        expect(predictions).toEqual([{
            placeId: 'ChIJshibuya',
            label: '渋谷区, 東京都, 日本',
            mainText: '渋谷区',
            secondaryText: '東京都, 日本'
        }])
    })

    it('reads a place details id and nothing else', () => {
        expect(parsePlaceDetailsId({ id: 'places/ChIJshibuya', formattedAddress: 'nope' })).toBe('ChIJshibuya')
        expect(parsePlaceDetailsId({})).toBeNull()
    })

    it('reads a ward and the address around it without keeping other fields', () => {
        const parsed = parsePlaceMatchText({
            types: ['sublocality_level_1', 'political'],
            formattedAddress: '日本、〒530-0001 大阪府大阪市北区',
            addressComponents: [
                { longText: '北区', types: ['sublocality_level_1', 'political'] },
                { longText: '大阪市', types: ['locality', 'political'] },
                { longText: '大阪府', types: ['administrative_area_level_1', 'political'] },
                { longText: '日本', types: ['country', 'political'] }
            ],
            location: { latitude: 34.7, longitude: 135.5 }
        })

        expect(parsed).toEqual({
            mainText: '北区',
            secondaryText: '日本、〒530-0001 大阪府大阪市北区'
        })
        expect(parsed && matchCitySuggestion(cities, parsed.mainText, parsed.secondaryText)?.id).toBe('osaka')
    })

    it('rejects a place body that has no city component', () => {
        expect(parsePlaceMatchText({
            types: ['country'],
            formattedAddress: '日本',
            addressComponents: [{ longText: '日本', types: ['country', 'political'] }]
        })).toBeNull()
    })

    it('treats a missing or year-old check as stale', () => {
        const now = Date.parse('2026-10-08T00:00:00.000Z')
        expect(placeIdIsStale(null, now)).toBe(true)
        expect(placeIdIsStale('2025-10-07T00:00:00.000Z', now)).toBe(true)
        expect(placeIdIsStale('2026-09-01T00:00:00.000Z', now)).toBe(false)
    })
})
