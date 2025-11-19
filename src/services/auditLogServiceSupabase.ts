/* eslint-disable */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE'
export type ObjectType = 'Facility' | 'HealthcareProfessional' | 'Submission'
export type SchemaVersion = 'V1'

type InsertAuditLog = {
    actionType: ActionType
    objectType: ObjectType
    schemaVersion?: SchemaVersion
    updatedBy: string
    newValue?: unknown
    oldValue?: unknown
}

export async function createAuditLogSQL({
    actionType,
    objectType,
    updatedBy,
    newValue,
    oldValue,
    schemaVersion = 'V1'
}: InsertAuditLog): Promise<void> {
    const { error } = await supabase.from('audit_logs').insert({
        action_type: actionType,
        object_type: objectType,
        schema_version: schemaVersion,
        new_value: newValue ?? null,
        old_value: oldValue ?? null,
        updated_by: updatedBy
    })

    if (error) { throw error }
}
