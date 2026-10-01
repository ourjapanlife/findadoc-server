import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveSearchCity } from '../src/vocabulary/cityMap.js'
import { mapLanguage, PUBLISHED_LOCALES } from '../src/vocabulary/languageMap.js'
import { mapPaymentBrand } from '../src/vocabulary/paymentBrandMap.js'

const root = path.resolve(import.meta.dirname, '..')

function city(prefectureEn: string, cityEn: string, cityJa: string) {
    return resolveSearchCity({ prefectureEn, cityEn, cityJa })
}

describe('resolveSearchCity', () => {
    it('folds Tokyo ward spellings onto one ward, including a fullwidth space', () => {
        expect(city('Tokyo', 'Minato City', '港区')).toEqual({
            status: 'mapped',
            value: { prefectureEn: 'Tokyo', nameEn: 'Minato', nameJa: '港区' }
        })
        expect(city('Tokyo', 'Chuo　City', '中央区')).toEqual({
            status: 'mapped',
            value: { prefectureEn: 'Tokyo', nameEn: 'Chuo', nameJa: '中央区' }
        })
        expect(city('Tokyo', 'Setagaya', '世田谷')).toEqual({
            status: 'mapped',
            value: { prefectureEn: 'Tokyo', nameEn: 'Setagaya', nameJa: '世田谷区' }
        })
        expect(city('Tokyo', 'Shibuya', '港区').status).toBe('needs_review')
    })

    it('rolls Fukuoka wards up to the city and keeps Kitakyushu separate', () => {
        expect(city('Fukuoka', 'East Ward', '東区').value).toMatchObject({ nameEn: 'Fukuoka' })
        expect(city('Fukuoka', 'Higashi Ward', '東区').value).toMatchObject({ nameEn: 'Fukuoka' })
        expect(city('Fukuoka', 'Chuo Ward', '中央区').value).toMatchObject({ nameEn: 'Fukuoka' })
        expect(city('Fukuoka', 'Watanabedori 2-4-28', '中央区').value).toMatchObject({ nameEn: 'Fukuoka' })
        expect(city('', 'Hakata Ward', '博多区').value).toMatchObject({
            prefectureEn: 'Fukuoka',
            nameEn: 'Fukuoka'
        })
        expect(city('Fukuoka', 'Kitakyushu, Kokuraminami Ward', '北九州市小倉南区').value)
            .toMatchObject({ nameEn: 'Kitakyushu' })
        expect(city('Fukuoka', 'Yahatanishi Ward', '八幡西区').value).toMatchObject({ nameEn: 'Kitakyushu' })
    })

    it('does not merge Chuo across prefectures', () => {
        expect(city('Tokyo', 'Chuo City', '中央区').value).toMatchObject({ prefectureEn: 'Tokyo', nameEn: 'Chuo' })
        expect(city('Fukuoka', 'Chuo Ward', '中央区').value).toMatchObject({ nameEn: 'Fukuoka' })
        expect(city('Osaka', 'Chuo Ward', '中央区').value).toMatchObject({ nameEn: 'Osaka', nameJa: '大阪市' })
        expect(city('Yamanashi', 'Chuo', '中央市').value).toEqual({
            prefectureEn: 'Yamanashi',
            nameEn: 'Chuo',
            nameJa: '中央市'
        })
    })

    it('leaves a bare Osaka ward unresolved when Sakai has the same ward', () => {
        expect(city('Osaka', 'North Ward', '北区')).toEqual({ status: 'needs_review', reason: 'ambiguous_ward' })
        expect(city('Osaka', 'West Ward', '西区')).toEqual({ status: 'needs_review', reason: 'ambiguous_ward' })
        expect(city('Osaka', 'Sakai North Ward', '堺市北区').value).toMatchObject({ nameEn: 'Sakai' })
        expect(city('Osaka', 'Sakai, West Ward', '堺市西区').value).toMatchObject({ nameEn: 'Sakai' })
    })

    it('rolls other designated-city wards up to the parent city', () => {
        expect(city('Hokkaido', 'Sapporo, East Ward', '札幌市東区').value).toMatchObject({ nameEn: 'Sapporo' })
        expect(city('Hokkaido', 'Sapporo, Nishi Ward', '札幌市西区').value).toMatchObject({ nameEn: 'Sapporo' })
        expect(city('Hokkaido', 'Sapporo, West Ward', '札幌市西区').value).toMatchObject({ nameEn: 'Sapporo' })
        expect(city('Kumamoto', 'Kita Ward', '北区').value).toMatchObject({ nameEn: 'Kumamoto' })
        expect(city('Niigata', 'West Ward', '西区').value).toMatchObject({ nameEn: 'Niigata' })
        expect(city('Miyagi', 'Sendai, Aoba Ward', '仙台市青葉区').value).toMatchObject({ nameEn: 'Sendai' })
        expect(city('Saitama', 'Urawa Ward', '浦和区').value).toMatchObject({ nameEn: 'Saitama', nameJa: 'さいたま市' })
    })

    it('keeps a municipality that shares its prefecture name', () => {
        expect(city('Tokushima', 'Tokushima', '徳島市').value).toMatchObject({ nameEn: 'Tokushima', nameJa: '徳島市' })
        expect(city('Okinawa', 'Okinawa', '沖縄市').value).toMatchObject({ nameEn: 'Okinawa', nameJa: '沖縄市' })
        expect(city('Mie', 'Mie', '三重郡')).toEqual({ status: 'needs_review', reason: 'district_only' })
    })

    it('does not pick a winner when English and Japanese name different places', () => {
        expect(city('Akita', 'Daisen', '秋田市')).toEqual({ status: 'needs_review', reason: 'language_disagreement' })
        expect(city('Akita', 'Niida', '秋田市')).toEqual({ status: 'needs_review', reason: 'language_disagreement' })
        expect(city('Niigata', 'Konan Ward', '港南区')).toEqual({
            status: 'needs_review',
            reason: 'language_disagreement'
        })
        expect(city('Akita', 'Akita', '秋田市').value).toMatchObject({ nameEn: 'Akita', nameJa: '秋田市' })
    })

    it('maps the reviewed town and typo rows and leaves a bare district', () => {
        expect(city('Fukui', 'Tsurgua', '敦賀市').value).toMatchObject({ nameEn: 'Tsuruga', nameJa: '敦賀市' })
        expect(city('Osaka', 'Minoh', '府箕面市').value).toMatchObject({ nameEn: 'Minoh', nameJa: '箕面市' })
        expect(city('Osaka', 'Ikeda', '池田').value).toMatchObject({ nameEn: 'Ikeda', nameJa: '池田市' })
        expect(city('Miyagi', 'Miyagi District, Rifu', '宮城郡利府町').value).toMatchObject({
            nameEn: 'Rifu',
            nameJa: '利府町'
        })
        expect(city('Hokkaido', 'Esashi, Hiyama District', '桧山郡江差町').value).toMatchObject({
            nameEn: 'Esashi',
            nameJa: '江差町'
        })
        expect(city('Hokkaido', 'Kutchan, Abuta District North 4', '虻田郡倶知安町北4').value).toMatchObject({
            nameEn: 'Kutchan',
            nameJa: '倶知安町'
        })
        expect(city('Fukuoka', 'Kasuya District', '糟屋郡')).toEqual({
            status: 'needs_review',
            reason: 'district_only'
        })
    })
})

describe('mapLanguage', () => {
    it('maps spreadsheet codes onto published locales and holds everything else', () => {
        expect(mapLanguage('EN')).toEqual({ status: 'mapped', value: 'en_US' })
        expect(mapLanguage('ZH')).toEqual({ status: 'mapped', value: 'zh_CN' })
        expect(mapLanguage('ZH-HK')).toEqual({ status: 'mapped', value: 'zh_HK' })
        expect(mapLanguage('KO')).toEqual({ status: 'mapped', value: 'ko_KR' })
        expect(mapLanguage('RU')).toEqual({ status: 'mapped', value: 'ru_RU' })
        expect(mapLanguage('en_US')).toEqual({ status: 'mapped', value: 'en_US' })
        expect(mapLanguage('ja_JP')).toEqual({ status: 'mapped', value: 'ja_JP' })
        expect(mapLanguage('zh_TW')).toEqual({ status: 'needs_review', reason: 'unpublished_locale' })
        expect(mapLanguage('und')).toEqual({ status: 'needs_review', reason: 'unpublished_locale' })
        expect(mapLanguage('ak_GH')).toEqual({ status: 'needs_review', reason: 'unpublished_locale' })
        expect(mapLanguage('')).toEqual({ status: 'needs_review', reason: 'empty' })
    })
})

describe('mapPaymentBrand', () => {
    it('maps spreadsheet brands and keeps an unmapped brand for review', () => {
        expect(mapPaymentBrand('VISA')).toEqual({ status: 'mapped', value: { brand: 'Visa' } })
        expect(mapPaymentBrand('MASTER')).toEqual({ status: 'mapped', value: { brand: 'Mastercard' } })
        expect(mapPaymentBrand('AMEX')).toEqual({ status: 'mapped', value: { brand: 'American Express' } })
        expect(mapPaymentBrand('UnionPay')).toEqual({ status: 'mapped', value: { brand: 'UnionPay' } })
        expect(mapPaymentBrand('Coiney')).toEqual({ status: 'mapped', value: { brand: 'Other', note: 'Coiney' } })
        expect(mapPaymentBrand('Suica')).toEqual({ status: 'mapped', value: { brand: 'IC' } })
        expect(mapPaymentBrand('Bitcoin')).toEqual({ status: 'needs_review', reason: 'unmapped_brand' })
        expect(mapPaymentBrand('')).toEqual({ status: 'needs_review', reason: 'empty' })
    })
})

describe('vocabulary maps stay off the API', () => {
    it('is not imported by resolvers or services', () => {
        const src = path.join(root, 'src')
        const files: string[] = []

        function walk(directory: string) {
            for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
                const fullPath = path.join(directory, entry.name)

                if (entry.isDirectory()) {
                    if (entry.name === 'vocabulary') {
                        continue
                    }

                    walk(fullPath)
                } else if (entry.name.endsWith('.ts')) {
                    files.push(fullPath)
                }
            }
        }

        walk(src)

        const offenders = files.filter(file => fs.readFileSync(file, 'utf8').includes('vocabulary/'))

        expect(offenders).toEqual([])
    })

    it('does not change the GraphQL fields the frontend already queries', () => {
        const schema = fs.readFileSync(path.join(root, 'src/typeDefs/schema.graphql'), 'utf8')

        expect(schema).toContain('cityEn: String!')
        expect(schema).toContain('cityJa: String!')
        expect(schema).toContain('paymentBrands: [String!]')
        expect(schema).toContain('enum Locale')

        for (const locale of PUBLISHED_LOCALES) {
            expect(schema).toContain(locale)
        }
    })
})
