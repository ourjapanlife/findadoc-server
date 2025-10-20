import * as gqlTypes from '../typeDefs/gqlTypes.js'
import { ErrorCode, Result } from '../result.js'
import { logger } from '../logger.js'
import { supabaseClient } from '../supabaseClient.js'

/**
 * Gets a user from the database that matches on the id.
 * @param id A string that matches the id of the User.
 * @returns A User object.
 */
export async function getUserById(id: string)
    : Promise<Result<gqlTypes.User>> {
    try {
        const { data } = await supabaseClient
            .from('user')
            .select('*')
            .eq('id', id) 

        if (!data) {
            throw new Error(`No data found for user with id: ${id}`)
        }

        if (data.length === 0) {
            throw new Error('data array is empty')
        }

        const selectedUserData = data[0]

        const selectedUser:gqlTypes.User = {
            createdDate: selectedUserData.created_date,
            id: selectedUserData.id,
            updatedDate: selectedUserData.updated_date,
            displayName: selectedUserData.display_name,
            profilePicUrl: selectedUserData.profile_pic_url
        }

        return {
            data: selectedUser,
            hasErrors: false
        }
    } catch (error) {
        logger.error(`Error getting user by id: ${error}`)

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
        const userToCreate:gqlTypes.User = {
            createdDate: new Date().toISOString(),
            id: '', //supabase will automatically assign an id upon creation, so will leave this blank
            updatedDate: new Date().toISOString(),
            displayName: input.displayName,
            profilePicUrl: input.profilePicUrl
        }

        const { data } = await supabaseClient
            .from('user')
            // eslint-disable-next-line camelcase
            .insert([{created_date: userToCreate.createdDate,
                // eslint-disable-next-line camelcase
                updated_date: userToCreate.updatedDate,
                // eslint-disable-next-line camelcase
                display_name: userToCreate.displayName,
                // eslint-disable-next-line camelcase
                profile_pic_url: userToCreate.profilePicUrl}
            ])
            .select('*')

        if (!data) {
            throw new Error('No data from create user call')
        }

        if (data.length === 0) {
            throw new Error('data array is empty')
        }

        const createdUserResult:gqlTypes.User = {
            createdDate: data[0].created_date,
            id: data[0].id,
            updatedDate: data[0].updated_date,
            displayName: data[0].display_name,
            profilePicUrl: data[0].profile_pic_url
        }

        return {
            data: createdUserResult,
            hasErrors: false
        }
    } catch (error) {
        logger.error(`Error creating user: ${error}`)

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
    id: string,
    fieldsToUpdate: gqlTypes.UpdateUserInput
): Promise<Result<gqlTypes.User>> {
    try {
        const { data } = await supabaseClient
            .from('user')
            .update({
                // eslint-disable-next-line camelcase
                updated_date: new Date().toISOString(),
                // eslint-disable-next-line camelcase
                display_name: fieldsToUpdate.displayName,
                // eslint-disable-next-line camelcase
                profile_pic_url: fieldsToUpdate.profilePicUrl
            })
            .eq('id', id)
            .select('*')

        if (!data) {
            throw new Error('no data returned from update call')
        }

        const updatedUser:gqlTypes.User = {
            createdDate: data[0].created_date,
            id: data[0].id,
            updatedDate: data[0].updated_date,
            displayName: data[0].display_name,
            profilePicUrl: data[0].profile_pic_url
        }

        return {
            data: updatedUser,
            hasErrors: false
        } 
    } catch (error) {
        logger.error(`Error updating user: ${error}`)

        return {
            data: {} as gqlTypes.User,
            hasErrors: true,
            errors: [{
                field: 'updateUser',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

