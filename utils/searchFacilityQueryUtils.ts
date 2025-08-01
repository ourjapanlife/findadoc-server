import { DocumentData, Query } from 'firebase-admin/firestore'
import * as gqlTypes from '../src/typeDefs/gqlTypes.js'
import * as dbSchema from '../src/typeDefs/dbSchema.js'
import { dbInstance } from '../src/firebaseDb.js'
import { ErrorCode } from '../src/result.js'
import type { Error } from '../src/result.js'
import { logger } from '../src/logger.js'
import { chunkArray } from './arrayUtils.js'
import { mapDbEntityTogqlEntity } from '../src/services/facilityService.js'

/**
 * Helper function to build the base Firestore query or an in-memory list of facilities based on filters.
 * This function handles complex filtering (like 'healthcareProfessionalIds' array-contains-any)
 * by either building a Firestore Query or fetching all relevant documents for in-memory processing.
 * It does NOT apply limit or offset directly to the Firestore query or the returned list.
 *
 * @param filters The search filters to apply.
 * @returns A Promise that resolves to an object containing either:
 * - `query`: A Firestore Query object, if filters can be fully applied on Firestore.
 * - `list`: An array of GraphQL Facilities, if `healthcareProfessionalIds` filter was used (requiring in-memory processing).
 * - `hasErrors`: A boolean indicating if an error occurred during query building.
 * - `errors`: An optional array of `Error` type.
 */
export async function buildBaseFacilitiesQuery(filters: gqlTypes.FacilitySearchFilters):
Promise<{ query?: Query<DocumentData>, list?: gqlTypes.Facility[], hasErrors: boolean, errors?: Error[] }> {
    try {
        let queryRef: Query<DocumentData> = dbInstance.collection('facilities')
        // Initialize an empty array to hold GraphQL Facility objects if in-memory processing is needed.
        let allGqlFacilities: gqlTypes.Facility[] = []

        /* Check if the 'healthcareProfessionalIds' filter is provided and has elements.
        * This filter requires special handling because Firestore's 'array-contains-any'
        * only supports a limited number of elements (max 30), and cannot be combined
        * with other range filters or multiple array-contains clauses directly in Firestore.
        */ 
        if (filters.healthcareProfessionalIds && filters.healthcareProfessionalIds.length > 0) {
            const chunks = chunkArray(filters.healthcareProfessionalIds!, 30);
            const snapshots = await Promise.all(chunks.map(chunk =>
                dbInstance.collection('facilities')
                    .where('healthcareProfessionalIds', 'array-contains-any', chunk)
                    .get()))

            // Use a Map to store unique facilities by their ID, preventing duplicates
            const uniqueFacilitiesMap = new Map<string, gqlTypes.Facility>()
            snapshots.forEach(snap =>
                snap.forEach(doc => {
                    uniqueFacilitiesMap.set(doc.id, mapDbEntityTogqlEntity(doc.data() as dbSchema.Facility))
                }))
            allGqlFacilities = Array.from(uniqueFacilitiesMap.values())

            // Apply any other specified filters directly in memory, as they couldn't be
            // combined with 'array-contains-any' on Firestore.
            if (filters.nameEn) {
                allGqlFacilities = allGqlFacilities.filter(f => f.nameEn === filters.nameEn)
            }
            if (filters.nameJa) {
                allGqlFacilities = allGqlFacilities.filter(f => f.nameJa === filters.nameJa)
            }
            if (filters.createdDate) {
                allGqlFacilities = allGqlFacilities.filter(f => f.createdDate === filters.createdDate)
            }
            if (filters.updatedDate) {
                allGqlFacilities = allGqlFacilities.filter(f => f.updatedDate === filters.updatedDate)
            }

            type ComparablePrimitive = string | number | boolean
            const comparePrimitiveValues = (valA: ComparablePrimitive, valB: ComparablePrimitive): number => {
                if (valA < valB) {
                    return -1
                } else if (valA > valB) {
                    return 1
                }
                return 0
            }

            if (filters.orderBy && Array.isArray(filters.orderBy)) {
                allGqlFacilities.sort((facilityA, facilityB) => {
                    for (const orderCriterion of filters.orderBy!) {
                        if (!orderCriterion) {
                            continue
                        }
                        const fieldName = orderCriterion.fieldToOrder as keyof gqlTypes.Facility
                        const valueA = facilityA[fieldName]
                        const valueB = facilityB[fieldName]
                        let currentComparison = 0

                        if (valueA === undefined || valueA === null) {
                            if (valueB === undefined || valueB === null) {
                                // Both are null/undefined, consider them equal
                                currentComparison = 0
                            } else {
                                // A is null/undefined, B is not, A comes first
                                currentComparison = -1
                            }
                        } else if (valueB === undefined || valueB === null) {
                            // A is not null/undefined, B is, B comes first
                            currentComparison = 1
                        } else {
                            const isValueAComparable = typeof valueA === 'string' || typeof valueA === 'number' || typeof valueA === 'boolean'
                            const isValueBComparable = typeof valueB === 'string' || typeof valueB === 'number' || typeof valueB === 'boolean'

                            if (isValueAComparable && isValueBComparable) {
                                currentComparison = comparePrimitiveValues(valueA as ComparablePrimitive, valueB as ComparablePrimitive)
                            } else {
                                throw new Error(`Sorting by field '${String(fieldName)}' is not supported. It contains a non-comparable type (e.g., object or array).`)
                            }
                        }

                        // Reverse the comparison if the order direction is Descending
                        if (orderCriterion.orderDirection === gqlTypes.OrderDirection.Desc) {
                            currentComparison *= -1
                        }

                        // If a comparison yields a non-zero result, return it immediately.
                        if (currentComparison !== 0) {
                            return currentComparison
                        }
                    }
                    // If all criteria are equal, the facilities are considered equal.
                    return 0
                })
            } else {
                // Default in-memory sorting: sort by 'createdDate' in descending order.
                allGqlFacilities.sort((facilityA, facilityB) => {
                    const createdDateA = new Date(facilityA.createdDate)
                    const createdDateB = new Date(facilityB.createdDate)
                    return createdDateB.getTime() - createdDateA.getTime()
                })
            }

            return { list: allGqlFacilities, hasErrors: false }

        } else {
            // Standard Firestore query path
            if (filters.nameEn) {
                queryRef = queryRef.where('nameEn', '==', filters.nameEn)
            }
            if (filters.nameJa) {
                queryRef = queryRef.where('nameJa', '==', filters.nameJa)
            }
            if (filters.createdDate) {
                queryRef = queryRef.where('createdDate', '==', filters.createdDate)
            }
            if (filters.updatedDate) {
                queryRef = queryRef.where('updatedDate', '==', filters.updatedDate)
            }

            // Apply ordering to the Firestore query
            if (filters.orderBy && Array.isArray(filters.orderBy)) {
                filters.orderBy.forEach(order => {
                    if (order) {
                        // Firestore expects field name as string and order direction.
                        queryRef = queryRef.orderBy(order.fieldToOrder as string, order.orderDirection as gqlTypes.OrderDirection)
                    }
                })
            } else {
                // Default Firestore ordering: order by 'createdDate' in descending order.
                queryRef = queryRef.orderBy('createdDate', gqlTypes.OrderDirection.Desc)
            }
            return { query: queryRef, hasErrors: false }
        }
    } catch (error: unknown) {
        logger.error(`ERROR in buildBaseFacilitiesQuery: ${error instanceof Error ? error.message : error}`)
        return {
            hasErrors: true,
            errors: [{
                field: 'buildBaseFacilitiesQuery',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}
