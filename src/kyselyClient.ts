// src/db/kyselyClient.ts

import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { Database } from './typeDefs/kyselyTypes.js'
import { logger } from './logger.js'

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
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

/**
 * Pool error handler
 * Catches connection-level errors that happen outside of query execution.
 * Without this handler, pool errors could crash the entire application.
 */
pool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client', err)
})

/**
 * Kysely Database Instance
 * This is the main database client for executing type-safe SQL queries.
 * Key features:
 * - Full TypeScript type inference based on your database schema
 * - Transaction support with automatic rollback on errors
 * - SQL injection protection through parameterized queries
 * - Direct connection to PostgreSQL (bypasses Supabase API layer) CHECK SAFETY ON THIS
 */
export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool })
})

/**
 * Graceful Shutdown
 * 
 * Properly closes all database connections when the application shuts down.
 * This prevents:
 * - Connection leaks
 * - "Connection refused" errors in logs
 * - The process hanging on exit
 * 
 * Should be called in your application's shutdown handler:
 * ```typescript
 * process.on('SIGTERM', async () => {
 *   await closeDatabase()
 *   process.exit(0)
 * })
 * ```
 */
export async function closeDatabase(): Promise<void> {
  try {
    await db.destroy()
    logger.info('Database connection pool closed successfully')
  } catch (error) {
    logger.error('Error closing database connection pool:', error)
    throw error
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
 * 
 * @returns true if database is healthy, false otherwise
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Simple query to verify connectivity
    await db.selectFrom('facilities').select('id').limit(1).execute()
    return true
  } catch (error) {
    logger.error('Database health check failed:', error)
    return false
  }
}