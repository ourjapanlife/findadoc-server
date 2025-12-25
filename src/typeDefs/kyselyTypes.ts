import type { ColumnType, Generated } from 'kysely'
import * as gqlTypes from './gqlTypes.js'
import type { Database as SupabaseDatabase } from './supabase-generated.js'

/**
 * Kysely Database types with proper JSONB typing
 * 
 * We override the auto-generated types to use our GraphQL types
 * for JSONB columns instead of generic 'Json' or 'unknown'.
 * 
 * This gives us:
 * - Full type safety (no 'as any' needed)
 * - Autocomplete in IDE
 * - Compile-time checks
 */

/**
 * Facilities Table
 * 
 * ColumnType<SelectType, InsertType, UpdateType>:
 * - SelectType: Type when reading from DB (SELECT)
 * - InsertType: Type when inserting (INSERT)
 * - UpdateType: Type when updating (UPDATE)
 */
export interface FacilitiesTable {
    id: Generated<string>
    code: string | null
    nameEn: string
    nameJa: string
    contact: ColumnType<gqlTypes.Contact, gqlTypes.ContactInput, gqlTypes.ContactInput>
    mapLatitude: number
    mapLongitude: number
    createdDate: string
    updatedDate: string
    firestore_id: string | null
}

/**
 * HPs (Healthcare Professionals) Table
 */
export interface HpsTable {
    id: Generated<string>
    names: ColumnType<gqlTypes.LocalizedName[], gqlTypes.LocalizedName[], gqlTypes.LocalizedName[]>
    additionalInfoForPatients: string | null
    degrees: ColumnType<gqlTypes.Degree[], gqlTypes.Degree[], gqlTypes.Degree[]>
    specialties: ColumnType<gqlTypes.Specialty[], gqlTypes.Specialty[], gqlTypes.Specialty[]>
    spokenLanguages: ColumnType<gqlTypes.Locale[], gqlTypes.Locale[], gqlTypes.Locale[]>
    acceptedInsurance: ColumnType<gqlTypes.Insurance[], gqlTypes.Insurance[], gqlTypes.Insurance[]>
    email: string | null
    createdDate: string
    updatedDate: string
    firestore_id: string | null
}

/**
 * HPs-Facilities Junction Table (many-to-many)
 */
export interface HpsFacilitiesTable {
    hps_id: string
    facilities_id: string
}

/**
 * Submissions Table
 */
export interface SubmissionsTable {
    id: Generated<string>
    status: SubmissionStatusEnum
    createdDate: string
    updatedDate: string
    hps_id: string | null
    facilities_id: string | null
    googleMapsUrl: string | null
    healthcareProfessionalName: string | null
    spokenLanguages: ColumnType<gqlTypes.Locale[] | null, gqlTypes.Locale[] | null, gqlTypes.Locale[] | null>
    notes: string | null
    autofillPlaceFromSubmissionUrl: boolean
    facility_partial: ColumnType<gqlTypes.FacilitySubmission | null, gqlTypes.FacilitySubmission 
        | null, gqlTypes.FacilitySubmission | null>
    healthcare_professionals_partial: ColumnType<gqlTypes.HealthcareProfessionalSubmission[]
        | null, gqlTypes.HealthcareProfessionalSubmission[] | null, gqlTypes.HealthcareProfessionalSubmission[] | null>
    firestore_id: string | null
}

/**
 * Audit Logs Table
 */
export interface AuditLogsTable {
    id: Generated<string>
    action_type: ActionTypeEnum
    object_type: ObjectTypeEnum
    schema_version: SchemaVersionEnum
    new_value: string | null
    old_value: string | null
    updated_by: string
    updated_date: Generated<string>
}

/**
 * Database interface - combines all tables
 */
export interface Database {
    facilities: FacilitiesTable
    hps: HpsTable
    hps_facilities: HpsFacilitiesTable
    submissions: SubmissionsTable
    audit_logs: AuditLogsTable
}

/**
 * Enums from the database
 */
export type ActionTypeEnum = SupabaseDatabase['public']['Enums']['action_type_enum']
export type ObjectTypeEnum = SupabaseDatabase['public']['Enums']['object_type_enum']
export type SchemaVersionEnum = SupabaseDatabase['public']['Enums']['schema_version_enum']
export type SubmissionStatusEnum = SupabaseDatabase['public']['Enums']['submission_status_enum']
