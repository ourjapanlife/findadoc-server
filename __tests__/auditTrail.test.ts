import * as gqlTypes from '../src/typeDefs/gqlTypes.js'
import { dbInstance } from '../src/firebaseDb.js'
import { describe, it, expect} from 'vitest'
import { createAuditLog } from '../src/services/auditLogService'
import { generateRandomCreateSubmissionInput } from '../src/fakeData/fakeSubmissions'
import { mapGqlEntityToDbEntity } from '../src/services/submissionService.js'

describe('createAuditLog', () => {
    it('should create an audit log successfully', async () => {        
        const newSubmission: gqlTypes.CreateSubmissionInput = generateRandomCreateSubmissionInput()
        const newAuditLog: gqlTypes.Submission = mapGqlEntityToDbEntity(newSubmission, '1')
        
        const auditLogResult = await dbInstance.runTransaction(async t => {
            const result = await createAuditLog(
                gqlTypes.ActionType.Create, 
                gqlTypes.ObjectType.Submission, 
                'user123', 
                newAuditLog, 
                null,
                t
            )

            return result
        })

        expect(auditLogResult.isSuccesful).toBe(true)
    })
})