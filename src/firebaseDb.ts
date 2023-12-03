import admin from 'firebase-admin'
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app'
import { Firestore } from 'firebase-admin/firestore'
import { envVariables } from '../utils/environmentVariables.js'
import { seedDatabase } from '../utils/databaseSeedTool.js'
import { logger } from './logger.js'

const isTestingEnvironment = envVariables.isTestingEnvironment()
const isProduction = envVariables.isProduction()
const isLocal = envVariables.isLocal()

export let dbInstance: Firestore

const testFirestoreIsInitialized = async (shouldSeedDatabase: boolean) => {
    try {
        const ref = dbInstance.collection('facilities')

        // we want to test that we can connect to firestore, so we try to get a document. 
        // If the connection fails, unfortunately this will hang for a really long time. There is no timeout option for this, currently. 
        const existingData = await ref.limit(1).get()
        
        logger.info('🔥 Firestore connection established 🔥')
        const hasExistingData = existingData.docs.length > 0

        // if we don't have any data, we should seed the database
        if (!hasExistingData && shouldSeedDatabase) {
            logger.info('\n🌱 Seeding firebase emulator data... 🌱\n')
            await seedDatabase()
        }
    } catch (ex) {
        logger.error(`❌ Firestore is not connecting... ❌ ${ex}'`)
        throw new Error('❌ Firestore is not connecting... ❌')
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
    
    const isNotProduction = !!isTestingEnvironment || isLocal

    if (isProduction) {
        logger.info('\n🔥 Connecting to production firebase...')
    } else if (isNotProduction) {
        logger.info('\n🔥 Connecting to firebase emulator...')
        logger.info('TIP: if it doesn\'t connect after 10 secs,' +
            ' make sure you have the firebase emulator running using the "yarn dev:startlocaldb" command')
    }

    await testFirestoreIsInitialized(isNotProduction)

    logger.info('✅ Firebase is initialized! ✅ \n')
}
