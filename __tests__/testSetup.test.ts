
import request from 'supertest'
import { expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import { initiatilizeFirebaseInstance } from '../src/firebaseDb.js'
import { gqlMutation } from '../utils/gqlTool.js'
import { CreateFacilityInput, Facility } from '../src/typeDefs/gqlTypes.js'
import { generateRandomCreateFacilityInput } from '../src/fakeData/fakeFacilities.js'
import { createFacilityMutation } from './facilities.test.js'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { initializeAuth } from '../src/auth.js'
import { createApolloFastifyServer } from '../src/server.js'

// These ids can be used in any of the tests so they don't have to recreate the same data. 
export const sharedFacilityIds = [] as string[]
// This is the url of the graphql api. All supertest requests should be sent to this url.
export let serverUrl: string
export let gqlApiUrl: string
const testPort = 0

beforeAll(async () => {
    //this initializes a shared firebase instance for all the tests.
    await initiatilizeFirebaseInstance()
    await initializeAuth() 
    serverUrl = await createApolloFastifyServer(testPort)
    gqlApiUrl = `${serverUrl}/api`
    
    //this sets up the firebase test environment
    await initializeTestEnvironment({
        projectId: process.env.FIRESTORE_PROJECT_ID,
        firestore: {
            rules: fs.readFileSync('./firestore.rules', 'utf8')
        }
    })

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
        console.log(JSON.stringify(errors))
        expect(JSON.stringify(errors)).toBeUndefined()
    }

    console.log(JSON.stringify(createFacilityResult.body))
    const facility = await createFacilityResult.body.data.createFacility as Facility
    const facilityId = facility.id

    sharedFacilityIds.push(facilityId)
})

afterAll(async () => {

})
