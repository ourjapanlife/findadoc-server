// Sentry instrumentation must be imported first, before any other module,
// so it can patch node built-ins (http, etc.) before they're loaded.
import './instrument.js'
import { initializeLogger } from './logger.js'
import { createApolloFastifyServer } from './server.js'
import { initializeSupabaseClient } from './supabaseClient.js'
import { initializeKyselyClient } from './kyselyClient.js'

initializeLogger()
await initializeSupabaseClient()
await initializeKyselyClient()
await createApolloFastifyServer()
