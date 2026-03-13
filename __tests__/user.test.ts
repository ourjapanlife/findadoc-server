import { expect, describe, test } from 'vitest'
import request from 'supertest'
import { gqlApiUrl } from './testSetup.test.js'
import { CreateUserInput, UpdateUserInput, User } from '../src/typeDefs/gqlTypes.js'
import { gqlMutation, gqlRequest } from '../utils/gqlTool.js'

describe('createUser', () => {
    test('can create a User and search it by id', async () => {
        const newUserInput: CreateUserInput = {
            displayName: 'user test display name',
            profilePicUrl: '/profile-pic'
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

describe('updateUser', () => {
    test('can update a User and verify changed fields are updated and untouched fields are unchanged', async () => {
        const newUserInput: CreateUserInput = {
            displayName: 'original display name',
            profilePicUrl: '/original-pic'
        }

        const createUserMutationRequest = {
            query: createUserMutation,
            variables: {
                input: newUserInput
            }
        } as gqlMutation<CreateUserInput>

        const createUserResult = await request(gqlApiUrl).post('').send(createUserMutationRequest)

        const createErrors = createUserResult.body?.errors

        if (createErrors) {
            expect(JSON.stringify(createErrors)).toBeUndefined()
        }

        const createdUser = createUserResult.body.data.createUser as User

        const updateInput: UpdateUserInput = {
            displayName: 'updated display name'
        }

        const updateUserMutationRequest = {
            query: updateUserMutation,
            variables: {
                id: createdUser.id,
                input: updateInput
            }
        } as gqlMutation<{ id: string, input: UpdateUserInput }>

        const updateUserResult = await request(gqlApiUrl).post('').send(updateUserMutationRequest)

        // should not have errors
        expect(updateUserResult.body?.errors).toBeUndefined()

        const updatedUser = updateUserResult.body.data.updateUser as User

        // changed field should match the update input
        expect(updatedUser.displayName).toEqual(updateInput.displayName)

        // untouched field should be unchanged from the original
        expect(updatedUser.profilePicUrl).toEqual(newUserInput.profilePicUrl)

        // system fields should be present
        expect(updatedUser.id).toEqual(createdUser.id)
        expect(updatedUser.createdDate).toEqual(createdUser.createdDate)
        expect(updatedUser.updatedDate).toBeDefined()
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

const updateUserMutation = `mutation test_updateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
        id
        createdDate
        updatedDate
        displayName
        profilePicUrl
    }
}`

