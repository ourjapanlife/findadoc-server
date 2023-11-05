
import request from 'supertest'
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import resolvers from '../src/resolvers.js'
import loadSchema from '../src/schema.js'
import { initiatilizeFirebaseInstance } from '../src/firebaseDb.js'
import { gqlMutation } from '../utils/gqlTool.js'
import { CreateFacilityInput, Facility } from '../src/typeDefs/gqlTypes.js'
import { generateRandomCreateFacilityInput } from '../src/fakeData/fakeFacilities.js'
import { createFacilityMutation } from './facilities.test.js'
import { RulesTestEnvironment, initializeTestEnvironment } from '@firebase/rules-unit-testing'

// These ids can be used in any of the tests so they don't have to recreate the same data. 
export const sharedFacilityIds = [] as string[]
// This is the url of the graphql api. All supertest requests should be sent to this url.
export let gqlApiUrl: string

let testEnv: RulesTestEnvironment

const server = new ApolloServer({
    typeDefs: loadSchema(),
    resolvers
})

beforeAll(async () => {
    ({ url: gqlApiUrl } = await startStandaloneServer(server, { listen: { port: 0 } }))
    
    //this sets up the firebase test environment
    testEnv = await initializeTestEnvironment({
        projectId: process.env.FIRESTORE_PROJECT_ID,
        firestore: {
            rules: fs.readFileSync('./firestore.rules', 'utf8')
        }
    })

    //this initializes a shared firebase instance for all the tests.
    await initiatilizeFirebaseInstance()

    // we want to clear all test data before each full test run. (not per test, but per `yarn test`. Per test, can cause one test to clear another's in-use data)
    await testEnv.clearFirestore()

    // Create a new Facility to add HealthProfessionals to
    const createFacilityRequest = {
        query: createFacilityMutation,
        variables: {
            input: generateRandomCreateFacilityInput()
        }
    } as gqlMutation<CreateFacilityInput>

    const createFacilityResult = await request(gqlApiUrl).post('/').send(createFacilityRequest)

    //should not have errors
    const errors = createFacilityResult.body?.errors

    if (errors) {
        expect(JSON.stringify(errors)).toBeUndefined()
    }

    const facility = await createFacilityResult.body.data.createFacility as Facility
    const facilityId = facility.id

    sharedFacilityIds.push(facilityId)
})

afterAll(async () => {
    // stop the server
    await server.stop()
})
