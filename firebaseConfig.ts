import admin  from 'firebase-admin'
import {envDetails} from './utils/environmentDetails'

if (admin.apps.length > 0) {
    admin.app();
}
else if (process.env.TEST_ENABLED) {
    admin.initializeApp({
        projectId: process.env.FIRESTORE_PROJECT_ID,
        databaseURL: envDetails.getDbUrl(),
    });
}
else {
    const firebaseCredentials = Object.assign(
        { private_key: String(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, "\n") },
        require("./firebaseServiceAccountKey.json"))
    
    envDetails.isProduction()
    admin.initializeApp({
        credential: admin.credential.cert(firebaseCredentials),
        databaseURL: envDetails.getDbUrl(),
    });
}

const db = admin.firestore();

export default db
