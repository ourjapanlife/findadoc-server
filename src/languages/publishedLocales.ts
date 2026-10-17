/**
 * Locales search may advertise as facets (#1015).
 * Order matches the directory: English, Japanese, then the languages we publish.
 * Spreadsheet codes map onto this list in the language map.
 * A Locale value that is not in this list is not a facet, even if an old row still stores it.
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

export function isPublishedLocale(value: string): value is PublishedLocale {
    return PUBLISHED.has(value)
}

/** First occurrence wins. Callers that store the list should keep this order. */
export function uniqueLocales<T extends string>(languages: readonly T[]): T[] {
    const seen = new Set<string>()
    const unique: T[] = []

    for (const language of languages) {
        if (seen.has(language)) {
            continue
        }

        seen.add(language)
        unique.push(language)
    }

    return unique
}
