import { expect } from '@jest/globals'
import request from 'supertest'
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing'
import fs from 'fs'
import resolvers from '../src/resolvers.js'
import loadSchema from '../src/schema.js'
import { initiatilizeFirebaseInstance } from '../src/firebaseDb.js'
import { generateRandomCreateSubmissionInput, generateRandomUpdateSubmissionInput } from '../src/fakeData/submissions.js'
import { CreateSubmissionInput, Submission, SubmissionSearchFilters } from '../src/typeDefs/gqlTypes.js'
import { Error, ErrorCode } from '../src/result.js'
import { generateSpokenLanguages } from '../src/fakeData/fakeHealthcareProfessionals.js'
import { gqlRequest } from '../utils/gqlTool.js'

describe('createSubmission', () => {
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

    it('creates a new Submission', async () => {
        const createSubmissionRequest = {
            query: createSubmissionMutation,
            variables: {
                input: generateRandomCreateSubmissionInput()
            }
        } satisfies gqlRequest
        // send request to create a new Submission
        const response = await request(url).post('/').send(createSubmissionRequest)

        //should not have errors
        expect(response.body.extensions?.errors).toBeUndefined()

        const originalValues = createSubmissionRequest.variables.input
        const newSubmission = response.body.data.createSubmission as Submission

        // Query to get the Submission by id
        const getSubmissionByIdRequest = {
            query: getSubmissionByIdQuery,
            variables: {
                id: newSubmission.id
            }
        } satisfies gqlRequest

        // Get the submission by id query data
        const searchResult = await request(url).post('/').send(getSubmissionByIdRequest)

        //should not have errors
        expect(searchResult.body.extensions?.errors).toBeUndefined()

        const foundSubmissions = searchResult.body.data.submission as Submission

        expect(foundSubmissions).toBeDefined()
        expect(foundSubmissions.id).toBeDefined()
        expect(foundSubmissions.healthcareProfessionalName).toBe(originalValues.healthcareProfessionalName)
        expect(foundSubmissions.googleMapsUrl).toBe(originalValues.googleMapsUrl)
        expect(foundSubmissions.isApproved).toBe(false)
        expect(foundSubmissions.isRejected).toBe(false)
        expect(foundSubmissions.isUnderReview).toBe(false)
        expect(foundSubmissions.spokenLanguages).toEqual(originalValues.spokenLanguages)
    })
})

describe('updateSubmission', () => {
    let url: string
    let testEnv: RulesTestEnvironment

    const server = new ApolloServer({
        typeDefs: loadSchema(),
        resolvers
    })

    beforeAll(async () => {
        ({ url } = await startStandaloneServer(server, { listen: { port: 0 } }))
        testEnv = await initializeTestEnvironment({
            projectId: process.env.FIRESTORE_PROJECT_ID,
            firestore: {
                rules: fs.readFileSync('./firestore.rules', 'utf8')
            }
        })
    })

    beforeEach(async () => {
        await testEnv.clearFirestore()
    })

    afterAll(async () => {
        await server?.stop()
    })

    it('updates a Submission with the fields included in the input', async () => {
        const createSubmissionRequest = {
            query: createSubmissionMutation,
            variables: {
                input: generateRandomCreateSubmissionInput()
            }
        } satisfies gqlRequest

        // Create a new Submission
        const newSubmissionResult = await request(url).post('/').send(createSubmissionRequest)

        //should not have errors
        expect(newSubmissionResult.body.extensions?.errors).toBeUndefined()

        // Get the ID of the new Submission
        const newSubmission = newSubmissionResult.body.data.createSubmission as Submission

        // Mutation to update the Submission
        const updateSubmissionRequest = {
            query: updateSubmissionMutation,
            variables: {
                id: newSubmission.id,
                input: generateRandomUpdateSubmissionInput({ isRejected: true, isApproved: false })
            }
        } satisfies gqlRequest

        // Update the submission
        const updateSubmissionResult = await request(url).post('/').send(updateSubmissionRequest)

        //should not have errors
        expect(updateSubmissionResult.body.extensions?.errors).toBeUndefined()

        // Compare the data returned in the response to the updated fields that were sent
        const updatedSubmission = updateSubmissionResult.body.data.updateSubmission as Submission
        const originalValues = updateSubmissionRequest.variables.input

        expect(updatedSubmission.id).toBe(newSubmission.id)
        expect(updatedSubmission.googleMapsUrl).toBe(originalValues.googleMapsUrl)
        expect(updatedSubmission.healthcareProfessionalName).toBe(originalValues.healthcareProfessionalName)
        expect(updatedSubmission.spokenLanguages).toEqual(originalValues.spokenLanguages)
        expect(updatedSubmission.isApproved).toBe(originalValues.isApproved)
        expect(updatedSubmission.isUnderReview).toBe(originalValues.isUnderReview)
        expect(updatedSubmission.isRejected).toBe(originalValues.isRejected)
    })
})

describe('getSubmissionById', () => {
    let url: string
    let testEnv: RulesTestEnvironment

    const server = new ApolloServer({
        typeDefs: loadSchema(),
        resolvers
    })

    beforeAll(async () => {
        ({ url } = await startStandaloneServer(server, { listen: { port: 0 } }))
        testEnv = await initializeTestEnvironment({
            projectId: process.env.FIRESTORE_PROJECT_ID,
            firestore: {
                rules: fs.readFileSync('./firestore.rules', 'utf8')
            }
        })
    })

    beforeEach(async () => {
        await testEnv.clearFirestore()
    })

    afterAll(async () => {
        await server?.stop()
    })

    it('get the submission that matches the id', async () => {
        const createSubmissionRequest = {
            query: createSubmissionMutation,
            variables: {
                input: generateRandomCreateSubmissionInput()
            }
        } satisfies gqlRequest

        // Create a new Submission
        const newSubmissionResult = await request(url).post('/').send(createSubmissionRequest)

        //should not have errors
        expect(newSubmissionResult.body.extensions?.errors).toBeUndefined()

        // Get the ID of the new Submission
        const newSubmission = newSubmissionResult.body.data.createSubmission as Submission

        // Compare the data returned in the response to the updated fields that were sent
        const originalValues = createSubmissionRequest.variables.input

        expect(newSubmission.googleMapsUrl).toBe(originalValues.googleMapsUrl)
        expect(newSubmission.healthcareProfessionalName).toBe(originalValues.healthcareProfessionalName)
        expect(newSubmission.spokenLanguages).toEqual(originalValues.spokenLanguages)
        expect(newSubmission.isApproved).toBeFalsy()
        expect(newSubmission.isUnderReview).toBeFalsy()
        expect(newSubmission.isRejected).toBeFalsy()
    })

    it('failing: returns an error when submission does not exist', async () => {
        // Create a non existing uuid
        const submissionId = 'this1doesntexist'

        // Query to get the Submission by non existing uuid
        const getSubmissionByIdRequest = {
            query: getSubmissionByIdQuery,
            variables: {
                id: submissionId
            }
        } satisfies gqlRequest

        // Get the submission by id
        const getByIdResults = await request(url).post('/').send(getSubmissionByIdRequest)
 
        expect(getByIdResults).toBe(1)
        expect(getByIdResults.body.errors.extensions.errors).toBeDefined()
 
        const submissionErrors = getByIdResults.body.extensions.errors as Error[]
        
        //We should have 1 error
        expect(submissionErrors.length).toBe(1)
        expect(submissionErrors[0].field).toBe('id')
        expect(submissionErrors[0].errorCode).toBe(ErrorCode.NOT_FOUND)
        expect(submissionErrors[0].httpStatus).toBe(404)

        //there should be no result
        expect(getByIdResults.body.data.submission).toBeUndefined()
    })
})

describe('searchSubmissions', () => {
    let url: string
    let testEnv: RulesTestEnvironment

    const server = new ApolloServer({
        typeDefs: loadSchema(),
        resolvers
    })

    beforeAll(async () => {
        ({ url } = await startStandaloneServer(server, { listen: { port: 0 } }))
        testEnv = await initializeTestEnvironment({
            projectId: process.env.FIRESTORE_PROJECT_ID,
            firestore: {
                rules: fs.readFileSync('./firestore.rules', 'utf8')
            }
        })
    })

    beforeEach(async () => {
        await testEnv.clearFirestore()
    })

    afterAll(async () => {
        await server?.stop()
    })

    it('search submissions using the language filter', async () => {
        const createSubmissionRequest = {
            query: createSubmissionMutation,
            variables: {
                input: {
                    ...generateRandomCreateSubmissionInput(),
                    //we want to guarantee english is a spoken language
                    spokenLanguages: generateSpokenLanguages({ onlyEnglish: true, count: 1 })
                } satisfies CreateSubmissionInput
            }
        } satisfies gqlRequest

        // Create a new Submission
        const newSubmissionResult = await request(url).post('/').send(createSubmissionRequest)

        //should not have errors
        expect(newSubmissionResult.body.extensions?.errors).toBeUndefined()

        // Query to get the Submission using language filter
        const searchSubmissionsRequest = {
            query: searchSubmissionsQuery,
            variables: {
                filters: {
                    spokenLanguages: createSubmissionRequest.variables.input.spokenLanguages
                }
            }
        } satisfies gqlRequest

        checkSearchResults(url, searchSubmissionsRequest, createSubmissionRequest.variables.input)
    })

    it('search submissions using the googleMapUrl filter', async () => {
        const createSubmissionRequest = {
            query: createSubmissionMutation,
            variables: {
                input: generateRandomCreateSubmissionInput() satisfies CreateSubmissionInput
            }
        } satisfies gqlRequest

        // Create a new Submission
        const createSubmissionResult = await request(url).post('/').send(createSubmissionRequest)

        //should not have errors
        expect(createSubmissionResult.body.extensions?.errors).toBeUndefined()

        const originalGoogleMapsUrl = createSubmissionRequest.variables.input.googleMapsUrl

        // Get googleUrl of newSubmission

        // Query to get the Submission using googleMapUrl filter
        const searchSubmissionsRequest = {
            query: searchSubmissionsQuery,
            variables: {
                filters: {
                    googleMapsUrl: originalGoogleMapsUrl
                }
            }
        }

        checkSearchResults(url, searchSubmissionsRequest, createSubmissionRequest.variables.input)
    })

    it('get submissions using the createdDate filter', async () => {
        const createSubmissionRequest = {
            query: createSubmissionMutation,
            variables: {
                input: generateRandomCreateSubmissionInput() satisfies CreateSubmissionInput
            }
        } satisfies gqlRequest

        // Create a new Submission
        const createSubmissionResult = await request(url).post('/').send(createSubmissionRequest)

        //should not have errors
        expect(createSubmissionResult.body.extensions?.errors).toBeUndefined()
        
        // Get the ID of the new Submission
        const newSubmission = createSubmissionResult.body.data.createSubmission as Submission
        
        const isValidDate = newSubmission.createdDate && !!Date.parse(newSubmission.createdDate)

        expect(isValidDate).toBe(true)

        // Query to get the Submission by createdDate
        const searchSubmissionsRequest = {
            query: searchSubmissionsQuery,
            variables: {
                filters: {
                    createdDate: newSubmission.createdDate
                } satisfies SubmissionSearchFilters
            }
        } satisfies gqlRequest

        checkSearchResults(url, searchSubmissionsRequest, createSubmissionRequest.variables.input)
    })

    it('get submissions using multiple filters combining healthcareProfessionalName, spokenLanguages, and isUnderReview', async () => {
        const createSubmissionRequest = {
            query: createSubmissionMutation,
            variables: {
                input: generateRandomCreateSubmissionInput() satisfies CreateSubmissionInput
            }
        } satisfies gqlRequest

        // Create a new Submission
        const createSubmissionResult = await request(url).post('/').send(createSubmissionRequest)

        //should not have errors
        expect(createSubmissionResult.body.extensions?.errors).toBeUndefined()

        // Query to get the Submission using 3 filters
        const searchSubmissionsRequest = {
            query: searchSubmissionsQuery,
            variables: {
                filters: {
                    healthcareProfessionalName: createSubmissionRequest.variables.input.healthcareProfessionalName,
                    spokenLanguages: createSubmissionRequest.variables.input.spokenLanguages,
                    isUnderReview: false
                } satisfies SubmissionSearchFilters
            }
        } satisfies gqlRequest

        checkSearchResults(url, searchSubmissionsRequest, createSubmissionRequest.variables.input)
    })

    it('get all the submissions without filters', async () => {
        // Create two new submissons to be able to see that we get 2 submissions back
        const createSubmissionRequest = {
            query: createSubmissionMutation,
            variables: {
                input: {
                    ...generateRandomCreateSubmissionInput()
                } satisfies CreateSubmissionInput
            }
        } satisfies gqlRequest

        // Create a new Submission
        const createSubmissionResult1 = await request(url).post('/').send(createSubmissionRequest)
        const createSubmissionResult2 = await request(url).post('/').send(createSubmissionRequest)
        const createdSubmission1 = createSubmissionResult1.body.data.createSubmission as Submission
        const createdSubmission2 = createSubmissionResult2.body.data.createSubmission as Submission

        //should not have errors
        expect(createSubmissionResult1.body.extensions?.errors).toBeUndefined()
        expect(createSubmissionResult2.body.extensions?.errors).toBeUndefined()

        // Query to get all (both) submissions
        const searchSubmissionsRequest = {
            query: searchSubmissionsQuery,
            variables: {
                filters: {} satisfies SubmissionSearchFilters
            }
        } as gqlRequest

        //Get the submissions query data
        const searchResult = await request(url).post('/').send(searchSubmissionsRequest)

        //should not have errors
        expect(searchResult.body.extensions?.errors).toBeUndefined()

        const searchedSubmissions = searchResult.body.data.submissions as Submission[]

        //should not be empty
        expect(searchedSubmissions).toBeDefined()
        expect(searchedSubmissions.length).toBeGreaterThanOrEqual(2)

        const foundFirstSubmission = searchedSubmissions.find(submission => submission.id === createdSubmission1.id)
        const foundSecondSubmission = searchedSubmissions.find(submission => submission.id === createdSubmission2.id)

        // we should find both submissions
        expect(foundFirstSubmission).toBeTruthy()
        expect(foundSecondSubmission).toBeTruthy()
    })
})

async function checkSearchResults(url: string,
    searchSubmissionsRequest: gqlRequest, originalValues: CreateSubmissionInput) {
    //Get the submissions query data
    const searchResult = await request(url).post('/').send(searchSubmissionsRequest)

    //should not have errors
    expect(searchResult.body.extensions?.errors).toBeUndefined()

    const searchedSubmissions = searchResult.body.data.submissions as Submission[]

    expect(searchedSubmissions).toBe(1)

    //should have at least 1 result
    expect(searchedSubmissions).toBeDefined()
    expect(searchedSubmissions.length).toBeGreaterThanOrEqual(1)

    const firstSubmission = searchedSubmissions[0]

    //Compare the data returned in the response to the createdSubmission
    expect(firstSubmission.googleMapsUrl).toBe(originalValues.googleMapsUrl)
    expect(!!Date.parse(firstSubmission.createdDate)).toBe(true)
    expect(firstSubmission.healthcareProfessionalName)
        .toBe(originalValues.healthcareProfessionalName)
    expect(firstSubmission.isApproved).toBe(false)
    expect(firstSubmission.isRejected).toBe(false)
    expect(firstSubmission.isUnderReview).toBe(false)
    expect(firstSubmission.spokenLanguages).toStrictEqual(originalValues.spokenLanguages)
}

const getSubmissionByIdQuery = `query test_getSubmissionById($id: ID!) {
    submission(id: $id) {
      id
      googleMapsUrl
      healthcareProfessionalName
      spokenLanguages
      isUnderReview
      isApproved
      isRejected
      createdDate
      updatedDate
    }
}`

const searchSubmissionsQuery = /* GraphQL */ `query test_searchSubmissions($filters: SubmissionSearchFilters!) {
    submissionszzzzzzz(filters: $filters) {
        idzzzzzzzz
        googleMapsUrl
        healthcareProfessionalName
        isApproved
        isRejected
        isUnderReview
        spokenLanguages
        createdDate
        updatedDate
    }
}`

const createSubmissionMutation = `mutation test_createSubmission($input: CreateSubmissionInput!) {
    createSubmission(input: $input) {
        id
        googleMapsUrl
        healthcareProfessionalName
        spokenLanguages
        isApproved
        isRejected
        isUnderReview
        createdDate
        updatedDate
    }
}`

const updateSubmissionMutation = `mutation test_updateSubmission($id: ID!, $input: UpdateSubmissionInput!) {
    updateSubmission(id: $id, input: $input) {
        id
        googleMapsUrl
        healthcareProfessionalName
        spokenLanguages
        facility {
            id
        }
        healthcareProfessionals {
            id
        }
        isUnderReview
        isApproved
        isRejected
        createdDate
        updatedDate
    }
}`
