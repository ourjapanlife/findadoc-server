import admin  from 'firebase-admin'
import { cert, ServiceAccount } from 'firebase-admin/app'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, './.env') })

const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH as string

const credentials = JSON.parse(fs.readFileSync(path.resolve(serviceAccountPath), 'utf8')) as ServiceAccount

admin.initializeApp({
    credential: cert(credentials)
})

// module.exports.admin = admin
export { admin }

