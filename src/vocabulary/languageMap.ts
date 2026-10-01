import { mapped, needsReview, type MapOutcome } from './types.js'

/**
 * Locales the product already publishes as search facets, plus `ru_RU`.
 * The facet list matches `SEARCHABLE_LANGUAGES` in findadoc-web `utils/homeDirectory.ts`.
 * `ru_RU` is here because spreadsheet code RU is an accepted import value.
 * It is not a web facet until #1015. This module does not change that list.
 */
export const PUBLISHED_LOCALES = [
    'en_US',
    'ja_JP',
    'zh_CN',
    'ko_KR',
    'tl_PH',
    'ne_NP',
    'id_ID',
    'zh_HK',
    'es_ES',
    'fr_FR',
    'ar_AE',
    'de_DE',
    'nl_BE',
    'sw_KE',
    'ru_RU'
] as const

export type PublishedLocale = typeof PUBLISHED_LOCALES[number]

const PUBLISHED = new Set<string>(PUBLISHED_LOCALES)

/** Spreadsheet and short codes. Plain ZH is Simplified Chinese. */
const LANGUAGE_CODES: Record<string, PublishedLocale> = {
    EN: 'en_US',
    JA: 'ja_JP',
    JP: 'ja_JP',
    ZH: 'zh_CN',
    'ZH-CN': 'zh_CN',
    'ZH-HK': 'zh_HK',
    KO: 'ko_KR',
    RU: 'ru_RU',
    ES: 'es_ES',
    FR: 'fr_FR',
    DE: 'de_DE',
    AR: 'ar_AE',
    ID: 'id_ID',
    TL: 'tl_PH',
    NE: 'ne_NP',
    NL: 'nl_BE',
    SW: 'sw_KE'
}

/**
 * Map a spreadsheet code or a Locale enum value onto a published locale.
 * Unknown codes and Locale values we do not publish return `needs_review`.
 * Plain ZH is Simplified Chinese (`zh_CN`). `zh_TW` stays unpublished.
 */
export function mapLanguage(source: string): MapOutcome<PublishedLocale> {
    const trimmed = source.trim()

    if (!trimmed) {
        return needsReview('empty')
    }

    const codeKey = trimmed.replace(/_/g, '-').replace(/\s+/g, '').toUpperCase()
    const fromCode = LANGUAGE_CODES[codeKey]

    if (fromCode) {
        return mapped(fromCode)
    }

    const localeMatch = trimmed.replace(/-/g, '_').match(/^([A-Za-z]{2,3})_([A-Za-z]{2})$/)

    if (localeMatch) {
        const locale = `${localeMatch[1].toLowerCase()}_${localeMatch[2].toUpperCase()}`

        if (PUBLISHED.has(locale)) {
            return mapped(locale as PublishedLocale)
        }
    }

    return needsReview('unpublished_locale')
}
