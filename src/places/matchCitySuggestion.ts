import { prefectureTranslations, resolvePrefectureKey } from '../../utils/japanesePrefectures.js'

/** A city row the suggestion matcher is allowed to return. */
export type MatchableCity = {
    id: string
    nameEn: string
    nameJa: string
    prefectureEn: string
}

const ENGLISH_SUFFIX = /\s+(city|ward|district|ku)$/i

/**
 * Map one Places suggestion onto a single city we own.
 * A ward that names its parent city rolls up to that city. A bare ward that
 * could be two cities stays unmatched.
 */
export function matchCitySuggestion<T extends MatchableCity>(
    cities: readonly T[],
    mainText: string,
    secondaryText: string
): T | null {
    const blob = `${mainText} ${secondaryText}`
    const prefectureEn = prefectureIn(blob)
    if (!prefectureEn) return null

    const inPrefecture = cities.filter(city => city.prefectureEn === prefectureEn)
    if (inPrefecture.length === 0) return null

    const main = stripPrefecture(mainText, prefectureEn)
    const exactJapanese = unique(inPrefecture.filter(city => city.nameJa === main))
    if (exactJapanese.length === 1) return exactJapanese[0] ?? null
    if (exactJapanese.length > 1) return null

    const englishKey = englishCityKey(main)
    if (englishKey) {
        const exactEnglish = unique(inPrefecture.filter(city => englishCityKey(city.nameEn) === englishKey))
        if (exactEnglish.length === 1) return exactEnglish[0] ?? null
        if (exactEnglish.length > 1) return null
    }

    const stem = main.replace(/[市区町村]$/u, '')
    if (stem && stem !== main) {
        const byStem = unique(inPrefecture.filter(city =>
            city.nameJa.replace(/[市区町村]$/u, '') === stem))
        if (byStem.length === 1) return byStem[0] ?? null
    }

    const namedParents = unique(inPrefecture.filter(city =>
        city.nameJa.endsWith('市') && blob.includes(city.nameJa) && city.nameJa !== main))
    if (namedParents.length === 1 && looksLikeWard(main)) {
        return namedParents[0] ?? null
    }

    return null
}

function unique<T extends MatchableCity>(cities: T[]): T[] {
    const seen = new Set<string>()
    return cities.filter(city => {
        if (seen.has(city.id)) return false
        seen.add(city.id)
        return true
    })
}

function looksLikeWard(text: string): boolean {
    return /区$/.test(text) || /\bward\b/i.test(text)
}

function englishCityKey(value: string): string {
    return value
        .replace(/\u3000/g, ' ')
        .replace(ENGLISH_SUFFIX, '')
        .trim()
        .toLowerCase()
}

function prefectureIn(text: string): string | undefined {
    const direct = resolvePrefectureKey(text)
    if (direct) return direct

    for (const [key, japanese] of Object.entries(prefectureTranslations)) {
        if (text.includes(japanese) || new RegExp(`\\b${key}\\b`, 'i').test(text)) {
            return key
        }
    }

    return undefined
}

function stripPrefecture(text: string, prefectureEn: string): string {
    const japanese = prefectureTranslations[prefectureEn] ?? ''
    return text
        .replace(japanese, '')
        .replace(new RegExp(prefectureEn, 'ig'), '')
        .replace(/日本/g, '')
        .replace(/,/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}
