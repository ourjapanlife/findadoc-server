import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { expect, describe, test, beforeAll } from 'vitest'
import * as gqlType from '../src/typeDefs/gqlTypes.js'
import { gqlMutation, gqlRequest } from '../utils/gqlTool.js'
import { generateRandomCreateFacilityInput } from '../src/fakeData/fakeFacilities.js'
import { generateRandomCreateHealthcareProfessionalInput } from '../src/fakeData/fakeHealthcareProfessionals.js'
import { Error, ErrorCode } from '../src/result.js'
import { gqlApiUrl } from './testSetup.test.js'
import { createFacilityMutation } from './facilities.test.js'
import { createHealthcareProfessionalMutation } from './healthcareProfessional.test.js'

// Kept out of facilities.test.ts: that file is imported by testSetup, so anything in it runs
// in every test file and counts against each file's request rate limit.
describe('searchFacilities', () => {
    // A unique tag in nameEn keeps these assertions isolated from other facilities in the database.
    const searchTag = `SearchFilterTest${randomUUID()}`

    const createFacility = async (suffix: string, prefectureEn: string, prefectureJa: string) => {
        const input = generateRandomCreateFacilityInput()

        input.nameEn = `${searchTag} ${suffix}`
        input.contact.address.prefectureEn = prefectureEn
        input.contact.address.prefectureJa = prefectureJa

        const result = await request(gqlApiUrl).post('').send({
            query: createFacilityMutation,
            variables: { input }
        } as gqlMutation<gqlType.CreateFacilityInput>)

        expect(result.body.errors).toBeUndefined()
        return result.body.data.createFacility as gqlType.Facility
    }

    const createProfessional = async (
        facilityId: string,
        spokenLanguages: gqlType.Locale[],
        specialties: gqlType.Specialty[]
    ) => {
        const result = await request(gqlApiUrl).post('').send({
            query: createHealthcareProfessionalMutation,
            variables: {
                input: {
                    ...generateRandomCreateHealthcareProfessionalInput(),
                    facilityIds: [facilityId],
                    spokenLanguages,
                    specialties
                } satisfies gqlType.CreateHealthcareProfessionalInput
            }
        } as gqlMutation<gqlType.CreateHealthcareProfessionalInput>)

        expect(result.body.errors).toBeUndefined()
    }

    const search = async (filters: gqlType.FacilitySearchFilters) => {
        const result = await request(gqlApiUrl).post('').send({
            query: searchFacilitiesQuery,
            variables: { filters: { nameEn: searchTag, ...filters } }
        } as gqlRequest)

        return result.body
    }

    let englishPediatricsFacility: gqlType.Facility
    let splitStaffFacility: gqlType.Facility
    let tokyoFacility: gqlType.Facility

    beforeAll(async () => {
        englishPediatricsFacility = await createFacility('A', 'Okinawa', '沖縄県')
        splitStaffFacility = await createFacility('B', 'okinawa', '沖縄県')
        tokyoFacility = await createFacility('C', 'Tokyo', '東京都')

        // One professional speaks English and practices pediatrics.
        const englishAndJapanese = [gqlType.Locale.EnUs, gqlType.Locale.JaJp]

        await createProfessional(englishPediatricsFacility.id, englishAndJapanese, [gqlType.Specialty.Pediatrics])
        // English and pediatrics are both here, but split across two professionals.
        await createProfessional(splitStaffFacility.id, [gqlType.Locale.EnUs], [gqlType.Specialty.Dermatology])
        await createProfessional(splitStaffFacility.id, [gqlType.Locale.JaJp], [gqlType.Specialty.Pediatrics])
        await createProfessional(tokyoFacility.id, [gqlType.Locale.EnUs], [gqlType.Specialty.Pediatrics])
    })

    test('filters by prefecture key, case-insensitively, or by Japanese name', async () => {
        for (const prefecture of ['Okinawa', 'OKINAWA', '沖縄県']) {
            const body = await search({ prefecture })

            expect(body.errors).toBeUndefined()
            const ids = (body.data.facilities as gqlType.Facility[]).map(facility => facility.id)

            expect(ids.sort()).toEqual([englishPediatricsFacility.id, splitStaffFacility.id].sort())
            expect(body.data.facilitiesTotalCount).toBe(2)
        }
    })

    test('rejects an unknown prefecture', async () => {
        const body = await search({ prefecture: 'Atlantis' })
        const errors = body.errors[0].extensions.errors as Error[]

        expect(errors[0].field).toBe('prefecture')
        expect(errors[0].errorCode).toBe(ErrorCode.INVALID_INPUT)
    })

    test('filters by specialty through associated professionals', async () => {
        const body = await search({ specialties: [gqlType.Specialty.Pediatrics] })

        expect(body.errors).toBeUndefined()
        const ids = (body.data.facilities as gqlType.Facility[]).map(facility => facility.id)

        expect(ids.sort()).toEqual([englishPediatricsFacility.id, splitStaffFacility.id, tokyoFacility.id].sort())
        expect(body.data.facilitiesTotalCount).toBe(3)
    })

    test('requires one professional to match every language and specialty', async () => {
        const body = await search({
            prefecture: 'Okinawa',
            spokenLanguages: [gqlType.Locale.EnUs],
            specialties: [gqlType.Specialty.Pediatrics]
        })

        expect(body.errors).toBeUndefined()
        const facilities = body.data.facilities as gqlType.Facility[]

        expect(facilities.map(facility => facility.id)).toEqual([englishPediatricsFacility.id])
        expect(body.data.facilitiesTotalCount).toBe(1)
        // The join used for filtering must not trim the facility's professional list.
        expect(facilities[0].healthcareProfessionalIds.length).toBe(1)
    })

    test('requires a professional to speak all requested languages', async () => {
        const body = await search({ spokenLanguages: [gqlType.Locale.EnUs, gqlType.Locale.JaJp] })

        expect(body.errors).toBeUndefined()
        expect((body.data.facilities as gqlType.Facility[]).map(facility => facility.id))
            .toEqual([englishPediatricsFacility.id])
    })

    test('matches a facility language list without creating a professional', async () => {
        const input = generateRandomCreateFacilityInput()

        input.nameEn = `${searchTag} HospitalLanguages`
        input.supportedLanguages = [gqlType.Locale.EnUs, gqlType.Locale.JaJp]

        const created = await request(gqlApiUrl).post('').send({
            query: createFacilityMutation,
            variables: { input }
        } as gqlMutation<gqlType.CreateFacilityInput>)

        expect(created.body.errors).toBeUndefined()
        const facility = created.body.data.createFacility as gqlType.Facility

        expect(facility.healthcareProfessionalIds).toEqual([])
        expect(facility.supportedLanguages).toEqual([gqlType.Locale.EnUs, gqlType.Locale.JaJp])

        const byLanguage = await search({
            spokenLanguages: [gqlType.Locale.EnUs, gqlType.Locale.JaJp]
        })
        const languageIds = (byLanguage.data.facilities as gqlType.Facility[]).map(row => row.id)

        expect(languageIds.sort()).toEqual([englishPediatricsFacility.id, facility.id].sort())

        const bySpecialty = await search({
            spokenLanguages: [gqlType.Locale.EnUs],
            specialties: [gqlType.Specialty.Pediatrics]
        })
        const specialtyIds = (bySpecialty.data.facilities as gqlType.Facility[]).map(row => row.id)

        expect(specialtyIds).not.toContain(facility.id)
        expect(specialtyIds).toContain(englishPediatricsFacility.id)
    })

    test('rejects a facility language that is not on the published list', async () => {
        const input = generateRandomCreateFacilityInput()

        input.nameEn = `${searchTag} UnpublishedLanguage`
        input.supportedLanguages = [gqlType.Locale.AkGh]

        const created = await request(gqlApiUrl).post('').send({
            query: createFacilityMutation,
            variables: { input }
        } as gqlMutation<gqlType.CreateFacilityInput>)
        const errors = created.body.errors[0].extensions.errors as Error[]

        expect(errors[0].field).toBe('supportedLanguages')
        expect(errors[0].errorCode).toBe(ErrorCode.INVALID_INPUT)
    })
})

describe('moderation list query', () => {
    const listQuery = `query test_listQuery(
        $filters: FacilitySearchFilters!
        $professionalFilters: HealthcareProfessionalSearchFilters!
    ) {
        facilities(filters: $filters) { id nameEn nameJa }
        facilitiesTotalCount(filters: $filters)
        healthcareProfessionals(filters: $professionalFilters) { id }
        healthcareProfessionalsTotalCount(filters: $professionalFilters)
    }`

    const search = async (
        filters: gqlType.FacilitySearchFilters,
        professionalFilters: gqlType.HealthcareProfessionalSearchFilters = {}
    ) => {
        const result = await request(gqlApiUrl).post('').send({
            query: listQuery,
            variables: { filters, professionalFilters }
        } as gqlRequest)

        return result.body
    }

    test('matches a facility or professional from the whole list, and pages those matches', async () => {
        const tag = `Lq${randomUUID().replace(/[^a-f]/g, '').slice(0, 10)}`
        const facilityInput = generateRandomCreateFacilityInput()

        facilityInput.nameEn = `${tag}%_Clinic`
        facilityInput.nameJa = `${tag}東京`

        const facilityResult = await request(gqlApiUrl).post('').send({
            query: createFacilityMutation,
            variables: { input: facilityInput }
        } as gqlMutation<gqlType.CreateFacilityInput>)

        expect(facilityResult.body.errors).toBeUndefined()
        const facility = facilityResult.body.data.createFacility as gqlType.Facility

        const professionalResult = await request(gqlApiUrl).post('').send({
            query: createHealthcareProfessionalMutation,
            variables: {
                input: {
                    ...generateRandomCreateHealthcareProfessionalInput(),
                    facilityIds: [facility.id],
                    names: [
                        { firstName: 'Ada', middleName: tag, lastName: 'Lovelace', locale: gqlType.Locale.EnUs },
                        { firstName: 'エイダ', middleName: null, lastName: 'ラブレス', locale: gqlType.Locale.JaJp }
                    ]
                } satisfies gqlType.CreateHealthcareProfessionalInput
            }
        } as gqlMutation<gqlType.CreateHealthcareProfessionalInput>)

        expect(professionalResult.body.errors).toBeUndefined()
        const professional = professionalResult.body.data.createHealthcareProfessional as gqlType.HealthcareProfessional

        const byEnglishName = await search({ query: `${tag}%_`, limit: 5, offset: 0 })

        expect(byEnglishName.errors).toBeUndefined()
        expect(byEnglishName.data.facilities.map((row: gqlType.Facility) => row.id)).toEqual([facility.id])
        expect(byEnglishName.data.facilitiesTotalCount).toBe(1)

        const byJapaneseName = await search({ query: `${tag}東京`, limit: 5, offset: 0 })

        expect(byJapaneseName.data.facilities.map((row: gqlType.Facility) => row.id)).toEqual([facility.id])

        const byFacilityId = await search({ query: facility.id, limit: 5, offset: 0 })

        expect(byFacilityId.data.facilities.map((row: gqlType.Facility) => row.id)).toEqual([facility.id])

        const pastTheFacilityMatch = await search({ query: `${tag}%_`, limit: 5, offset: 5 })

        expect(pastTheFacilityMatch.data.facilities).toEqual([])
        expect(pastTheFacilityMatch.data.facilitiesTotalCount).toBe(1)

        const byMiddleName = await search({}, { query: tag, limit: 5, offset: 0 })

        expect(byMiddleName.errors).toBeUndefined()
        expect(byMiddleName.data.healthcareProfessionals.map((row: gqlType.HealthcareProfessional) => row.id))
            .toEqual([professional.id])
        expect(byMiddleName.data.healthcareProfessionalsTotalCount).toBe(1)

        const byGivenName = await search({}, { query: 'エイダ', limit: 25, offset: 0 })

        expect(byGivenName.data.healthcareProfessionals.map((row: gqlType.HealthcareProfessional) => row.id))
            .toContain(professional.id)

        const byProfessionalId = await search({}, { query: professional.id, limit: 5, offset: 0 })

        expect(byProfessionalId.data.healthcareProfessionals.map((row: gqlType.HealthcareProfessional) => row.id))
            .toEqual([professional.id])

        const pastTheProfessionalMatch = await search({}, { query: tag, limit: 5, offset: 5 })

        expect(pastTheProfessionalMatch.data.healthcareProfessionals).toEqual([])
        expect(pastTheProfessionalMatch.data.healthcareProfessionalsTotalCount).toBe(1)
    })

    test('rejects a list query that is too long', async () => {
        const body = await search({ query: 'x'.repeat(129) })
        const errors = body.errors[0].extensions.errors as Error[]

        expect(errors[0].field).toBe('query')
        expect(errors[0].errorCode).toBe(ErrorCode.INVALID_LENGTH_TOO_LONG)
    })
})

const searchFacilitiesQuery = `query test_searchFacilities($filters: FacilitySearchFilters!) {
    facilities(filters: $filters) {
        id
        nameEn
        healthcareProfessionalIds
    }
    facilitiesTotalCount(filters: $filters)
}`
