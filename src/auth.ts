import { FastifyInstance, FastifyRequest } from 'fastify'
import FastifyJWT from '@fastify/jwt'

import { logger } from './logger.js'
import { envVariables } from '../utils/environmentVariables.js'

// These are the different roles that a user can have in the system. 
// A role comes with a set of permissions or scopes to save having to define them every time. 
export enum Role {
    Admin = 'admin',
    Moderator = 'moderator',
    User = 'user'
}

// These are the different scopes or permissions that are available in the system.
// For example, a user with the `read:facilities` scope can read facilities data.
export enum Scope {
    ReadHealthcareProfessionals = 'read:healthcareprofessionals',
    WriteHealthcareProfessionals = 'write:healthcareprofessionals',
    DeleteHealthcareProfessionals = 'delete:healthcareprofessionals',
    ReadFacilities = 'read:facilities',
    WriteFacilities = 'write:facilities',
    DeleteFacilities = 'delete:facilities',
    ReadSubmissions = 'read:submissions',
    WriteSubmissions = 'write:submissions',
    DeleteSubmissions = 'delete:submissions',
    ReadLogs = 'read:logs',
    WriteLogs = 'write:logs',
    ReadProfile = 'read:profile',
    WritePosts = 'write:posts',
    DeleteComments = 'delete:comments'
}

// These are the different permissions or "scopes" that are associated with each role.
// For example, an admin might have permissions to read, write, and delete healthcare professionals,
// while a user might only have permission to read their own profile and posts.
// A user can have separate scopes from their roles, so we need to check both.
const roleScopes: Record<Role, Scope[]> = {
    [Role.Admin]: [
        Scope.ReadHealthcareProfessionals, Scope.WriteHealthcareProfessionals, Scope.DeleteHealthcareProfessionals,
        Scope.ReadFacilities, Scope.WriteFacilities, Scope.DeleteFacilities,
        Scope.ReadSubmissions, Scope.WriteSubmissions, Scope.DeleteSubmissions,
        Scope.ReadLogs, Scope.WriteLogs
    ],
    [Role.Moderator]: [
        Scope.ReadProfile, Scope.WritePosts, Scope.DeleteComments
    ],
    [Role.User]: [
        Scope.ReadProfile, Scope.ReadHealthcareProfessionals, Scope.ReadFacilities, Scope.WriteSubmissions
    ]
}

export interface UserContext {
    user: User
}

interface User {
    sub: string
    name: string
    email: string
    roles: string[]
    scope: string
    [key: string]: unknown // Allow additional properties
}

/**
 * Checks if the user is authorized for the given scope.
 * @param request - The Fastify request object containing the decoded JWT.
 * @param requiredScope - The scope to check for authorization. Ex. `read:facilities` or `write:healthcareprofessionals`.
 * @returns {boolean} - True if authorized, false otherwise.
 */
export function authorize(user: User, requiredScopes: Scope[]): boolean {
    try {
        if (!user) {
            logger.warn('Auth: User is not defined')
            return false
        }
        
        const currentUserScopes = user.scope?.split(' ') || []
        const currentUserRoles = user.roles as Role[] || []
        const currentUserScopesFromRoles = currentUserRoles.flatMap(role => roleScopes[role] || [])
        // We want to combine the user's explicit scopes with the scopes derived from their roles.
        const allUserScopes = [...currentUserScopes, ...currentUserScopesFromRoles]

        const hasRequiredScopes = requiredScopes.every((scope: string) => allUserScopes.includes(scope))

        if (!hasRequiredScopes) {
            logger.warn(`Auth: ❌ User ${user.sub} is NOT authorized for the required scopes: ${requiredScopes.join(', ')}`)
        } else {
            logger.info(`Auth: ✅ User ${user.sub} is authorized for the required scopes: ${requiredScopes.join(', ')}`)
        }

        return hasRequiredScopes
    } catch (err) {
        logger.error('Error authorizing user:', err)
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
            roles: userFromRequest?.roles || [],
            scope: userFromRequest?.scope || ''
        } satisfies User
    } satisfies UserContext
}

// This function intializes the auth server integration. 
// It sets up the JWT authentication and verifies the token on every request.
export async function initializeAuth(fastify: FastifyInstance) {
    logger.debug('🔓 Initializing Auth system...')

    // Register the JWT plugin with the secret key used by Auth0
    await fastify.register(FastifyJWT, {
        secret: envVariables.authAuth0APIKey()
    })
            
    //We want the user to be authenticated for every request. This hook will verify the JWT token on every request
    //This also allows us to retrive the user object from the JWT token
    fastify.addHook('preHandler', async (request: FastifyRequest) => {
        // Check if Authorization header exists
        const authHeader = request.headers.authorization
        const tokenExists = !!authHeader
        
        logger.debug(`Auth: Token exists: ${tokenExists} - ${authHeader}`)
            
        if (tokenExists) {
            try {
                logger.debug('token exists! Verifying...`')
    
                // If token exists, verify it
                await request.jwtVerify()
                // Token is valid, request.user is now available
                    
                return
            } catch (err) {
                // Token is invalid
                logger.error('Invalid token:', err) 
            }
        }
            
        // If no token, continue without authentication (as anonymous user)
        request.user = {
            sub: 'Anonymous User',
            name: '',
            email: '',
            roles: [Role.User],
            scope: ''
        }
    })

    logger.debug('🔐 Initialized Auth system')
}
