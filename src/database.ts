import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

export async function initializeDb() {
    const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH

    if (!serviceAccountPath) {
        throw new Error('SERVICE_ACCOUNT_PATH environment variable is not set.')
    }

    const credentials = JSON.parse(fs.readFileSync(path.resolve(serviceAccountPath), 'utf8')) as ServiceAccount

    initializeApp({
        credential: cert(credentials)
        
    })
}