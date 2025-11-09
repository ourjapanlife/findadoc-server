
import request from 'supertest'
import { expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import { gqlMutation } from '../utils/gqlTool.js'
import { CreateFacilityInput, Facility } from '../src/typeDefs/gqlTypes.js'
import { generateRandomCreateFacilityInput } from '../src/fakeData/fakeFacilities.js'
import { createFacilityMutation } from './facilities.test.js'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { createApolloFastifyServer } from '../src/server.js'
import { initializeLogger, logger } from '../src/logger.js'
import { initializeSupabaseClient } from '../src/supabaseClient.js'
// import { createTestUser, deleteTestUser } from './auth.test.js'

// These ids can be used in any of the tests so they don't have to recreate the same data. 
export const sharedFacilityIds = [] as string[]
// This is the url of the graphql api. All supertest requests should be sent to this url.
export let serverUrl: string
export let gqlApiUrl: string

//TODO: we want to share this authenticated user across all the tests. (we need to share cookies or Jwt)
// let sharedTestUserId = ''

beforeAll(async () => {
    // This enables testing mode in the app. 
    // Primarily used for bypassing authentication and authorization checks in the api
    process.env.TEST_ENABLED = 'true'
    const testPort = 0

    //this initializes a shared firebase instance and supabase instance for all the tests.
    initializeLogger()
    await initializeSupabaseClient()
    serverUrl = await createApolloFastifyServer(testPort)
    gqlApiUrl = `${serverUrl}/`

    //this sets up the firebase test environment
    await initializeTestEnvironment({
        projectId: process.env.FIRESTORE_PROJECT_ID,
        firestore: {
            rules: fs.readFileSync('./firestore.rules', 'utf8')
        }
    })

    //let's create a logged in user for the tests
    // const { testUserId } = await createTestUser()
    // sharedTestUserId = testUserId

    // Create a new Facility to add HealthProfessionals to
    const createFacilityRequest = {
        query: createFacilityMutation,
        variables: {
            input: generateRandomCreateFacilityInput()
        }
    } as gqlMutation<CreateFacilityInput>

    const createFacilityResult = await request(gqlApiUrl).post('').send(createFacilityRequest)

    //should not have errors
    const errors = createFacilityResult.body?.errors

    if (errors) {
        logger.error(JSON.stringify(errors))
        expect(JSON.stringify(errors)).toBeUndefined()
    }

    const facility = await createFacilityResult.body.data.createFacility as Facility
    const facilityId = facility.id

    sharedFacilityIds.push(facilityId)
})

afterAll(async () => {
    //clean up the user
    // const result = await deleteTestUser(sharedTestUserId)
    // expect(result).toBeTruthy()
})
