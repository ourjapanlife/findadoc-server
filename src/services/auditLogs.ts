// import { DocumentData, Query, WriteBatch } from 'firebase-admin/firestore'
import * as gqlTypes from '../typeDefs/gqlTypes.js'
import * as dbSchema from '../typeDefs/dbSchema.js'
import { ErrorCode, Result } from '../result.js'
import { dbInstance } from '../firebaseDb.js'
import { logger } from '../logger.js'

/**
 * Gets the Facility from the database that matches on the id.
 * @param id A string that matches the id of the Firestore Document for the Facility.
 * @returns A Facility object.
 */
export const getAuditLogById = async (id: string)
    : Promise<Result<gqlTypes.AuditLogs>> => {
    try {
        const auditLogsRef = dbInstance.collection('auditLogs').where('id', '==', id)
        const dbQueryResults = await auditLogsRef.get()
        const dbDocs = dbQueryResults.docs

        if (dbDocs.length != 1) {
            throw new Error('No auditLogs found')
        }

        const dbAuditLogs = dbDocs[0].data() as dbSchema.AuditLogs
        const convertedEntity = mapDbEntityTogqlEntity(dbAuditLogs)

        return {
            data: convertedEntity,
            hasErrors: false
        }
    } catch (error) {
        logger.error(`ERROR: Error retrieving audit log by id: ${error}`)

        return {
            data: {} as gqlTypes.AuditLogs,
            hasErrors: true,
            errors: [{
                field: 'getAuditLogById',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

export const createAuditLog = async (auditLogInput: gqlTypes.CreateAuditLog): Promise<Result<gqlTypes.AuditLogs>> => {
    try {
        const auditLogsRef = dbInstance.collection('auditLogs').doc()
        const newAuditLogId = auditLogsRef.id
        const newAuditLog = mapGqlEntityToDbEntity(auditLogInput, newAuditLogId)

        await auditLogsRef.set(newAuditLog)

        const createdAuditLog = await getAuditLogById(newAuditLogId)

        if (!createdAuditLog.data) {
            throw new Error(`${JSON.stringify(createdAuditLog.errors)}`)
        }

        return {
            data: createdAuditLog.data,
            hasErrors: false
        } 
    } catch (error) {
        logger.error(`ERROR: Error creating audit: ${error}`)

        return {
            data: {} as gqlTypes.AuditLogs,
            hasErrors: true,
            errors: [{
                field: `${error}`,
                errorCode: ErrorCode.SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

function mapGqlEntityToDbEntity(input: gqlTypes.CreateAuditLog, newId: string): dbSchema.AuditLogs {
    return {
        id: newId,
        actionType: input.actionType,
        tableName: input.tableName,
        schemaVersion: input.schemaVersion,
        jsonData: input.jsonData,
        updatedBy: input.updatedBy,
        //business rule: updatedDate is updated on every change.
        updatedDate: new Date().toISOString()
    } satisfies dbSchema.AuditLogs
}

const mapDbEntityTogqlEntity = (dbEntity: dbSchema.AuditLogs): gqlTypes.AuditLogs => {
    const gqlEntity = {
        id: dbEntity.id,
        actionType: dbEntity.actionType,
        tableName: dbEntity.tableName,
        schemaVersion: dbEntity.schemaVersion,
        jsonData: dbEntity.jsonData,
        updatedBy: dbEntity.updatedBy,
        updatedDate: dbEntity.updatedDate
    } satisfies gqlTypes.AuditLogs

    return gqlEntity
}