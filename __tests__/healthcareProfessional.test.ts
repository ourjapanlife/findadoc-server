import { expect } from '@jest/globals'
import resolvers from '../src/resolvers'
import loadSchema from '../src/schema'
import request from 'supertest'
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { initiatilizeFirebaseInstance } from '../src/firebaseDb'
import { Error, ErrorCode } from '../src/result'

const facilityIds = [] as string[]
const healthcareProfessionalIds = [] as string[]

const facilityMutationRequest = {
    query: `mutation CreateFacility($input: FacilityInput) {
        CreateFacilityInput(input: $input) {
          id
        }
      }`,
    variables: {
        input: {
            contact: {
                googleMapsUrl: null,
                email: null,
                phone: null,
                website: null,
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
                }
            },
            healthcareProfessionalIds: healthcareProfessionalIds,
            nameEn: null,
            nameJa: null
        }
    }

}

const healthcareProfessionalMutationRequest = {
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
            languageCode_iso639_3
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
                    languageCode_iso639_3: 'EN',
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
        ({ url } = await startStandaloneServer(server, { listen: { port: 0 } }))
        await initiatilizeFirebaseInstance()

        // Create a new Facility to add HealthProfessionals to
        const facility = await request(url).post('/').send(facilityMutationRequest)

        const facilityId = await facility.body.data.createFacilityWithHealthcareProfessional.id

        facilityIds.push(facilityId)
    })

    afterAll(async () => {
        await server.stop()
    })

    it('creates a new HealthcareProfessional and adds it to the list of facilities', async () => {
        const response = await request(url).post('/').send(healthcareProfessionalMutationRequest)

        //should not have errors
        expect(response.body.errors).toBeUndefined()

        const inputData = healthcareProfessionalMutationRequest.variables.input
        const newHealthcareProfessionalData = response.body.data.createHealthcareProfessional

        expect(newHealthcareProfessionalData.id).toBeDefined()
        expect(newHealthcareProfessionalData.names).toEqual(inputData.names)
        expect(newHealthcareProfessionalData.degrees).toEqual(inputData.degrees)
        expect(newHealthcareProfessionalData.spokenLanguages).toEqual(inputData.spokenLanguages)
        expect(newHealthcareProfessionalData.acceptedInsurance).toEqual(inputData.acceptedInsurance)
        expect(newHealthcareProfessionalData.createdDate).toBeDefined()
        expect(newHealthcareProfessionalData.updatedDate).toBeDefined()
    })

    it('failing: throws an error if the list of facilityIds is empty', async () => {
        //clear facilityIds so the empty list will throw a validation error
        facilityIds.pop()

        const response = await request(url).post('/').send(healthcareProfessionalMutationRequest)

        expect(response.body.errors).toBeDefined()
        expect(response.body.errors[0].extensions.errors[0]).toBeDefined()
        expect(response.body.errors[0].extensions.errors.length).toEqual(1)

        const error = response.body.errors[0].extensions.errors[0] as Error

        expect(error.field).toBe('facilityId')
        expect(error.errorCode).toBe(ErrorCode.CREATEPROFFESIONAL_FACILITYIDS_REQUIRED)
        expect(error.httpStatus).toBe(400)
    })
})

