import { expect } from '@jest/globals'
import resolvers from '../src/resolvers'
import loadSchema from '../src/schema'
import request from 'supertest'
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { initiatilizeFirebaseInstance } from '../src/firebaseDb'
import { initializeTestEnvironment, RulesTestEnvironment} from '@firebase/rules-unit-testing'
import fs from 'fs'

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
            languageCode_iso639_3
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
                    languageCode_iso639_3: 'en',
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
    let testEnv: RulesTestEnvironment

    const server = new ApolloServer({
        typeDefs: loadSchema(),
        resolvers
    })

    beforeAll(async () => {
        ({ url } = await startStandaloneServer(server, {listen: { port: 0 }}))
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
              }`,
            variables: {
                input: {
                    googleMapsUrl: 'http://new.com',
                    healthcareProfessionalName: 'some NEW name',
                    spokenLanguages: [
                        {
                            languageCode_iso639_3: 'en',
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

        // Get the submission query data
        const searchResult = await request(url).post('/').send(submissionQuery)

        // Compare the data returned in the response to the updated fields that were sent
        const submissionResponse = searchResult.body.data.updateSubmission
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
    let testEnv: RulesTestEnvironment

    const server = new ApolloServer({
        typeDefs: loadSchema(),
        resolvers
    })

    beforeAll(async () => {
        ({ url } = await startStandaloneServer(server, {listen: { port: 0 }}))
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
        // Create a new Submission
        const newSubmission = await request(url).post('/').send(queryData)

        // Destructure newSubmission
        const createdSubmissionData = newSubmission.body.data.createSubmission
        
        // Get the ID of the new Submission
        const submissionId = createdSubmissionData.id
        
        // Query to get the Submission by id
        const submissionQuery = {
            query: `query Query($submissionId: ID!) {
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
              }`,
            variables: {
                submissionId: submissionId
            }
        }

        // Get the submission by id query data
        const searchResult = await request(url).post('/').send(submissionQuery)

        // Compare the data returned in the response to the updated fields that were sent
        const submissionResponse = searchResult.body.data.submission
    
        expect(submissionResponse.id).toBe(submissionId)
        expect(submissionResponse.googleMapsUrl).toBe(createdSubmissionData.googleMapsUrl)
        expect(submissionResponse.healthcareProfessionalName).toBe(createdSubmissionData.healthcareProfessionalName)
        expect(submissionResponse.spokenLanguages).toEqual(createdSubmissionData.spokenLanguages)
        expect(submissionResponse.isApproved).toBe(createdSubmissionData.isApproved)
        expect(submissionResponse.isUnderReview).toBe(createdSubmissionData.isUnderReview)
        expect(submissionResponse.isRejected).toBe(createdSubmissionData.isRejected)
    })

    it('failing: returns an error when submission does not exist', async () => {
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
              }`,
            variables: {
                submissionId: submissionId
            }
        }

        // Get error data
        const searchData = await request(url).post('/').send(submissionQuery)

        // Compare the data returned in the response to the updated fields that were sent
        const submissionErrorResponse = searchData.body

        expect(submissionErrorResponse.errors[0].message).toBe('Error: Submission was not found.')
        expect(submissionErrorResponse.errors[0].extensions.code).toBe('NOT_FOUND')
        expect(searchData.status).toBe(404)
        expect(submissionErrorResponse.data.submission).toEqual(null)
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
        ({ url } = await startStandaloneServer(server, {listen: { port: 0 }}))
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

    it('get submissions using the language filter', async () => {
        // Create a new Submission
        const newSubmission = await request(url).post('/').send(queryData)

        // Destructure newSubmission result data 
        const createdSubmissionData = newSubmission.body.data.createSubmission

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
                    languageCode_iso639_3
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
                            languageCode_iso639_3: 'en',
                            nameEn: 'English',
                            nameJa: '英語',
                            nameNative: 'English'
                        }
                    ]
                }
            }
        }

        // Get the submissions query data
        const searchResult = await request(url).post('/').send(submissionQuery)

        // Compare the data returned in the response to the createdSubmission
        const resultData = searchResult.body.data.submissions[0]
        
        expect(resultData.id).toBe(createdSubmissionData.id)
        expect(resultData.googleMapsUrl).toBe(createdSubmissionData.googleMapsUrl)
        expect(resultData.createdDate).toBe(createdSubmissionData.createdDate)
        expect(resultData.healthcareProfessionalName)
            .toBe(createdSubmissionData.healthcareProfessionalName)
        expect(resultData.isApproved).toBe(createdSubmissionData.isApproved)
        expect(resultData.isRejected).toBe(createdSubmissionData.isRejected)
        expect(resultData.isUnderReview).toBe(createdSubmissionData.isUnderReview)
        expect(resultData.spokenLanguages).toStrictEqual(createdSubmissionData.spokenLanguages)
    })

    it('get submissions using the googleMapUrl filter', async () => {
        // Create a new Submission
        const newSubmission = await request(url).post('/').send(queryData)

        // Destructure newSubmission result data
        const createdSubmissionData = newSubmission.body.data.createSubmission

        // Get googleUrl of newSubmission
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
                    languageCode_iso639_3
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

        const searchResult = await request(url).post('/').send(submissionQuery)

        // Compare the data returned in the response to the createSubmission
        const submissionResponse = searchResult.body.data.submissions[0]

        expect(submissionResponse.id).toBe(createdSubmissionData.id)
        expect(submissionResponse.googleMapsUrl).toBe(createdSubmissionData.googleMapsUrl)
        expect(submissionResponse.createdDate).toBe(createdSubmissionData.createdDate)
        expect(submissionResponse.healthcareProfessionalName)
            .toBe(createdSubmissionData.healthcareProfessionalName)
        expect(submissionResponse.isApproved).toBe(createdSubmissionData.isApproved)
        expect(submissionResponse.isRejected).toBe(createdSubmissionData.isRejected)
        expect(submissionResponse.isUnderReview).toBe(createdSubmissionData.isUnderReview)
        expect(submissionResponse.spokenLanguages).toStrictEqual(createdSubmissionData.spokenLanguages)
    })

    it('get submissions using the createDate filter', async () => {
        // Create a new Submission
        const newSubmission = await request(url).post('/').send(queryData)
        
        // Destructure newSubmission result data
        const createdSubmissionData = newSubmission.body.data.createSubmission

        // Get createDate 
        const newSubmissionCreateDate = createdSubmissionData.createDate

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
                    languageCode_iso639_3
                    nameEn
                    nameJa
                    nameNative
                  }
                  updatedDate
                }
              }`,
            variables: {
                filters: {
                    createdDate: newSubmissionCreateDate
                }
            }
        }

        // Get the submissions query data
        const searchResult = await request(url).post('/').send(submissionQuery)

        // Compare the data returned in the response to the createdSubmissionsData
        const resultData = searchResult.body.data.submissions[0]
        
        expect(resultData.id).toBe(createdSubmissionData.id)
        expect(resultData.googleMapsUrl).toBe(createdSubmissionData.googleMapsUrl)
        expect(resultData.createdDate).toBe(createdSubmissionData.createdDate)
        expect(resultData.healthcareProfessionalName).toBe(createdSubmissionData.healthcareProfessionalName)
        expect(resultData.isApproved).toBe(createdSubmissionData.isApproved)
        expect(resultData.isRejected).toBe(createdSubmissionData.isRejected)
        expect(resultData.isUnderReview).toBe(createdSubmissionData.isUnderReview)
        expect(resultData.spokenLanguages).toStrictEqual(createdSubmissionData.spokenLanguages)
    })

    it('get submissions using multiple filters combining isApproved, isRejected and underReview', 
       async () => {
           // In this test beside testing the filters I want to test if it excepts multiple filters
           
           // Create a new Submission
           const newSubmission = await request(url).post('/').send(queryData)

           // Destructure newSubmission result data
           const createdSubmissionData = newSubmission.body.data.createSubmission

           // Get isApproved, isRejected, isUnderReview of createSubmission
           const isApprovedNewSubmission = createdSubmissionData.isApproved
           const isRejectedNewSubmission = createdSubmissionData.isRejected
           const isUnderReviewNewSubmission = createdSubmissionData.isUnderReview

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
                    languageCode_iso639_3
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

           //Get the submissions query data
           const searchResult = await request(url).post('/').send(submissionQuery)
        
           // Compare the data returned in the response to the createSubmission
           const resultData = searchResult.body.data.submissions[0]
        
           expect(resultData.id).toBe(createdSubmissionData.id)
           expect(resultData.googleMapsUrl).toBe(createdSubmissionData.googleMapsUrl)
           expect(resultData.createdDate).toBe(createdSubmissionData.createdDate)
           expect(resultData.healthcareProfessionalName).toBe(createdSubmissionData.healthcareProfessionalName)
           expect(resultData.isApproved).toBe(createdSubmissionData.isApproved)
           expect(resultData.isRejected).toBe(createdSubmissionData.isRejected)
           expect(resultData.isUnderReview).toBe(createdSubmissionData.isUnderReview)
           expect(resultData.spokenLanguages).toStrictEqual(createdSubmissionData.spokenLanguages)
       })

    it('get all the submissions without filters', async () => {
        // Create two new submissons to be able to see that we get 2 submissions back
        const newSubmissionOne = await request(url).post('/').send(queryData)
        const newSubmissionTwo = await request(url).post('/').send(queryData)
 
        // Destructure newSubmission result data 
        const createdSubmissionOneData = newSubmissionOne.body.data.createSubmission
        const createdSubmissionTwoData = newSubmissionTwo.body.data.createSubmission

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
                languageCode_iso639_3
                nameEn
                nameJa
                nameNative
              }
              updatedDate
            }
          }`
        }

        // Get the query data
        const searchResult = await request(url).post('/').send(submissionQuery)
    
        // Get all the submissions data
        const allSubmissionsData = searchResult.body.data.submissions
        
        expect(allSubmissionsData.length).toBe(2)
        expect(allSubmissionsData[1].id).toBe(createdSubmissionOneData.id)
        expect(allSubmissionsData[0].id).toBe(createdSubmissionTwoData.id)
    })
})
