import { expect } from '@jest/globals'
import resolvers from '../src/resolvers'
import loadSchema from '../src/schema'
import request from 'supertest'
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { initiatilizeFirebaseInstance } from '../src/firebaseDb'
import * as gqlType from '../src/typeDefs/gqlTypes'
import { gqlMutation, gqlRequest } from '../utils/gqlTool'
import { generateRandomFacilities, generateRandomFacility } from '../src/fakeData/facilities'

describe('createFacility', () => {
    let url: string

    const server = new ApolloServer({
        typeDefs: loadSchema(),
        resolvers
    })

    beforeAll(async () => {
        ({ url } = await startStandaloneServer(server, { listen: { port: 0 } }))
        await initiatilizeFirebaseInstance()
    })

    afterAll(async () => {
        await server?.stop()
    })

    it('creates a new Facility', async () => {
        const createFacilityResult = await request(url).post('/').send(createFacilityRequest)

        //should not have errors
        expect(createFacilityResult.body.errors).toBeUndefined()

        const originalInputValues = createFacilityRequest.variables.input
        const newFacilityId = createFacilityResult.body.data

        const getFacilityResult = await request(url).post('/').send(facilityQuery(newFacilityId))

        //should not have errors
        expect(getFacilityResult.body.errors).toBeUndefined()

        const newFacility = getFacilityResult.body.data as gqlType.Facility

        expect(newFacility.contact).toEqual(originalInputValues.contact)
        expect(newFacility.healthcareProfessionalIds).toHaveLength(1)
        expect(newFacility.id).toBeDefined()
        expect(newFacility.createdDate).toBeDefined()
        expect(newFacility.updatedDate).toBeDefined()
        expect(newFacility.nameEn).toBe(originalInputValues.nameEn)
        expect(newFacility.nameJa).toBe(originalInputValues.nameJa)
    })

    it.skip('properly updates facility/healthcareprofessional associations', async () => {
        const createFacilityResult = await request(url).post('/').send(createFacilityRequest)

        //should not have errors
        expect(createFacilityResult.body.errors).toBeUndefined()



        const originalInputValues = createFacilityRequest.variables.input
        const newFacilityId = createFacilityResult.body.data

        const getFacilityResult = await request(url).post('/').send(facilityQuery(newFacilityId))

        //should not have errors
        expect(getFacilityResult.body.errors).toBeUndefined()

        const newFacility = getFacilityResult.body.data as gqlType.Facility

        expect(newFacility.contact).toEqual(originalInputValues.contact)
        expect(newFacility.healthcareProfessionalIds).toHaveLength(1)
        expect(newFacility.updatedDate).toBeDefined()
    })
})

describe('getFacilityById', () => {
    let url: string

    const server = new ApolloServer({
        typeDefs: loadSchema(),
        resolvers
    })

    beforeAll(async () => {
        ({ url } = await startStandaloneServer(server, { listen: { port: 0 } }))
        await initiatilizeFirebaseInstance()
    })

    afterAll(async () => {
        await server?.stop()
    })

    it('gets the Facility that matches the facility_id', async () => {
        // Create a new facility
        const newFacilityResult = await request(url).post('/').send(createFacilityRequest)

        // Get the ID of the new facility
        const newFacilityId = newFacilityResult.body.data as string

        // Query the facility by id
        const queryResponse = await request(url).post('/').send(facilityQuery)

        //should not have errors
        expect(queryResponse.body.errors).toBeUndefined()

        // Compare the actual data returned by getFacilityById to the new facility stored in the database
        const facility = queryResponse.body.data as gqlType.Facility
        const originalInputValues = createFacilityRequest.variables.input

        expect(facility.id).toBe(newFacilityId)
        expect(facility.nameEn).toBe(originalInputValues.nameEn)
        expect(facility.nameJa).toBe(originalInputValues.nameJa)
        expect(facility.contact).toEqual(originalInputValues.contact)
        expect(facility.healthcareProfessionalIds).toHaveLength(1)
        expect(facility.createdDate).toBeDefined()
        expect(facility.updatedDate).toBeDefined()
    })
})

describe('updateFacility', () => {
    let url: string

    const server = new ApolloServer({
        typeDefs: loadSchema(),
        resolvers
    })

    beforeAll(async () => {
        ({ url } = await startStandaloneServer(server, { listen: { port: 0 } }))
        await initiatilizeFirebaseInstance()
    })

    afterAll(async () => {
        await server?.stop()
    })

    it('updates various Facility fields', async () => {
        // Create a new facility
        const newFacilityResult = await request(url).post('/').send(createFacilityRequest) 

        //should not have errors
        expect(newFacilityResult.body.errors).toBeUndefined()

        // Get the ID of the new facility
        const newFacilityId = newFacilityResult.body.data as string

        // Mutation to update the facility
        const updateFacilityResult = await request(url).post('/').send(updateFacilityMutationRequest)

        //should not have errors
        expect(updateFacilityResult.body.errors).toBeUndefined()

        // fetch the updated facility
        const getFacilityResult = await request(url).post('/').send(facilityQuery) 

        // Compare the actual updated facility returned by getFacilityById to the update request we sent
        const updatedFacility = getFacilityResult.body.data as gqlType.Facility
        const fieldsThatWereUpdated = createFacilityRequest.variables.input as gqlType.Facility

        expect(updatedFacility.id).toBe(newFacilityId)
        expect(updatedFacility.nameEn).toBe(fieldsThatWereUpdated.nameEn)
        expect(updatedFacility.nameJa).toBe(fieldsThatWereUpdated.nameJa)
        expect(updatedFacility.contact.phone).toBe(fieldsThatWereUpdated.contact.phone)
        expect(updatedFacility.healthcareProfessionalIds).toHaveLength(1)
        expect(updatedFacility.createdDate).toBeDefined()
        expect(updatedFacility.updatedDate).toBeDefined()
    })
})

const createFacilityRequest: gqlMutation<gqlType.CreateFacilityInput> = {
    query: `mutation Mutation($input: FacilityInput) {
        createFacility(input: $input) {
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
          id
          nameEn
          nameJa
          createdDate
          updatedDate
        }
      }`,
    variables: {
        input: generateRandomFacility() satisfies gqlType.CreateFacilityInput
    }
}

const updateFacilityMutationRequest = (facilityId: string, healthcareProfessionalIds: gqlType.RelationshipInput[] = [])
    : gqlRequest => ({
    query: `mutation Mutation($input: FacilityInput, $updateFacilityId: ID!) {
        updateFacility(input: $input, id: $updateFacilityId) {
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
      }`,
    variables: {
        id: facilityId,
        input: { 
            ...generateRandomFacility(),
            healthcareProfessionalIds: healthcareProfessionalIds
        } satisfies gqlType.UpdateFacilityInput
    }
})

const facilityQuery = (facilityId: string): gqlRequest => {
    {
        return {
            query: `query Facility($facilityId: ID!) {
                facility(id: $facilityId) {
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
            }`,
            variables: {
                facilityId: facilityId
            }
        }
    }
}
