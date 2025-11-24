import type { Database as SupabaseDatabase } from './supabase-generated'
import type { KyselifyDatabase } from 'kysely-supabase'

/**
 * Kysely Database types
 * Auto-generated from Supabase schema using kysely-supabase
 * 
 * To regenerate after schema changes:
 * yarn db:types
 */
export type Database = KyselifyDatabase<SupabaseDatabase>

/**
 * Helper types for the tables we work with
 * (Facilities, HPs, Submissions, AuditLogs)
 */
export type FacilitiesTable = Database['facilities']
export type HpsTable = Database['hps']
export type HpsFacilitiesTable = Database['hps_facilities']
export type SubmissionsTable = Database['submissions']
export type AuditLogsTable = Database['audit_logs']

/**
 * Enums from the database
 */
export type ActionTypeEnum = SupabaseDatabase['public']['Enums']['action_type_enum']
export type ObjectTypeEnum = SupabaseDatabase['public']['Enums']['object_type_enum']
export type SchemaVersionEnum = SupabaseDatabase['public']['Enums']['schema_version_enum']