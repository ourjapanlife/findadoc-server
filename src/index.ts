// We want the logger to be started before anything else
import { initializeLogger } from './logger.js'
import { createApolloFastifyServer } from './server.js'
import { initializeSupabaseClient } from './supabaseClient.js'

initializeLogger()
await initializeSupabaseClient()
await createApolloFastifyServer()
