//we want the logger to be started before anything else
import { initializeLogger } from './logger.js'
import { initializeAuth } from './auth.js'
import { initiatilizeFirebaseInstance } from './firebaseDb.js'
import { createApolloFastifyServer } from './server.js'

initializeLogger()
await initiatilizeFirebaseInstance()
await initializeAuth()
await createApolloFastifyServer()
