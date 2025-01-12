import { FastifyRequest } from 'fastify'
import { envVariables } from '../utils/environmentVariables.js'
import { logger } from './logger.js'

export interface UserContext {
    userId: string;
    tenantId: string;
}

export const initializeAuth = async () => {
    logger.debug('🔓 Initializing Auth system...')

    await Promise.resolve(() => { 
        logger.debug('🔐 TODO add Auth0 here')
    })

    logger.debug('🔐 Initialized Auth system')
}

export async function getRolesForUser(userId: string, tenantId: string): Promise<string[]> {
    //TODO: this is function temporary and being reworked. 
    const response = await Promise.resolve(
        logger.debug(`🔐 todo: ${userId} ${tenantId}`)
    )

    logger.debug(`🔐 ${response}`)

    const roles: string[] = []

    return roles
}

export async function hasAdminRole(context: UserContext): Promise<boolean> {
    //TODO: this is function temporary and being reworked. 
    const skipAuth = envVariables.isTestingEnvironment() || envVariables.isLocal()
    
    if (skipAuth) {
        return true
    }
    
    const userId = context.userId

    if (!userId) {
        return false
    }

    const roles = await getRolesForUser(userId, context.tenantId)

    return roles.includes('admin')
}

export async function buildUserContext(req: FastifyRequest): Promise<UserContext> {
    //TODO: this is function temporary and being reworked. 
    const userId = req ? '' : ''
    const tenantId = req ? '' : ''

    return {
        userId,
        tenantId
    } satisfies UserContext
}
