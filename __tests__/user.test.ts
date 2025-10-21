import { expect, describe, test } from 'vitest'
import request from 'supertest'
import { gqlApiUrl } from './testSetup.test.js'
import { CreateUserInput, User } from '../src/typeDefs/gqlTypes.js'
import { gqlMutation, gqlRequest } from '../utils/gqlTool.js'

describe('createUser', () => {
    test('can create a User and search it by id', async () => {
        const newUserInput: CreateUserInput = {
            displayName: 'user test display name',
            profilePicUrl: 'user test profile-pic'
        }

        const createUserMutationRequest = {
            query: createUserMutation,
            variables: {
                input: newUserInput
            }
        } as gqlMutation<CreateUserInput>

        const createUserResult = await request(gqlApiUrl).post('').send(createUserMutationRequest)
        
        //should not have errors
        const errors = createUserResult.body?.errors
        
        if (errors) {
            expect(JSON.stringify(errors)).toBeUndefined()
        }

        const createdUser =
                    createUserResult.body.data.createUser as User
        
        const getUserByIdRequest = {
            query: getUserByIdQuery,
            variables: {
                id: createdUser.id
            }
        } as gqlRequest
        
        const searchResult = await request(gqlApiUrl).post('').send(getUserByIdRequest)   
        
        //should not have errors
        expect(searchResult.body?.errors).toBeUndefined()
        
        const searchedUser = searchResult.body.data.user as User
        const originalInputValues = createUserMutationRequest.variables.input

        //validate the created User has the same values as the original
        expect(searchedUser).toBeDefined()
        expect(searchedUser.id).toBeDefined()
        expect(searchedUser.createdDate).toBeDefined()
        expect(searchedUser.updatedDate).toBeDefined()
        expect(searchedUser.displayName).toEqual(originalInputValues.displayName)
        expect(searchedUser.profilePicUrl).toEqual(originalInputValues.profilePicUrl)
    })
})

export const createUserMutation = `mutation test_createUser($input: CreateUserInput!) {
    createUser(input: $input) {
        id
        createdDate
        updatedDate
        displayName
        profilePicUrl
    }
}`

const getUserByIdQuery = `query test_getUserById($id: ID!) {
    user(id: $id) {
        id
        createdDate
        updatedDate
        displayName
        profilePicUrl
    }
}`

