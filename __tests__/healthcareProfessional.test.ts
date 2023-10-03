import { expect } from '@jest/globals'
import resolvers from '../src/resolvers'
import loadSchema from '../src/schema'
import request from 'supertest'
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { initiatilizeFirebaseInstance } from '../src/firebaseDb'
import { ErrorCode } from '../src/result'

const facilityIds = [] as string[]

const facilityQueryData = {
    query: `mutation CreateFacilityWithHealthcareProfessional($input: FacilityInput) {
        createFacilityWithHealthcareProfessional(input: $input) {
          id
        }
      }`,
    variables: {
        input: {
            contact: {
                address: {
                    addressLine1En: null,
                    addressLine1Ja: null,
                    addressLine2En: null,
                    addressLine2Ja: null,
                    cityEn: null,
                    postalCode: null,
                    cityJa: null,
                    prefectureEn: null,
                    prefectureJa: null
                },
                email: null,
                mapsLink: null,
                phone: null,
                website: null
            },
            healthcareProfessionalIds: null,
            healthcareProfessionals: [
                {
                    acceptedInsurance: 'JAPANESE_HEALTH_INSURANCE',
                    degrees: [
                        {
                            nameJa: null,
                            nameEn: null,
                            abbreviation: null
                        }
                    ],
                    facilityIds: [],
                    names: [
                        {
                            middleName: null,
                            locale: 'ENGLISH',
                            lastName: 'null',
                            firstName: 'null'
                        }
                    ],
                    specialties: [
                        {
                            names: [
                                {
                                    name: null,
                                    locale: null
                                }
                            ]
                        }
                    ],
                    spokenLanguages: [
                        {
                            nameNative: 'null',
                            nameEn: 'null',
                            iso639_3: 'null',
                            nameJa: 'null'
                        }
                    ]
                }
            ],
            isDeleted: null,
            nameEn: null,
            nameJa: null
        }
    }

}

const healthcareProfessionalQueryData = {
    query: `mutation Mutation($input: HealthcareProfessionalInput) {
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
          spokenLanguages {
            iso639_3
            nameJa
            nameEn
            nameNative
          }
          specialties {
            names {
              name
              locale
            }
          }
          acceptedInsurance
          isDeleted
          createdDate
          updatedDate
        }
      }`,
    variables: {
        input: {
            acceptedInsurance: ['INSURANCE_NOT_ACCEPTED'],
            degrees: [
                {
                    abbreviation: 'DG',
                    nameEn: 'some degree EN',
                    nameJa: 'some degree JA'
                }
            ],
            names: [
                {
                    firstName: 'some first name',
                    lastName: 'some last name',
                    locale: 'ENGLISH',
                    middleName: 'some middle name'
                }
            ],
            specialties: [
                {
                    names: [
                        {
                            locale: 'ENGLISH',
                            name: 'some specialty name'
                        }
                    ]
                }
            ],
            spokenLanguages: [
                {
                    iso639_3: 'EN',
                    nameEn: 'some spoken language EN',
                    nameJa: 'some spoken language JA',
                    nameNative: 'some spoken language NATIVE'
                }
            ],
            facilityIds: facilityIds
        }
    }
}

describe('createHealthcareProfessional', () => {
    let url: string

    const server = new ApolloServer({
        typeDefs: loadSchema(),
        resolvers
    })
    
    beforeAll(async () => {
        ({ url } = await startStandaloneServer(server, {listen: { port: 0 }}))
        await initiatilizeFirebaseInstance()

        // Create a new Facility to add HealthProfessionals to
        const facility = await request(url).post('/').send(facilityQueryData)

        const facilityId = await facility.body.data.createFacilityWithHealthcareProfessional.id

        facilityIds.push(facilityId)
    })
    
    afterAll(async () => {
        await server?.stop()
    })
    
    it('creates a new HealthcareProfessional and adds it to the list of facilities', async () => {
        const response = await request(url).post('/').send(healthcareProfessionalQueryData)
        
        const inputData = healthcareProfessionalQueryData.variables.input
        const newHealthcareProfessionalData = response.body.data.createHealthcareProfessional

        expect(newHealthcareProfessionalData.id).toBeDefined()
        expect(newHealthcareProfessionalData.names).toEqual(inputData.names)
        expect(newHealthcareProfessionalData.degrees).toEqual(inputData.degrees)
        expect(newHealthcareProfessionalData.spokenLanguages).toEqual(inputData.spokenLanguages)
        expect(newHealthcareProfessionalData.acceptedInsurance).toEqual(inputData.acceptedInsurance)
        expect(newHealthcareProfessionalData.isDeleted).toBe(false)
        expect(newHealthcareProfessionalData.createdDate).toBeDefined()
        expect(newHealthcareProfessionalData.updatedDate).toBeDefined()
    })

    it('throws an error if the list of facilityIds is empty', async () => {
        facilityIds.pop()

        const response = await request(url).post('/').send(healthcareProfessionalQueryData)

        const errors = response.body.errors[0]

        expect(errors.message).toBe('The list of facilityIds cannot be empty.')
        expect(errors.extensions.code).toBe(ErrorCode.MISSING_INPUT)
        expect(response.statusCode).toBe(400)
    })
})

