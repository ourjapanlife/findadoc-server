import * as gqlTypes from '../typeDefs/gqlTypes.js'
// import * as dbSchema from '../typeDefs/dbSchema.js'
import { ErrorCode, Result } from '../result.js'
import { logger } from '../logger.js'

// temporarilty using in-memory database for testing user service
const users: Array<gqlTypes.User> = []

/**
 * Gets a user from the database that matches on the id.
 * @param id A string that matches the id of the Firestore Document for the professional.
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
 * - if you add any facilityids, it will update the corresponding facility by adding this healthcare professional id to their list
 * - business logic: a healthcare professional must be associated with at least one facility (otherwise no one can find them)
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

