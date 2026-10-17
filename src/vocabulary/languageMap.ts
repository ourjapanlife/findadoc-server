import { mapped, needsReview, type MapOutcome } from './types.js'
import {
    isPublishedLocale,
    type PublishedLocale
} from '../languages/publishedLocales.js'

export { PUBLISHED_LOCALES, type PublishedLocale } from '../languages/publishedLocales.js'

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

        if (isPublishedLocale(locale)) {
            return mapped(locale)
        }
    }

    return needsReview('unpublished_locale')
}
