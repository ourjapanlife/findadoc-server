import { config } from 'dotenv'

const dotEnvFileToLoad = process.env.NODE_ENV === 'production' ? './.env.prod' : './.env.dev'

config({ path: dotEnvFileToLoad })

const envVariables = {
    isProduction: () => process.env.NODE_ENV === 'production',
    isLocal: () => !envVariables.isProduction(),
    getDbUrl: () =>
        envVariables.isProduction()
            ? process.env.FIREBASE_DATABASE_URL
            : process.env.FIRESTORE_EMULATOR_HOST,
    isTestingEnvironment: () => process.env.TEST_ENABLED,
    firebaseKey: () => process.env.FIREBASE_PRIVATE_KEY,
    firebaseProjectId: () => process.env.FIRESTORE_PROJECT_ID,
    firebaseAuthDomain: () => process.env.FIREBASE_AUTH_DOMAIN,
    firebaseDatabaseUrl: () => process.env.FIREBASE_DATABASE_URL,
    firebaseStorageBucket: () => process.env.FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: () => process.env.FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: () => process.env.FIREBASE_APP_ID,
    firebaseMeasurementId: () => process.env.FIREBASE_MEASUREMENT_ID
}

console.log(`Environment loaded: ${process.env.NODE_ENV}`)
console.log(`DB URL: ${envVariables.getDbUrl()}`)

export { envVariables }
