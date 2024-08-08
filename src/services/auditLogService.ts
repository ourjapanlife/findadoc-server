import * as gqlTypes from '../typeDefs/gqlTypes.js'
import * as dbSchema from '../typeDefs/dbSchema.js'
import { AuditLogResult } from '../typeDefs/dbSchema.js'
import { dbInstance } from '../firebaseDb.js'
import { logger } from '../logger.js'
import { Transaction } from 'firebase-admin/firestore'

export async function createAuditLog(
    action: gqlTypes.ActionType, 
    objectType: gqlTypes.ObjectType, 
    updatedBy: string, 
    newData: Partial<dbSchema.Submission> | gqlTypes.Submission,
    oldData: Partial<dbSchema.Submission> | gqlTypes.Submission | null,
    t: Transaction
): Promise<AuditLogResult> {
    try {
        let oldValue: string | null = null

        // For some actions this will be null so need to check first before we use JSON.stringify
        if (oldData) {
            oldValue = JSON.stringify(oldData)
        }
        
        const audit: dbSchema.AuditLog = {
            actionType: action,
            objectType: objectType,
            schemaVersion: gqlTypes.SchemaVersion.V1,
            updatedBy: updatedBy,
            newValue: JSON.stringify(newData),
            oldValue: oldValue
        }

        const auditLogRef = dbInstance.collection('auditLogs').doc()
        const newAuditLogId = auditLogRef.id
        const newAuditLog = mapGqlEntityToDbEntity(audit, newAuditLogId)

        t.set(auditLogRef, newAuditLog)
        
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
        newValue: input.newValue,
        oldValue: input.oldValue,
        objectType: input.objectType as gqlTypes.ObjectType,
        schemaVersion: input.schemaVersion as gqlTypes.SchemaVersion,
        updatedBy: input.updatedBy,
        updatedDate: new Date().toISOString()
    } satisfies gqlTypes.AuditLog
}