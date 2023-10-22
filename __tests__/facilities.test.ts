import { expect } from '@jest/globals'
import resolvers from '../src/resolvers'
import loadSchema from '../src/schema'
import request from 'supertest'
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { initiatilizeFirebaseInstance } from '../src/firebaseDb'
import * as gqlType from '../src/typeDefs/gqlTypes'
import { gqlQuery, gqlMutation, gqlRequest } from '../utils/gqlTool'

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

    it('creates a new Facility with a new HealthcareProfessional', async () => {
        const response = await request(url).post('/').send(createFacilityRequest)

        //should not have errors
        expect(response.body.errors).toBeUndefined()

        const inputData = createFacilityRequest.variables.input
        const newFacilityId = response.body.data

        const response = await request(url).post('/').send(facilityQuery(newFacilityId))

        //should not have errors
        expect(response.body.errors).toBeUndefined()


        expect(newFacilityId.contact).toEqual(inputData.contact)
        expect(newFacilityId.healthcareProfessionalIds).toHaveLength(1)
        expect(newFacilityId.id).toBeDefined()
        expect(newFacilityId.createdDate).toBeDefined()
        expect(newFacilityId.updatedDate).toBeDefined()
        expect(newFacilityId.nameEn).toBe(inputData.nameEn)
        expect(newFacilityId.nameJa).toBe(inputData.nameJa)
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
        const newFacility = await request(url).post('/').send(createFacilityRequest)

        // Get the ID of the new facility
        const facilityId = newFacility.body.data.createFacilityWithHealthcareProfessional.id

        // Query the facility by id
        const queryResponse = await request(url).post('/').send(facilityQuery)

        //should not have errors
        expect(queryResponse.body.errors).toBeUndefined()

        // Compare the data returned by getFacilityById to the new facility stored in the database
        const facilityData = queryResponse.body.data.facility
        const inputData = createFacilityRequest.variables.input

        expect(facilityData.id).toBe(facilityId)
        expect(facilityData.nameEn).toBe(inputData.nameEn)
        expect(facilityData.nameJa).toBe(inputData.nameJa)
        expect(facilityData.contact).toEqual(inputData.contact)
        expect(facilityData.healthcareProfessionalIds).toHaveLength(1)
        expect(facilityData.createdDate).toBeDefined()
        expect(facilityData.updatedDate).toBeDefined()
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

    it('updates the Facility fields included in the input', async () => {
        // Create a new facility
        const newFacility = await request(url).post('/').send(createFacilityRequest)

        //should not have errors
        expect(newFacility.body.errors).toBeUndefined()

        // Get the ID of the new facility
        const facilityId = newFacility.body.data.createFacilityWithHealthcareProfessional.id

        // Mutation to update the facility

        const facility = await request(url).post('/').send(updateFacilityMutationRequest)

        //should not have errors
        expect(facility.body.errors).toBeUndefined()

        // Compare the data returned by getFacilityById to the new facility stored in the database
        const updatedFacilityData = facility.body.data.updateFacility
        const updatedFields = facilityQuery.variables.input

        expect(updatedFacilityData.id).toBe(facilityId)
        expect(updatedFacilityData.nameEn).toBe(updatedFields.nameEn)
        expect(updatedFacilityData.nameJa).toBe(updatedFields.nameJa)
        expect(updatedFacilityData.contact.phone).toBe(updatedFields.contact.phone)
        expect(updatedFacilityData.healthcareProfessionalIds).toHaveLength(1)
        expect(updatedFacilityData.createdDate).toBeDefined()
        expect(updatedFacilityData.updatedDate).toBeDefined()
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
        input: {
            contact: {
                googleMapsUrl: 'https://some-map-link',
                email: 'some@email.com',
                phone: '000-000-0000',
                website: 'https://foo.com',
                address: {
                    addressLine1Ja: 'some address line 1 JA',
                    addressLine1En: 'some address line 1 EN',
                    addressLine2En: 'some address line 2 EN',
                    addressLine2Ja: 'some address line 2 JA',
                    cityEn: 'some city EN',
                    cityJa: 'some city JA',
                    postalCode: 'some postal code',
                    prefectureEn: 'some prefecture EN',
                    prefectureJa: 'some prefecture JA'
                }
            },
            healthcareProfessionalIds: [],
            nameEn: 'some facility name EN',
            nameJa: 'some facility name JA'
        }
    }
}

const updateFacilityMutationRequest = (facilityId: string)
    : <string, gqlMutation<gqlType.UpdateFacilityInput>> => ({
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
                nameEn: 'some NEW facility name EN',
                nameJa: 'some NEW facility name JA',
                contact: {
                    googleMapsUrl: 'https://some-NEW-map-link',
                    phone: '111-111-1111',
                    email: 'someemail@findadoc.jp',
                    website: 'https://findadoc.jp',
                    address: {
                        addressLine1Ja: 'some NEW address line 1 JA',
                        addressLine1En: 'some NEW address line 1 EN',
                        addressLine2En: 'some NEW address line 2 EN',
                        addressLine2Ja: 'some NEW address line 2 JA',
                        cityEn: 'some NEW city EN',
                        cityJa: 'some NEW city JA',
                        postalCode: 'some NEW postal code',
                        prefectureEn: 'some NEW prefecture EN',
                        prefectureJa: 'some NEW prefecture JA'
                    }
                }
            }

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
