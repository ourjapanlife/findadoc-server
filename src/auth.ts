import { init as initSupertokens } from 'supertokens-node'
import { init as ThirdPartyEmailPasswordRecipeInit } from 'supertokens-node/recipe/thirdpartyemailpassword/index.js'
import Session from 'supertokens-node/recipe/session/index.js'
import Dashboard from 'supertokens-node/recipe/dashboard/index.js'
import UserRoles from 'supertokens-node/recipe/userroles/index.js'
import { envVariables } from '../utils/environmentVariables.js'
import { SessionRequest } from 'supertokens-node/framework/fastify/index.js'

export interface UserContext {
    userId: string;
}

export const initializeAuth = async () => {
    initSupertokens({
        framework: 'fastify',
        supertokens: {
            // https://try.supertokens.com is for demo purposes. Replace this with the address of your core instance (sign up on supertokens.com), or self host a core.
            connectionURI: envVariables.authSupertokensURL(),
            apiKey: envVariables.authSupertokensAPIKey()
        },
        appInfo: {
            // learn more about this on https://supertokens.com/docs/thirdpartyemailpassword/appinfo
            appName: 'Findadoc',
            apiDomain: 'https://api.findadoc.jp',
            websiteDomain: 'https://findadoc.jp',
            apiBasePath: '/',
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
                        termsOfServiceLink: 'https://findadoc.jp/terms-of-service',
                        privacyPolicyLink: 'https://findadoc.jp/privacy-policy'
                    }
                }
            }),
            Session.init(),
            UserRoles.init()
        ]
    })

    await setupRoles()

    console.log('🔐 Initialized Auth system')
}

async function setupRoles(): Promise<void> {
    //this is create the roles if they don't already exist
    await UserRoles.createNewRoleOrAddPermissions('admin', ['read', 'write'])
    await UserRoles.createNewRoleOrAddPermissions('user', ['read'])
}

export async function getRolesForUser(userId: string) {
    const response = await UserRoles.getRolesForUser('public', userId)
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

    const roles = await getRolesForUser(userId)

    return roles.includes('admin')
}

export async function buildUserContext(req: SessionRequest): Promise<UserContext> {
    const userId = req.session?.getUserId() ?? ''

    return {
        userId
    } satisfies UserContext
}
 