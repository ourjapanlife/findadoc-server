import { initializeAuth } from './auth.js'
import { initiatilizeFirebaseInstance } from './firebaseDb.js'
import { createApolloFastifyServer } from './server.js'

await initiatilizeFirebaseInstance()
await initializeAuth()
await createApolloFastifyServer()
