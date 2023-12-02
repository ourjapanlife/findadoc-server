import request from 'supertest'
import { expect, describe, test } from 'vitest'
import { gqlApiUrl, serverUrl } from './testSetup.test.js'
import { searchSubmissionsQuery } from './submissions.test.js'
import { Submission, SubmissionSearchFilters } from '../src/typeDefs/gqlTypes.js'
import { gqlRequest } from '../utils/gqlTool.js'

describe('auth', () => {
    test('can login and access secure routes', async () => {
        const requestData = {
            formFields: [{
                id: 'email',
                value: 'test@findadoc.com'
            }, {
                id: 'password',
                value: 'findadoc123'
            }]
        }
        const authSignupResult = await request(serverUrl).post('/auth/signup')
            .set('rid', 'thirdpartyemailpassword')
            .set('st-auth-mode', 'cookie')
            .set('Content-Type', 'application/json')
            .send(requestData)

        console.log(JSON.stringify(authSignupResult))

        expect(authSignupResult).toBeDefined()
        expect(authSignupResult.body).toBeDefined()

        //a successful auth will have cookies
        const cookies = authSignupResult.headers['set-cookie'] as string[]

        cookies.forEach(cookie => {
            expect(cookie).toBeDefined()
            const hasAuthCookie = cookie.includes('sAccessToken') || cookie.includes('sRefreshToken')
            
            expect(hasAuthCookie).toBeTruthy()
        })

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
