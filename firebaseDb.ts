import admin from 'firebase-admin'
import { initializeApp } from 'firebase-admin/app';
import {envVariables} from './utils/environmentVariables'

const isTestingEnvironment = process.env.TEST_ENABLED
const isProduction = envVariables.isProduction()
const isLocal = envVariables.isLocal()


if(isProduction) {
    const firebaseCredentials = Object.assign(
        { private_key: String(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, "\n") },
        require("./firebaseServiceAccountKey.json"))
    
    initializeApp({
        credential: admin.credential.cert(firebaseCredentials),
    });
}
else if (isTestingEnvironment || isLocal) {
    initializeApp({
        projectId: process.env.FIRESTORE_PROJECT_ID,
        databaseURL: envVariables.getDbUrl(),
    });
} 

const db = admin.firestore();

export default db
