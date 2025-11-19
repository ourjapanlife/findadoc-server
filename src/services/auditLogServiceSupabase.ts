import * as gqlTypes from '../typeDefs/gqlTypes.js'
import { logger } from '../logger.js'
import { getSupabaseClient } from '../supabaseClient.js'

type InsertAuditLog = {
    actionType: gqlTypes.ActionType
    objectType: gqlTypes.ObjectType
    schemaVersion?: gqlTypes.SchemaVersion
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
    schemaVersion = gqlTypes.SchemaVersion.V1
}: InsertAuditLog): Promise<void> {
    try {
        const supabase = getSupabaseClient()
        
        const { error } = await supabase
            .from('audit_logs')
            .insert({
                action_type: actionType,
                object_type: objectType,
                schema_version: schemaVersion,
                new_value: newValue ?? null,
                old_value: oldValue ?? null,
                updated_by: updatedBy,
                updated_date: new Date().toISOString()
            })

        if (error) {
            logger.error(`ERROR: Failed to create audit log: ${error.message}`)
            throw error
        }

        logger.info(`Audit log created: ${actionType} ${objectType}`)
    } catch (error) {
        logger.error(`ERROR: Error creating audit log: ${error}`)
        throw error
    }
}