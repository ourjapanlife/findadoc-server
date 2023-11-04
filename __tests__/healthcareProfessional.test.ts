import request from 'supertest'
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { expect, describe, beforeAll, afterAll, it } from 'vitest'
import resolvers from '../src/resolvers.js'
import loadSchema from '../src/schema.js'
import { initiatilizeFirebaseInstance } from '../src/firebaseDb.js'
import { Error, ErrorCode } from '../src/result.js'
import { generateRandomCreateHealthcareProfessionalInput } from '../src/fakeData/fakeHealthcareProfessionals.js'
import { gqlMutation, gqlRequest } from '../utils/gqlTool.js'
import { CreateFacilityInput, CreateHealthcareProfessionalInput, Facility, HealthcareProfessional } from '../src/typeDefs/gqlTypes.js'
import { generateRandomCreateFacilityInput } from '../src/fakeData/fakeFacilities.js'
import { createFacilityMutation } from './facilities.test.js'

const facilityIds = [] as string[]

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
        const createFacilityRequest = {
            query: createFacilityMutation,
            variables: {
                input: generateRandomCreateFacilityInput()
            }
        } as gqlMutation<CreateFacilityInput>

        const createFacilityResult = await request(url).post('/').send(createFacilityRequest)

        //should not have errors
        expect(createFacilityResult.body.extensions?.errors).toBeUndefined()

        const facility = await createFacilityResult.body.data.createFacility as Facility
        const facilityId = facility.id

        facilityIds.push(facilityId)
    })

    afterAll(async () => {
        await server.stop()
    })

    it('creates a new HealthcareProfessional and adds it to the list of facilities', async () => {
        const createHealthcareProfessionalMutationRequest = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: generateRandomCreateHealthcareProfessionalInput({ facilityIds })
            }
        } as gqlMutation<CreateHealthcareProfessionalInput>

        const createProfessionalResult = await request(url).post('/').send(createHealthcareProfessionalMutationRequest)

        //should not have errors
        expect(createProfessionalResult.body.extensions?.errors).toBeUndefined()

        const createdHealthcareProfessional =
            createProfessionalResult.body.data.createHealthcareProfessional as HealthcareProfessional

        const getHealthcareProfessionalByIdRequest = {
            query: getHealthcareProfessionalByIdQuery,
            variables: {
                id: createdHealthcareProfessional.id
            }
        } as gqlRequest

        const searchResult = await request(url).post('/').send(getHealthcareProfessionalByIdRequest)

        //should not have errors
        expect(searchResult.body.extensions?.errors).toBeUndefined()

        const searchedProfessional = searchResult.body.data.healthcareProfessional as HealthcareProfessional
        const originalValues = createHealthcareProfessionalMutationRequest.variables.input

        //validate the created HealthcareProfessional has the same values as the original
        expect(searchedProfessional).toBeDefined()
        expect(searchedProfessional.id).toBeDefined()
        expect(searchedProfessional.names).toEqual(originalValues.names)
        expect(searchedProfessional.degrees).toEqual(originalValues.degrees)
        expect(searchedProfessional.spokenLanguages).toEqual(originalValues.spokenLanguages)
        expect(searchedProfessional.acceptedInsurance).toEqual(originalValues.acceptedInsurance)
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

        const createProfessionalResult = await request(url).post('/').send(createHealthcareProfessionalRequest)
        const createdProfessional
            = createProfessionalResult.body.data.createHealthcareProfessional as HealthcareProfessional

        expect(createdProfessional).toBeFalsy()
        expect(createProfessionalResult.body).toBe(1)
        expect(createProfessionalResult.body.extensions?.errors).toBeDefined()
        expect(createProfessionalResult.body.extensions?.errors[0].extensions.errors[0]).toBeDefined()
        expect(createProfessionalResult.body.extensions?.errors[0].extensions.errors.length).toEqual(1)

        const error = createProfessionalResult.body.extensions?.errors[0].extensions.errors[0] as Error

        expect(error.field).toBe('facilityIds')
        expect(error.errorCode).toBe(ErrorCode.CREATEPROFFESIONAL_FACILITYIDS_REQUIRED)
        expect(error.httpStatus).toBe(400)
    })
})

const createHealthcareProfessionalMutation = `mutation test_createHealthcareProfessional($input: CreateHealthcareProfessionalInput!) {
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
        spokenLanguages
        acceptedInsurance
        createdDate
        updatedDate
    }
}`
