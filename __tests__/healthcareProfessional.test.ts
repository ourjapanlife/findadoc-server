import request from 'supertest'
import { expect, describe, it } from 'vitest'
import { Error, ErrorCode } from '../src/result.js'
import { generateRandomCreateHealthcareProfessionalInput } from '../src/fakeData/fakeHealthcareProfessionals.js'
import { gqlMutation, gqlRequest } from '../utils/gqlTool.js'
import { CreateHealthcareProfessionalInput, HealthcareProfessional } from '../src/typeDefs/gqlTypes.js'
import { gqlApiUrl, sharedFacilityIds } from './testSetup.test.js'

describe('createHealthcareProfessional', () => {
    it('creates a new HealthcareProfessional and adds it to the list of facilities', async () => {
        const createHealthcareProfessionalMutationRequest = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: generateRandomCreateHealthcareProfessionalInput({ facilityIds: sharedFacilityIds })
            }
        } as gqlMutation<CreateHealthcareProfessionalInput>

        const createProfessionalResult = await request(gqlApiUrl).post('/').send(createHealthcareProfessionalMutationRequest)

        //should not have errors
        const errors = createProfessionalResult.body?.errors

        if (errors) {
            expect(JSON.stringify(errors)).toBeUndefined()
        }

        const createdHealthcareProfessional =
            createProfessionalResult.body.data.createHealthcareProfessional as HealthcareProfessional

        const getHealthcareProfessionalByIdRequest = {
            query: getHealthcareProfessionalByIdQuery,
            variables: {
                id: createdHealthcareProfessional.id
            }
        } as gqlRequest

        const searchResult = await request(gqlApiUrl).post('/').send(getHealthcareProfessionalByIdRequest)

        //should not have errors
        expect(searchResult.body?.errors).toBeUndefined()

        const searchedProfessional = searchResult.body.data.healthcareProfessional as HealthcareProfessional
        const originalInputValues = createHealthcareProfessionalMutationRequest.variables.input

        //validate the created HealthcareProfessional has the same values as the original
        expect(searchedProfessional).toBeDefined()
        expect(searchedProfessional.id).toBeDefined()
        expect(searchedProfessional.names).toEqual(originalInputValues.names)
        expect(searchedProfessional.degrees).toEqual(originalInputValues.degrees)
        expect(searchedProfessional.spokenLanguages).toEqual(originalInputValues.spokenLanguages)
        expect(searchedProfessional.acceptedInsurance).toEqual(originalInputValues.acceptedInsurance)
        expect(searchedProfessional.createdDate).toBeDefined()
        expect(searchedProfessional.updatedDate).toBeDefined()
    })

    it('failing: throws an error if the list of facilityIds is empty', async () => {
        //send an empty facilityIds array so the empty list will throw a validation error
        const emptyFacilityIds = [] as string[]

        const createHealthcareProfessionalRequest = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: generateRandomCreateHealthcareProfessionalInput({ facilityIds: emptyFacilityIds })
            }
        } as gqlMutation<CreateHealthcareProfessionalInput>

        const createProfessionalResult = await request(gqlApiUrl).post('/').send(createHealthcareProfessionalRequest)
        const createdProfessional
            = createProfessionalResult.body.data.createHealthcareProfessional as HealthcareProfessional

        expect(createdProfessional).toBeFalsy()
        expect(createProfessionalResult.body?.errors).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors[0]).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors.length).toEqual(1)

        const error = createProfessionalResult.body?.errors[0].extensions.errors[0] as Error

        expect(error.field).toBe('facilityIds')
        expect(error.errorCode).toBe(ErrorCode.CREATEPROFFESIONAL_FACILITYIDS_REQUIRED)
        expect(error.httpStatus).toBe(400)
    })
})

export const createHealthcareProfessionalMutation = `mutation test_createHealthcareProfessional($input: CreateHealthcareProfessionalInput!) {
    createHealthcareProfessional(input: $input) {
        id
        names {
            lastName
            firstName
            middleName
            locale
        }
        degrees {
            nameJa
            nameEn
            abbreviation
        }
        specialties {
            names {
                name
                locale
            }
        }
        facilityIds
        spokenLanguages
        acceptedInsurance
        createdDate
        updatedDate
    }
}`

const getHealthcareProfessionalByIdQuery = `query test_getHealthcareProfessionalById($id: ID!) {
    healthcareProfessional(id: $id) {
        id
        names {
            lastName
            firstName
            middleName
            locale
        }
        degrees {
            nameJa
            nameEn
            abbreviation
        }
        specialties {
            names {
                name
                locale
            }
        }
        facilityIds
        spokenLanguages
        acceptedInsurance
        createdDate
        updatedDate
    }
}`
