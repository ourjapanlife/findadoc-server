import request from 'supertest'
import { expect, describe, test } from 'vitest'
import { Error, ErrorCode } from '../src/result.js'
import { generateRandomCreateHealthcareProfessionalInput as generateCreateProfessionalInput } from '../src/fakeData/fakeHealthcareProfessionals.js'
import { gqlMutation, gqlRequest } from '../utils/gqlTool.js'
import { CreateHealthcareProfessionalInput, HealthcareProfessional } from '../src/typeDefs/gqlTypes.js'
import { gqlApiUrl, sharedFacilityIds } from './testSetup.test.js'

describe('createHealthcareProfessional', () => {
    test('creates a new HealthcareProfessional and adds it to the list of facilities', async () => {
        const createHealthcareProfessionalMutationRequest = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: generateCreateProfessionalInput({ facilityIds: sharedFacilityIds })
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
        expect(searchedProfessional.names[0].firstName).toEqual(originalInputValues.names[0].firstName)
        expect(searchedProfessional.names[0].lastName).toEqual(originalInputValues.names[0].lastName)
        expect(searchedProfessional.names[0].middleName).toEqual(originalInputValues.names[0].middleName || null)
        expect(searchedProfessional.degrees).toEqual(originalInputValues.degrees)
        expect(searchedProfessional.spokenLanguages).toEqual(originalInputValues.spokenLanguages)
        expect(searchedProfessional.acceptedInsurance).toEqual(originalInputValues.acceptedInsurance)
        expect(searchedProfessional.createdDate).toBeDefined()
        expect(searchedProfessional.updatedDate).toBeDefined()
    })

    test('failing: throws an error if the list of facilityIds is empty', async () => {
        //send an empty facilityIds array so the empty list will throw a validation error
        const emptyFacilityIds = [] as string[]

        const createHealthcareProfessionalRequest = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: generateCreateProfessionalInput({ facilityIds: emptyFacilityIds })
            }
        } as gqlMutation<CreateHealthcareProfessionalInput>

        const createProfessionalResult = await request(gqlApiUrl).post('/').send(createHealthcareProfessionalRequest)
        const createdProfessional
            = createProfessionalResult.body.data.createHealthcareProfessional as HealthcareProfessional

        expect(createdProfessional).toBeFalsy()
        expect(createProfessionalResult.body?.errors).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors[0]).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors.length).toBeGreaterThan(0)

        const error = createProfessionalResult.body?.errors[0].extensions.errors[0] as Error

        expect(error.field).toBe('facilityIds')
        expect(error.errorCode).toBe(ErrorCode.CREATEPROFFESIONAL_FACILITYIDS_REQUIRED)
        expect(error.httpStatus).toBe(400)
    })
})

describe('deleteHealthcareProfessional', () => {
    test('deletes a new healthcare professional', async () => {
        // -- Create a new professional that we plan to delete --
        const createRequest = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: generateCreateProfessionalInput({
                    facilityIds: sharedFacilityIds
                }) satisfies CreateHealthcareProfessionalInput
            }
        } as gqlMutation<CreateHealthcareProfessionalInput>

        const createResult = await request(gqlApiUrl).post('/').send(createRequest)

        //should not have errors
        const createErrors = createResult.body?.errors

        if (createErrors) {
            console.log(JSON.stringify(createErrors))
            expect(createErrors).toBeUndefined()
        }

        const originalInputValues = createRequest.variables.input
        const newProfessional = createResult.body.data.createHealthcareProfessional as HealthcareProfessional
        const newProfessionalId = newProfessional.id

        const getByIdRequest = {
            query: getHealthcareProfessionalByIdQuery,
            variables: {
                id: newProfessional.id
            }
        } as gqlRequest

        // -- Query the professional by id --
        const validQueryResult = await request(gqlApiUrl).post('/').send(getByIdRequest)

        //should not have errors
        const queryErrors = createResult.body?.errors

        if (queryErrors) {
            console.log(JSON.stringify(queryErrors))
            expect(queryErrors).toBeUndefined()
        }

        const searchedProfessional = validQueryResult.body.data.healthcareProfessional as HealthcareProfessional

        // We want to ensure the professional was created before we delete it. 
        expect(searchedProfessional.spokenLanguages).toEqual(originalInputValues.spokenLanguages)
        expect(searchedProfessional.id).toBeDefined()

        const deleteRequest = {
            query: deleteProfessionalMutation,
            variables: {
                id: newProfessionalId
            }
        } as gqlRequest

        // -- Let's try to delete the professional! --
        const deleteResult = await request(gqlApiUrl).post('/').send(deleteRequest)

        //should not have errors
        const deleteErrors = deleteResult.body?.errors

        if (deleteErrors) {
            console.log(JSON.stringify(deleteErrors))
            expect(deleteErrors).toBeUndefined()
        }

        // we should have a success response
        expect(deleteResult.body.data.deleteHealthcareProfessional.isSuccessful).toBe(true)

        // -- Let's try to fetch the professional again to confirm it's deleted --
        const missingQueryResult = await request(gqlApiUrl).post('/').send(getByIdRequest)

        //should have an error that it doesn't exist
        const validQueryGqlErrors = missingQueryResult.body?.errors
        const validQueryErrors = validQueryGqlErrors[0].extensions.errors as Error[]

        console.log(JSON.stringify(validQueryErrors))
        expect(validQueryErrors.length).toBe(1)
        expect(validQueryErrors[0]).toBeDefined()
        expect(validQueryErrors[0].field).toBe('getHealthcareProfessionalById')
        expect(validQueryErrors[0].errorCode).toBe(ErrorCode.INTERNAL_SERVER_ERROR)

        // -- Let's try to delete the professional again! We should receive an error now that it doesn't exist --
        const deleteAgainResult = await request(gqlApiUrl).post('/').send(deleteRequest)

        //should have an error that it doesn't exist
        const deleteAgainErrors = deleteAgainResult.body?.errors[0].extensions.errors as Error[]

        console.log(JSON.stringify(deleteAgainErrors))
        expect(deleteAgainResult.body?.deleteHealthcareProfessional).toBeFalsy()
        expect(deleteAgainErrors.length).toBe(1)
        expect(deleteAgainErrors[0]).toBeDefined()
        expect(deleteAgainErrors[0].field).toBe('deleteHealthcareProfessional')
        expect(deleteAgainErrors[0].errorCode).toBe(ErrorCode.INVALID_ID)
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

const deleteProfessionalMutation = `mutation test_deleteHealthcareProfessional($id: ID!) {
    deleteHealthcareProfessional(id: $id) {
        isSuccessful
    }
}`
