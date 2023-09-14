import { config } from 'dotenv'

console.log(`\n🔌 Loading environment: ${process.env.NODE_ENV}...`)

const dotEnvFileToLoad = process.env.NODE_ENV === 'production' ? './.env.prod' : './.env.dev'

config({ path: dotEnvFileToLoad })

const envVariables = {
    isProduction: () => process.env.NODE_ENV === 'production',
    isLocal: () => !envVariables.isProduction(),
    serverPort: () => process.env.SERVER_PORT as string,
    getDbUrl: () =>
        envVariables.isProduction()
            ? process.env.FIREBASE_DATABASE_URL
            : process.env.FIRESTORE_EMULATOR_HOST,
    isTestingEnvironment: () => process.env.TEST_ENABLED,
    firebaseServiceAccount: () => process.env.FIRESTORE_SERVICE_ACCOUNT as string,
    firebaseProjectId: () => process.env.FIRESTORE_PROJECT_ID,
    firebaseDatabaseUrl: () => process.env.FIREBASE_DATABASE_URL
}

console.log('🔌 Loaded env variables 🔌')

export { envVariables }
