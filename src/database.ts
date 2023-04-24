import { initializeApp, applicationDefault, cert } from 'firebase-admin/app'
import serviceAccountCredentials
    from '../findadoc-firebase-service-account-credentials.json'
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'

export async function initializeDb() {
    initializeApp({
        credential: cert(serviceAccountCredentials)
    })
}
