import request from 'supertest'
import { expect, describe, test, beforeAll } from 'vitest'
import { Error, ErrorCode } from '../src/result.js'
import { generateRandomCreateHealthcareProfessionalInput as generateCreateProfessionalInput } from '../src/fakeData/fakeHealthcareProfessionals.js'
import { generateRandomCreateFacilityInput } from '../src/fakeData/fakeFacilities.js'
import { gqlMutation, gqlRequest } from '../utils/gqlTool.js'
import {
    CreateFacilityInput, CreateHealthcareProfessionalInput, Facility, HealthcareProfessional, Specialty
} from '../src/typeDefs/gqlTypes.js'
import { gqlApiUrl } from './testSetup.test.js'
import { createFacilityMutation } from './facilities.test.js'
import { createHealthcareProfessionalMutation } from './healthcareProfessional.test.js'

// Kept out of healthcareProfessional.test.ts: testSetup imports facilities.test.ts, which imports
// that file, so anything in it runs in every test file and counts against each file's request rate limit.
describe('searchHealthcareProfessionals: facilityIds filter', () => {
    let facilityA: Facility
    let facilityB: Facility
    let facilityC: Facility
    let professionalAtA: HealthcareProfessional
    let professionalAtB: HealthcareProfessional
    let professionalAtBWithSpecialty: HealthcareProfessional

    const createFacility = async () => {
        const result = await request(gqlApiUrl).post('').send({
            query: createFacilityMutation,
            variables: { input: generateRandomCreateFacilityInput() }
        } as gqlMutation<CreateFacilityInput>)

        expect(result.body?.errors).toBeUndefined()
        return result.body.data.createFacility as Facility
    }

    const createProfessional = async (facilityId: string, specialties: Specialty[]) => {
        const input = generateCreateProfessionalInput({ facilityIds: [facilityId] })

        input.specialties = specialties

        const result = await request(gqlApiUrl).post('').send({
            query: createHealthcareProfessionalMutation,
            variables: { input }
        } as gqlMutation<CreateHealthcareProfessionalInput>)

        expect(result.body?.errors).toBeUndefined()
        return result.body.data.createHealthcareProfessional as HealthcareProfessional
    }

    const search = async (filters: Record<string, unknown>) => {
        const result = await request(gqlApiUrl).post('').send({
            query: searchHealthcareProfessionalsWithCount,
            variables: { filters }
        } as gqlRequest)

        return result.body
    }

    beforeAll(async () => {
        facilityA = await createFacility()
        facilityB = await createFacility()
        facilityC = await createFacility()

        professionalAtA = await createProfessional(facilityA.id, [Specialty.Dermatology])
        professionalAtB = await createProfessional(facilityB.id, [Specialty.Dermatology])
        professionalAtBWithSpecialty = await createProfessional(facilityB.id, [Specialty.Pediatrics])
    })

    test('returns only professionals linked to the facility', async () => {
        const body = await search({ facilityIds: [facilityB.id] })

        expect(body.errors).toBeUndefined()
        const found = body.data.healthcareProfessionals as HealthcareProfessional[]

        expect(found.map(p => p.id).sort()).toEqual([professionalAtB.id, professionalAtBWithSpecialty.id].sort())
        // facilityIds on the result still comes from the junction table, not the filter.
        found.forEach(p => expect(p.facilityIds).toEqual([facilityB.id]))
        expect(body.data.healthcareProfessionalsTotalCount).toBe(2)
    })

    test('matches professionals at any of several facilities', async () => {
        const body = await search({ facilityIds: [facilityA.id, facilityB.id] })

        expect(body.errors).toBeUndefined()
        const found = body.data.healthcareProfessionals as HealthcareProfessional[]

        expect(found.map(p => p.id).sort()).toEqual(
            [professionalAtA.id, professionalAtB.id, professionalAtBWithSpecialty.id].sort()
        )
        expect(body.data.healthcareProfessionalsTotalCount).toBe(3)
    })

    test('combines with other filters', async () => {
        const body = await search({ facilityIds: [facilityB.id], specialties: [Specialty.Pediatrics] })

        expect(body.errors).toBeUndefined()
        const found = body.data.healthcareProfessionals as HealthcareProfessional[]

        expect(found.map(p => p.id)).toEqual([professionalAtBWithSpecialty.id])
        expect(body.data.healthcareProfessionalsTotalCount).toBe(1)
    })

    test('returns nothing for a facility with no professionals', async () => {
        const body = await search({ facilityIds: [facilityC.id] })

        expect(body.errors).toBeUndefined()
        expect(body.data.healthcareProfessionals).toEqual([])
        expect(body.data.healthcareProfessionalsTotalCount).toBe(0)
    })

    test('rejects a facility id that is not a UUID', async () => {
        const body = await search({ facilityIds: ['not-a-uuid'] })
        const errors = body.errors[0].extensions.errors as Error[]

        expect(errors[0].field).toBe('facilityIds')
        expect(errors[0].errorCode).toBe(ErrorCode.INVALID_ID)
    })
})

const searchHealthcareProfessionalsWithCount = `query test_searchHealthcareProfessionalsWithCount($filters: HealthcareProfessionalSearchFilters!) {
    healthcareProfessionals(filters: $filters) {
        id
        facilityIds
    }
    healthcareProfessionalsTotalCount(filters: $filters)
}`
