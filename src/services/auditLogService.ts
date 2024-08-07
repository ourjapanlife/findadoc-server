import * as gqlTypes from '../typeDefs/gqlTypes.js'
import * as dbSchema from '../typeDefs/dbSchema.js'
import { AuditLogResult } from '../typeDefs/dbSchema.js'
import { dbInstance } from '../firebaseDb.js'
import { logger } from '../logger.js'

export async function createAuditLog(auditLogInput: dbSchema.AuditLog): Promise<AuditLogResult> {
    try {
        // TO DO: Validations here

        const auditLogRef = dbInstance.collection('auditLogs').doc()
        const newAuditLogId = auditLogRef.id
        const newAuditLog = mapGqlEntityToDbEntity(auditLogInput, newAuditLogId)

        await auditLogRef.set(newAuditLog)
        
        return {
            isSuccesful: true
        }
    } catch (error) {
        logger.error(`ERROR: Error creating audit log: ${error}`)

        return {
            isSuccesful: false
        }
    }
}

function mapGqlEntityToDbEntity(input: dbSchema.AuditLog, newId: string): gqlTypes.AuditLog {
    return {
        id: newId,
        actionType: input.actionType as gqlTypes.ActionType,
        jsonData: input.jsonData,
        objectType: input.objectType as gqlTypes.ObjectType,
        schemaVersion: input.schemaVersion as gqlTypes.SchemaVersion,
        updatedBy: input.updatedBy,
        updatedDate: new Date().toISOString()
    } satisfies gqlTypes.AuditLog
}