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

const getSubmissionByIdQuery = {
    query:
    `query GetSubmission($id: ID!) {
        submission(id: $id) {
          id
          createdDate
          updatedDate
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
        }
      }`,
    variables: {
        id: ''
    }
}

describe('getSubmissionById', () => {
    let url: string
    let newSubmissionId: string

    const server = new ApolloServer({
        typeDefs: loadSchema(),
        resolvers
    })

    beforeAll(async () => {
        ({ url } = await startStandaloneServer(server, { listen: {port: 0}}))
        await initiatilizeFirebaseInstance()
    })

    afterAll(async () => {
        await server?.stop()
    })

    it('fetches a submission with the matching ID', async () => {
        const response = await request(url).post('/').send(queryData)

        newSubmissionId = response.body.data.createSubmission.id
        getSubmissionByIdQuery.variables.id = newSubmissionId

        const fetchResponse = await request(url).post('/').send(getSubmissionByIdQuery)
        const fetchedSubmissionData = fetchResponse.body.data.submission

        const createdSubmission = queryData.variables.input

        console.log('fetchResponse.body:', fetchResponse.body)

        expect(fetchedSubmissionData.id).toBe(newSubmissionId)
        expect(fetchedSubmissionData.googleMapsUrl).toBe(createdSubmission.googleMapsUrl)
        expect(fetchedSubmissionData.healthcareProfessionalName).toBe(createdSubmission.healthcareProfessionalName)
        expect(fetchedSubmissionData.spokenLanguages).toEqual(createdSubmission.spokenLanguages)
        expect(typeof fetchedSubmissionData.isUnderReview).toBe('boolean')
        expect(typeof fetchedSubmissionData.isApproved).toBe('boolean')
        expect(typeof fetchedSubmissionData.isRejected).toBe('boolean')
    })
})