import { DocumentData, Query } from 'firebase-admin/firestore'
import * as gqlTypes from '../src/typeDefs/gqlTypes.js'
import * as dbSchema from '../src/typeDefs/dbSchema.js'
import { dbInstance } from '../src/firebaseDb.js'
import { ErrorCode } from '../src/result.js'
import type { Error } from '../src/result.js'
import { logger } from '../src/logger.js'
import { chunkArray } from './arrayUtils.js'
import { mapDbEntityTogqlEntity } from '../src/services/healthcareProfessionalService-pre-migration.js'


type ComparablePrimitive = string | number | boolean | Date

/**
 * Determines which filters are present and calculates dependencies for processing.
 * This helps centralize the logic for deciding if in-memory processing is required.
 * @param filters The search filters provided by the user.
 * @returns An object containing boolean flags for filter presence and processing strategy.
 */
function determineFilterPresenceAndDependencies(filters: gqlTypes.HealthcareProfessionalSearchFilters) {
    const hasSpecialtiesFilter = filters.specialties && filters.specialties.length > 0
    const hasSpokenLanguagesFilter = filters.spokenLanguages && filters.spokenLanguages.length > 0
    const hasDegreesFilter = filters.degrees && filters.degrees.length > 0
    const hasNamesFilter = filters.names && filters.names.length > 0

    // Prioritization for Firestore 'array-contains-any' query.
    const shouldFilterBySpecialties = hasSpecialtiesFilter
    const shouldFilterBySpokenLanguages = hasSpokenLanguagesFilter && !hasSpecialtiesFilter
    const shouldFilterByDegrees = hasDegreesFilter && !hasSpecialtiesFilter && !hasSpokenLanguagesFilter
    const shouldFilterByNames = hasNamesFilter && !hasDegreesFilter
        && !hasSpecialtiesFilter && !hasSpokenLanguagesFilter

    // NOTE: Names filter needs in-memory as well if not primary
    const needsInMemoryProcessing = shouldFilterBySpecialties || shouldFilterBySpokenLanguages || shouldFilterByDegrees || hasNamesFilter

    return {
        hasSpecialtiesFilter,
        hasSpokenLanguagesFilter,
        hasDegreesFilter,
        hasNamesFilter,
        shouldFilterBySpecialties,
        shouldFilterBySpokenLanguages,
        shouldFilterByDegrees,
        shouldFilterByNames,
        needsInMemoryProcessing
    }
}

/**
 * Fetches the initial set of professionals from Firestore into a Map.
 * This function performs the *single* array-based Firestore query allowed.
 * @param filters The search filters.
 * @param filterFlags Flags indicating which filters are active and should be prioritized for the initial fetch.
 * @returns A Map where keys are professional IDs and values are mapped GQL professional objects.
 */
async function fetchInitialProfessionalsIntoMap(
    filters: gqlTypes.HealthcareProfessionalSearchFilters,
    filterFlags: ReturnType<typeof determineFilterPresenceAndDependencies>
): Promise<Map<string, gqlTypes.HealthcareProfessional>> {
    const uniqueProfessionalsMap = new Map<string, gqlTypes.HealthcareProfessional>()
    const { shouldFilterBySpecialties, shouldFilterBySpokenLanguages, shouldFilterByDegrees, shouldFilterByNames } = filterFlags

    if (shouldFilterBySpecialties) {
        const chunks = chunkArray(filters.specialties!, 30)
        const snapshots = await Promise.all(chunks.map(chunk =>
            dbInstance.collection('healthcareProfessionals')
                .where('specialties', 'array-contains-any', chunk)
                .get()))
        snapshots.forEach(snap => snap.forEach(doc =>
            uniqueProfessionalsMap.set(doc.id, mapDbEntityTogqlEntity(doc.data() as dbSchema.HealthcareProfessional))))
    } else if (shouldFilterBySpokenLanguages) {
        const chunks = chunkArray(filters.spokenLanguages!, 30)
        const snapshots = await Promise.all(chunks.map(chunk =>
            dbInstance.collection('healthcareProfessionals')
                .where('spokenLanguages', 'array-contains-any', chunk)
                .get()))
        snapshots.forEach(snap => snap.forEach(doc =>
            uniqueProfessionalsMap.set(doc.id, mapDbEntityTogqlEntity(doc.data() as dbSchema.HealthcareProfessional))))
    } else if (shouldFilterByDegrees) {
        const chunks = chunkArray(filters.degrees!, 30)
        const snapshots = await Promise.all(chunks.map(chunk =>
            dbInstance.collection('healthcareProfessionals')
                .where('degrees', 'array-contains-any', chunk)
                .get()))
        snapshots.forEach(snap => snap.forEach(doc =>
            uniqueProfessionalsMap.set(doc.id, mapDbEntityTogqlEntity(doc.data() as dbSchema.HealthcareProfessional))))
    } else if (shouldFilterByNames) {
        const snapshot = await dbInstance.collection('healthcareProfessionals')
            .where('names', 'array-contains', filters.names![0])
            .get()
        snapshot.forEach(doc =>
            uniqueProfessionalsMap.set(doc.id, mapDbEntityTogqlEntity(doc.data() as dbSchema.HealthcareProfessional)))
    }
    return uniqueProfessionalsMap
}

/**
 * Applies additional filters in memory to a list of healthcare professionals.
 * This is used for filters that could not be applied directly in the Firestore query.
 * @param professionals The list of professionals to filter.
 * @param filters The search filters.
 * @param filterFlags Flags indicating which filters are active.
 * @returns The filtered list of professionals.
 */
function applyInMemoryFilters(
    professionals: gqlTypes.HealthcareProfessional[],
    filters: gqlTypes.HealthcareProfessionalSearchFilters,
    filterFlags: ReturnType<typeof determineFilterPresenceAndDependencies>
): gqlTypes.HealthcareProfessional[] {
    let filteredProfessionals = [...professionals]

    if (filters.createdDate) {
        filteredProfessionals = filteredProfessionals.filter(p => p.createdDate === filters.createdDate)
    }
    if (filters.updatedDate) {
        filteredProfessionals = filteredProfessionals.filter(p => p.updatedDate === filters.updatedDate)
    }

    const { hasSpecialtiesFilter, hasSpokenLanguagesFilter, hasDegreesFilter, hasNamesFilter } = filterFlags

    // Apply secondary array-based filters in memory.
    // This logic ensures that filters are applied hierarchically if a primary
    // 'array-contains-any' filter was used for the Firestore fetch.
    if (hasSpecialtiesFilter) {
        if (hasSpokenLanguagesFilter) {
            filteredProfessionals = filteredProfessionals.filter(professional =>
                professional.spokenLanguages.some(lang => filters.spokenLanguages?.includes(lang)))
        }
        if (hasDegreesFilter) {
            filteredProfessionals = filteredProfessionals.filter(professional =>
                professional.degrees.some(degree => filters.degrees?.includes(degree)))
        }
        if (hasNamesFilter) {
            const filterName = filters.names![0]
            filteredProfessionals = filteredProfessionals.filter(professional =>
                professional.names.some(dbName =>
                    dbName.firstName === filterName.firstName &&
                    dbName.lastName === filterName.lastName &&
                    dbName.locale === filterName.locale))
        }
    } else if (hasSpokenLanguagesFilter) {
        if (hasDegreesFilter) {
            filteredProfessionals = filteredProfessionals.filter(professional =>
                professional.degrees.some(degree => filters.degrees?.includes(degree)))
        }
        if (hasNamesFilter) {
            const filterName = filters.names![0]
            filteredProfessionals = filteredProfessionals.filter(professional =>
                professional.names.some(dbName =>
                    dbName.firstName === filterName.firstName &&
                    dbName.lastName === filterName.lastName &&
                    dbName.locale === filterName.locale))
        }
    } else if (hasDegreesFilter) {
        if (hasNamesFilter) {
            const filterName = filters.names![0]
            filteredProfessionals = filteredProfessionals.filter(professional =>
                professional.names.some(dbName =>
                    dbName.firstName === filterName.firstName &&
                    dbName.lastName === filterName.lastName &&
                    dbName.locale === filterName.locale))
        }
    }
    return filteredProfessionals
}

/**
 * Sorts a list of healthcare professionals based on specified criteria.
 * Supports multiple sorting fields and handles specific data types like names.
 * @param professionals The list of professionals to sort.
 * @param orderBy An array of sorting criteria.
 * @returns The sorted list of professionals.
 */
function sortProfessionalsInMemory(
    professionals: gqlTypes.HealthcareProfessional[],
    orderBy?: gqlTypes.OrderBy[] | null
): gqlTypes.HealthcareProfessional[] {
    if (!orderBy || !Array.isArray(orderBy) || orderBy.length === 0) {
        return professionals.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
    }

    return professionals.sort((a, b) => {
        for (const orderCriterion of orderBy) {
            if (!orderCriterion) {
                continue
            }

            const fieldName = orderCriterion.fieldToOrder as keyof gqlTypes.HealthcareProfessional
            const valueA = a[fieldName]
            const valueB = b[fieldName]

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
                // Check if both values are simple, comparable primitive types (string, number, boolean).
                const isValueAComparable = typeof valueA === 'string' || typeof valueA === 'number' || typeof valueA === 'boolean'
                const isValueBComparable = typeof valueB === 'string' || typeof valueB === 'number' || typeof valueB === 'boolean'

                if (isValueAComparable && isValueBComparable) {
                    // Perform standard comparison for primitive types.
                    currentComparison = (valueA as ComparablePrimitive) < (valueB as ComparablePrimitive) ?
                                        -1 : ((valueA as ComparablePrimitive) > (valueB as ComparablePrimitive) ? 1 : 0)
                } else if (fieldName === 'names' && Array.isArray(valueA) && Array.isArray(valueB)) {
                    // --- Special handling for the 'names' field ---
                    // If the field is 'names' and both values are arrays, we apply custom logic.
                    // This handles sorting by a complex type (an array of LocalizedName).
                    const namesA = valueA as gqlTypes.LocalizedName[]
                    const namesB = valueB as gqlTypes.LocalizedName[]
                    const nameA = (namesA[0]?.lastName || '') + (namesA[0]?.firstName || '')
                    const nameB = (namesB[0]?.lastName || '') + (namesB[0]?.firstName || '')
                    currentComparison = nameA.localeCompare(nameB)
                } else {
                    logger.warn(`Sorting by field '${String(fieldName)}' is not fully supported for in-memory comparison or contains a non-comparable type.`)
                    currentComparison = 0
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
        return 0
    })
}

/**
 * Builds the base list of Healthcare Professionals or a Firestore Query reference
 * based on the provided filters. This function handles both in-memory and direct Firestore
 * query strategies, returning the full relevant list or a query before pagination.
 *
 * @param filters The search filters.
 * @returns A Promise resolving to an object containing either:
 * - `list`: An array of all relevant Healthcare Professionals (if in-memory processing was needed).
 * - `query`: A Firestore Query (if direct Firestore query was possible).
 * - `totalCountForQueryPath`: The total count from Firestore if `query` path is used.
 * - `hasErrors`: A boolean indicating if an error occurred.
 * - `errors`: An optional array of custom error objects.
 */
export async function buildBaseHealthcareProfessionalsQuery(filters: gqlTypes.HealthcareProfessionalSearchFilters):
    Promise<{
        list?: gqlTypes.HealthcareProfessional[],
        query?: Query<DocumentData>,
        totalCountForQueryPath?: number, // Total count for the Firestore query path
        hasErrors: boolean,
        errors?: Error[]
    }> {
    try {
        const filterFlags = determineFilterPresenceAndDependencies(filters)

        if (filterFlags.needsInMemoryProcessing) {
            const uniqueProfessionalsMap = await fetchInitialProfessionalsIntoMap(filters, filterFlags)
            let allRelevantProfessionals = Array.from(uniqueProfessionalsMap.values())

            allRelevantProfessionals = applyInMemoryFilters(allRelevantProfessionals, filters, filterFlags)
            allRelevantProfessionals = sortProfessionalsInMemory(allRelevantProfessionals, filters.orderBy)

            // For in-memory path, the full filtered and sorted list is returned.
            // Pagination will be applied by the caller (searchProfessionals).
            return {
                list: allRelevantProfessionals, hasErrors: false
            }
        } else {
            // This is the direct Firestore query path.
            // We need to return the queryRef and its totalCount before limit/offset.
            let searchRef: Query<DocumentData> = dbInstance.collection('healthcareProfessionals')

            // Apply direct equality filters (same as in performFirestoreQuery, but without limit/offset)
            if (filters.createdDate) {
                searchRef = searchRef.where('createdDate', '==', filters.createdDate)
            }
            if (filters.updatedDate) {
                searchRef = searchRef.where('updatedDate', '==', filters.updatedDate)
            }

            // Get the total count of documents matching these filters (before limit/offset)
            const countQuerySnapshot = await searchRef.count().get()
            const totalCount = countQuerySnapshot.data().count

            // Apply sorting criteria directly to the Firestore query.
            if (filters.orderBy && Array.isArray(filters.orderBy)) {
                filters.orderBy.forEach(order => {
                    if (order) {
                        searchRef = searchRef.orderBy(order.fieldToOrder as string, order.orderDirection as gqlTypes.OrderDirection)
                    }
                })
            } else {
                searchRef = searchRef.orderBy('createdDate', gqlTypes.OrderDirection.Desc)
            }

            // Return the query reference and its total count (before pagination)
            return { query: searchRef, totalCountForQueryPath: totalCount, hasErrors: false }
        }
    } catch (error: unknown) {
        logger.error(`ERROR in buildBaseHealthcareProfessionalsQuery: ${error instanceof Error ? error.message : error}`)
        return {
            hasErrors: true,
            errors: [{
                field: 'buildBaseHealthcareProfessionalsQuery',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}
