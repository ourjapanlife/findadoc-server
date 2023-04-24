import { initializeApp, applicationDefault, cert, ServiceAccount } from 'firebase-admin/app'
import serviceAccountCredentialsJson
    from '../findadoc-firebase-service-account-credentials.json'
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'

export async function initializeDb() {
    const credentials = serviceAccountCredentialsJson as ServiceAccount

    initializeApp({
        credential: cert(credentials)
    })
}
