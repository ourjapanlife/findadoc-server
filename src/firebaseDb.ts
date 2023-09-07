import admin from 'firebase-admin'
import { initializeApp } from 'firebase-admin/app'
import { envVariables } from '../utils/environmentVariables'
import { seedDatabase } from '../utils/databaseSeedTool'
import { Firestore } from 'firebase-admin/firestore'

const isTestingEnvironment = envVariables.isTestingEnvironment()
const isProduction = envVariables.isProduction()
const isLocal = envVariables.isLocal()

export let dbInstance: Firestore

const testFirestoreIsInitialized = async (newDbInstance: Firestore) => {
    try {
        // let firebaseConnected = false

        // setTimeout(() => {
        //     if (!firebaseConnected) {
        //         throw new Error('Firestore is not initialized ❌')
        //     }
        // }, 5000)

        const ref = newDbInstance.collection('facilities')
        //validate firestore is initialized by getting a 1 document

        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        const dbResult = await ref.limit(1).get()

        // firebaseConnected = true
        console.log('Firestore is initialized 🔥')
    } catch {
        console.log('Firestore is not initialized ❌')
    }
}

// This is to prevent race conditions where parallel calls/tests/etc 
// try to initialize the firebase instance at the same time
let alreadyStartedInitialization = false

export const initiatilizeFirebaseInstance = async () => {
    if (dbInstance || alreadyStartedInitialization) {
        return
    }

    alreadyStartedInitialization = true

    const firebaseConfig = {
        projectId: envVariables.firebaseProjectId(),
        databaseURL: isProduction ? undefined : envVariables.getDbUrl(),
        apiKey: envVariables.firebaseKey(),
        authDomain: envVariables.firebaseAuthDomain(),
        storageBucket: envVariables.firebaseStorageBucket(),
        messagingSenderId: envVariables.firebaseMessagingSenderId(),
        appId: envVariables.firebaseAppId(),
        measurementId: envVariables.firebaseMeasurementId()
    }

    initializeApp(firebaseConfig)

    const newDbInstance = admin.firestore()

    await testFirestoreIsInitialized(newDbInstance)
    dbInstance = newDbInstance

    if (isProduction) {
        console.log('Connecting to production firebase...')
    } else if (isTestingEnvironment || isLocal) {
        console.log('Connecting to firebase emulator...')

        const ref = newDbInstance.collection('facilities')
        const firstFacility = await ref.limit(1).get()
        const hasSeedData = firstFacility.docs.length > 0

        if (!hasSeedData) {
            console.log('Seeding firebase emulator data 🌱')
            await seedDatabase()
        }
        console.log('Connected to firebase! ✅')
    }
}
