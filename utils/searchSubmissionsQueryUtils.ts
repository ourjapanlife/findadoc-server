import { DocumentData, Query } from 'firebase-admin/firestore'
import * as gqlTypes from '../src/typeDefs/gqlTypes.js'
import * as dbSchema from '../src/typeDefs/dbSchema.js'
import { dbInstance } from '../src/firebaseDb.js'
import { ErrorCode} from '../src/result.js'
import type { Error } from '../src/result.js'
import { logger } from '../src/logger.js'
import { chunkArray,sortArrayByOrderCriteria } from './arrayUtils.js'
import { mapDbEntityTogqlEntity } from '../src/services/submissionService-pre-migration.js'

/**
 * Helper function to build the base Firestore query or an in-memory list of submissions based on filters.
 * This function handles the complex logic of applying filters, especially `spokenLanguages` which requires
 * in-memory filtering due to Firestore limitations (`array-contains-any` cannot be combined with other range/equality filters).
 * It does NOT apply limit or offset directly to the Firestore query or the returned list.
 *
 * @param filters The search filters to apply.
 * @returns A Promise that resolves to an object containing either:
 * - `query`: A Firestore Query object, if filters can be fully applied on Firestore.
 * - `list`: An array of GraphQL Submissions, if `spokenLanguages` filter was used (requiring in-memory processing).
 */
export async function buildBaseSubmissionsQuery(filters: gqlTypes.SubmissionSearchFilters):
Promise<{ query?: Query<DocumentData>, list?: gqlTypes.Submission[], hasErrors: boolean, errors?: Error[] }> {
    let queryRef: Query<DocumentData> = dbInstance.collection('submissions')
    let allGqlSubmissions: gqlTypes.Submission[] = []

    if (filters.spokenLanguages && filters.spokenLanguages.length > 0) {
        try {
            const chunks = chunkArray(filters.spokenLanguages, 30)

            const snapshots = await Promise.all(chunks.map(chunk =>
                dbInstance.collection('submissions')
                    .where('spokenLanguages', 'array-contains-any', chunk)
                    .get()))

            const uniqueSubmissionsMap = new Map<string, gqlTypes.Submission>()

            snapshots.forEach(snap =>
                snap.forEach(doc => {
                    uniqueSubmissionsMap.set(doc.id, mapDbEntityTogqlEntity(doc.data() as dbSchema.Submission))
                }))
            allGqlSubmissions = Array.from(uniqueSubmissionsMap.values())

            if (filters.googleMapsUrl) {
                allGqlSubmissions = allGqlSubmissions.filter(s => s.googleMapsUrl === filters.googleMapsUrl)
            }
            if (filters.healthcareProfessionalName) {
                allGqlSubmissions = allGqlSubmissions.filter(s =>
                    s.healthcareProfessionalName === filters.healthcareProfessionalName)
            }
            if (filters.isUnderReview !== undefined) {
                allGqlSubmissions = allGqlSubmissions.filter(s => s.isUnderReview === filters.isUnderReview)
            }
            if (filters.isApproved !== undefined) {
                allGqlSubmissions = allGqlSubmissions.filter(s => s.isApproved === filters.isApproved)
            }
            if (filters.isRejected !== undefined) {
                allGqlSubmissions = allGqlSubmissions.filter(s => s.isRejected === filters.isRejected)
            }
            if (filters.createdDate) {
                allGqlSubmissions = allGqlSubmissions.filter(s => s.createdDate === filters.createdDate)
            }
            if (filters.updatedDate) {
                allGqlSubmissions = allGqlSubmissions.filter(s => s.updatedDate === filters.updatedDate)
            }

            const orderCriteria = (filters.orderBy && Array.isArray(filters.orderBy) && filters.orderBy.length)
                ? filters.orderBy
                : [{ fieldToOrder: 'createdDate', orderDirection: gqlTypes.OrderDirection.Desc }]
            
            allGqlSubmissions = sortArrayByOrderCriteria(allGqlSubmissions, orderCriteria)

            return { list: allGqlSubmissions, hasErrors: false }
                 
        } catch (error: unknown) {
            logger.error(`ERROR in buildBaseSubmissionsQuery (in-memory path): ${error instanceof Error ? error.message : error}`)
            return {
                hasErrors: true,
                errors: [{
                    field: 'buildBaseSubmissionsQuery',
                    errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                    httpStatus: 500
                }]
            }
        }
    } else {
        if (filters.googleMapsUrl) {
            queryRef = queryRef.where('googleMapsUrl', '==', filters.googleMapsUrl)
        }
        if (filters.healthcareProfessionalName) {
            queryRef = queryRef.where('healthcareProfessionalName', '==', filters.healthcareProfessionalName)
        }
        if (filters.isUnderReview !== undefined) {
            queryRef = queryRef.where('isUnderReview', '==', filters.isUnderReview)
        }
        if (filters.isApproved !== undefined) {
            queryRef = queryRef.where('isApproved', '==', filters.isApproved)
        }
        if (filters.isRejected !== undefined) {
            queryRef = queryRef.where('isRejected', '==', filters.isRejected)
        }
        if (filters.createdDate) {
            queryRef = queryRef.where('createdDate', '==', filters.createdDate)
        }
        if (filters.updatedDate) {
            queryRef = queryRef.where('updatedDate', '==', filters.updatedDate)
        }

        if (filters.orderBy && Array.isArray(filters.orderBy)) {
            filters.orderBy.forEach(order => {
                if (order) {
                    queryRef = queryRef.orderBy(order.fieldToOrder as string,
                                                 order.orderDirection as gqlTypes.OrderDirection)
                }
            })
        } else {
            queryRef = queryRef.orderBy('createdDate', gqlTypes.OrderDirection.Desc)
        }
        return { query: queryRef, hasErrors: false }
    }
}
