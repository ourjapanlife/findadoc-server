import { expect, describe, test } from 'vitest'
import request from 'supertest'
import { gqlApiUrl } from './testSetup.test.js'
import { CreateUserInput, User, CreateReservationInput, Reservation, ReservationStatus } from '../src/typeDefs/gqlTypes.js'
import { gqlMutation, gqlRequest } from '../utils/gqlTool.js'

describe('create reservation', () => {
    test('can create a reservation and search it by id', async () => {
        // create a user 
        const newUserInput: CreateUserInput = {
            displayName: 'rez_test_user',
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
        const createUserErrors = createUserResult.body?.errors
        
        if (createUserErrors) {
            expect(JSON.stringify(createUserErrors)).toBeUndefined()
        }

        const createdUser =
                    createUserResult.body.data.createUser as User

        // create a reservation with createdUser
        const newRezInput:CreateReservationInput = {
            userId: createdUser.id
        }

        const createRezMutationRequest = {
            query: createRezMutation,
            variables: {
                input: newRezInput
            }
        } as gqlMutation<CreateReservationInput>

        const createRezResult = await request(gqlApiUrl).post('').send(createRezMutationRequest)

        //should not have errors
        const createRezErrors = createRezResult.body?.errors
        
        if (createRezErrors) {
            expect(JSON.stringify(createRezErrors)).toBeUndefined()
        }

        const createdRez = createRezResult.body.data.createReservation as Reservation

        const getRezByIdRequest = {
            query: getRezByIdQuery,
            variables: {
                id: createdRez.id
            }
        } as gqlRequest
                
        const searchResult = await request(gqlApiUrl).post('').send(getRezByIdRequest)   
                
        //should not have errors
        expect(searchResult.body?.errors).toBeUndefined()
                
        const searchedRez = searchResult.body.data.user as Reservation
        const originalInputValues = createRezMutationRequest.variables.input

        //validate the created Reservation exists and has an id
        expect(searchedRez).toBeDefined()
        expect(searchedRez.id).toBeDefined()
        //the searched user id should be the same as the original input
        expect(searchedRez.userId).toEqual(originalInputValues.userId)
        // the reservation status should be booked
        expect(searchedRez.status).toEqual(ReservationStatus.Booked)
    }) 
})

export const createRezMutation = `mutation test_createRez($input: CreateUserInput!) {
    createReservation(input: $input) {
        id
        userId
        createdDate
        updatedDate
        status
    }
}`

const getRezByIdQuery = `query test_getRezById($id: ID!) {
    reservation(id: $id) {
        id
        userId
        createdDate
        updatedDate
        status
    }
}`

export const createUserMutation = `mutation test_createUser($input: CreateUserInput!) {
    createUser(input: $input) {
        id
        createdDate
        updatedDate
        displayName
        profilePicUrl
    }
}`
