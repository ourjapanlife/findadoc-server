import supertokens from 'supertokens-node'
import Session from 'supertokens-node/recipe/session'
import ThirdPartyEmailPassword from 'supertokens-node/recipe/thirdpartyemailpassword'

export const initializeAuth = () => {
    supertokens.init({
        supertokens: {
            // https://try.supertokens.com is for demo purposes. Replace this with the address of your core instance (sign up on supertokens.com), or self host a core.
            connectionURI: 'https://try.supertokens.com'
            // apiKey: <API_KEY(if configured)>,
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
            ThirdPartyEmailPassword.init({/*TODO: See next step*/ }),
            // Session.init() // initializes session features
        ]
    })
}
