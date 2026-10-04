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
})

const searchFacilitiesQuery = `query test_searchFacilities($filters: FacilitySearchFilters!) {
    facilities(filters: $filters) {
        id
        nameEn
        healthcareProfessionalIds
    }
    facilitiesTotalCount(filters: $filters)
}`
