import { expect } from '@jest/globals'
import resolvers from '../src/resolvers'
import loadSchema from '../src/schema'
import request from 'supertest'
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { initiatilizeFirebaseInstance } from '../src/firebaseDb'
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing'
import fs from 'fs'
import { generateRandomCreateSubmissionInput, generateRandomUpdateSubmissionInput } from '../src/fakeData/submissions'
import { CreateSubmissionInput, LanguageCode_Iso639_3, Submission, SubmissionSearchFilters } from '../src/typeDefs/gqlTypes'
import { Error, ErrorCode } from '../src/result'
import { generateSpokenLanguage } from '../src/fakeData/healthcareProfessionals'
import { gqlRequest } from '../utils/gqlTool'

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
        expect(response.body.errors).toBeUndefined()

        const originalValues = createSubmissionRequest.variables.input
        const newSubmissionId = response.body.data as string

        // Query to get the Submission by id
        const getSubmissionByIdRequest = {
            query: getSubmissionByIdQuery,
            variables: {
                submissionId: newSubmissionId
            }
        } satisfies gqlRequest

        // Get the submission by id query data
        const searchResult = await request(url).post('/').send(getSubmissionByIdRequest)

        //should not have errors
        expect(searchResult.body.errors).toBeUndefined()

        const foundSubmissions = searchResult.body.data as Submission

        expect(foundSubmissions).not.toBeNull()
        expect(foundSubmissions.googleMapsUrl).toBe(originalValues.googleMapsUrl)
        expect(foundSubmissions.healthcareProfessionalName).toBe(originalValues.healthcareProfessionalName)
        expect(foundSubmissions.isApproved).toBe(false)
        expect(foundSubmissions.isRejected).toBe(false)
        expect(foundSubmissions.isUnderReview).toBe(false)
        expect(foundSubmissions.spokenLanguages).toEqual(originalValues.spokenLanguages)
        expect(foundSubmissions.id).toBeDefined()
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
        expect(newSubmissionResult.body.errors).toBeUndefined()

        // Get the ID of the new Submission
        const newSubmissionId = newSubmissionResult.body.data as string

        // Mutation to update the Submission
        const updateSubmissionRequest = {
            query: updateSubmissionMutation,
            variables: {
                input: generateRandomUpdateSubmissionInput({ isRejected: true, isApproved: false }),
                updateSubmissionId: newSubmissionId
            }
        } satisfies gqlRequest

        // Update the submission
        const updateSubmissionResult = await request(url).post('/').send(updateSubmissionRequest)

        //should not have errors
        expect(updateSubmissionResult.body.errors).toBeUndefined()

        // Query to get the Submission by id
        const getSubmissionByIdRequest = {
            query: getSubmissionByIdQuery,
            variables: {
                submissionId: newSubmissionId
            }
        } satisfies gqlRequest

        // Get the submission by id query data
        const searchResult = await request(url).post('/').send(getSubmissionByIdRequest)

        //should not have errors
        expect(searchResult.body.errors).toBeUndefined()

        // Compare the data returned in the response to the updated fields that were sent
        const updatedSubmission = searchResult.body.data as Submission
        const originalValues = updateSubmissionRequest.variables.input

        expect(updatedSubmission.id).toBe(newSubmissionId)
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
        expect(newSubmissionResult.body.errors).toBeUndefined()

        // Get the ID of the new Submission
        const newSubmissionId = newSubmissionResult.body.data as string

        // Query to get the Submission by id
        const getSubmissionByIdRequest = {
            query: getSubmissionByIdQuery,
            variables: {
                submissionId: newSubmissionId
            }
        } satisfies gqlRequest

        // Get the submission by id query data
        const searchResult = await request(url).post('/').send(getSubmissionByIdRequest)

        //should not have errors
        expect(searchResult.body.errors).toBeUndefined()

        // Compare the data returned in the response to the updated fields that were sent
        const searchedSubmission = searchResult.body.data as Submission
        const originalValues = createSubmissionRequest.variables.input

        expect(searchedSubmission.id).toBe(newSubmissionId)
        expect(searchedSubmission.googleMapsUrl).toBe(originalValues.googleMapsUrl)
        expect(searchedSubmission.healthcareProfessionalName).toBe(originalValues.healthcareProfessionalName)
        expect(searchedSubmission.spokenLanguages).toEqual(originalValues.spokenLanguages)
        expect(searchedSubmission.isApproved).toBe(false)
        expect(searchedSubmission.isUnderReview).toBe(false)
        expect(searchedSubmission.isRejected).toBe(false)
    })

    it('failing: returns an error when submission does not exist', async () => {
        // Create a non existing uuid
        const submissionId = 'this1doesntexist'

        // Query to get the Submission by non existing uuid
        const getSubmissionByIdRequest = {
            query: getSubmissionByIdQuery,
            variables: {
                submissionId: submissionId
            }
        } satisfies gqlRequest

        // Get the submission by id
        const searchResults = await request(url).post('/').send(getSubmissionByIdRequest)
        const submissionErrors = searchResults.body.errors as Error[]

        //We should have 1 error
        expect(submissionErrors.length).toBe(1)
        expect(submissionErrors[0].field).toBe('submissionId')
        expect(submissionErrors[0].errorCode).toBe(ErrorCode.NOT_FOUND)
        expect(submissionErrors[0].httpStatus).toBe(404)

        //there should be no result
        expect(searchResults.body.data).toEqual(null)
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
                    spokenLanguages: [generateSpokenLanguage({ onlyEnglish: true })]
                } satisfies CreateSubmissionInput
            }
        } satisfies gqlRequest

        // Create a new Submission
        const newSubmissionResult = await request(url).post('/').send(createSubmissionRequest)

        //should not have errors
        expect(newSubmissionResult.body.errors).toBeUndefined()

        // Query to get the Submission using language filter
        const searchSubmissionsRequest = {
            query: searchSubmissionsQuery,
            variables: {
                filters: {
                    spokenLanguages: [
                        {
                            languageCode_iso639_3: LanguageCode_Iso639_3.Eng,
                            nameEn: 'English',
                            nameJa: '英語',
                            nameNative: 'English'
                        }
                    ]
                }
            }
        } satisfies gqlRequest

        checkSearchResults(url, searchSubmissionsRequest, createSubmissionRequest.variables.input)
    })

    it('search submissions using the googleMapUrl filter', async () => {
        const createSubmissionRequest = {
            query: createSubmissionMutation,
            variables: {
                input: {
                    ...generateRandomCreateSubmissionInput()
                } satisfies CreateSubmissionInput
            }
        } satisfies gqlRequest

        // Create a new Submission
        const createSubmissionResult = await request(url).post('/').send(createSubmissionRequest)

        //should not have errors
        expect(createSubmissionResult.body.errors).toBeUndefined()

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

    it('get submissions using the createDate filter', async () => {
        const createSubmissionRequest = {
            query: createSubmissionMutation,
            variables: {
                input: {
                    ...generateRandomCreateSubmissionInput()
                } satisfies CreateSubmissionInput
            }
        } satisfies gqlRequest

        // Create a new Submission
        const createSubmissionResult = await request(url).post('/').send(createSubmissionRequest)

        //should not have errors
        expect(createSubmissionResult.body.errors).toBeUndefined()

        // Get the ID of the new Submission
        const newSubmissionId = createSubmissionResult.body.data as string

        // Query to get the Submission by id
        const getSubmissionByIdRequest = {
            query: searchSubmissionsQuery,
            variables: {
                submissionId: newSubmissionId
            }
        } satisfies gqlRequest

        // Get the submission by id query data
        const searchResult = await request(url).post('/').send(getSubmissionByIdRequest)

        //should not have errors
        expect(searchResult.body.errors).toBeUndefined()
        expect(searchResult.body.data.createdDate).not.toBeNull()

        // Query to get the Submission by createdDate
        const searchSubmissionsRequest = {
            query: searchSubmissionsQuery,
            variables: {
                filters: {
                    createdDate: searchResult.body.data.createdDate
                } satisfies SubmissionSearchFilters
            }
        } satisfies gqlRequest

        checkSearchResults(url, searchSubmissionsRequest, createSubmissionRequest.variables.input)
    })

    it('get submissions using multiple filters combining healthcareProfessionalName, spokenLanguages, and isUnderReview', async () => {
        const createSubmissionRequest = {
            query: createSubmissionMutation,
            variables: {
                input: {
                    ...generateRandomCreateSubmissionInput()
                } satisfies CreateSubmissionInput
            }
        } satisfies gqlRequest

        // Create a new Submission
        const createSubmissionResult = await request(url).post('/').send(createSubmissionRequest)

        //should not have errors
        expect(createSubmissionResult.body.errors).toBeUndefined()

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

        //should not have errors
        expect(createSubmissionResult1.body.errors).toBeUndefined()
        expect(createSubmissionResult2.body.errors).toBeUndefined()

        // Query to get all (both) submissions
        const searchSubmissionsRequest = {
            query: searchSubmissionsQuery,
            variables: {
                filters: {} satisfies SubmissionSearchFilters
            }
        }

        //Get the submissions query data
        const searchResult = await request(url).post('/').send(searchSubmissionsRequest)

        //should not have errors
        expect(searchResult.body.errors).toBeUndefined()

        const searchedSubmissions = searchResult.body.data as Submission[]

        //should have at least 1 result
        expect(searchedSubmissions).not.toBeNull()
        expect(searchedSubmissions.length).toBe(2)
    })
})

async function checkSearchResults(url: string,
    searchSubmissionsRequest: gqlRequest, originalValues: CreateSubmissionInput) {
    //Get the submissions query data
    const searchResult = await request(url).post('/').send(searchSubmissionsRequest)

    //should not have errors
    expect(searchResult.body.errors).toBeUndefined()

    const searchedSubmissions = searchResult.body.data

    //should have at least 1 result
    expect(searchedSubmissions).not.toBeNull()
    expect(searchedSubmissions.length).toBe(1)

    //Compare the data returned in the response to the createdSubmission
    expect(searchedSubmissions.googleMapsUrl).toBe(originalValues.googleMapsUrl)
    expect(searchedSubmissions.createdDate).toBe(Date)
    expect(searchedSubmissions.healthcareProfessionalName)
        .toBe(originalValues.healthcareProfessionalName)
    expect(searchedSubmissions.isApproved).toBe(false)
    expect(searchedSubmissions.isRejected).toBe(false)
    expect(searchedSubmissions.isUnderReview).toBe(false)
    expect(searchedSubmissions.spokenLanguages).toStrictEqual(originalValues.spokenLanguages)
}

const getSubmissionByIdQuery = `query Query($submissionId: ID!) {
    submission(id: $submissionId) {
      id
      googleMapsUrl
      healthcareProfessionalName
      spokenLanguages {
        languageCode_iso639_3
        nameJa
        nameEn
        nameNative
      }
      isUnderReview
      isApproved
      isRejected
      createdDate
      updatedDate
    }
}`

const searchSubmissionsQuery = `query Query($filters: SubmissionSearchFilters!) {
    submissions(filters: $filters) {
      googleMapsUrl
      createdDate
      id
      healthcareProfessionalName
      isApproved
      isRejected
      isUnderReview
      spokenLanguages {
        languageCode_iso639_3
        nameEn
        nameJa
        nameNative
      }
      updatedDate
    }
}`

const createSubmissionMutation = `mutation Mutation($input: CreateSubmissionInput!) {
    createSubmission(input: $input) {
        googleMapsUrl
        healthcareProfessionalName
        spokenLanguages {
            languageCode_iso639_3
            nameEn
            nameJa
            nameNative
        }
    }
}`

const updateSubmissionMutation = `mutation Mutation($updateSubmissionId: ID!, $input: UpdateSubmissionInput!) {
    updateSubmission(id: $updateSubmissionId, input: $input) {
      id
      googleMapsUrl
      healthcareProfessionalName
      spokenLanguages {
        languageCode_iso639_3
        nameJa
        nameEn
        nameNative
      }
      facility
      healthcareProfessionals
      isUnderReview
      isApproved
      isRejected
      createdDate
      updatedDate
    }
}`
