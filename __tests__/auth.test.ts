import request from 'supertest'
import { expect, describe, test } from 'vitest'
import UserRoles from 'supertokens-node/recipe/userroles/index.js'
import { deleteUser } from 'supertokens-node'
import { gqlApiUrl, serverUrl } from './testSetup.test.js'
import { searchSubmissionsQuery } from './submissions.test.js'
import { Submission, SubmissionSearchFilters } from '../src/typeDefs/gqlTypes.js'
import { gqlRequest } from '../utils/gqlTool.js'
import { faker } from '@faker-js/faker'

describe('auth', () => {
    test('can login and access secure routes', async () => {
        const { response, testUserId } = await createTestUser()

        //a successful auth will have cookies
        const cookies = response.headers['set-cookie'] as unknown as string[]

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

        //clean up the user
        await deleteUser(testUserId)
    })
})

export async function createTestUser() : Promise<{ response: request.Response, testUserId: string }> {
    const requestData = {
        formFields: [{
            id: 'email',
            value: `testuser_${faker.string.alphanumeric(15)}@findadoc.com`
        }, {
            id: 'password',
            value: `findadoc1${faker.string.alphanumeric(15)}`
        }]
    }
    const authSignupResult = await request(serverUrl).post('/auth/signup')
        .set('rid', 'thirdpartyemailpassword')
        .set('st-auth-mode', 'cookie')
        .send(requestData)

    expect(authSignupResult).toBeDefined()
    expect(authSignupResult.body).toBeDefined()

    const userId = authSignupResult.body.user.id

    //let's make the user an admin
    const response = await UserRoles.addRoleToUser('public', userId, 'admin')

    expect(response).toBeDefined()
    expect(response.status === 'OK').toBeTruthy()

    const testUserId = authSignupResult.body.user.id
    
    expect(testUserId).toBeDefined()

    return { response: authSignupResult, testUserId }
}

export async function deleteTestUser(userId: string) : Promise<boolean> {
    const result = await deleteUser(userId)
    
    return result.status === 'OK'
}
