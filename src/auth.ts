import { init } from 'supertokens-node'
import { init as ThirdPartyEmailPasswordRecipeInit } from 'supertokens-node/recipe/thirdpartyemailpassword/index.js'
import Dashboard from 'supertokens-node/recipe/dashboard/index.js'
import { envVariables } from '../utils/environmentVariables.js'
import { env } from 'process'

export const initializeAuth = () => {
    init({
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
            apiBasePath: '/auth',
            websiteBasePath: '/'
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
                providers: [{
                    config: {
                        thirdPartyId: 'github',
                        clients: [{
                            clientId: envVariables.authGithubClientId(),
                            clientSecret: envVariables.authGithubClientSecret()
                        }]
                    }
                }]
            })
        ]
    })

    console.log('🔐 Initialized Auth system')
}
