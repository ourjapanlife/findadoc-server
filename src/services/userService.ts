import * as gqlTypes from '../typeDefs/gqlTypes.js'
import { ErrorCode, Result } from '../result.js'
import { logger } from '../logger.js'

// temporarily using in-memory database for testing user service before using Supabase
const users: Array<gqlTypes.User> = []

/**
 * Gets a user from the database that matches on the id.
 * @param id A string that matches the id of the User.
 * @returns A User object.
 */
export async function getUserById(id: string)
    : Promise<Result<gqlTypes.User>> {
    try {
        const selectedUser = users.find(u => u.id === id)

        if (!selectedUser) {
            throw new Error(`No user found with id: ${id}`)
        }
        return {
            data: selectedUser,
            hasErrors: false
        }
    } catch (error) {
        logger.error(`ERROR: Error getting user by id: ${error}`)

        return {
            data: {} as gqlTypes.User,
            hasErrors: true,
            errors: [{
                field: 'getUserById',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

/**
 * Creates a User.
 * @param input the new User object
 * @returns the newly created User so you don't have to query it after
 */
export async function createUser(
    input: gqlTypes.CreateUserInput
): Promise<Result<gqlTypes.User>> {
    try {
        const newCreatedDate = new Date().toISOString()
        const newUpdatedDate = new Date().toISOString()
        const newIdNum = users.length + 1
        const newId = String(newIdNum)

        const createdUserResult:gqlTypes.User = {
            createdDate: newCreatedDate,
            id: newId,
            updatedDate: newUpdatedDate,
            displayName: input.displayName,
            profilePicUrl: input.profilePicUrl
        } 

        users.push(createdUserResult)
        return {
            data: createdUserResult,
            hasErrors: false
        }
    } catch (error) {
        logger.error(`ERROR: Error creating user: ${error}`)

        return {
            data: {} as gqlTypes.User,
            hasErrors: true,
            errors: [{
                field: 'createUser',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

/**
 * Updates a User.
 * @param input the id of the user and the fields to update
 * @returns the updated User so you don't have to query it after
 */
export async function updateUser(
    userId: string,
    fieldsToUpdate: gqlTypes.UpdateUserInput
): Promise<Result<gqlTypes.User>> {
    try {
        // check if user exists and get the array index in the database
        const userArrayIndex = users.findIndex(u => u.id === userId)

        if (userArrayIndex === -1) {
            throw new Error('No user exists with the provided id')
        }

        // update the user using the array index
        users[userArrayIndex] = {
            createdDate: users[userArrayIndex].createdDate,
            id: users[userArrayIndex].id,
            updatedDate: new Date().toISOString(),
            displayName: fieldsToUpdate.displayName !== undefined ? fieldsToUpdate.displayName
                : users[userArrayIndex].displayName,
            profilePicUrl: fieldsToUpdate.profilePicUrl !== undefined ? fieldsToUpdate.profilePicUrl
                : users[userArrayIndex].profilePicUrl
        }

        // return the updated user
        return {
            data: users[userArrayIndex],
            hasErrors: false
        } 
    } catch (error) {
        logger.error(`ERROR: Error creating user: ${error}`)

        return {
            data: {} as gqlTypes.User,
            hasErrors: true,
            errors: [{
                field: 'createUser',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

