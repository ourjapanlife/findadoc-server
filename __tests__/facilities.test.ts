import request from 'supertest'
import { expect, describe, test } from 'vitest'
import * as gqlType from '../src/typeDefs/gqlTypes.js'
import { gqlMutation, gqlRequest } from '../utils/gqlTool.js'
import { generateRandomCreateFacilityInput } from '../src/fakeData/fakeFacilities.js'
import { gqlApiUrl, sharedFacilityIds } from './testSetup.test.js'
import { createHealthcareProfessionalMutation } from './healthcareProfessional.test.js'
import { generateRandomCreateHealthcareProfessionalInput } from '../src/fakeData/fakeHealthcareProfessionals.js'
import { Error, ErrorCode } from '../src/result.js'

describe('createFacility', () => {
    test('creates a new Facility', async () => {
        const createFacilityRequest = {
            query: createFacilityMutation,
            variables: {
                input: generateRandomCreateFacilityInput() satisfies gqlType.CreateFacilityInput
            }
        } as gqlMutation<gqlType.CreateFacilityInput>

        const createFacilityResult = await request(gqlApiUrl).post('/').send(createFacilityRequest)

        //should not have errors
        expect(createFacilityResult.body.errors).toBeUndefined()

        const originalInputValues = createFacilityRequest.variables.input
        const newFacility = createFacilityResult.body.data.createFacility as gqlType.Facility

        const getFacilityByIdRequest = {
            query: getFacilityByIdQuery,
            variables: {
                id: newFacility.id
            }
        } as gqlRequest

        // Query the facility by id
        const getFacilityResult = await request(gqlApiUrl).post('/').send(getFacilityByIdRequest)

        //should not have errors
        const errors = createFacilityResult.body?.errors

        if (errors) {
            console.log(createFacilityResult.body.errors)
        }
        expect(errors).toBeUndefined()

        const searchedFacility = getFacilityResult.body.data.facility as gqlType.Facility

        expect(searchedFacility.contact).toEqual(originalInputValues.contact)
        expect(searchedFacility.id).toBeDefined()
        expect(searchedFacility.createdDate).toBeDefined()
        expect(searchedFacility.updatedDate).toBeDefined()
        expect(searchedFacility.nameEn).toBe(originalInputValues.nameEn)
        expect(searchedFacility.nameJa).toBe(originalInputValues.nameJa)
    })

    test('facility/healthcareprofessional associations: Creating healthcareprofessional updates facility\'s healthcareProfessionalIds', async () => {
        //// Step 1: Create a new facility that has the sharedFacilityIds.
        const createHealthcareProfessionalRequest = {
            query: createHealthcareProfessionalMutation,
            variables: {
                // eslint-disable-next-line max-len
                input: {
                    ...generateRandomCreateHealthcareProfessionalInput(),
                    facilityIds: sharedFacilityIds
                } satisfies gqlType.CreateHealthcareProfessionalInput
            }
        } as gqlMutation<gqlType.CreateHealthcareProfessionalInput>

        // Create a new healthcare professional with the associated facility id
        const createProfessionalResult = await request(gqlApiUrl).post('/').send(createHealthcareProfessionalRequest)

        //should not have errors
        const createdErrors = createProfessionalResult.body.errors

        if (createdErrors) {
            console.log(JSON.stringify(createdErrors))
            expect(createdErrors).toBeUndefined()
        }
        const createdProfessional =
            createProfessionalResult.body.data.createHealthcareProfessional as gqlType.HealthcareProfessional

        // The healthcare professional should have the facility ids that we provided.
        expect(createdProfessional).toBeDefined()
        expect(createdProfessional.facilityIds).toBeDefined()
        expect(createdProfessional.facilityIds).containSubset(sharedFacilityIds)

        const getFacilityByIdRequest = {
            query: getFacilityByIdQuery,
            variables: {
                id: sharedFacilityIds[0]
            }
        } as gqlRequest

        //// Step 2: Query the facility by id and check if it has the new healthcare professional id added to it.
        const getFacilityResult = await request(gqlApiUrl).post('/').send(getFacilityByIdRequest)

        //should not have errors
        const errors = getFacilityResult.body?.errors

        if (errors) {
            console.log(JSON.stringify(errors))
            expect(errors).toBeUndefined()
        }

        const searchedFacility = getFacilityResult.body.data.facility as gqlType.Facility

        // The healthcare professional should have the facility ids that we provided.
        expect(searchedFacility.healthcareProfessionalIds).toBeDefined()
        expect(searchedFacility.healthcareProfessionalIds).toContain(createdProfessional.id)
    })
})

describe('getFacilityById', () => {
    test('gets the Facility that matches the facility_id', async () => {
        const createFacilityRequest = {
            query: createFacilityMutation,
            variables: {
                input: generateRandomCreateFacilityInput() satisfies gqlType.CreateFacilityInput
            }
        } as gqlMutation<gqlType.CreateFacilityInput>

        // Create a new facility
        const newFacilityResult = await request(gqlApiUrl).post('/').send(createFacilityRequest)

        //should not have errors
        const errors = newFacilityResult.body?.errors

        if (errors) {
            console.log(newFacilityResult.body.errors)
        }
        expect(errors).toBeUndefined()

        // Get the ID of the new facility
        const newFacility = newFacilityResult.body.data.createFacility as gqlType.Facility

        const getFacilityByIdRequest = {
            query: getFacilityByIdQuery,
            variables: {
                id: newFacility.id
            }
        } as gqlRequest

        // Query the facility by id
        const getFacilityResult = await request(gqlApiUrl).post('/').send(getFacilityByIdRequest)

        //should not have errors
        expect(getFacilityResult.body?.errors).toBeUndefined()

        // Compare the actual data returned by getFacilityById to the new facility stored in the database
        const searchedFacility = getFacilityResult.body.data.facility as gqlType.Facility
        const originalInputValues = createFacilityRequest.variables.input

        expect(searchedFacility.id).toBe(newFacility.id)
        expect(searchedFacility.nameEn).toBe(originalInputValues.nameEn)
        expect(searchedFacility.nameJa).toBe(originalInputValues.nameJa)
        expect(searchedFacility.contact).toEqual(originalInputValues.contact)
        expect(searchedFacility.createdDate).toBeDefined()
        expect(searchedFacility.updatedDate).toBeDefined()
    })
})

describe('updateFacility', () => {
    test('updates various Facility fields', async () => {
        // Create a new facility
        const createFacilityRequest = {
            query: createFacilityMutation,
            variables: {
                input: generateRandomCreateFacilityInput() satisfies gqlType.CreateFacilityInput
            }
        } as gqlMutation<gqlType.CreateFacilityInput>
        const newFacilityResult = await request(gqlApiUrl).post('/').send(createFacilityRequest)

        //should not have errors
        const errors = newFacilityResult.body?.errors

        if (errors) {
            console.log(JSON.stringify(errors))
            expect(JSON.stringify(errors)).toBeUndefined()
        }

        // Get the ID of the new facility
        const newFacility = newFacilityResult.body.data.createFacility as gqlType.Facility

        const updateFacilityMutationRequest = {
            query: updateFacilityMutation,
            variables: {
                id: newFacility.id,
                input: {
                    ...generateRandomCreateFacilityInput(),
                    healthcareProfessionalIds: []
                } satisfies gqlType.UpdateFacilityInput
            }
        } as gqlMutation<gqlType.UpdateFacilityInput>

        // Mutation to update the facility
        const updateFacilityResult = await request(gqlApiUrl).post('/').send(updateFacilityMutationRequest)

        //should not have errors
        const updateErrors = updateFacilityResult.body?.errors

        if (updateErrors) {
            console.log(JSON.stringify(updateErrors))
            expect(JSON.stringify(updateErrors)).toBeUndefined()
        }

        const getFacilityByIdRequest = {
            query: getFacilityByIdQuery,
            variables: {
                id: newFacility.id
            }
        } as gqlRequest

        // fetch the updated facility
        const getFacilityResult = await request(gqlApiUrl).post('/').send(getFacilityByIdRequest)

        //should not have errors
        const queryErrors = getFacilityResult.body?.errors

        if (queryErrors) {
            console.log(JSON.stringify(queryErrors))
            expect(JSON.stringify(queryErrors)).toBeUndefined()
        }

        // Compare the actual updated facility returned by getFacilityById to the update request we sent
        const updatedFacility = getFacilityResult.body.data.facility as gqlType.Facility
        const fieldsThatWereUpdated = updateFacilityMutationRequest.variables.input

        expect(updatedFacility.id).toBe(newFacility.id)
        expect(updatedFacility.nameEn).toBe(fieldsThatWereUpdated.nameEn)
        expect(updatedFacility.nameJa).toBe(fieldsThatWereUpdated.nameJa)
        expect(updatedFacility.contact.phone).toBe(fieldsThatWereUpdated.contact?.phone)
        expect(updatedFacility.createdDate).toBeDefined()
        expect(updatedFacility.updatedDate).toBeDefined()
    })
})

describe('deleteFacility', () => {
    test('deletes a new facility', async () => {
        // -- Create a new facility that we plan to delete --
        const createFacilityRequest = {
            query: createFacilityMutation,
            variables: {
                input: generateRandomCreateFacilityInput() satisfies gqlType.CreateFacilityInput
            }
        } as gqlMutation<gqlType.CreateFacilityInput>

        const createFacilityResult = await request(gqlApiUrl).post('/').send(createFacilityRequest)

        //should not have errors
        const createErrors = createFacilityResult.body?.errors

        if (createErrors) {
            console.log(JSON.stringify(createErrors))
            expect(createErrors).toBeUndefined()
        }

        const originalInputValues = createFacilityRequest.variables.input
        const newFacility = createFacilityResult.body.data.createFacility as gqlType.Facility
        const newFacilityId = newFacility.id

        const getFacilityByIdRequest = {
            query: getFacilityByIdQuery,
            variables: {
                id: newFacility.id
            }
        } as gqlRequest

        // -- Query the facility by id --
        const getFacilityResult = await request(gqlApiUrl).post('/').send(getFacilityByIdRequest)

        //should not have errors
        const queryErrors = createFacilityResult.body?.errors

        if (queryErrors) {
            console.log(JSON.stringify(queryErrors))
            expect(queryErrors).toBeUndefined()
        }

        const searchedFacility = getFacilityResult.body.data.facility as gqlType.Facility

        // We want to ensure the facility was created before we delete it. 
        expect(searchedFacility.contact).toEqual(originalInputValues.contact)
        expect(searchedFacility.id).toBeDefined()

        const deleteFacilityRequest = {
            query: deleteFacilityMutation,
            variables: {
                id: newFacilityId
            }
        } as gqlRequest

        // -- Let's try to delete the facility! --
        const deleteFacilityResult = await request(gqlApiUrl).post('/').send(deleteFacilityRequest)

        //should not have errors
        const deleteErrors = deleteFacilityResult.body?.errors

        if (deleteErrors) {
            console.log(JSON.stringify(deleteErrors))
            expect(deleteErrors).toBeUndefined()
        }

        // we should have a success response
        expect(deleteFacilityResult.body.data.deleteFacility.isSuccessful).toBe(true)

        // -- Let's try to fetch the facility again to confirm it's deleted --
        const missingFacilityQueryResult = await request(gqlApiUrl).post('/').send(getFacilityByIdRequest)

        //should have an error that it doesn't exist
        const validQueryGqlErrors = missingFacilityQueryResult.body?.errors
        const validQueryErrors = validQueryGqlErrors[0].extensions.errors as Error[]
        
        console.log(JSON.stringify(validQueryErrors))
        expect(validQueryErrors.length).toBe(1)
        expect(validQueryErrors[0]).toBeDefined()
        expect(validQueryErrors[0].field).toBe('getFacilityById')
        expect(validQueryErrors[0].errorCode).toBe(ErrorCode.INTERNAL_SERVER_ERROR)

        // -- Let's try to delete the facility again! We should receive an error now that it doesn't exist --
        const deleteAgainFacilityResult = await request(gqlApiUrl).post('/').send(deleteFacilityRequest)

        //should have an error that it doesn't exist
        const deleteAgainErrors = deleteAgainFacilityResult.body?.errors[0].extensions.errors as Error[]

        console.log(JSON.stringify(deleteAgainErrors))
        expect(deleteAgainFacilityResult.body?.deleteFacility).toBeFalsy()
        expect(deleteAgainErrors.length).toBe(1)
        expect(deleteAgainErrors[0]).toBeDefined()
        expect(deleteAgainErrors[0].field).toBe('deleteFacility')
        expect(deleteAgainErrors[0].errorCode).toBe(ErrorCode.INVALID_ID)
    })
})

export const createFacilityMutation = `mutation test_createFacility($input: CreateFacilityInput!) {
    createFacility(input: $input) {
        id
        contact {
            address {
                addressLine1En
                addressLine1Ja
                addressLine2En
                addressLine2Ja
                cityEn
                cityJa
                postalCode
                prefectureEn
                prefectureJa
            }
            googleMapsUrl
            email
            phone
            website
        }
        healthcareProfessionalIds
        nameEn
        nameJa
        createdDate
        updatedDate
    }
}`

const updateFacilityMutation = `mutation test_updateFacility($id: ID!, $input: UpdateFacilityInput!) {
    updateFacility(id: $id, input: $input) {
        id
        nameEn
        nameJa
        contact {
        googleMapsUrl
        email
        phone
        website
        address {
            postalCode
            prefectureEn
            cityEn
            addressLine1En
            addressLine2En
            prefectureJa
            cityJa
            addressLine1Ja
            addressLine2Ja
        }
        }
        healthcareProfessionalIds
        createdDate
        updatedDate
    }
}`

const deleteFacilityMutation = `mutation test_deleteFacility($id: ID!) {
    deleteFacility(id: $id) {
        isSuccessful
    }
}`

const getFacilityByIdQuery = `query test_getfacilityById($id: ID!) {
    facility(id: $id) {
        id
        nameEn
        nameJa
        contact {
            googleMapsUrl
            email
            phone
            website
            address {
                postalCode
                prefectureEn
                cityEn
                addressLine1En
                addressLine2En
                prefectureJa
                cityJa
                addressLine1Ja
                addressLine2Ja
            }
        }
        healthcareProfessionalIds
        createdDate
        updatedDate
    }
}`
