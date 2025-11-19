import * as gqlTypes from '../src/typeDefs/gqlTypes.js'
import * as dbSchema from '../src/typeDefs/dbSchema.js'
import { describe, it, expect } from 'vitest'
import { createAuditLogSQL } from '../src/services/auditLogServiceSupabase.js'
import { generateRandomCreateSubmissionInput } from '../src/fakeData/fakeSubmissions.js'
import { mapGqlEntityToDbEntity } from '../src/services/submissionService-pre-migration.js'

describe('createAuditLog', () => {
    it('should create an audit log successfully', async () => {        
        const newSubmission: gqlTypes.CreateSubmissionInput = generateRandomCreateSubmissionInput()
        const newAuditLog: dbSchema.SubmissionInsertRow = mapGqlEntityToDbEntity(newSubmission)
        
        await expect(
            createAuditLogSQL({
                actionType: gqlTypes.ActionType.Create,
                objectType: gqlTypes.ObjectType.Submission,
                updatedBy: 'user123',
                newValue: newAuditLog,
                oldValue: null
            })
        ).resolves.not.toThrow()
    })
})