import { type ApolloFastifyContextFunction } from '@as-integrations/fastify'
import { FastifyReply, type FastifyRequest } from 'fastify'
import { logger } from './logger.js'
import jwt from 'jsonwebtoken'
import { envVariables } from '../utils/environmentVariables.js'

// ---------------------------------------------------------------
// DISCLAIMER: this is all temporary until we get auth0 integrated
// ---------------------------------------------------------------

export interface AuthContext {
    authToken: string;
    isAuthenticated: boolean;
    isAdmin: boolean;
    response: FastifyReply;
}

export const initializeAuth = async () => {
    logger.debug('🔓 Initializing Auth system...')
    logger.debug('🔐 Initialized Auth system')
}

export function hasAdminRole(isAuthenticated: boolean): boolean {
    return isAuthenticated
}

export const buildAuthContext: ApolloFastifyContextFunction<AuthContext> = (request, response): Promise<AuthContext> => {
    return new Promise((resolve) => {
        const jwtToken = getAuthJwtToken(request)
        const isAuthenticatedUser = isAuthenticated(jwtToken ?? '')
        const isAdmin = hasAdminRole(isAuthenticatedUser)

        const authContext = {
            authToken: jwtToken ?? '',
            isAuthenticated: isAuthenticatedUser,
            isAdmin,
            response: response
        } satisfies AuthContext
        resolve(authContext)
    })
}

function isAuthenticated(authJwtToken: string): boolean {
    const skipAuth = envVariables.isTestingEnvironment() || envVariables.isLocal()

    if (skipAuth) {
        logger.debug(`skipping auth due to testing environment or local environment`)
        return true
    }

    if (!authJwtToken) {
        return false
    }

    try {
        const jwtData = jwt.verify(authJwtToken, envVariables.authSupertokensAPIKey())
        console.log(`jwtData: ${JSON.stringify(jwtData)}`)
        return true
    } catch (error) {
        console.log(`failed parsing auth token`)
        return false
    }
}

function getAuthJwtToken(request: FastifyRequest): string | undefined {
    const cookieValue = request.cookies['authorization']
    console.log(`auth cookie: ${cookieValue}`)

    return cookieValue
}
