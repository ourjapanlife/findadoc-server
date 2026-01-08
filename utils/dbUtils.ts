import { sql } from 'kysely'

/**
 * Type constraint for database query builders that support ILIKE operations.
 * Used primarily with Supabase client for case-insensitive text search.
 */
export type HasIlike = {
    ilike: (column: string, pattern: string) => unknown
}

/**
 * Serializes a value as JSONB for PostgreSQL insertion via Kysely.
 * 
 * WHY THIS EXISTS:
 * - PostgreSQL JSONB columns require explicit JSON serialization
 * - Without this, Kysely/pg driver may double-encode the JSON ({"name":"davide"} → "{\"name\":\"davide\"}")
 * - This helper ensures single-pass serialization with explicit ::jsonb cast
 * 
 *  * WHEN TO USE:
 * - ALWAYS use for INSERT operations with JSONB columns
 * - ALWAYS use for UPDATE operations that modify JSONB columns
 * - NOT needed for SELECT (Kysely handles deserialization correctly)
 */
export const asJsonb = <T>(value: T) => sql<T>`${JSON.stringify(value)}::jsonb`

/**
 * Type constraint for database query builders that support JSONB @> (contains) operations.
 * Used with both Supabase and Kysely for filtering on JSONB array fields.
 */
export type HasContains = {
    contains: (
        column: string,
        //eslint-disable-next-line
        value: string | readonly any[] | Record<string, unknown>
    ) => unknown
}
