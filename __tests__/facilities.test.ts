import request from 'supertest'
import { expect, describe, it } from 'vitest'
import * as gqlType from '../src/typeDefs/gqlTypes.js'
import { gqlMutation, gqlRequest } from '../utils/gqlTool.js'
import { generateRandomCreateFacilityInput } from '../src/fakeData/fakeFacilities.js'
import { gqlApiUrl } from './testSetup.test.js'

describe('createFacility', () => {
    it('creates a new Facility', async () => {
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

    it.skip('properly updates facility/healthcareprofessional associations', async () => {
        const createFacilityRequest = {
            query: createFacilityMutation,
            variables: {
                input: generateRandomCreateFacilityInput() satisfies gqlType.CreateFacilityInput
            }
        } as gqlMutation<gqlType.CreateFacilityInput>

        const createFacilityResult = await request(gqlApiUrl).post('/').send(createFacilityRequest)

        //should not have errors
        const errors = createFacilityResult.body?.errors
        
        if (errors) {
            console.log(createFacilityResult.body.errors)
        }
        expect(errors).toBeUndefined()

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
        expect(getFacilityResult.body.errors).toBeUndefined()

        const searchedFacility = getFacilityResult.body.data.facility as gqlType.Facility

        expect(searchedFacility.contact).toEqual(originalInputValues.contact)
        expect(searchedFacility.updatedDate).toBeDefined()
    })
})

describe('getFacilityById', () => {
    it('gets the Facility that matches the facility_id', async () => {
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
    it('updates various Facility fields', async () => {
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
        } as gqlMutation<gqlType.CreateFacilityInput>

        // Mutation to update the facility
        const updateFacilityResult = await request(gqlApiUrl).post('/').send(updateFacilityMutationRequest)

        //should not have errors
        expect(updateFacilityResult.body?.errors).toBeUndefined()

        const getFacilityByIdRequest = {
            query: getFacilityByIdQuery,
            variables: {
                id: newFacility.id
            }
        } as gqlRequest

        // fetch the updated facility
        const getFacilityResult = await request(gqlApiUrl).post('/').send(getFacilityByIdRequest)

        // Compare the actual updated facility returned by getFacilityById to the update request we sent
        const updatedFacility = getFacilityResult.body.data.facility as gqlType.Facility
        const fieldsThatWereUpdated = createFacilityRequest.variables.input

        expect(updatedFacility.id).toBe(newFacility.id)
        expect(updatedFacility.nameEn).toBe(fieldsThatWereUpdated.nameEn)
        expect(updatedFacility.nameJa).toBe(fieldsThatWereUpdated.nameJa)
        expect(updatedFacility.contact.phone).toBe(fieldsThatWereUpdated.contact.phone)
        expect(updatedFacility.createdDate).toBeDefined()
        expect(updatedFacility.updatedDate).toBeDefined()
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
