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
        const dbResult = await ref.limit(1).get()

        // firebaseConnected = true
        console.log('Firestore is initialized 🔥')
    } catch {
        console.log('Firestore is not initialized ❌')
    }
}

let alreadyStartedInitialization = false

export const initiatilizeFirebaseInstance = async () => {
    if (dbInstance || alreadyStartedInitialization) {
        return
    }

    alreadyStartedInitialization = true

    initializeApp({
        projectId: envVariables.firebaseProjectId(),
        databaseURL: envVariables.getDbUrl(),
        // credential: admin.credential.cert({
        //     privateKey: envVariables.firebaseKey(),
        //     projectId: envVariables.firebaseProjectId(),
        // }),
        storageBucket: envVariables.firebaseStorageBucket()
    })

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
