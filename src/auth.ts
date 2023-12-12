import { init as initSupertokens } from 'supertokens-node'
import { init as ThirdPartyEmailPasswordRecipeInit } from 'supertokens-node/recipe/thirdpartyemailpassword/index.js'
import Session from 'supertokens-node/recipe/session/index.js'
import Dashboard from 'supertokens-node/recipe/dashboard/index.js'
import UserRoles from 'supertokens-node/recipe/userroles/index.js'
import { envVariables } from '../utils/environmentVariables.js'
import { SessionRequest } from 'supertokens-node/framework/fastify/index.js'
// import { exec } from 'child_process'
import { logger } from './logger.js'

export interface UserContext {
    userId: string;
    tenantId: string;
}

export const initializeAuth = async () => {
    logger.debug('🔓 Initializing Auth system...')
    initSupertokens({
        framework: 'fastify',
        supertokens: {
            // https://try.supertokens.com is for demo purposes. Replace this with the address of your core instance (sign up on supertokens.com), or self host a core.
            connectionURI: envVariables.authSupertokensURL(),
            apiKey: envVariables.authSupertokensAPIKey()
        },
        appInfo: {
            // learn more about this on https://supertokens.com/docs/thirdpartyemailpassword/appinfo
            appName: 'findadoc',
            apiDomain: envVariables.apiURL(),
            websiteDomain: envVariables.websiteURL(),
            apiBasePath: '/auth',
            websiteBasePath: '/auth'
        },
        recipeList: [
            //this sets up the dashboard for managing users and sessions
            Dashboard.init({
                admins: [
                    'philipermish@gmail.com',
                    'lts001@gmail.com'
                ]
            }),
            ThirdPartyEmailPasswordRecipeInit({
                //@ts-expect-error - signInAndUpFeature is missing on the type
                signInAndUpFeature: {
                    providers: [{
                        config: {
                            thirdPartyId: 'github',
                            clients: [{
                                clientId: envVariables.authGithubClientId(),
                                clientSecret: envVariables.authGithubClientSecret()
                            }]
                        }
                    }],
                    signUpForm: {
                        termsOfServiceLink: 'https://www.findadoc.jp/terms-of-service',
                        privacyPolicyLink: 'https://www.findadoc.jp/privacy-policy'
                    }
                }
            }),
            Session.init(),
            UserRoles.init()
        ]
    })

    await setupRoles()

    //     const result = exec(`
    //     curl --location --request POST 'https://st-dev-48e40380-90bf-11ee-a12f-c10c15e3d0ab.aws.supertokens.io/recipe/dashboard/user' \
    // --header 'rid: dashboard' \
    // --header 'api-key: sqG7JfslDpaFaBTte0Edj5DHdU' \
    // --header 'Content-Type: application/json' \
    // --data-raw '{"email": "philipermish@gmail.com","password": "temp123"}'`)

    //     logger.info(result)

    logger.debug('🔐 Initialized Auth system')
}

async function setupRoles(): Promise<void> {
    //this is create the roles if they don't already exist
    await UserRoles.createNewRoleOrAddPermissions('admin', ['read', 'write'])
    await UserRoles.createNewRoleOrAddPermissions('user', ['read'])
}

export async function getRolesForUser(userId: string, tenantId: string): Promise<string[]> {
    //public is the default tenantId
    const response = await UserRoles.getRolesForUser(tenantId, userId)
    const roles: string[] = response.roles

    return roles
}

export async function hasAdminRole(context: UserContext): Promise<boolean> {
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

export async function buildUserContext(req: SessionRequest): Promise<UserContext> {
    const userId = req.session?.getUserId() ?? ''
    const tenantId = req.session?.getTenantId() ?? ''

    return {
        userId,
        tenantId
    } satisfies UserContext
}
