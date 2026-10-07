import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { citySlug, resolveFacilityLocation, resolveSearchCity, vocabularyCities } from '../src/vocabulary/cityMap.js'
import { mapLanguage, PUBLISHED_LOCALES } from '../src/vocabulary/languageMap.js'
import { mapPaymentBrand } from '../src/vocabulary/paymentBrandMap.js'
import { prefectureTranslations } from '../utils/japanesePrefectures.js'

const root = path.resolve(import.meta.dirname, '..')

function city(prefectureEn: string, cityEn: string, cityJa: string) {
    return resolveSearchCity({ prefectureEn, cityEn, cityJa })
}

function mappedCity(prefectureEn: string, cityEn: string, cityJa: string) {
    const outcome = city(prefectureEn, cityEn, cityJa)

    if (outcome.status !== 'mapped') {
        throw new Error(`expected a mapped city, got ${outcome.reason}`)
    }

    return outcome.value
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
        expect(mappedCity('Fukuoka', 'East Ward', '東区')).toMatchObject({ nameEn: 'Fukuoka' })
        expect(mappedCity('Fukuoka', 'Higashi Ward', '東区')).toMatchObject({ nameEn: 'Fukuoka' })
        expect(mappedCity('Fukuoka', 'Chuo Ward', '中央区')).toMatchObject({ nameEn: 'Fukuoka' })
        expect(mappedCity('Fukuoka', 'Watanabedori 2-4-28', '中央区')).toMatchObject({ nameEn: 'Fukuoka' })
        expect(mappedCity('', 'Hakata Ward', '博多区')).toMatchObject({
            prefectureEn: 'Fukuoka',
            nameEn: 'Fukuoka'
        })
        expect(mappedCity('Fukuoka', 'Kitakyushu, Kokuraminami Ward', '北九州市小倉南区'))
            .toMatchObject({ nameEn: 'Kitakyushu' })
        expect(mappedCity('Fukuoka', 'Yahatanishi Ward', '八幡西区')).toMatchObject({ nameEn: 'Kitakyushu' })
    })

    it('does not merge Chuo across prefectures', () => {
        expect(mappedCity('Tokyo', 'Chuo City', '中央区')).toMatchObject({ prefectureEn: 'Tokyo', nameEn: 'Chuo' })
        expect(mappedCity('Fukuoka', 'Chuo Ward', '中央区')).toMatchObject({ nameEn: 'Fukuoka' })
        expect(mappedCity('Osaka', 'Chuo Ward', '中央区')).toMatchObject({ nameEn: 'Osaka', nameJa: '大阪市' })
        expect(mappedCity('Yamanashi', 'Chuo', '中央市')).toEqual({
            prefectureEn: 'Yamanashi',
            nameEn: 'Chuo',
            nameJa: '中央市'
        })
    })

    it('leaves a bare Osaka ward unresolved when Sakai has the same ward', () => {
        expect(city('Osaka', 'North Ward', '北区')).toEqual({ status: 'needs_review', reason: 'ambiguous_ward' })
        expect(city('Osaka', 'West Ward', '西区')).toEqual({ status: 'needs_review', reason: 'ambiguous_ward' })
        expect(mappedCity('Osaka', 'Sakai North Ward', '堺市北区')).toMatchObject({ nameEn: 'Sakai' })
        expect(mappedCity('Osaka', 'Sakai, West Ward', '堺市西区')).toMatchObject({ nameEn: 'Sakai' })
    })

    it('rolls other designated-city wards up to the parent city', () => {
        expect(mappedCity('Hokkaido', 'Sapporo, East Ward', '札幌市東区')).toMatchObject({ nameEn: 'Sapporo' })
        expect(mappedCity('Hokkaido', 'Sapporo, Nishi Ward', '札幌市西区')).toMatchObject({ nameEn: 'Sapporo' })
        expect(mappedCity('Hokkaido', 'Sapporo, West Ward', '札幌市西区')).toMatchObject({ nameEn: 'Sapporo' })
        expect(mappedCity('Kumamoto', 'Kita Ward', '北区')).toMatchObject({ nameEn: 'Kumamoto' })
        expect(mappedCity('Niigata', 'West Ward', '西区')).toMatchObject({ nameEn: 'Niigata' })
        expect(mappedCity('Miyagi', 'Sendai, Aoba Ward', '仙台市青葉区')).toMatchObject({ nameEn: 'Sendai' })
        expect(mappedCity('Saitama', 'Urawa Ward', '浦和区')).toMatchObject({ nameEn: 'Saitama', nameJa: 'さいたま市' })
    })

    it('keeps a municipality that shares its prefecture name', () => {
        expect(mappedCity('Tokushima', 'Tokushima', '徳島市')).toMatchObject({ nameEn: 'Tokushima', nameJa: '徳島市' })
        expect(mappedCity('Okinawa', 'Okinawa', '沖縄市')).toMatchObject({ nameEn: 'Okinawa', nameJa: '沖縄市' })
        expect(city('Mie', 'Mie', '三重郡')).toEqual({ status: 'needs_review', reason: 'district_only' })
    })

    it('does not pick a winner when English and Japanese name different places', () => {
        expect(city('Akita', 'Daisen', '秋田市')).toEqual({ status: 'needs_review', reason: 'language_disagreement' })
        expect(city('Niigata', 'Konan Ward', '港南区')).toEqual({
            status: 'needs_review',
            reason: 'language_disagreement'
        })
        expect(mappedCity('Akita', 'Akita', '秋田市')).toMatchObject({ nameEn: 'Akita', nameJa: '秋田市' })
        expect(mappedCity('Akita', 'Niida', '秋田市')).toMatchObject({ nameEn: 'Akita', nameJa: '秋田市' })
        expect(mappedCity('Hyogo', 'Ashiya', '兵庫県')).toMatchObject({ nameEn: 'Ashiya', nameJa: '芦屋市' })
        expect(mappedCity('Akita', 'Kita Akita', '北秋田市')).toMatchObject({ nameEn: 'Kitaakita' })
        expect(mappedCity('Kagoshima', 'Nishinoomote', '西之表市')).toMatchObject({ nameEn: 'Nishinomote' })
        expect(mappedCity('Tochigi', 'Nikko', '日光')).toMatchObject({ nameEn: 'Nikko', nameJa: '日光市' })
        expect(mappedCity('Saga', 'Kasemachi', '嘉瀬町')).toMatchObject({ nameEn: 'Saga', nameJa: '佐賀市' })
    })

    it('reads the town from the address when the city field is only a district', () => {
        expect(resolveFacilityLocation({
            prefectureEn: 'Fukuoka',
            cityEn: 'Kasuya District',
            cityJa: '糟屋郡',
            addressLine1Ja: '粕屋町長者原東３－２－３０'
        })).toMatchObject({ status: 'mapped', value: { nameEn: 'Kasuya', nameJa: '粕屋町' } })
        expect(resolveFacilityLocation({
            prefectureEn: 'Akita',
            cityEn: 'Daisen',
            cityJa: '秋田市',
            addressLine1Ja: '大花町14-3'
        })).toMatchObject({ status: 'mapped', value: { nameEn: 'Daisen', nameJa: '大仙市' } })
        expect(resolveFacilityLocation({
            prefectureEn: 'Osaka',
            cityEn: 'North Ward',
            cityJa: '北区',
            addressLine1Ja: '天神橋７－５－１５'
        })).toMatchObject({ status: 'mapped', value: { nameEn: 'Osaka', nameJa: '大阪市' } })
        expect(resolveFacilityLocation({
            prefectureEn: 'Niigata',
            cityEn: 'Konan Ward',
            cityJa: '港南区',
            addressLine1Ja: '稲葉１－４－３'
        })).toMatchObject({ status: 'mapped', value: { nameEn: 'Niigata', nameJa: '新潟市' } })
        expect(resolveFacilityLocation({
            prefectureEn: 'Nagano',
            cityEn: 'Shimotakai District',
            cityJa: '下高井郡',
            addressLine1En: 'Nozawaonsen Toyosato Oyu 9323'
        })).toMatchObject({ status: 'mapped', value: { nameEn: 'Nozawaonsen', nameJa: '野沢温泉村' } })
    })

    it('refuses a municipality that is not in the official list', () => {
        expect(city('Hokkaido', 'Foo', 'フー市')).toEqual({ status: 'needs_review', reason: 'unmapped' })
        expect(city('Hokkaido', 'Esashi', '枝幸町')).toEqual({ status: 'needs_review', reason: 'unmapped' })
    })

    it('maps the reviewed town and typo rows and leaves a bare district', () => {
        expect(mappedCity('Fukui', 'Tsurgua', '敦賀市')).toMatchObject({ nameEn: 'Tsuruga', nameJa: '敦賀市' })
        expect(mappedCity('Osaka', 'Minoh', '府箕面市')).toMatchObject({ nameEn: 'Minoh', nameJa: '箕面市' })
        expect(mappedCity('Osaka', 'Ikeda', '池田')).toMatchObject({ nameEn: 'Ikeda', nameJa: '池田市' })
        expect(mappedCity('Miyagi', 'Miyagi District, Rifu', '宮城郡利府町')).toMatchObject({
            nameEn: 'Rifu',
            nameJa: '利府町'
        })
        expect(mappedCity('Hokkaido', 'Esashi, Hiyama District', '桧山郡江差町')).toMatchObject({
            nameEn: 'Esashi',
            nameJa: '江差町'
        })
        expect(mappedCity('Hokkaido', 'Kutchan, Abuta District North 4', '虻田郡倶知安町北4')).toMatchObject({
            nameEn: 'Kutchan',
            nameJa: '倶知安町'
        })
        expect(city('Fukuoka', 'Kasuya District', '糟屋郡')).toEqual({
            status: 'needs_review',
            reason: 'district_only'
        })
        expect(mappedCity('Fukushima', 'Koriyama', '郡山市')).toMatchObject({ nameEn: 'Koriyama', nameJa: '郡山市' })
        expect(mappedCity('Ishikawa', 'Anamizu, Hosu District', '穴水町字')).toMatchObject({
            nameEn: 'Anamizu',
            nameJa: '穴水町'
        })
        expect(mappedCity('Niigata', 'Joetsu', '上越市吉川区')).toMatchObject({ nameEn: 'Joetsu', nameJa: '上越市' })
        expect(mappedCity('Miyagi', 'Osaki, Matsuyamasengoku', '大崎市松山千石字')).toMatchObject({
            nameEn: 'Osaki',
            nameJa: '大崎市'
        })
        expect(mappedCity('Ishikawa', 'Kanazawa', '⾦沢市')).toMatchObject({ nameEn: 'Kanazawa', nameJa: '金沢市' })
        expect(mappedCity('Tochigi', 'Takenezawa, Shioya District', '塩谷郡高根沢町大字')).toMatchObject({
            nameEn: 'Takanezawa',
            nameJa: '高根沢町'
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

describe('vocabularyCities', () => {
    it('is the official municipality list, with one slug per prefecture', () => {
        const cities = vocabularyCities()
        const keys = cities.map(searchCity => `${searchCity.prefectureEn}|${citySlug(searchCity.nameEn)}`)
        const wards = cities.filter(searchCity => searchCity.nameJa.endsWith('区'))

        expect(cities).toHaveLength(1747)
        expect(new Set(keys).size).toBe(keys.length)
        expect(new Set(cities.map(searchCity => searchCity.lgCode)).size).toBe(cities.length)
        expect(wards).toHaveLength(23)
        expect(new Set(wards.map(searchCity => searchCity.prefectureEn))).toEqual(new Set(['Tokyo']))
        expect(cities).toContainEqual({ lgCode: '131024', prefectureEn: 'Tokyo', nameEn: 'Chuo', nameJa: '中央区' })
        expect(cities).toContainEqual({ lgCode: '192147', prefectureEn: 'Yamanashi', nameEn: 'Chuo', nameJa: '中央市' })
        expect(cities).toContainEqual({ lgCode: '271004', prefectureEn: 'Osaka', nameEn: 'Osaka', nameJa: '大阪市' })
        expect(cities).toContainEqual({ lgCode: '011002', prefectureEn: 'Hokkaido', nameEn: 'Sapporo', nameJa: '札幌市' })
        expect(cities).toContainEqual({ lgCode: '013617', prefectureEn: 'Hokkaido', nameEn: 'Esashi', nameJa: '江差町' })
        expect(cities.find(searchCity => searchCity.prefectureEn === 'Osaka' && searchCity.nameEn === 'Chuo')).toBeUndefined()
        expect(cities.find(searchCity => searchCity.nameJa === '札幌市中央区')).toBeUndefined()

        for (const searchCity of cities) {
            expect(prefectureTranslations[searchCity.prefectureEn]).toBeTruthy()
            expect(searchCity.lgCode).toMatch(/^\d{6}$/)
            expect(searchCity.nameEn).not.toMatch(/city|ward|district/i)
        }
    })
})
