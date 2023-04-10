import { initializeApp, applicationDefault, cert } from 'firebase-admin/app'
import serviceAccountCredentials
  from '/home/jchae/projects/findadoc-server/find-a-doc-japan-firebase-adminsdk-k7f1f-12c410ff49.json'
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'

export async function initializeDb() {
    initializeApp({
        credential: cert(serviceAccountCredentials)
    })
}
