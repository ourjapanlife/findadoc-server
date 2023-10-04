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

describe('sereachSubmissions', () => {
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

    it('get submissions using the language filter', async () => {
        // Create a new Submission
        const newSubmission = await request(url).post('/').send(queryData)
    
        // Query to get the Submission using language filter
        const submissionQuery = {
            query: `query Query($filters: SubmissionSearchFilters) {
                submissions(filters: $filters) {
                  googleMapsUrl
                  createdDate
                  id
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
                filters: {
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

        const submission = await request(url).post('/').send(submissionQuery)

        const submissionResponse = submission.body.data.submissions[0]
        
        const createdSubmission = newSubmission.body.data.createSubmission

        expect(submissionResponse.id).toBe(createdSubmission.id)
        expect(submissionResponse.googleMapsUrl).toBe(createdSubmission.googleMapsUrl)
        expect(submissionResponse.createdDate).toBe(createdSubmission.createdDate)
        expect(submissionResponse.healthcareProfessionalName)
            .toBe(createdSubmission.healthcareProfessionalName)
        expect(submissionResponse.isApproved).toBe(createdSubmission.isApproved)
        expect(submissionResponse.isRejected).toBe(createdSubmission.isRejected)
        expect(submissionResponse.isUnderReview).toBe(createdSubmission.isUnderReview)
        expect(submissionResponse.spokenLanguages).toStrictEqual(createdSubmission.spokenLanguages)
    })

    it('get submissions using the googleMapUrl filter', async () => {
        // Create a new Submission
        const newSubmission = await request(url).post('/').send(queryData)

        // get googleUrl of newSubmission
        const googleMapsUrlNewSubmission = newSubmission.body.data.createSubmission.googleMapsUrl
    
        // Query to get the Submission using googleMapUrl filter
        const submissionQuery = {
            query: `query Query($filters: SubmissionSearchFilters) {
                submissions(filters: $filters) {
                  googleMapsUrl
                  createdDate
                  id
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
                filters: {
                    googleMapsUrl: googleMapsUrlNewSubmission
                }
            }
        }

        const submission = await request(url).post('/').send(submissionQuery)

        // Compare the data returned in the response to the createSubmission
        const submissionResponse = submission.body.data.submissions[0]
        
        const createdSubmission = newSubmission.body.data.createSubmission

        expect(submissionResponse.id).toBe(createdSubmission.id)
        expect(submissionResponse.googleMapsUrl).toBe(createdSubmission.googleMapsUrl)
        expect(submissionResponse.createdDate).toBe(createdSubmission.createdDate)
        expect(submissionResponse.healthcareProfessionalName)
            .toBe(createdSubmission.healthcareProfessionalName)
        expect(submissionResponse.isApproved).toBe(createdSubmission.isApproved)
        expect(submissionResponse.isRejected).toBe(createdSubmission.isRejected)
        expect(submissionResponse.isUnderReview).toBe(createdSubmission.isUnderReview)
        expect(submissionResponse.spokenLanguages).toStrictEqual(createdSubmission.spokenLanguages)
    })

    it('get submissions using the createDate filter', async () => {
        // Create a new Submission
        const newSubmission = await request(url).post('/').send(queryData)
        
        // get create date of newSubmission
        const createDateNewSubmission = newSubmission.body.data.createSubmission.createDate

        // Query to get the Submission using createDate filter
        const submissionQuery = {
            query: `query Query($filters: SubmissionSearchFilters) {
                submissions(filters: $filters) {
                  googleMapsUrl
                  createdDate
                  id
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
                filters: {
                    createdDate: createDateNewSubmission
                }
            }
        }

        const submission = await request(url).post('/').send(submissionQuery)

        // Compare the data returned in the response to the created data
        const submissionResponse = submission.body.data.submissions[0]
        
        const createdSubmission = newSubmission.body.data.createSubmission

        expect(submissionResponse.id).toBe(createdSubmission.id)
        expect(submissionResponse.googleMapsUrl).toBe(createdSubmission.googleMapsUrl)
        expect(submissionResponse.createdDate).toBe(createdSubmission.createdDate)
        expect(submissionResponse.healthcareProfessionalName).toBe(createdSubmission.healthcareProfessionalName)
        expect(submissionResponse.isApproved).toBe(createdSubmission.isApproved)
        expect(submissionResponse.isRejected).toBe(createdSubmission.isRejected)
        expect(submissionResponse.isUnderReview).toBe(createdSubmission.isUnderReview)
        expect(submissionResponse.spokenLanguages).toStrictEqual(createdSubmission.spokenLanguages)
    })

    it('get submissions using multiple filters combining isApproved, isRejected and underReview', 
       async () => {
           // In this test beside testing the filters I want to test if it excepts multiple filters

           // Create a new Submission
           const newSubmission = await request(url).post('/').send(queryData)

           // get isApproved, isRejected, isUnderReview of newSubmission
           const isApprovedNewSubmission = newSubmission.body.data.createSubmission.isApproved
           const isRejectedNewSubmission = newSubmission.body.data.createSubmission.isRejected
           const isUnderReviewNewSubmission = newSubmission.body.data.createSubmission.isUnderReview

           // Query to get the Submission using 3 filters
           const submissionQuery = {
               query: `query Query($filters: SubmissionSearchFilters) {
                submissions(filters: $filters) {
                  googleMapsUrl
                  createdDate
                  id
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
                   filters: {
                       isApproved: isApprovedNewSubmission,
                       isRejected: isRejectedNewSubmission,
                       isUnderReview: isUnderReviewNewSubmission
                   }
               }
           }

           const submission = await request(url).post('/').send(submissionQuery)
        
           // Compare the data returned in the response to the createSubmission
           const submissionResponse = submission.body.data.submissions[0]
        
           const createdSubmission = newSubmission.body.data.createSubmission

           expect(submissionResponse.id).toBe(createdSubmission.id)
           expect(submissionResponse.googleMapsUrl).toBe(createdSubmission.googleMapsUrl)
           expect(submissionResponse.createdDate).toBe(createdSubmission.createdDate)
           expect(submissionResponse.healthcareProfessionalName).toBe(createdSubmission.healthcareProfessionalName)
           expect(submissionResponse.isApproved).toBe(createdSubmission.isApproved)
           expect(submissionResponse.isRejected).toBe(createdSubmission.isRejected)
           expect(submissionResponse.isUnderReview).toBe(createdSubmission.isUnderReview)
           expect(submissionResponse.spokenLanguages).toStrictEqual(createdSubmission.spokenLanguages)
       })

    it('get all the submissions without filters', async () => {
        /* I wanted to create two new submissions to test if I got more than 1 submissions back 
        if I want to get all the submissions. But the linting doesn't allow variables that are not used.
        Since we dont' delete our emulator data yet after every test it works fine. In the future when we delete our
        data from the emulator we should create multiple submissions.*/

        // const newSubmissionOne = await request(url).post('/').send(queryData)
        // const newSubmissionTwo = await request(url).post('/').send(queryData)
     
        // Query to get the Submission using googleMapUrl filter
        const submissionQuery = {
            query: `query Query($filters: SubmissionSearchFilters) {
            submissions(filters: $filters) {
              googleMapsUrl
              createdDate
              id
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
          }`
        }

        const submission = await request(url).post('/').send(submissionQuery)
    
        // Compare the data returned in the response with desired length
        const submissionResponse = submission.body.data.submissions

        expect(submissionResponse.length).toBeGreaterThan(1)
    })
})
