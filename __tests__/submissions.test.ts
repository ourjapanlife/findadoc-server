import { expect } from '@jest/globals'
import resolvers from '../src/resolvers'
import loadSchema from '../src/schema'
import request from 'supertest'
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { initiatilizeFirebaseInstance } from '../src/firebaseDb'

const queryData = {
    query: `mutation Mutation($input: SubmissionInput) {
        createSubmission(input: $input) {
          id
          googleMapsUrl
          createdDate
          healthcareProfessionalName
          isApproved
          isRejected
          isUnderReview
          spokenLanguages {
            iso639_3
            nameEn
            nameJa
            nameNative
          }
          updatedDate
        }
      }`,
    variables: {
        input: {
            googleMapsUrl: 'http://domain.com',
            healthcareProfessionalName: 'a',
            spokenLanguages: [
                {
                    iso639_3: 'en',
                    nameEn: 'English',
                    nameJa: '英語',
                    nameNative: 'English'
                }
            ]
        }
    }
}

describe('createSubmission', () => {
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
    
    it('creates a new Submission', async () => {
        const response = await request(url).post('/').send(queryData)
        
        const inputData = queryData.variables.input
        const newSubmissionData = response.body.data.createSubmission

        expect(newSubmissionData.googleMapsUrl).toBe(inputData.googleMapsUrl)
        expect(newSubmissionData.healthcareProfessionalName).toBe(inputData.healthcareProfessionalName)
        expect(newSubmissionData.isApproved).toBe(false)
        expect(newSubmissionData.isRejected).toBe(false)
        expect(newSubmissionData.isUnderReview).toBe(false)
        expect(newSubmissionData.spokenLanguages).toEqual(inputData.spokenLanguages)
        expect(newSubmissionData.id).toBeDefined()
    })
})

describe('updateSubmission', () => {
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
    
    it('updates a Submission with the fields included in the input', async () => {
        // Create a new Submission
        const newSubmission = await request(url).post('/').send(queryData)
        
        // Get the ID of the new Submission
        const submissionId = newSubmission.body.data.createSubmission.id

        // Mutation to update the Submission
        const submissionQuery = {
            query: `mutation Mutation($updateSubmissionId: ID!, $input: SubmissionInput) {
                updateSubmission(id: $updateSubmissionId, input: $input) {
                  id
                  googleMapsUrl
                  healthcareProfessionalName
                  spokenLanguages {
                    iso639_3
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
              }`,
            variables: {
                input: {
                    googleMapsUrl: 'http://new.com',
                    healthcareProfessionalName: 'some NEW name',
                    spokenLanguages: [
                        {
                            iso639_3: 'en',
                            nameEn: 'English',
                            nameJa: 'Eigo',
                            nameNative: 'English'
                        }
                    ],
                    isUnderReview: true,
                    isApproved: true,
                    isRejected: true
                },
                updateSubmissionId: submissionId
            }
        }

        const submission = await request(url).post('/').send(submissionQuery)

        // Compare the data returned in the response to the updated fields that were sent
        const submissionResponse = submission.body.data.updateSubmission
        const updatedFields = submissionQuery.variables.input

        expect(submissionResponse.id).toBe(submissionId)
        expect(submissionResponse.googleMapsUrl).toBe(updatedFields.googleMapsUrl)
        expect(submissionResponse.healthcareProfessionalName).toBe(updatedFields.healthcareProfessionalName)
        expect(submissionResponse.spokenLanguages).toEqual(updatedFields.spokenLanguages)
        expect(submissionResponse.isApproved).toBe(updatedFields.isApproved)
        expect(submissionResponse.isUnderReview).toBe(updatedFields.isUnderReview)
        expect(submissionResponse.isRejected).toBe(updatedFields.isRejected)
    })
})

describe('getSubmissionById', () => {
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
    
    it('get the submission that matches the id', async () => {
        // Create a new Submission
        const newSubmission = await request(url).post('/').send(queryData)
        
        // Get the ID of the new Submission
        const submissionId = newSubmission.body.data.createSubmission.id
        
        // Query to get the Submission by id
        const submissionQuery = {
            query: `query Query($submissionId: ID!) {
                submission(id: $submissionId) {
                  id
                  googleMapsUrl
                  healthcareProfessionalName
                  spokenLanguages {
                    iso639_3
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
              }`,
            variables: {
                    submissionId: submissionId
            }
        }

        const submission = await request(url).post('/').send(submissionQuery)

        // Compare the data returned in the response to the updated fields that were sent
        const submissionResponse = submission.body.data.submission

        const createdSubmission = newSubmission.body.data.createSubmission
    
        expect(submissionResponse.id).toBe(submissionId)
        expect(submissionResponse.googleMapsUrl).toBe(createdSubmission.googleMapsUrl)
        expect(submissionResponse.healthcareProfessionalName).toBe(createdSubmission.healthcareProfessionalName)
        expect(submissionResponse.spokenLanguages).toEqual(createdSubmission.spokenLanguages)
        expect(submissionResponse.isApproved).toBe(createdSubmission.isApproved)
        expect(submissionResponse.isUnderReview).toBe(createdSubmission.isUnderReview)
        expect(submissionResponse.isRejected).toBe(createdSubmission.isRejected)
    })

    it('get an error when submission does not exist', async () => {
        // Create a new Submission
        const newSubmission = await request(url).post('/').send(queryData)
        
        // Create a non existing uuid
        const submissionId = 'f34ec7a260e9'
        
        // Query to get the Submission by non existing uuid
        const submissionQuery = {
            query: `query Query($submissionId: ID!) {
                submission(id: $submissionId) {
                  id
                  googleMapsUrl
                  healthcareProfessionalName
                  spokenLanguages {
                    iso639_3
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
              }`,
            variables: {
                    submissionId: submissionId
            }
        }

        const submission = await request(url).post('/').send(submissionQuery)

        // Compare the data returned in the response to the updated fields that were sent
        const submissionErrorResponse = submission.body

        expect(submissionErrorResponse.errors[0].message).toBe('Error: Submission was not found.')
        expect(submissionErrorResponse.errors[0].extensions.code).toBe('NOT_FOUND')
        expect(submission.status).toBe(404)
        expect(submissionErrorResponse.data.submission).toEqual(null)
    })
})
