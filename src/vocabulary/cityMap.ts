import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prefectureTranslations } from '../../utils/japanesePrefectures.js'
import { mapped, needsReview, type MapOutcome } from './types.js'

/**
 * Search-city aliases from docs/city-rules.md (#1006).
 * Not imported by resolvers or services. Stored `cityEn` values stay as they
 * are until the backfill in #1011.
 */
export type CanonicalCity = {
    prefectureEn: string
    nameEn: string
    nameJa: string
}

/** One row of the official municipality list. `lgCode` is 全国地方公共団体コード. */
export type OfficialMunicipality = CanonicalCity & {
    lgCode: string
}

export type CitySource = {
    prefectureEn: string
    cityEn: string
    cityJa: string
}

const FUKUOKA: CanonicalCity = { prefectureEn: 'Fukuoka', nameEn: 'Fukuoka', nameJa: '福岡市' }
const KITAKYUSHU: CanonicalCity = { prefectureEn: 'Fukuoka', nameEn: 'Kitakyushu', nameJa: '北九州市' }
const SAPPORO: CanonicalCity = { prefectureEn: 'Hokkaido', nameEn: 'Sapporo', nameJa: '札幌市' }
const SENDAI: CanonicalCity = { prefectureEn: 'Miyagi', nameEn: 'Sendai', nameJa: '仙台市' }
const SAITAMA_CITY: CanonicalCity = { prefectureEn: 'Saitama', nameEn: 'Saitama', nameJa: 'さいたま市' }
const YOKOHAMA: CanonicalCity = { prefectureEn: 'Kanagawa', nameEn: 'Yokohama', nameJa: '横浜市' }
const OSAKA_CITY: CanonicalCity = { prefectureEn: 'Osaka', nameEn: 'Osaka', nameJa: '大阪市' }
const SAKAI: CanonicalCity = { prefectureEn: 'Osaka', nameEn: 'Sakai', nameJa: '堺市' }
const NIIGATA_CITY: CanonicalCity = { prefectureEn: 'Niigata', nameEn: 'Niigata', nameJa: '新潟市' }
const KUMAMOTO_CITY: CanonicalCity = { prefectureEn: 'Kumamoto', nameEn: 'Kumamoto', nameJa: '熊本市' }
const KOBE: CanonicalCity = { prefectureEn: 'Hyogo', nameEn: 'Kobe', nameJa: '神戸市' }

const PARENT_CITIES: { prefix: string, city: CanonicalCity }[] = [
    { prefix: '北九州市', city: KITAKYUSHU },
    { prefix: '札幌市', city: SAPPORO },
    { prefix: '仙台市', city: SENDAI },
    { prefix: 'さいたま市', city: SAITAMA_CITY },
    { prefix: '横浜市', city: YOKOHAMA },
    { prefix: '大阪市', city: OSAKA_CITY },
    { prefix: '堺市', city: SAKAI },
    { prefix: '新潟市', city: NIIGATA_CITY },
    { prefix: '熊本市', city: KUMAMOTO_CITY },
    { prefix: '福岡市', city: FUKUOKA },
    { prefix: '神戸市', city: KOBE }
]

/**
 * Bare ward → the one designated city in that prefecture that contains it.
 * Osaka omits Kita, Nishi, Minami, and Higashi because Sakai has those wards too.
 */
const WARD_ROLLUP: Record<string, Record<string, CanonicalCity>> = {
    Fukuoka: {
        中央区: FUKUOKA,
        東区: FUKUOKA,
        博多区: FUKUOKA,
        早良区: FUKUOKA,
        南区: FUKUOKA,
        西区: FUKUOKA,
        城南区: FUKUOKA,
        小倉北区: KITAKYUSHU,
        小倉南区: KITAKYUSHU,
        戸畑区: KITAKYUSHU,
        若松区: KITAKYUSHU,
        八幡西区: KITAKYUSHU,
        八幡東区: KITAKYUSHU,
        門司区: KITAKYUSHU
    },
    Kumamoto: {
        中央区: KUMAMOTO_CITY,
        東区: KUMAMOTO_CITY,
        西区: KUMAMOTO_CITY,
        南区: KUMAMOTO_CITY,
        北区: KUMAMOTO_CITY
    },
    Niigata: {
        北区: NIIGATA_CITY,
        東区: NIIGATA_CITY,
        中央区: NIIGATA_CITY,
        江南区: NIIGATA_CITY,
        秋葉区: NIIGATA_CITY,
        南区: NIIGATA_CITY,
        西区: NIIGATA_CITY,
        西蒲区: NIIGATA_CITY
    },
    Osaka: {
        都島区: OSAKA_CITY,
        福島区: OSAKA_CITY,
        此花区: OSAKA_CITY,
        港区: OSAKA_CITY,
        大正区: OSAKA_CITY,
        天王寺区: OSAKA_CITY,
        浪速区: OSAKA_CITY,
        西淀川区: OSAKA_CITY,
        東淀川区: OSAKA_CITY,
        東成区: OSAKA_CITY,
        生野区: OSAKA_CITY,
        旭区: OSAKA_CITY,
        城東区: OSAKA_CITY,
        鶴見区: OSAKA_CITY,
        阿倍野区: OSAKA_CITY,
        住之江区: OSAKA_CITY,
        住吉区: OSAKA_CITY,
        東住吉区: OSAKA_CITY,
        西成区: OSAKA_CITY,
        淀川区: OSAKA_CITY,
        中央区: OSAKA_CITY
    },
    Hokkaido: {
        中央区: SAPPORO,
        北区: SAPPORO,
        東区: SAPPORO,
        白石区: SAPPORO,
        厚別区: SAPPORO,
        豊平区: SAPPORO,
        清田区: SAPPORO,
        南区: SAPPORO,
        西区: SAPPORO,
        手稲区: SAPPORO
    },
    Saitama: {
        西区: SAITAMA_CITY,
        北区: SAITAMA_CITY,
        大宮区: SAITAMA_CITY,
        見沼区: SAITAMA_CITY,
        中央区: SAITAMA_CITY,
        桜区: SAITAMA_CITY,
        浦和区: SAITAMA_CITY,
        南区: SAITAMA_CITY,
        緑区: SAITAMA_CITY,
        岩槻区: SAITAMA_CITY
    },
    Miyagi: {
        青葉区: SENDAI,
        宮城野区: SENDAI,
        若林区: SENDAI,
        太白区: SENDAI,
        泉区: SENDAI
    }
}

/** Shared by Osaka city and Sakai. A bare ward is not enough to pick one. */
const OSAKA_SHARED_WARDS = new Set(['北区', '西区', '南区', '東区'])

const COMPASS_TO_WARD: Record<string, string> = {
    east: '東区',
    higashi: '東区',
    west: '西区',
    nishi: '西区',
    north: '北区',
    kita: '北区',
    south: '南区',
    minami: '南区',
    chuo: '中央区'
}

/** Slug for a frozen English city name. Suffixes are already gone. */
export function citySlug(nameEn: string): string {
    return nameEn.trim().toLowerCase().replace(/\s+/g, '-')
}

const OFFICIAL_MUNICIPALITIES: OfficialMunicipality[] = JSON.parse(
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'municipalities.json'), 'utf8')
)

const OFFICIAL_BY_JA = new Map(
    OFFICIAL_MUNICIPALITIES.map(city => [`${city.prefectureEn}|${city.nameJa}`, city])
)

/**
 * Every search city this server owns. Built from the Address Base Registry by
 * utils/buildMunicipalityVocabulary.py and shaped by docs/city-rules.md.
 * Designated-city wards are not in this list. Tokyo's 23 wards are.
 */
export function vocabularyCities(): OfficialMunicipality[] {
    return OFFICIAL_MUNICIPALITIES
}

function officialMatch(prefectureEn: string, nameEn: string, nameJa: string): CanonicalCity | undefined {
    const official = OFFICIAL_BY_JA.get(`${prefectureEn}|${nameJa}`)

    if (!official || citySlug(nameEn) !== citySlug(official.nameEn)) {
        return undefined
    }

    return {
        prefectureEn: official.prefectureEn,
        nameEn: official.nameEn,
        nameJa: official.nameJa
    }
}

export const TOKYO_WARDS: CanonicalCity[] = [
    { prefectureEn: 'Tokyo', nameEn: 'Chiyoda', nameJa: '千代田区' },
    { prefectureEn: 'Tokyo', nameEn: 'Chuo', nameJa: '中央区' },
    { prefectureEn: 'Tokyo', nameEn: 'Minato', nameJa: '港区' },
    { prefectureEn: 'Tokyo', nameEn: 'Shinjuku', nameJa: '新宿区' },
    { prefectureEn: 'Tokyo', nameEn: 'Bunkyo', nameJa: '文京区' },
    { prefectureEn: 'Tokyo', nameEn: 'Taito', nameJa: '台東区' },
    { prefectureEn: 'Tokyo', nameEn: 'Sumida', nameJa: '墨田区' },
    { prefectureEn: 'Tokyo', nameEn: 'Koto', nameJa: '江東区' },
    { prefectureEn: 'Tokyo', nameEn: 'Shinagawa', nameJa: '品川区' },
    { prefectureEn: 'Tokyo', nameEn: 'Meguro', nameJa: '目黒区' },
    { prefectureEn: 'Tokyo', nameEn: 'Ota', nameJa: '大田区' },
    { prefectureEn: 'Tokyo', nameEn: 'Setagaya', nameJa: '世田谷区' },
    { prefectureEn: 'Tokyo', nameEn: 'Shibuya', nameJa: '渋谷区' },
    { prefectureEn: 'Tokyo', nameEn: 'Nakano', nameJa: '中野区' },
    { prefectureEn: 'Tokyo', nameEn: 'Suginami', nameJa: '杉並区' },
    { prefectureEn: 'Tokyo', nameEn: 'Toshima', nameJa: '豊島区' },
    { prefectureEn: 'Tokyo', nameEn: 'Kita', nameJa: '北区' },
    { prefectureEn: 'Tokyo', nameEn: 'Arakawa', nameJa: '荒川区' },
    { prefectureEn: 'Tokyo', nameEn: 'Itabashi', nameJa: '板橋区' },
    { prefectureEn: 'Tokyo', nameEn: 'Nerima', nameJa: '練馬区' },
    { prefectureEn: 'Tokyo', nameEn: 'Adachi', nameJa: '足立区' },
    { prefectureEn: 'Tokyo', nameEn: 'Katsushika', nameJa: '葛飾区' },
    { prefectureEn: 'Tokyo', nameEn: 'Edogawa', nameJa: '江戸川区' }
]

type ExplicitAlias = CitySource & { city: CanonicalCity }

/** Pairs the frozen rules already decided, including corrupt Japanese that a parser would misread. */
const EXPLICIT_ALIASES: ExplicitAlias[] = [
    { prefectureEn: '', cityEn: 'Hakata Ward', cityJa: '博多区', city: FUKUOKA },
    { prefectureEn: 'Fukui', cityEn: 'Tsurgua', cityJa: '敦賀市', city: { prefectureEn: 'Fukui', nameEn: 'Tsuruga', nameJa: '敦賀市' } },
    { prefectureEn: 'Osaka', cityEn: 'Ikeda', cityJa: '池田', city: { prefectureEn: 'Osaka', nameEn: 'Ikeda', nameJa: '池田市' } },
    {
        prefectureEn: 'Hokkaido',
        cityEn: 'Kutchan, Abuta District',
        cityJa: '田郡俱知安虻町',
        city: { prefectureEn: 'Hokkaido', nameEn: 'Kutchan', nameJa: '倶知安町' }
    },
    {
        prefectureEn: 'Hokkaido',
        cityEn: 'Kutchan, Abuta District North 4',
        cityJa: '虻田郡倶知安町北4',
        city: { prefectureEn: 'Hokkaido', nameEn: 'Kutchan', nameJa: '倶知安町' }
    }
]

const DISAGREEMENTS: CitySource[] = [
    { prefectureEn: 'Akita', cityEn: 'Daisen', cityJa: '秋田市' },
    { prefectureEn: 'Akita', cityEn: 'Niida', cityJa: '秋田市' },
    { prefectureEn: 'Hyogo', cityEn: 'Ashiya', cityJa: '兵庫県' },
    { prefectureEn: 'Niigata', cityEn: 'Konan Ward', cityJa: '港南区' }
]

function squash(value: string): string {
    return value.replace(/\u3000/g, ' ').replace(/\s+/g, ' ').trim()
}

function cleanJa(value: string): string {
    const squashed = squash(value)

    return squashed.replace(/^[府県](?=.*[市区町村])/, '')
}

function englishKey(value: string): string {
    return squash(value).toLowerCase().replace(/\s+(city|ward|ku)$/i, '').trim()
}

function sourceKey(prefectureEn: string, cityEn: string, cityJa: string): string {
    return `${squash(prefectureEn).toLowerCase()}|${englishKey(cityEn)}|${cleanJa(cityJa)}`
}

function wardJa(cityJa: string): string | undefined {
    return cleanJa(cityJa).match(/([一-龯々]+区)$/)?.[1]
}

function isStreet(cityEn: string): boolean {
    return /\d/.test(cityEn) || /dori|chome/i.test(cityEn)
}

function knownPrefecture(prefectureEn: string): boolean {
    return Object.prototype.hasOwnProperty.call(prefectureTranslations, prefectureEn)
}

function sameCity(left: CanonicalCity, right: CanonicalCity): boolean {
    return left.prefectureEn === right.prefectureEn && left.nameEn === right.nameEn && left.nameJa === right.nameJa
}

function tokyoWard(cityEn: string, cityJa: string): CanonicalCity | 'disagree' | undefined {
    const key = englishKey(cityEn)
    const ja = cleanJa(cityJa)
    const fromEn = TOKYO_WARDS.find(ward => ward.nameEn.toLowerCase() === key)
    const fromJa = TOKYO_WARDS.find(ward => ward.nameJa === ja || ward.nameJa.replace(/区$/, '') === ja)

    if (fromEn && fromJa && !sameCity(fromEn, fromJa)) {
        return 'disagree'
    }

    if (fromEn && ja && !fromJa) {
        return 'disagree'
    }

    if (fromJa && key && !fromEn) {
        return 'disagree'
    }

    return fromEn ?? fromJa
}

function parentCity(prefectureEn: string, cityJa: string): CanonicalCity | 'wrong_prefecture' | undefined {
    const ja = cleanJa(cityJa)
    const parent = PARENT_CITIES.find(candidate => ja.startsWith(candidate.prefix))

    if (!parent) {
        return undefined
    }

    if (prefectureEn && prefectureEn !== parent.city.prefectureEn) {
        return 'wrong_prefecture'
    }

    return parent.city
}

function englishParent(prefectureEn: string, cityEn: string): CanonicalCity | undefined {
    const name = squash(cityEn)

    if (!/,|ward$/i.test(name)) {
        return undefined
    }

    const parent = PARENT_CITIES.find(candidate => name.toLowerCase().startsWith(candidate.city.nameEn.toLowerCase()))

    if (!parent || (prefectureEn && prefectureEn !== parent.city.prefectureEn)) {
        return undefined
    }

    return parent.city
}

function compassAgrees(cityEn: string, cityJa: string): boolean {
    const expected = COMPASS_TO_WARD[englishKey(cityEn)]
    const actual = wardJa(cityJa)

    if (!expected || !actual) {
        return true
    }

    return expected === actual
}

function townFromDistrict(prefectureEn: string, cityEn: string, cityJa: string): CanonicalCity | undefined {
    const townJa = cleanJa(cityJa).match(/郡(.+?[町村])/)?.[1]

    if (!townJa || !knownPrefecture(prefectureEn)) {
        return undefined
    }

    const parts = squash(cityEn)
        .split(',')
        .map(part => part.trim())
        .filter(part => part && !/district/i.test(part) && !/\d/.test(part))

    if (parts.length !== 1) {
        return undefined
    }

    return officialMatch(prefectureEn, parts[0].replace(/\s+city$/i, ''), townJa)
}

function selfMap(prefectureEn: string, cityEn: string, cityJa: string): CanonicalCity | undefined {
    const name = squash(cityEn)
    const ja = cleanJa(cityJa)

    if (!knownPrefecture(prefectureEn)) {
        return undefined
    }

    if (/ward|district/i.test(name) || /\d/.test(name) || /[,，]/.test(name)) {
        return undefined
    }

    if (!/(市|町|村)$/.test(ja)) {
        return undefined
    }

    const nameEn = name.replace(/\s+city$/i, '')

    if (!nameEn) {
        return undefined
    }

    return officialMatch(prefectureEn, nameEn, ja)
}

function explicitAlias(prefectureEn: string, cityEn: string, cityJa: string): CanonicalCity | undefined {
    const key = sourceKey(prefectureEn, cityEn, cityJa)

    return EXPLICIT_ALIASES.find(alias => sourceKey(alias.prefectureEn, alias.cityEn, alias.cityJa) === key)?.city
}

function disagreement(prefectureEn: string, cityEn: string, cityJa: string): boolean {
    const key = sourceKey(prefectureEn, cityEn, cityJa)

    return DISAGREEMENTS.some(row => sourceKey(row.prefectureEn, row.cityEn, row.cityJa) === key)
}

/**
 * Resolve one stored address onto a search city.
 * Unresolved rows come back as `needs_review` and are not given a guessed city.
 */
export function resolveSearchCity(source: CitySource): MapOutcome<CanonicalCity> {
    const prefectureEn = squash(source.prefectureEn)
    const cityEn = squash(source.cityEn)
    const cityJa = cleanJa(source.cityJa)
    const alias = explicitAlias(prefectureEn, cityEn, cityJa)

    if (alias) {
        return mapped(alias)
    }

    if (disagreement(prefectureEn, cityEn, cityJa)) {
        return needsReview('language_disagreement')
    }

    if (prefectureEn && !knownPrefecture(prefectureEn)) {
        return needsReview('unknown_prefecture')
    }

    const usableEn = isStreet(cityEn) ? '' : cityEn
    const parent = parentCity(prefectureEn, cityJa)

    if (parent === 'wrong_prefecture') {
        return needsReview('language_disagreement')
    }

    if (parent) {
        return mapped(parent)
    }

    const fromEnglishParent = englishParent(prefectureEn, usableEn)

    if (fromEnglishParent) {
        return mapped(fromEnglishParent)
    }

    if (prefectureEn === 'Tokyo') {
        const ward = tokyoWard(usableEn, cityJa)

        if (ward === 'disagree') {
            return needsReview('language_disagreement')
        }

        if (ward) {
            return mapped(ward)
        }

        return needsReview('unmapped')
    }

    if (!compassAgrees(usableEn, cityJa)) {
        return needsReview('language_disagreement')
    }

    const ward = wardJa(cityJa)

    if (ward && prefectureEn === 'Osaka' && OSAKA_SHARED_WARDS.has(ward)) {
        return needsReview('ambiguous_ward')
    }

    const rollup = ward ? WARD_ROLLUP[prefectureEn]?.[ward] : undefined

    if (rollup) {
        return mapped(rollup)
    }

    if (ward || /ward$/i.test(usableEn)) {
        return needsReview('unmapped')
    }

    const town = townFromDistrict(prefectureEn, usableEn, cityJa)

    if (town) {
        return mapped(town)
    }

    if (/郡/.test(cityJa) || /district$/i.test(usableEn)) {
        return needsReview('district_only')
    }

    const municipality = selfMap(prefectureEn, usableEn, cityJa)

    if (municipality) {
        return mapped(municipality)
    }

    return needsReview('unmapped')
}
