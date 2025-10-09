import * as gqlTypes from '../typeDefs/gqlTypes.js'
import { ErrorCode, Result } from '../result.js'
import { logger } from '../logger.js'
import { supabase } from '../supabaseClient.js'

/**
 * Gets a user from the database that matches on the id.
 * @param id A string that matches the id of the User.
 * @returns A User object.
 */
export async function getUserById(id: string)
    : Promise<Result<gqlTypes.User>> {
    try {
        const { data } = await supabase
            .from('user')
            .select('*')
            .eq('id', id) 

        if (!data) {
            throw new Error(`No user found with id: ${id}`)
        }

        const selectedUser:gqlTypes.User = {
            createdDate: data[0].created_date,
            id: data[0].id,
            updatedDate: data[0].updated_date,
            displayName: data[0].display_name,
            profilePicUrl: data[0].profile_pic_url
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
        const { data } = await supabase
            .from('user')
            // eslint-disable-next-line camelcase
            .insert([{created_date: new Date().toISOString(),
                // eslint-disable-next-line camelcase
                updated_date: new Date().toISOString(),
                // eslint-disable-next-line camelcase
                display_name: input.displayName,
                // eslint-disable-next-line camelcase
                profile_pic_url: input.profilePicUrl}
            ])
            .select('*')

        if (!data) {
            throw new Error('No data from create user call')
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
        const { data } = await supabase
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

