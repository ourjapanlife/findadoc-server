/* eslint-disable camelcase */
import * as gqlTypes from '../typeDefs/gqlTypes.js'
import { ErrorCode, Result } from '../result.js'
import { logger } from '../logger.js'

export async function updateUserAccount(
  input: gqlTypes.UpdateUserAccountInput
//   userId: string
): Promise<Result<gqlTypes.UserAccountInfo>> {
    const updateUserAccountResult: Result<gqlTypes.UserAccountInfo> = {
        data: {} as gqlTypes.UserAccountInfo,
        hasErrors: false,
        errors: []
    }

    try {
        const validationResults = validateUpdateUserAccountInput(input)

        if (validationResults.hasErrors) { return validationResults as Result<gqlTypes.UserAccountInfo> }

        updateUserAccountResult.data = {
            ...updateUserAccountResult.data,
            userMetadata: input.userMetadata
        }

        return updateUserAccountResult
    } catch (err: unknown) {
        logger.error('Error updating user account', err)
        return {
            data: {} as gqlTypes.UserAccountInfo,
            hasErrors: true,
            errors: [
                {
                    field: 'userMetadata',
                    errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                    httpStatus: 500
                }
            ]
        }
    }
}
        
export function validateUpdateUserAccountInput(
  input: gqlTypes.InputMaybe<gqlTypes.UpdateUserAccountInput> | undefined
): Result<gqlTypes.UserAccountInfo> {
    const results: Result<gqlTypes.UserAccountInfo> = {
        data: {} as gqlTypes.UserAccountInfo,
        hasErrors: false,
        errors: []
    }

    if (!input?.userMetadata) { return results }

    const inputUserMetadataValues = Object.values(input.userMetadata)

    const inputUserMetadataValuesExist = inputUserMetadataValues.some(value => !!value)

    if (!inputUserMetadataValuesExist) {
        results.hasErrors = true
        results.errors!.push({
            field: 'userMetadata',
            errorCode: ErrorCode.INVALID_INPUT,
            httpStatus: 400
        })
    }

    if (
        input.userMetadata.displayName &&
        input.userMetadata.displayName.length > 48
    ) {
        results.hasErrors = true
        results.errors!.push({
            field: 'displayName',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    return results
}
