import admin from 'firebase-admin'
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app'
import { envVariables } from '../utils/environmentVariables'
import { seedDatabase } from '../utils/databaseSeedTool'
import { Firestore } from 'firebase-admin/firestore'

const isTestingEnvironment = envVariables.isTestingEnvironment()
const isProduction = envVariables.isProduction()
const isLocal = envVariables.isLocal()

export let dbInstance: Firestore

const testFirestoreIsInitialized = async (newDbInstance: Firestore) => {
    try {
        const ref = newDbInstance.collection('facilities')
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        const dbResult = await ref.limit(1).get()

        console.log('🔥 Firestore connection established 🔥')
    } catch (ex) {
        console.log('❌ Firestore is not connecting... ❌')
        console.log(ex)
        throw new Error('❌ Firestore is not connecting... ❌')
    }
}

const setupSeedData = async (newDbInstance: Firestore) => {
    const ref = newDbInstance.collection('facilities')
    const firstFacility = await ref.limit(1).get()
    const hasSeedData = firstFacility.docs.length > 0

    if (!hasSeedData) {
        console.log('\n🌱 Seeding firebase emulator data... 🌱\n')
        await seedDatabase()
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
        credential: isProduction ? cert(JSON.parse(envVariables.firebaseServiceAccount())) : applicationDefault(),
        databaseURL: isProduction ? undefined : envVariables.getDbUrl()
    }

    initializeApp(firebaseConfig)

    const newDbInstance = admin.firestore()

    dbInstance = newDbInstance

    if (isProduction) {
        console.log('\n🔥 Connecting to production firebase...')
        await testFirestoreIsInitialized(newDbInstance)
    } else if (isTestingEnvironment || isLocal) {
        console.log('\n🔥 Connecting to firebase emulator...')
        console.log('TIP: if it doesn\'t connect after 10 secs,' +
            ' make sure you have the firebase emulator running using the "yarn dev:startlocaldb" command')

        await testFirestoreIsInitialized(newDbInstance)
        await setupSeedData(newDbInstance)
    }

    console.log('✅ Firebase is initialized! ✅ \n')
}
