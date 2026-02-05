import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { Database } from './typeDefs/kyselyTypes.js'
import { logger } from './logger.js'
import { envVariables } from '../utils/environmentVariables.js'

let pool: Pool | null = null
let kyselyInstance: Kysely<Database> | null = null

/**
 * Initialize Kysely client with connection pool
 * Should be called once at application startup, after environment variables are loaded
 */
export async function initializeKyselyClient(): Promise<void> {
    if (kyselyInstance) {
        logger.warn('Kysely client already initialized')
        return
    }

    const databaseUrl = envVariables.databaseUrl()

    if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is not set')
    }

    logger.info('🔌 Initializing Kysely client...')
    logger.debug(`Database URL: ${databaseUrl}`)

    /**
 * PostgreSQL Connection Pool
 * The pool manages a set of reusable database connections.
 * Instead of opening a new connection for every query (slow and resource-intensive),
 * the pool maintains a set of open connections that can be reused.
 * Configuration:
 * - connectionString: Uses DATABASE_URL from .env (same database as Supabase)
 * - max: 10 connections in the pool (enough for dev and moderate production traffic)
 * - idleTimeoutMillis: Close idle connections after 30 seconds to free resources
 * - connectionTimeoutMillis: Fail fast if can't acquire a connection within 2 seconds
 */
    pool = new Pool({
        connectionString: databaseUrl,
        max: 100,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
    })

    /**
 * Pool error handler
 * Catches connection-level errors that happen outside of query execution.
 * Without this handler, pool errors could crash the entire application.
 */
    pool.on('error', err => {
        logger.error('Unexpected error on idle PostgreSQL client', err)
    })

    // Create Kysely instance
    kyselyInstance = new Kysely<Database>({
        dialect: new PostgresDialect({ pool })
    })

    // Test connection
    try {
        logger.info('🧪 Testing Kysely connection to PostgreSQL...')
    
        await kyselyInstance
            .selectFrom('facilities')
            .select('id')
            .limit(1)
            .execute()
    
        logger.info('✅ Kysely client initialized and connected successfully!')
    } catch (error) {
        logger.error('❌ Kysely connection test failed:', error)
    
        // Cleanup on failure
        await kyselyInstance.destroy()
        kyselyInstance = null
        pool = null
    
        throw new Error(`Failed to connect to PostgreSQL: ${error}`)
    }
}

/**
 * Get the Kysely database instance
 * Throws an error if not initialized
 */
function getKyselyClient(): Kysely<Database> {
    if (!kyselyInstance) {
        throw new Error(
            'Kysely client not initialized. Call initializeKyselyClient() first.'
        )
    }
    return kyselyInstance
}

/**
 * For backward compatibility - export as 'db'
 * But this will throw if not initialized
 */
export const db = new Proxy({} as Kysely<Database>, {
    get(_target, prop) {
        const instance = getKyselyClient()
        const value = instance[prop as keyof Kysely<Database>]

        return typeof value === 'function' ? value.bind(instance) : value
    }
})

/**
 * Graceful Shutdown
 * 
 * Properly closes all database connections when the application shuts down.
 * This prevents:
 * - Connection leaks
 * - "Connection refused" errors in logs
 * - The process hanging on exit
 */
export async function closeDatabase(): Promise<void> {
    if (!kyselyInstance) {
        logger.warn('Kysely client not initialized, nothing to close')
        return
    }

    try {
        await kyselyInstance.destroy()
        logger.info('✅ Database connection pool closed successfully')
    } catch (error) {
        logger.error('Error closing database connection pool:', error)
        throw error
    } finally {
        kyselyInstance = null
        pool = null
    }
}

/**
 * Health Check
 * 
 * Verifies that the database is reachable and accepting queries.
 * Useful for:
 * - Health check endpoints (e.g., /health)
 * - Startup verification
 * - Monitoring systems
 */
export async function checkDatabaseHealth(): Promise<boolean> {
    if (!kyselyInstance) {
        logger.error('Kysely client not initialized')
        return false
    }

    try {
        await kyselyInstance.selectFrom('facilities').select('id').limit(1).execute()
        return true
    } catch (error) {
        logger.error('Database health check failed:', error)
        return false
    }
}
