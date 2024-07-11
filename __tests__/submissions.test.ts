import { expect, describe, test } from 'vitest'
import request from 'supertest'
import { generateRandomCreateSubmissionInput, generateRandomUpdateSubmissionInput } from '../src/fakeData/fakeSubmissions.js'
import { CreateSubmissionInput, Submission, SubmissionSearchFilters } from '../src/typeDefs/gqlTypes.js'
import { Error, ErrorCode } from '../src/result.js'
import { generateSpokenLanguages } from '../src/fakeData/fakeHealthcareProfessionals.js'
import { gqlMutation, gqlRequest } from '../utils/gqlTool.js'
import { gqlApiUrl } from './testSetup.test.js'
import { logger } from '../src/logger.js'

describe('createSubmission', () => {
    test('creates a new Submission', async () => {
        const createSubmissionRequest = {
            query: createSubmissionMutation,
            variables: {
                input: generateRandomCreateSubmissionInput()
            }
        } satisfies gqlRequest
        // send request to create a new Submission
        const response = await request(gqlApiUrl).post('').send(createSubmissionRequest)

        //should not have errors
        const errors = response.body.errors

        if (errors) {
            logger.error(`errors: ${JSON.stringify(errors)}`)
            expect(JSON.stringify(errors)).toBeUndefined()
        }

        const originalInputValues = createSubmissionRequest.variables.input
        const newSubmission = response.body.data.createSubmission as Submission

        // Query to get the Submission by id
        const getSubmissionByIdRequest = {
            query: getSubmissionByIdQuery,
            variables: {
                id: newSubmission.id
            }
        } satisfies gqlRequest

        // Get the submission by id query data
        const searchResult = await request(gqlApiUrl).post('').send(getSubmissionByIdRequest)

        //should not have errors
        const searchErrors = searchResult.body?.errors

        if (searchErrors) {
            logger.error(`errors: ${JSON.stringify(searchErrors)}`)
            expect(searchResult.body?.errors).toBeUndefined()
        }
        const foundSubmissions = searchResult.body.data.submission as Submission

        expect(foundSubmissions).toBeDefined()
        expect(foundSubmissions.id).toBeDefined()
        expect(foundSubmissions.healthcareProfessionalName).toBe(originalInputValues.healthcareProfessionalName)
        expect(foundSubmissions.googleMapsUrl).toBe(originalInputValues.googleMapsUrl)
        expect(foundSubmissions.isApproved).toBe(false)
        expect(foundSubmissions.isRejected).toBe(false)
        expect(foundSubmissions.isUnderReview).toBe(false)
        expect(foundSubmissions.spokenLanguages).toEqual(originalInputValues.spokenLanguages)
        expect(foundSubmissions.notes).toEqual(originalInputValues.notes)
    })
})

describe('updateSubmission', () => {
    test('updates a Submission with the fields included in the input', async () => {
        const createSubmissionRequest = {
            query: createSubmissionMutation,
            variables: {
                input: generateRandomCreateSubmissionInput()
            }
        } satisfies gqlRequest

        // Create a new Submission
        const newSubmissionResult = await request(gqlApiUrl).post('').send(createSubmissionRequest)

        //should not have errors
        expect(newSubmissionResult.body.errors).toBeUndefined()

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
        const updateSubmissionResult = await request(gqlApiUrl).post('').send(updateSubmissionRequest)

        //should not have errors
        expect(updateSubmissionResult.body?.errors).toBeUndefined()

        // Compare the data returned in the response to the updated fields that were sent
        const updatedSubmission = updateSubmissionResult.body.data.updateSubmission as Submission
        const originalInputValues = updateSubmissionRequest.variables.input

        expect(updatedSubmission.id).toBe(newSubmission.id)
        expect(updatedSubmission.googleMapsUrl).toBe(originalInputValues.googleMapsUrl)
        expect(updatedSubmission.healthcareProfessionalName).toBe(originalInputValues.healthcareProfessionalName)
        expect(updatedSubmission.spokenLanguages).toEqual(originalInputValues.spokenLanguages)
        expect(updatedSubmission.isApproved).toBe(originalInputValues.isApproved)
        expect(updatedSubmission.isUnderReview).toBe(originalInputValues.isUnderReview)
        expect(updatedSubmission.isRejected).toBe(originalInputValues.isRejected)
    })
})

describe('getSubmissionById', () => {
    test('get the submission that matches the id', async () => {
        const createSubmissionRequest = {
            query: createSubmissionMutation,
            variables: {
                input: generateRandomCreateSubmissionInput()
            }
        } satisfies gqlRequest

        // Create a new Submission
        const newSubmissionResult = await request(gqlApiUrl).post('').send(createSubmissionRequest)

        //should not have errors
        const errors = newSubmissionResult.body?.errors

        if (errors) {
            expect(JSON.stringify(errors)).toBeUndefined()
        }

        // Get the ID of the new Submission
        const newSubmission = newSubmissionResult.body.data.createSubmission as Submission

        // Compare the data returned in the response to the updated fields that were sent
        const originalInputValues = createSubmissionRequest.variables.input

        expect(newSubmission.googleMapsUrl).toBe(originalInputValues.googleMapsUrl)
        expect(newSubmission.healthcareProfessionalName).toBe(originalInputValues.healthcareProfessionalName)
        expect(newSubmission.spokenLanguages).toEqual(originalInputValues.spokenLanguages)
        expect(newSubmission.isApproved).toBeFalsy()
        expect(newSubmission.isUnderReview).toBeFalsy()
        expect(newSubmission.isRejected).toBeFalsy()
    })

    test('failing: returns an error when submission does not exist', async () => {
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
        const getByIdResults = await request(gqlApiUrl).post('').send(getSubmissionByIdRequest)

        const gqlErrors = getByIdResults.body.errors

        expect(gqlErrors).toBeDefined()
        expect(gqlErrors.length).toBe(1)

        const submissionErrors = gqlErrors[0].extensions.errors as Error[]

        //We should have 1 error
        expect(submissionErrors.length).toBe(1)
        expect(submissionErrors[0].field).toBe('id')
        expect(submissionErrors[0].errorCode).toBe(ErrorCode.NOT_FOUND)
        expect(submissionErrors[0].httpStatus).toBe(404)

        //there should be no result
        expect(getByIdResults.body.data.submission).toBeFalsy()
    })
})

describe('searchSubmissions', () => {
    test('search submissions using the language filter', async () => {
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
        const newSubmissionResult = await request(gqlApiUrl).post('').send(createSubmissionRequest)

        //should not have errors
        const errors = newSubmissionResult.body?.errors

        if (errors) {
            expect(JSON.stringify(errors)).toBeUndefined()
        }

        // Query to get the Submission using language filter
        const searchSubmissionsRequest = {
            query: searchSubmissionsQuery,
            variables: {
                filters: {
                    spokenLanguages: createSubmissionRequest.variables.input.spokenLanguages
                }
            }
        } satisfies gqlRequest

        await checkSearchResults(searchSubmissionsRequest, createSubmissionRequest.variables.input)
    })

    test('search submissions using the googleMapsUrl filter', async () => {
        const createSubmissionRequest = {
            query: createSubmissionMutation,
            variables: {
                input: generateRandomCreateSubmissionInput() satisfies CreateSubmissionInput
            }
        } satisfies gqlRequest

        // Create a new Submission
        const createSubmissionResult = await request(gqlApiUrl).post('').send(createSubmissionRequest)

        //should not have errors
        const errors = createSubmissionResult.body?.errors

        if (errors) {
            expect(JSON.stringify(errors)).toBeUndefined()
        }

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

        await checkSearchResults(searchSubmissionsRequest, createSubmissionRequest.variables.input)
    })

    test('get submissions using the createdDate filter', async () => {
        const createSubmissionRequest = {
            query: createSubmissionMutation,
            variables: {
                input: generateRandomCreateSubmissionInput() satisfies CreateSubmissionInput
            }
        } satisfies gqlRequest

        // Create a new Submission
        const createSubmissionResult = await request(gqlApiUrl).post('').send(createSubmissionRequest)

        //should not have errors
        const errors = createSubmissionResult.body?.errors

        if (errors) {
            expect(JSON.stringify(errors)).toBeUndefined()
        }

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

        await checkSearchResults(searchSubmissionsRequest, createSubmissionRequest.variables.input)
    })

    test('get submissions using multiple filters combining healthcareProfessionalName, spokenLanguages, and isUnderReview', async () => {
        const createSubmissionRequest = {
            query: createSubmissionMutation,
            variables: {
                input: generateRandomCreateSubmissionInput() satisfies CreateSubmissionInput
            }
        } satisfies gqlRequest

        // Create a new Submission
        const createSubmissionResult = await request(gqlApiUrl).post('').send(createSubmissionRequest)

        //should not have errors
        const errors = createSubmissionResult.body?.errors

        if (errors) {
            expect(JSON.stringify(errors)).toBeUndefined()
        }

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

        await checkSearchResults(searchSubmissionsRequest, createSubmissionRequest.variables.input)
    })

    test('get all the submissions without filters', async () => {
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
        const createSubmissionResult1 = await request(gqlApiUrl).post('').send(createSubmissionRequest)
        const createSubmissionResult2 = await request(gqlApiUrl).post('').send(createSubmissionRequest)
        const createdSubmission1 = createSubmissionResult1.body.data.createSubmission as Submission
        const createdSubmission2 = createSubmissionResult2.body.data.createSubmission as Submission

        //should not have errors
        const errors1 = createSubmissionResult1.body?.errors
        const errors2 = createSubmissionResult1.body?.errors

        if (errors1 || errors2) {
            logger.error(`errors from first: ${JSON.stringify(errors1)}. errors from second: ${JSON.stringify(errors2)}`)
            expect(errors1).toBeUndefined()
            expect(errors2).toBeUndefined()
        }

        // Query to get all (both) submissions
        const searchSubmissionsRequest = {
            query: searchSubmissionsQuery,
            variables: {
                filters: {} satisfies SubmissionSearchFilters
            }
        } as gqlRequest

        //Get the submissions query data
        const searchResult = await request(gqlApiUrl).post('').send(searchSubmissionsRequest)

        //should not have errors
        expect(searchResult.body.errors).toBeUndefined()

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

describe('deleteSubmission', () => {
    test('deletes a new submission', async () => {
        // -- Create a new submission that we plan to delete --
        const createRequest = {
            query: createSubmissionMutation,
            variables: {
                input: generateRandomCreateSubmissionInput() satisfies CreateSubmissionInput
            }
        } as gqlMutation<CreateSubmissionInput>

        const createResult = await request(gqlApiUrl).post('').send(createRequest)

        //should not have errors
        const createErrors = createResult.body?.errors

        if (createErrors) {
            logger.error(JSON.stringify(createErrors))
            expect(createErrors).toBeUndefined()
        }

        const originalInputValues = createRequest.variables.input
        const newSubmission = createResult.body.data.createSubmission as Submission
        const newSubmissionId = newSubmission.id

        const getByIdRequest = {
            query: getSubmissionByIdQuery,
            variables: {
                id: newSubmission.id
            }
        } as gqlRequest

        // -- Query the submission by id --
        const validQueryResult = await request(gqlApiUrl).post('').send(getByIdRequest)

        //should not have errors
        const queryErrors = createResult.body?.errors

        if (queryErrors) {
            logger.error(JSON.stringify(queryErrors))
            expect(queryErrors).toBeUndefined()
        }

        const searchedSubmission = validQueryResult.body.data.submission as Submission

        // We want to ensure the submission was created before we delete it. 
        expect(searchedSubmission.spokenLanguages).toEqual(originalInputValues.spokenLanguages)
        expect(searchedSubmission.id).toBeDefined()

        const deleteRequest = {
            query: deleteSubmissionMutation,
            variables: {
                id: newSubmissionId
            }
        } as gqlRequest

        // -- Let's try to delete the submission! --
        const deleteResult = await request(gqlApiUrl).post('').send(deleteRequest)

        //should not have errors
        const deleteErrors = deleteResult.body?.errors

        if (deleteErrors) {
            logger.error(JSON.stringify(deleteErrors))
            expect(deleteErrors).toBeUndefined()
        }

        // we should have a success response
        expect(deleteResult.body.data.deleteSubmission.isSuccessful).toBe(true)

        // -- Let's try to fetch the submission again to confirm it's deleted --
        const missingQueryResult = await request(gqlApiUrl).post('').send(getByIdRequest)

        //should have an error that it doesn't exist
        const validQueryGqlErrors = missingQueryResult.body?.errors
        const validQueryErrors = validQueryGqlErrors[0].extensions.errors as Error[]

        logger.error(JSON.stringify(validQueryErrors))
        expect(validQueryErrors.length).toBe(1)
        expect(validQueryErrors[0]).toBeDefined()
        expect(validQueryErrors[0].field).toBe('id')
        expect(validQueryErrors[0].errorCode).toBe(ErrorCode.NOT_FOUND)

        // -- Let's try to delete the submission again! We should receive an error now that it doesn't exist --
        const deleteAgainResult = await request(gqlApiUrl).post('').send(deleteRequest)

        //should have an error that it doesn't exist
        const deleteAgainErrors = deleteAgainResult.body?.errors[0].extensions.errors as Error[]

        logger.error(JSON.stringify(deleteAgainErrors))
        expect(deleteAgainResult.body?.deleteSubmission).toBeFalsy()
        expect(deleteAgainErrors.length).toBe(1)
        expect(deleteAgainErrors[0]).toBeDefined()
        expect(deleteAgainErrors[0].field).toBe('deleteSubmission')
        expect(deleteAgainErrors[0].errorCode).toBe(ErrorCode.INVALID_ID)
    })
})

async function checkSearchResults(searchSubmissionsRequest: gqlRequest, originalInputValues: CreateSubmissionInput) {
    //Get the submissions query data
    const searchResult = await request(gqlApiUrl).post('').send(searchSubmissionsRequest)

    //should not have errors
    const errors = searchResult.body.errors

    if (errors && errors.length > 0) {
        logger.error(`test errors: ${JSON.stringify(errors)}`)
        expect(errors).toBeUndefined()
    }

    const searchedSubmissions = searchResult.body.data.submissions as Submission[]

    //should have at least 1 result
    expect(searchedSubmissions).toBeDefined()
    expect(searchedSubmissions.length).toBeGreaterThanOrEqual(1)

    const firstSubmission = searchedSubmissions.find(submission =>
        submission.googleMapsUrl === originalInputValues.googleMapsUrl)

    if (!firstSubmission) {
        logger.error(`firstSubmission undefined: ${JSON.stringify(searchedSubmissions)}`)
        expect(firstSubmission).toBeDefined()
        return
    }

    //Compare the data returned in the response to the createdSubmission
    expect(firstSubmission.googleMapsUrl).toBe(originalInputValues.googleMapsUrl)
    expect(!!Date.parse(firstSubmission.createdDate)).toBe(true)
    expect(firstSubmission.healthcareProfessionalName)
        .toBe(originalInputValues.healthcareProfessionalName)
    expect(firstSubmission.isApproved).toBe(false)
    expect(firstSubmission.isRejected).toBe(false)
    expect(firstSubmission.isUnderReview).toBe(false)
    expect(firstSubmission.spokenLanguages).toStrictEqual(originalInputValues.spokenLanguages)
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

export const searchSubmissionsQuery = /* GraphQL */ `query test_searchSubmissions($filters: SubmissionSearchFilters!) {
    submissions(filters: $filters) {
        id
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

const deleteSubmissionMutation = `mutation test_deleteSubmission($id: ID!) {
    deleteSubmission(id: $id) {
        isSuccessful
    }
}`
