import { config } from 'dotenv'

console.log(`\n🔌 Loading environment: ${process.env.NODE_ENV}...`)

const dotEnvFileToLoad = process.env.NODE_ENV === 'production' ? './.env.prod' : './.env.dev'

config({ path: dotEnvFileToLoad })

const envVariables = {
    isProduction: () => process.env.NODE_ENV === 'production',
    isLocal: () => !envVariables.isProduction(),
    serverHost: () => process.env.SERVER_HOST as string,
    serverPort: () => process.env.SERVER_PORT as string,
    apiURL: () => process.env.API_URL as string,
    websiteURL: () => process.env.WEBSITE_URL as string,
    loggerGrafanaURL: () => process.env.LOGGER_GRAFANA_URL as string,
    loggerGrafanaApiKey: () => process.env.LOGGER_GRAFANA_API_KEY as string,
    authAuth0APIKey: () => process.env.AUTH_AUTH0_API_KEY as string,
    authAuth0URL: () => process.env.AUTH_AUTH0_URL as string,
    authGithubClientId: () => process.env.AUTH_GITHUB_CLIENT_ID as string,
    authGithubClientSecret: () => process.env.AUTH_GITHUB_CLIENT_SECRET as string,
    getDbUrl: () =>
        envVariables.isProduction()
            ? process.env.FIREBASE_DATABASE_URL
            : process.env.FIRESTORE_EMULATOR_HOST,
    isTestingEnvironment: () => process.env.TEST_ENABLED === 'true',
    firebaseServiceAccount: () => process.env.FIRESTORE_SERVICE_ACCOUNT as string,
    firebaseProjectId: () => process.env.FIRESTORE_PROJECT_ID,
    firebaseDatabaseUrl: () => process.env.FIREBASE_DATABASE_URL,
    googleAPIKey: () => process.env.GOOGLE_API_KEY
}

console.log('🔌 Loaded env variables 🔌')

export { envVariables }
