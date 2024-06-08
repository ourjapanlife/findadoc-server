import * as gqlTypes from '../typeDefs/gqlTypes.js'
import { ErrorCode, Result } from '../result.js'
import { dbInstance } from '../firebaseDb.js'
import { logger } from '../logger.js'
import { envVariables } from '../../utils/environmentVariables.js'


/**
 * Login method. It will return a cookie if authenticated for the user to use in subsequent requests to the API
 * @param loginInput 
 * @returns A simple success boolean for now.
 */
export async function login(loginInput: gqlTypes.LoginInput): Promise<Result<gqlTypes.LoginResult>> {
    try {
        console.log(`Authenticating user: ${loginInput.username} with password: ${loginInput.password} and twofactorkey: ${loginInput.twofactorkey}`)
        console.log(`auth test: ${envVariables.authUsername()}, ${envVariables.authPassword()}, ${envVariables.authTwoFactor()}`)
        // authenticate the user
        const isAuthenticated = loginInput.username === envVariables.authUsername()
            && loginInput.password === envVariables.authPassword()
            && loginInput.twofactorkey === envVariables.authTwoFactor()

        console.log(`isAuthenticated: ${isAuthenticated}`)
        if (!isAuthenticated) {
            logger.error(`ERROR: A failed login attempt: ${JSON.stringify(loginInput)}`)
            return {
                data: {
                    success: false
                } as gqlTypes.LoginResult,
                hasErrors: true,
                errors: [{
                    field: 'login',
                    errorCode: ErrorCode.UNAUTHENTICATED,
                    httpStatus: 401
                }]
            }
        }

        // if authenticated, we'll return a cookie
        logger.info(`\LOGIN: Successfully logged in user: ${loginInput.username}`)
        return {
            data: {
                success: true
            },
            hasErrors: false
        }
    } catch (error) {
        logger.error(`ERROR: Error logging in: ${error}`)

        return {
            data: {
                success: false
            } as gqlTypes.LoginResult,
            hasErrors: true,
            errors: [{
                field: 'login',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}
