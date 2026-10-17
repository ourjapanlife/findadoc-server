import { describe, expect, it } from 'vitest'
import { Locale, Specialty } from '../src/typeDefs/gqlTypes.js'
import { isPublishedLocale, PUBLISHED_LOCALES } from '../src/languages/publishedLocales.js'
import { supportedLanguageFields, mapKyselyHpToGraphQL } from '../src/services/mappersEntityService.js'
import {
    applyFacilityFilters,
    buildFacilitySelect,
    buildFacilityUpdatePatch,
    matchesThroughProfessional
} from '../src/services/facilityService.js'
import { validateSupportedLanguages } from '../src/validation/validateFacility.js'
import { ErrorCode, Result } from '../src/result.js'
import type { Selectable } from 'kysely'
import type { HpsTable } from '../src/typeDefs/kyselyTypes.js'

function validationResult(): Result<unknown> {
    return { data: undefined, hasErrors: false, errors: [] }
}

function filterRecorder() {
    const contains: string[] = []
    const query = {
        ilike() {
            return query
        },
        or() {
            return query
        },
        contains(column: string) {
            contains.push(column)
            return query
        }
    }

    return { query, contains }
}

describe('published language allowlist', () => {
    it('keeps English and Japanese first and leaves unused locales off the facet list', () => {
        expect(PUBLISHED_LOCALES[0]).toBe('en_US')
        expect(PUBLISHED_LOCALES[1]).toBe('ja_JP')
        expect(PUBLISHED_LOCALES).toContain('ru_RU')
        expect(isPublishedLocale('ak_GH')).toBe(false)
        expect(isPublishedLocale(Locale.EnUs)).toBe(true)
        expect(isPublishedLocale(Locale.JaJp)).toBe(true)
    })

    it('accepts a published facility language and rejects one that is not a facet', () => {
        const englishAndJapanese = validationResult()

        validateSupportedLanguages([Locale.EnUs, Locale.JaJp], englishAndJapanese)
        expect(englishAndJapanese.hasErrors).toBe(false)

        const empty = validationResult()

        validateSupportedLanguages([], empty)
        expect(empty.hasErrors).toBe(false)

        const unpublished = validationResult()

        validateSupportedLanguages([Locale.AkGh], unpublished)
        expect(unpublished.errors?.[0].field).toBe('supportedLanguages')
        expect(unpublished.errors?.[0].errorCode).toBe(ErrorCode.INVALID_INPUT)
    })

    it('still displays an existing English and Japanese professional as those languages', () => {
        const professional = mapKyselyHpToGraphQL({
            id: 'hp',
            names: [],
            spoken_languages: [Locale.EnUs, Locale.JaJp],
            degrees: [],
            primary_license: null,
            additional_credentials: [],
            license_review: null,
            license_recommendation: null,
            specialties: [],
            accepted_insurance: [],
            additional_info_for_patients: null,
            email: null,
            firestore_id: null,
            search_text: '',
            created_date: '2023-08-28T00:00:00.000Z',
            updated_date: '2023-08-28T00:00:00.000Z'
        } as Selectable<HpsTable>, [])

        expect(professional.spokenLanguages).toEqual([Locale.EnUs, Locale.JaJp])
    })

    it('reads facility languages and drops a locale that is not published', () => {
        expect(supportedLanguageFields({
            supported_languages: [Locale.JaJp, Locale.EnUs, Locale.AkGh, Locale.JaJp]
        }).supportedLanguages).toEqual([Locale.JaJp, Locale.EnUs])
    })

    it('stores facility languages without a professional relationship', () => {
        const patch = buildFacilityUpdatePatch({
            supportedLanguages: [Locale.EnUs, Locale.EnUs, Locale.JaJp]
        })

        expect(patch.supported_languages).toBe(JSON.stringify([Locale.EnUs, Locale.JaJp]))
        expect(patch).not.toHaveProperty('healthcareProfessionalIds')

        const cleared = buildFacilityUpdatePatch({ supportedLanguages: null })

        expect(cleared.supported_languages).toBe('[]')
    })

    it('joins professionals only when a specialty is part of the filter', () => {
        expect(matchesThroughProfessional({ spokenLanguages: [Locale.EnUs] })).toBe(false)
        expect(matchesThroughProfessional({
            spokenLanguages: [Locale.EnUs],
            specialties: []
        })).toBe(false)
        expect(buildFacilitySelect('id', { spokenLanguages: [Locale.EnUs] })).toBe('id')

        const languagesOnly = filterRecorder()

        applyFacilityFilters(languagesOnly.query, { spokenLanguages: [Locale.EnUs, Locale.JaJp] })
        expect(languagesOnly.contains).toEqual([])

        expect(matchesThroughProfessional({
            spokenLanguages: [Locale.EnUs],
            specialties: [Specialty.Pediatrics]
        })).toBe(true)
        expect(buildFacilitySelect('id', {
            spokenLanguages: [Locale.EnUs],
            specialties: [Specialty.Pediatrics]
        })).toContain('hps_facilities!inner')

        const withSpecialty = filterRecorder()

        applyFacilityFilters(withSpecialty.query, {
            spokenLanguages: [Locale.EnUs],
            specialties: [Specialty.Pediatrics]
        })
        expect(withSpecialty.contains).toContain('hps_facilities.hps.spoken_languages')
    })
})
