import { init } from 'supertokens-node'
import { init as ThirdPartyEmailPasswordRecipeInit } from 'supertokens-node/recipe/thirdpartyemailpassword/index.js'
import Dashboard from 'supertokens-node/recipe/dashboard/index.js'
import { envVariables } from '../utils/environmentVariables.js'

export const initializeAuth = () => {
    init({
        framework: 'fastify',
        supertokens: {
            // https://try.supertokens.com is for demo purposes. Replace this with the address of your core instance (sign up on supertokens.com), or self host a core.
            connectionURI: envVariables.supertokensAuthURL(),
            apiKey: envVariables.authAPIKey()
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
                    'philipermish@gmail.com'
                ]
            }),
            ThirdPartyEmailPasswordRecipeInit({
                providers: [{
                    config: {
                        thirdPartyId: 'google',
                        clients: [{
                            clientId: '1060725074195-kmeum4crr01uirfl2op9kd5acmi9jutn.apps.googleusercontent.com',
                            clientSecret: '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'
                        }]
                    }
                }, {
                    config: {
                        thirdPartyId: 'github',
                        clients: [{
                            clientId: '467101b197249757c71f',
                            clientSecret: 'e97051221f4b6426e8fe8d51486396703012f5bd'
                        }]
                    }
                }, {
                    config: {
                        thirdPartyId: 'apple',
                        clients: [{
                            clientId: '4398792-io.supertokens.example.service',
                            additionalConfig: {
                                keyId: '7M48Y4RYDL',
                                privateKey:
                                    '-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgu8gXs+XYkqXD6Ala9Sf/iJXzhbwcoG5dMh1OonpdJUmgCgYIKoZIzj0DAQehRANCAASfrvlFbFCYqn3I2zeknYXLwtH30JuOKestDbSfZYxZNMqhF/OzdZFTV0zc5u5s3eN+oCWbnvl0hM+9IW0UlkdA\n-----END PRIVATE KEY-----',
                                teamId: 'YWQCXGJRJL'
                            }
                        }]
                    }
                }]
            })
        ]
    })

    console.log('🔐 Initialized Auth system')
}
