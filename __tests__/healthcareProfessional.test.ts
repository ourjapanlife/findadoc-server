import request from 'supertest'
import { expect, describe, test } from 'vitest'
import { Error, ErrorCode } from '../src/result.js'
import { generateRandomCreateHealthcareProfessionalInput as generateCreateProfessionalInput } from '../src/fakeData/fakeHealthcareProfessionals.js'
import { gqlMutation, gqlRequest } from '../utils/gqlTool.js'
import { CreateHealthcareProfessionalInput, HealthcareProfessional } from '../src/typeDefs/gqlTypes.js'
import { gqlApiUrl, sharedFacilityIds } from './testSetup.test.js'
import { logger } from '../src/logger.js'

describe('createHealthcareProfessional', () => {
    test('creates a new HealthcareProfessional and adds it to the list of facilities', async () => {
        const createHealthcareProfessionalMutationRequest = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: generateCreateProfessionalInput({ facilityIds: sharedFacilityIds })
            }
        } as gqlMutation<CreateHealthcareProfessionalInput>

        const createProfessionalResult = await request(gqlApiUrl).post('').send(createHealthcareProfessionalMutationRequest)

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

        const searchResult = await request(gqlApiUrl).post('').send(getHealthcareProfessionalByIdRequest)

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

        const createResult = await request(gqlApiUrl).post('').send(createRequest)

        //should not have errors
        const createErrors = createResult.body?.errors

        if (createErrors) {
            logger.error(JSON.stringify(createErrors))
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
        const validQueryResult = await request(gqlApiUrl).post('').send(getByIdRequest)

        //should not have errors
        const queryErrors = createResult.body?.errors

        if (queryErrors) {
            logger.error(JSON.stringify(queryErrors))
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
        const deleteResult = await request(gqlApiUrl).post('').send(deleteRequest)

        //should not have errors
        const deleteErrors = deleteResult.body?.errors

        if (deleteErrors) {
            logger.error(JSON.stringify(deleteErrors))
            expect(deleteErrors).toBeUndefined()
        }

        // we should have a success response
        expect(deleteResult.body.data.deleteHealthcareProfessional.isSuccessful).toBe(true)

        // -- Let's try to fetch the professional again to confirm it's deleted --
        const missingQueryResult = await request(gqlApiUrl).post('').send(getByIdRequest)

        //should have an error that it doesn't exist
        const validQueryGqlErrors = missingQueryResult.body?.errors
        const validQueryErrors = validQueryGqlErrors[0].extensions.errors as Error[]

        logger.error(JSON.stringify(validQueryErrors))
        expect(validQueryErrors.length).toBe(1)
        expect(validQueryErrors[0]).toBeDefined()
        expect(validQueryErrors[0].field).toBe('getHealthcareProfessionalById')
        expect(validQueryErrors[0].errorCode).toBe(ErrorCode.INTERNAL_SERVER_ERROR)

        // -- Let's try to delete the professional again! We should receive an error now that it doesn't exist --
        const deleteAgainResult = await request(gqlApiUrl).post('').send(deleteRequest)

        //should have an error that it doesn't exist
        const deleteAgainErrors = deleteAgainResult.body?.errors[0].extensions.errors as Error[]

        logger.error(JSON.stringify(deleteAgainErrors))
        expect(deleteAgainResult.body?.deleteHealthcareProfessional).toBeFalsy()
        expect(deleteAgainErrors.length).toBe(1)
        expect(deleteAgainErrors[0]).toBeDefined()
        expect(deleteAgainErrors[0].field).toBe('deleteHealthcareProfessional')
        expect(deleteAgainErrors[0].errorCode).toBe(ErrorCode.INVALID_ID)
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

        const createResult = await request(gqlApiUrl).post('').send(createRequest)

        //should not have errors
        const createErrors = createResult.body?.errors

        if (createErrors) {
            logger.error(JSON.stringify(createErrors))
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
        const validQueryResult = await request(gqlApiUrl).post('').send(getByIdRequest)

        //should not have errors
        const queryErrors = createResult.body?.errors

        if (queryErrors) {
            logger.error(JSON.stringify(queryErrors))
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
        const deleteResult = await request(gqlApiUrl).post('').send(deleteRequest)

        //should not have errors
        const deleteErrors = deleteResult.body?.errors

        if (deleteErrors) {
            logger.error(JSON.stringify(deleteErrors))
            expect(deleteErrors).toBeUndefined()
        }

        // we should have a success response
        expect(deleteResult.body.data.deleteHealthcareProfessional.isSuccessful).toBe(true)

        // -- Let's try to fetch the professional again to confirm it's deleted --
        const missingQueryResult = await request(gqlApiUrl).post('').send(getByIdRequest)

        //should have an error that it doesn't exist
        const validQueryGqlErrors = missingQueryResult.body?.errors
        const validQueryErrors = validQueryGqlErrors[0].extensions.errors as Error[]

        logger.error(JSON.stringify(validQueryErrors))
        expect(validQueryErrors.length).toBe(1)
        expect(validQueryErrors[0]).toBeDefined()
        expect(validQueryErrors[0].field).toBe('getHealthcareProfessionalById')
        expect(validQueryErrors[0].errorCode).toBe(ErrorCode.INTERNAL_SERVER_ERROR)

        // -- Let's try to delete the professional again! We should receive an error now that it doesn't exist --
        const deleteAgainResult = await request(gqlApiUrl).post('').send(deleteRequest)

        //should have an error that it doesn't exist
        const deleteAgainErrors = deleteAgainResult.body?.errors[0].extensions.errors as Error[]

        logger.error(JSON.stringify(deleteAgainErrors))
        expect(deleteAgainResult.body?.deleteHealthcareProfessional).toBeFalsy()
        expect(deleteAgainErrors.length).toBe(1)
        expect(deleteAgainErrors[0]).toBeDefined()
        expect(deleteAgainErrors[0].field).toBe('deleteHealthcareProfessional')
        expect(deleteAgainErrors[0].errorCode).toBe(ErrorCode.INVALID_ID)
    })
})

describe('searchHealthcareProfessionals', () => {
    test('searches for healthcare professionals by ids filter', async () => {
        // Create two professionals
        const professionalInputs = [
            generateCreateProfessionalInput({ facilityIds: sharedFacilityIds }),
            generateCreateProfessionalInput({ facilityIds: sharedFacilityIds })
        ]

        // Use Promise.all for parallel creation
        const createRequests = professionalInputs.map(input => request(gqlApiUrl).post('').send({
            query: createHealthcareProfessionalMutation,
            variables: { input }
        } as gqlMutation<CreateHealthcareProfessionalInput>))
        const createResults = await Promise.all(createRequests)

        createResults.forEach(result => {
            expect(result.body?.errors).toBeUndefined()
        })
        const createdProfessionals: HealthcareProfessional[] = createResults.map(result =>
            result.body.data.createHealthcareProfessional as HealthcareProfessional)

        // Search by ids
        const searchHealthcareProfessionalsRequest = {
            query: searchHealthcareProfessionals,
            variables: {
                filters: {
                    ids: [createdProfessionals[0].id, createdProfessionals[1].id]
                }
            }
        } as gqlRequest

        // -- Search the professionals by id --
        const searchResult = await request(gqlApiUrl).post('').send(searchHealthcareProfessionalsRequest)

        //should not have errors
        const queryErrors = searchResult.body?.errors

        if (queryErrors) {
            logger.error(JSON.stringify(queryErrors))
            expect(queryErrors).toBeUndefined()
        }

        const foundProfessionals = searchResult.body.data.healthcareProfessionals as HealthcareProfessional[]

        expect(foundProfessionals.length).toBe(2)
        expect(foundProfessionals.map(p => p.id)).toEqual(
            expect.arrayContaining([createdProfessionals[0].id, createdProfessionals[1].id])
        )
    })

    test('returns empty array when no professionals match ids', async () => {
        const searchRequest = {
            query: searchHealthcareProfessionals,
            variables: {
                filters: { ids: ['nonexistent-id-1', 'nonexistent-id-2'] }
            }
        }
        const searchResult = await request(gqlApiUrl).post('').send(searchRequest)

        expect(searchResult.body?.errors).toBeUndefined()
        const foundProfessionals = searchResult.body.data.healthcareProfessionals as HealthcareProfessional[]

        expect(foundProfessionals.length).toBe(0)
    })

    test('returns limited results when limit is set', async () => {
        // Create three professionals
        const professionalInputs = [
            generateCreateProfessionalInput({ facilityIds: sharedFacilityIds }),
            generateCreateProfessionalInput({ facilityIds: sharedFacilityIds }),
            generateCreateProfessionalInput({ facilityIds: sharedFacilityIds })
        ]
        // Use Promise.all for parallel creation
        const createRequests = professionalInputs.map(input => request(gqlApiUrl).post('').send({
            query: createHealthcareProfessionalMutation,
            variables: { input }
        } as gqlMutation<CreateHealthcareProfessionalInput>))
        const createResults = await Promise.all(createRequests)

        createResults.forEach(result => {
            expect(result.body?.errors).toBeUndefined()
        })

        // Search with limit = 2
        const searchRequest = {
            query: searchHealthcareProfessionals,
            variables: {
                filters: { limit: 2 }
            }
        }
        const searchResult = await request(gqlApiUrl).post('').send(searchRequest)

        expect(searchResult.body?.errors).toBeUndefined()
        const foundProfessionals = searchResult.body.data.healthcareProfessionals as HealthcareProfessional[]

        expect(foundProfessionals.length).toBeLessThanOrEqual(2)
    })

    test('returns paginated results when offset is set', async () => {
        // Create two professionals
        const professionalInputs = [
            generateCreateProfessionalInput({ facilityIds: sharedFacilityIds }),
            generateCreateProfessionalInput({ facilityIds: sharedFacilityIds })
        ]
        // Use Promise.all for parallel creation
        const createRequests = professionalInputs.map(input => request(gqlApiUrl).post('').send({
            query: createHealthcareProfessionalMutation,
            variables: { input }
        } as gqlMutation<CreateHealthcareProfessionalInput>))
        const createResults = await Promise.all(createRequests)

        createResults.forEach(result => {
            expect(result.body?.errors).toBeUndefined()
        })

        const searchRequest = {
            query: searchHealthcareProfessionals,
            variables: {
                filters: { offset: 1 }
            }
        }
        const searchResult = await request(gqlApiUrl).post('').send(searchRequest)

        expect(searchResult.body?.errors).toBeUndefined()
        const foundProfessionals = searchResult.body.data.healthcareProfessionals as HealthcareProfessional[]

        expect(foundProfessionals.length).toBeGreaterThanOrEqual(1)
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
        degrees
        specialties
        facilityIds
        spokenLanguages
        acceptedInsurance
        createdDate
        updatedDate
        additionalInfoForPatients
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
        degrees
        specialties
        facilityIds
        spokenLanguages
        acceptedInsurance
        createdDate
        updatedDate
    }
}`

const searchHealthcareProfessionals = `query test_searchHealthcareProfessionals($filters: HealthcareProfessionalSearchFilters!) {
    healthcareProfessionals(filters: $filters) {
        id
        names { firstName lastName }
    }
}`

const deleteProfessionalMutation = `mutation test_deleteHealthcareProfessional($id: ID!) {
    deleteHealthcareProfessional(id: $id) {
        isSuccessful
    }
}`
