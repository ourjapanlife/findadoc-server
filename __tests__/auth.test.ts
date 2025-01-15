import request from 'supertest'
import { expect, describe, test } from 'vitest'
import { gqlApiUrl } from './testSetup.test.js'
import { searchSubmissionsQuery } from './submissions.test.js'
import { Submission, SubmissionSearchFilters } from '../src/typeDefs/gqlTypes.js'
import { gqlRequest } from '../utils/gqlTool.js'

describe('auth', () => {
    test('can login and access secure routes', async () => {
        // TODO add auth0 test here

        // test a secure endpoint as a logged in user
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
        
        expect(searchedSubmissions).toBeDefined()
    })
})
