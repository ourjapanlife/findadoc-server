import admin from 'firebase-admin'
import { initializeApp } from 'firebase-admin/app'
import { envVariables } from '../utils/environmentVariables'
import { seedDatabase } from './databaseSeedTool'
import { Firestore } from 'firebase-admin/firestore'

const isTestingEnvironment = envVariables.isTestingEnvironment()
const isProduction = envVariables.isProduction()
const isLocal = envVariables.isLocal()

const testFirestoreIsInitialized = async (db: Firestore) => {

    try {
        let firebaseConnected = false
        setTimeout(() => {
            if (!firebaseConnected)
                throw new Error('Firestore is not initialized ❌')
        }, 5000)

        const ref = db.collection('facilities')
        //validate firestore is initialized by getting a 1 document
        const dbResult = await ref.limit(1).get()
        firebaseConnected = true
        console.log('Firestore is initialized 🔥')
    } catch {
        console.log('Firestore is not initialized ❌')
    }
}

const createFirebaseConnection = async () => {
    initializeApp({
        projectId: envVariables.firebaseProjectId(),
        databaseURL: envVariables.getDbUrl(),
        // credential: admin.credential.cert({
        //     privateKey: envVariables.firebaseKey(),
        //     projectId: envVariables.firebaseProjectId(),
        //     clientEmail: `firebase-adminsdk-${envVariables.firebaseProjectId()}@${envVariables.firebaseProjectId()}.iam.gserviceaccount.com`,
        // }),
        storageBucket: envVariables.firebaseStorageBucket(),
    });

    const dbInstance = admin.firestore();
    await testFirestoreIsInitialized(dbInstance)

    if (isProduction) {
        console.log('Connecting to production firebase...')
    }
    else if (isTestingEnvironment || isLocal) {
        console.log('Connecting to firebase emulator...')

        const ref = dbInstance.collection('facilities')
        const firstFacility = await ref.limit(1).get()
        const hasSeedData = firstFacility.docs.length > 0

        if (!hasSeedData) {
            console.log('Seeding firebase emulator data 🌱')
            await seedDatabase()
        }
        console.log('Connected to firebase! ✅')
    }

    return dbInstance
}


let db = createFirebaseConnection()

export default db
