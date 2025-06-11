import { FastifyInstance, FastifyRequest } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import buildGetJwks from 'get-jwks'

import { logger } from './logger.js'
import { envVariables } from '../utils/environmentVariables.js'
// import { envVariables } from '../utils/environmentVariables.js'

// These are the different roles that a user can have in the system. 
// A role comes with a set of permissions or scopes to save having to define them every time. 
export enum Role {
    Admin = 'Admin',
    Moderator = 'Moderator',
    Dev = 'Dev',
    User = 'User'
}

// These are the different scopes or permissions that are available in the system.
// For example, a user with the `read:facilities` scope can read facilities data.
export enum Scope {
    'read:healthcareprofessionals' = 'read:healthcareprofessionals',
    'write:healthcareprofessionals' = 'write:healthcareprofessionals',
    'delete:healthcareprofessionals' = 'delete:healthcareprofessionals',
    'read:facilities' = 'read:facilities',
    'write:facilities' = 'write:facilities',
    'delete:facilities' = 'delete:facilities',
    'read:submissions' = 'read:submissions',
    'write:submissions' = 'write:submissions',
    'delete:submissions' = 'delete:submissions',
    'read:logs' = 'read:logs',
    'write:logs' = 'write:logs',
    'read:profile' = 'read:profile',
    'write:posts' = 'write:posts',
    'read:users' = 'read:users',
    'write:users' = 'write:users',
    'delete:users' = 'delete:users'
}

// These are the different permissions or "scopes" that are associated with each role.
// For example, an admin might have permissions to read, write, and delete healthcare professionals,
// while a user might only have permission to read their own profile and posts.
// A user can have separate scopes from their roles, so we need to check both.
const roleScopes: Record<Role, Scope[]> = {
    [Role.Admin]: [
        Scope['read:healthcareprofessionals'], Scope['write:healthcareprofessionals'], Scope['delete:healthcareprofessionals'],
        Scope['read:facilities'], Scope['write:facilities'], Scope['delete:facilities'],
        Scope['read:submissions'], Scope['write:submissions'], Scope['delete:submissions'],
        Scope['read:users'], Scope['write:users'], Scope['delete:users'],
        Scope['read:profile'], 
        Scope['write:posts'],
        Scope['read:logs'], Scope['write:logs']
    ],
    [Role.Moderator]: [
        Scope['read:healthcareprofessionals'], Scope['write:healthcareprofessionals'], Scope['delete:healthcareprofessionals'],
        Scope['read:facilities'], Scope['write:facilities'], Scope['delete:facilities'],
        Scope['read:submissions'], Scope['write:submissions'], Scope['delete:submissions'],
        Scope['read:profile'], 
        Scope['write:posts']
    ],
    [Role.Dev]: [
        Scope['read:healthcareprofessionals'], Scope['write:healthcareprofessionals'], Scope['delete:healthcareprofessionals'],
        Scope['read:facilities'], Scope['write:facilities'], Scope['delete:facilities'],
        Scope['read:submissions'], Scope['write:submissions'], Scope['delete:submissions'],
        Scope['read:profile'], 
        Scope['write:posts']
    ],
    [Role.User]: [
        Scope['read:healthcareprofessionals'], 
        Scope['read:facilities'], 
        Scope['write:submissions'],
        Scope['read:profile']
    ]
}

interface User {
    sub: string
    name: string
    email: string
    roles: Role[]
    scope: string
    [key: string]: unknown // Allow additional properties
}

export interface UserContext {
    user: User
}

/**
 * Checks if the user is authorized for the given scope.
 * @param request - The Fastify request object containing the decoded JWT.
 * @param requiredScope - The scope to check for authorization. Ex. `read:facilities` or `write:healthcareprofessionals`.
 * @returns {boolean} - True if authorized, false otherwise.
 */
export function authorize(user: User, requiredScopes: Scope[]): boolean {
    try {
        // Check if we're in a testing environment such as CI/CD or local testing
        // In these cases, we want to skip auth checks to allow for easier testing.
        if (envVariables.isTestingEnvironment()) {
            return true
        }

        if (!user) {
            logger.warn('Auth: User is not defined')
            return false
        }
        
        // This will fail if we change auth0 roles and forget to update our mapping.
        const currentUserScopes = user.scope?.split(' ') as unknown as Scope[] || []
        const currentUserRoles = user.roles as unknown as Role[] || []
        
        const currentUserScopesFromRoles = currentUserRoles.flatMap(role => roleScopes[role] as Scope[])
        // We want to combine the user's explicit scopes with the scopes derived from their roles.
        let allUserScopes = [...currentUserScopes, ...currentUserScopesFromRoles]
        
        // In production, restrict permissions unless user is Admin or Moderator
        if (envVariables.isProduction() &&
        !currentUserRoles.includes(Role.Admin) &&
        !currentUserRoles.includes(Role.Moderator)) {
            // It removes any write or delete permissions from the user's scopes
            allUserScopes = allUserScopes.filter(scope => scope.startsWith('read:'))
        }

        const hasRequiredScopes = requiredScopes.every((scope: Scope) => allUserScopes.includes(scope))

        if (!hasRequiredScopes) {
            logger.warn(`Auth: ❌ User ${user.sub} is NOT authorized for the required scopes: ${requiredScopes.join(', ')}`)
            logger.warn(`Auth: User's current roles ${currentUserRoles.join(', ')} and scopes: ${allUserScopes.join(', ')}.`)
        } else {
            logger.info(`Auth: ✅ User ${user.sub} is authorized for the required scopes: ${requiredScopes.join(', ')}`)
        }

        return hasRequiredScopes
    } catch (err) {
        logger.error('Error parsing user object. Have we updated roles in Auth0 that don\'t match our required scopes above?:', err)
        return false
    }
}

// This function builds the user context from the FastifyRequest object so it can be used in the graphQL resolvers.
export async function buildUserContext(req: FastifyRequest): Promise<UserContext> {
    const userFromRequest = req?.user as User

    return {
        user: {
            sub: userFromRequest?.sub,
            name: userFromRequest?.name,
            email: userFromRequest?.email,
            scope: userFromRequest?.scope || '',
            // These are custom roles defined in the Auth0 dashboard
            // They are JWT recommended prefixes with https://findadoc.jp/roles to avoid conflicts with standard JWT claims
            roles: userFromRequest['https://findadoc.jp/roles'] as Role[] || userFromRequest?.roles as Role[] || []
        } satisfies User
    } satisfies UserContext
}

// This function intializes the auth server integration. 
// It sets up the JWT authentication and verifies the token on every request.
export async function initializeAuth(fastify: FastifyInstance) {
    logger.debug('🔓 Initializing Auth system...')

    if (envVariables.isTestingEnvironment()) {
        logger.info('Auth: Testing environment detected! Skipping auth checks.') 
    }

    const getJwks = buildGetJwks()

    await fastify.register(fastifyJwt, {
        decode: { complete: true },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        secret: async (request: any, token: any) => {
            const { kid, alg } = token.header

            return getJwks.getPublicKey({kid, 
                domain: 'https://findadoc.jp.auth0.com', 
                alg})
        },
        // Correcting the 'algorithm' property
        sign: {
            algorithm: 'RS256'
        }
    })

    //We want the user to be authenticated for every request. This hook will verify the JWT token on every request
    // This also allows us to retrieve the user object from the JWT token
    fastify.addHook('preHandler', async (request: FastifyRequest) => {
        // Check if Authorization header exists
        const authHeader = request.headers.authorization
        const tokenExists = !!authHeader
        
        if (tokenExists) {
            try {
                // If token exists, verify it
                await request.jwtVerify()
                // Token is valid, request.user is now available
                    
                return
            } catch (err) {
                // Token is invalid
                logger.error('Invalid token:', err) 
                return
            }
        }
            
        // If no token, continue without authentication (as anonymous user)
        request.user = {
            sub: 'Anonymous User',
            name: 'Anonymous',
            email: '',
            roles: [Role.User],
            scope: ''
        } satisfies User
    })

    logger.debug('🔐 Initialized Auth system.')
}
