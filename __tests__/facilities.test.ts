import { expect } from '@jest/globals'
import resolvers from '../src/resolvers'
import loadSchema from '../src/schema'
import request from 'supertest'
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { initiatilizeFirebaseInstance } from '../src/firebaseDb'

const queryData = {
    query: `mutation Mutation($input: FacilityInput) {
        createFacilityWithHealthcareProfessional(input: $input) {
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
            email
            mapsLink
            phone
            website
          }
          healthcareProfessionalIds
          id
          isDeleted
          nameEn
          nameJa
          createdDate
          updatedDate
        }
      }`,
    variables: {
        input: {
            contact: {
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
                },
                email: 'some@email.com',
                mapsLink: 'https://some-map-link',
                phone: '000-000-0000',
                website: 'https://foo.com'
            },
            healthcareProfessionalIds: [],
            healthcareProfessionals: [
                {
                    acceptedInsurance: 'JAPANESE_HEALTH_INSURANCE',
                    degrees: [
                        {
                            nameJa: 'some degree JA',
                            nameEn: 'some degree EN',
                            abbreviation: 's.D.'
                        }
                    ],
                    names: [
                        {
                            middleName: 'some middle name',
                            locale: 'ENGLISH',
                            lastName: 'some last name',
                            firstName: 'some first name'
                        }
                    ],
                    specialties: [
                        {
                            names: [
                                {
                                    name: 'some specialty',
                                    locale: 'ENGLISH'
                                }
                            ]
                        }
                    ],
                    spokenLanguages: [
                        {
                            nameNative: 'some native language',
                            nameJa: 'some language JA',
                            nameEn: 'some language EN',
                            iso639_3: 'en'
                        }
                    ],
                    facilityIds: []
                }
            ],
            nameEn: 'some facility name EN',
            nameJa: 'some facility name JA'
        }
    }
}

describe('createFacilityWithHealthcareProfessional', () => {
    let url: string

    const server = new ApolloServer({
        typeDefs: loadSchema(),
        resolvers
    })

    beforeAll(async () => {
        ({ url } = await startStandaloneServer(server, {listen: { port: 0 }}))
        await initiatilizeFirebaseInstance()
    })

    afterAll(async () => {
        await server?.stop()
    })
    
    it('creates a new Facility with a new HealthcareProfessional', async () => {
        const response = await request(url).post('/').send(queryData)

        const inputData = queryData.variables.input
        const newFacilityData = response.body.data.createFacilityWithHealthcareProfessional

        expect(newFacilityData.contact).toEqual(inputData.contact)
        expect(newFacilityData.healthcareProfessionalIds).toHaveLength(1)
        expect(newFacilityData.id).toBeDefined()
        expect(newFacilityData.isDeleted).toBe(false)
        expect(newFacilityData.createdDate).toBeDefined()
        expect(newFacilityData.updatedDate).toBeDefined()
        expect(newFacilityData.nameEn).toBe(inputData.nameEn)
        expect(newFacilityData.nameJa).toBe(inputData.nameJa)
    })
})

describe('getFacilityById', () => {
    let url: string

    const server = new ApolloServer({
        typeDefs: loadSchema(),
        resolvers
    })

    beforeAll(async () => {
        ({ url } = await startStandaloneServer(server, {listen: { port: 0 }}))
        await initiatilizeFirebaseInstance()
    })

    afterAll(async () => {
        await server?.stop()
    })
    
    it('gets the Facility that matches the facility_id', async () => {
        // Create a new facility
        const newFacility = await request(url).post('/').send(queryData)

        // Get the ID of the new facility
        const facilityId = newFacility.body.data.createFacilityWithHealthcareProfessional.id

        // Query the facility by id
        const facilityQuery = {
            query: `query Facility($facilityId: ID!) {
                facility(id: $facilityId) {
                  id
                  nameEn
                  nameJa
                  contact {
                    email
                    phone
                    website
                    mapsLink
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
                  isDeleted
                  createdDate
                  updatedDate
                }
              }`,
            variables: {
                facilityId: facilityId
            }
        }
        const facility = await request(url).post('/').send(facilityQuery)

        // Compare the data returned by getFacilityById to the new facility stored in the database
        const facilityData = facility.body.data.facility
        const inputData = queryData.variables.input

        expect(facilityData.id).toBe(facilityId)
        expect(facilityData.nameEn).toBe(inputData.nameEn)
        expect(facilityData.nameJa).toBe(inputData.nameJa)
        expect(facilityData.contact).toEqual(inputData.contact)
        expect(facilityData.healthcareProfessionalIds).toHaveLength(1)
        expect(facilityData.isDeleted).toBe(false)
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
        ({ url } = await startStandaloneServer(server, {listen: { port: 0 }}))
        await initiatilizeFirebaseInstance()
    })

    afterAll(async () => {
        await server?.stop()
    })
    
    it('updates the Facility fields included in the input', async () => {
        // Create a new facility
        const newFacility = await request(url).post('/').send(queryData)

        // Get the ID of the new facility
        const facilityId = newFacility.body.data.createFacilityWithHealthcareProfessional.id

        // Mutation to update the facility
        const facilityQuery = {
            query: `mutation Mutation($input: FacilityInput, $updateFacilityId: ID!) {
                updateFacility(input: $input, id: $updateFacilityId) {
                  id
                  nameEn
                  nameJa
                  contact {
                    email
                    phone
                    website
                    mapsLink
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
                  isDeleted
                  createdDate
                  updatedDate
                }
              }`,
            variables: {
                updateFacilityId: facilityId,
                input: {
                    nameEn: 'some NEW facility name EN',
                    nameJa: 'some NEW facility name JA',
                    contact: {
                        phone: '111-111-1111'
                    },
                    isDeleted: true
                }
                  
            }
        }
        const facility = await request(url).post('/').send(facilityQuery)

        // Compare the data returned by getFacilityById to the new facility stored in the database
        const updatedFacilityData = facility.body.data.updateFacility
        const updatedFields = facilityQuery.variables.input

        expect(updatedFacilityData.id).toBe(facilityId)
        expect(updatedFacilityData.nameEn).toBe(updatedFields.nameEn)
        expect(updatedFacilityData.nameJa).toBe(updatedFields.nameJa)
        expect(updatedFacilityData.contact.phone).toBe(updatedFields.contact.phone)
        expect(updatedFacilityData.healthcareProfessionalIds).toHaveLength(1)
        expect(updatedFacilityData.isDeleted).toBe(updatedFields.isDeleted)
        expect(updatedFacilityData.createdDate).toBeDefined()
        expect(updatedFacilityData.updatedDate).toBeDefined()
    })
})
