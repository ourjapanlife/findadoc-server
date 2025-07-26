import { Query, DocumentData, Transaction } from 'firebase-admin/firestore'
import * as gqlTypes from '../typeDefs/gqlTypes.js'
import * as dbSchema from '../typeDefs/dbSchema.js'
import { ErrorCode, Result } from '../result.js'
import { dbInstance } from '../firebaseDb.js'
import { validateNames, validateDegrees, validateProfessionalsSearchInput, validateInsurance, validateSpecialties, validateSpokenLanguages } from '../validation/validationHealthcareProfessional.js'
import { updateFacilitiesWithHealthcareProfessionalIdChanges, validateIdInput } from './facilityService.js'
import { MapDefinedFields } from '../../utils/objectUtils.js'
import { logger } from '../logger.js'
import { createAuditLog } from './auditLogService.js'
import { chunkArray } from '../../utils/arrayUtils.js'

type ComparablePrimitive = string | number | boolean | Date

/**
 * Determines which filters are present and calculates dependencies for processing.
 * This helps centralize the logic for deciding if in-memory processing is required.
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
    const shouldFilterByNames = hasNamesFilter

    // Determines if we need to fetch a broader set of data and perform subsequent filtering/sorting in memory.
    // This is true if any of the array-based filters are used, as they often conflict in Firestore.
    const needsInMemoryProcessing
    = shouldFilterBySpecialties || shouldFilterBySpokenLanguages || shouldFilterByDegrees 
      || shouldFilterByNames || shouldFilterByNames

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
 */
async function fetchInitialProfessionalsIntoMap(
    filters: gqlTypes.HealthcareProfessionalSearchFilters,
    filterFlags: ReturnType<typeof determineFilterPresenceAndDependencies>
): Promise<Map<string, gqlTypes.HealthcareProfessional>> {
    const uniqueProfessionalsMap = new Map<string, gqlTypes.HealthcareProfessional>()
    const { shouldFilterBySpecialties, shouldFilterBySpokenLanguages, shouldFilterByDegrees, shouldFilterByNames }
        = filterFlags

    const queryRef: Query<DocumentData> = dbInstance.collection('healthcareProfessionals')

    /*Execute the primary Firestore query based on the determined priority
    * Note: Firestore only allows one 'array-contains-any' filter per query.
    * It also does not support 'orderBy' or range queries on nested fields within arrays of objects.
    * For 'names' filter, we either rely on another compatible Firestore filter,
    * or fetch all documents (up to a reasonable limit) for in-memory processing.
    * */
    if (shouldFilterBySpecialties) {
        // Chunking for 'array-contains-any' to adhere to Firestore's 30-item limit for IN queries.
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
        /* MODIFIED: When filtering by names, and no other Firestore-compatible array filter is present,
        * we must fetch a broader dataset (potentially all documents) and filter in-memory.
        * Firestore does NOT support 'orderBy' with 'startAt/endAt' on 'names.firstName'/'names.lastName'
        * due to 'names' being an array of objects.
        * The previous attempt with two queries for firstName/lastName was causing issues
        * because it still tried to use range queries without a proper indexable field.
        * Fetch all documents up to a certain limit if no other filters are applied
        * or apply other simple equality filters directly in Firestore.
        * For simplicity, we'll fetch all here, but for very large collections,
        * you might want to add a reasonable limit to this initial fetch or
        * combine it with other direct Firestore filters if available (e.g., by ID range).
        * Note: For large datasets, fetching all documents is inefficient.
        * Denormalization is the proper long-term solution.
        */
        const snapshot = await queryRef.get()

        snapshot.forEach(doc => {
            uniqueProfessionalsMap.set(doc.id, mapDbEntityTogqlEntity(doc.data() as dbSchema.HealthcareProfessional))
        })
    } else {
        // If no array-based filters were explicitly prioritized, fetch all (or apply other basic filters).
        // This path will be taken for simple pagination or when only `createdDate`/`updatedDate` filters are present
        // (which are handled by `performFirestoreQuery`).
        // However, `fetchInitialProfessionalsIntoMap` is primarily for the `needsInMemoryProcessing` path,
        // which implies one of the array filters or names filter is active.
        // If it reaches here without any specific filter, it implies a broad fetch is needed.
        const snapshot = await queryRef.get()

        snapshot.forEach(doc => {
            uniqueProfessionalsMap.set(doc.id, mapDbEntityTogqlEntity(doc.data() as dbSchema.HealthcareProfessional))
        })
    }
    return uniqueProfessionalsMap
}

/**
 * Applies additional filters in memory to a list of healthcare professionals.
 * This is used for filters that could not be applied directly in the Firestore query.
 */
function applyInMemoryFilters(
    professionals: gqlTypes.HealthcareProfessional[],
    filters: gqlTypes.HealthcareProfessionalSearchFilters,
    filterFlags: ReturnType<typeof determineFilterPresenceAndDependencies>
): gqlTypes.HealthcareProfessional[] {
    let filteredProfessionals = [...professionals] // Create a shallow copy to work on

    // Apply date filters in memory (if they were not part of the initial Firestore query)
    if (filters.createdDate) {
        filteredProfessionals = filteredProfessionals.filter(p => p.createdDate === filters.createdDate)
    }
    if (filters.updatedDate) {
        filteredProfessionals = filteredProfessionals.filter(p => p.updatedDate === filters.updatedDate)
    }

    // Apply secondary array-based filters in memory.
    // This logic ensures that filters are applied hierarchically if a primary
    // 'array-contains-any' filter was used for the Firestore fetch.
    const { hasSpecialtiesFilter, hasSpokenLanguagesFilter, hasDegreesFilter, hasNamesFilter } = filterFlags

    // Apply specialties filter if it was NOT handled by the primary Firestore query and is present
    if (hasSpecialtiesFilter && !filterFlags.shouldFilterBySpecialties && filterFlags.needsInMemoryProcessing) {
        filteredProfessionals = filteredProfessionals.filter(professional =>
            professional.specialties.some(specialty => filters.specialties?.includes(specialty)))
    }
    // Apply spokenLanguages filter if it was NOT handled by the primary Firestore query and is present
    if (hasSpokenLanguagesFilter && !filterFlags.shouldFilterBySpokenLanguages && filterFlags.needsInMemoryProcessing) {
        filteredProfessionals = filteredProfessionals.filter(professional =>
            professional.spokenLanguages.some(lang => filters.spokenLanguages?.includes(lang)))
    }
    // Apply degrees filter if it was NOT handled by the primary Firestore query and is present
    if (hasDegreesFilter && !filterFlags.shouldFilterByDegrees && filterFlags.needsInMemoryProcessing) {
        filteredProfessionals = filteredProfessionals.filter(professional =>
            professional.degrees.some(degree => filters.degrees?.includes(degree)))
    }
    // This `hasNamesFilter` block is where the 'names' filtering *always* happens now.
    // The `shouldFilterByNames` flag will be true if `filters.names` is present.
    if (hasNamesFilter) {
        const nameFiltersFromFrontend = filters.names!

        // filteredProfessionals is the result of the initial Firestore fetch or previous in-memory filters.
        // We need to filter this array using an OR logic for each name filter.
        // To achieve an OR, we collect a set of IDs of professionals that match at least one filter.

        const matchedProfessionalIds = new Set<string>()

        // Iterate over each name filter object sent from the frontend
        for (const filterNameInput of nameFiltersFromFrontend) {
            const searchTerm = (filterNameInput.firstName || filterNameInput.lastName || '').toLowerCase()
            const searchLocale = filterNameInput.locale

            if (searchTerm) {
                // Filter the current list of professionals to find those that match the current filter criteria.
                const currentFilterMatches = filteredProfessionals.filter(professional =>
                    professional.names.some(dbName => {
                        const matchesFirstNameStartsWith = dbName.firstName?.toLowerCase().startsWith(searchTerm) 
                                                           || false

                        const matchesLastNameStartsWith = dbName.lastName?.toLowerCase().startsWith(searchTerm) || false

                        const fullName = `${dbName.firstName || ''} ${dbName.lastName || ''}`.trim().toLowerCase()
                        const reverseFullName = `${dbName.lastName || ''} ${dbName.firstName || ''}`.trim().toLowerCase()
                        const matchesAnyPart = fullName.includes(searchTerm) || reverseFullName.includes(searchTerm)

                        // The locale MUST match if it's specified in the current filter entry
                        const matchesLocale = searchLocale ? dbName.locale === searchLocale : true

                        // A professional's name entry in the DB must match the searchTerm and the locale of the current filter
                        return (matchesFirstNameStartsWith || matchesLastNameStartsWith || matchesAnyPart)
                                && matchesLocale
                    }))

                // Add the IDs of the professionals that matched this specific filterNameInput to the set
                for (const match of currentFilterMatches) {
                    matchedProfessionalIds.add(match.id)
                }
            }
        }

        // After checking all filterNameInputs, reduce the list of professionals
        // to only include those whose IDs are in our matchedProfessionalIds set (OR logic across filter entries).
        filteredProfessionals = filteredProfessionals.filter(professional =>
            matchedProfessionalIds.has(professional.id))
    }

    return filteredProfessionals
}

/**
 * Sorts a list of healthcare professionals based on specified criteria.
 * Supports multiple sorting fields and handles specific data types like names.
 */
function sortProfessionalsInMemory(
    professionals: gqlTypes.HealthcareProfessional[],
    orderBy?: gqlTypes.OrderBy[] | null
): gqlTypes.HealthcareProfessional[] {
    // If no specific ordering is provided, default to sorting by createdDate descending.
    if (!orderBy || !Array.isArray(orderBy) || orderBy.length === 0) {
        return professionals.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
    }

    // Sort by multiple criteria defined in orderBy array
    return professionals.sort((a, b) => {
        for (const orderCriterion of orderBy) {
            if (!orderCriterion) {
                continue
            }

            const fieldName = orderCriterion.fieldToOrder as keyof gqlTypes.HealthcareProfessional
            const valueA = a[fieldName]
            const valueB = b[fieldName]

            let currentComparison = 0

            // Handle undefined/null values: put them first in ascending order
            if (valueA === undefined || valueA === null) {
                if (valueB === undefined || valueB === null) {
                    currentComparison = 0
                } else {
                    currentComparison = -1
                }
            } else if (valueB === undefined || valueB === null) {
                currentComparison = 1
            } else {
                // Compare primitive types directly (string, number, boolean)
                const isValueAComparable = typeof valueA === 'string' || typeof valueA === 'number' || typeof valueA === 'boolean'
                const isValueBComparable = typeof valueB === 'string' || typeof valueB === 'number' || typeof valueB === 'boolean'

                if (isValueAComparable && isValueBComparable) {
                    currentComparison = (valueA as ComparablePrimitive) < (valueB as ComparablePrimitive) ? -1
                        : ((valueA as ComparablePrimitive) > (valueB as ComparablePrimitive) ? 1 : 0)
                } else if (fieldName === 'names' && Array.isArray(valueA) && Array.isArray(valueB)) {
                    const namesA = valueA as gqlTypes.LocalizedName[]

                    const namesB = valueB as gqlTypes.LocalizedName[]

                    const nameA = (namesA[0]?.lastName || '') + (namesA[0]?.firstName || '')

                    const nameB = (namesB[0]?.lastName || '') + (namesB[0]?.firstName || '')
                    
                    currentComparison = nameA.localeCompare(nameB)
                } else {
                    // Log a warning if attempting to sort by an unsupported/non-comparable type
                    logger.warn(`Sorting by field '${String(fieldName)}' is not fully supported for in-memory comparison or contains a non-comparable type.`)
                    currentComparison = 0 // Treat as equal for unhandled types
                }
            }

            // Apply sorting direction (Ascending or Descending)
            if (orderCriterion.orderDirection === gqlTypes.OrderDirection.Desc) {
                currentComparison *= -1
            }

            // If a difference is found for the current criterion, return it immediately.
            // Otherwise, continue to the next criterion.
            if (currentComparison !== 0) {
                return currentComparison
            }
        }
        return 0 // If all criteria are equal, the order doesn't matter
    })
}

/**
 * Executes a direct Firestore query for healthcare professionals.
 * This path is taken when complex in-memory filtering is not required.
 */
async function performFirestoreQuery(
    filters: gqlTypes.HealthcareProfessionalSearchFilters
): Promise<{ nodes: gqlTypes.HealthcareProfessional[], totalCount: number }> {
    let searchRef: Query<DocumentData> = dbInstance.collection('healthcareProfessionals')

    // Apply direct equality filters
    if (filters.createdDate) {
        searchRef = searchRef.where('createdDate', '==', filters.createdDate)
    }
    if (filters.updatedDate) {
        searchRef = searchRef.where('updatedDate', '==', filters.updatedDate)
    }

    // Get the total count of documents matching the basic filters.
    // Different to submissionService.ts line 254 i can use .count().get()
    const countQuerySnapshot = await searchRef.count().get()
    const totalCount = countQuerySnapshot.data().count

    // Apply sorting criteria directly to the Firestore query.
    if (filters.orderBy && Array.isArray(filters.orderBy)) {
        filters.orderBy.forEach(order => {
            if (order) {
                searchRef
                    = searchRef.orderBy(order.fieldToOrder as string, order.orderDirection as gqlTypes.OrderDirection)
            }
        })
    } else {
        // Default Firestore order if no specific order is provided
        searchRef = searchRef.orderBy('createdDate', gqlTypes.OrderDirection.Desc)
    }

    // Apply pagination (limit and offset)
    searchRef = searchRef.limit(filters.limit || 20)
    searchRef = searchRef.offset(filters.offset || 0)

    // Execute the query and map the database entities to GraphQL types.
    const dbDocument = await searchRef.get()
    const dbProfessionals = dbDocument.docs

    const nodes = dbProfessionals.map(dbProfessional =>
        mapDbEntityTogqlEntity(dbProfessional.data() as dbSchema.HealthcareProfessional))

    return { nodes, totalCount }
}

/**
 * Gets the Healthcare Professional from the database that matches on the id.
 * @param id A string that matches the id of the Firestore Document for the professional.
 * @param firestoreRef An optional reference to the Firestore database within a transaction. If we don't use this during a transaction, we might not get the latest saved data.
 * @returns A Healthcare Professional object.
 */
export async function getHealthcareProfessionalById(id: string)
    : Promise<Result<gqlTypes.HealthcareProfessional>> {
    try {
        const validationResults = validateIdInput(id)

        if (validationResults.hasErrors) {
            logger.warn(`Validation Error: User passed in invalid id: ${id}}`)
            return validationResults as Result<gqlTypes.HealthcareProfessional>
        }

        const healthcareProfessionalRef = dbInstance.collection('healthcareProfessionals').where('id', '==', id)
        const dbQueryResults = await healthcareProfessionalRef.get()
        const dbDocs = dbQueryResults.docs

        if (dbDocs.length != 1) {
            throw new Error(`No professional found with id: ${id}`)
        }

        const dbEntity = dbDocs[0].data() as dbSchema.HealthcareProfessional
        const convertedEntity = mapDbEntityTogqlEntity(dbEntity)

        return {
            data: convertedEntity,
            hasErrors: false
        }
    } catch (error) {
        logger.error(`ERROR: Error retrieving healthcareProfessional by id ${id}: ${error}`)

        return {
            data: {} as gqlTypes.HealthcareProfessional,
            hasErrors: true,
            errors: [{
                field: 'getHealthcareProfessionalById',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

// --- Main searchProfessionals function (Refactored for lower complexity) ---

/**
 * Searches for healthcare professionals based on provided filters.
 * This function now acts as an orchestrator, delegating complex logic
 * to smaller, more focused, and testable helper functions.
 */
export async function searchProfessionals(filters: gqlTypes.HealthcareProfessionalSearchFilters = {}):
Promise<Result<gqlTypes.HealthcareProfessionalConnection>> {
    try {
        const validationResult = validateProfessionalsSearchInput(filters)

        if (validationResult.hasErrors) {
            return { ...validationResult, data: { nodes: [], totalCount: 0 } } as 
                Result<gqlTypes.HealthcareProfessionalConnection>
        }

        const filterFlags = determineFilterPresenceAndDependencies(filters)
        let finalGqlProfessionalsForNodes: gqlTypes.HealthcareProfessional[] = []
        let finalTotalCount = 0

        if (filterFlags.needsInMemoryProcessing) {
            // --- IN-MEMORY PROCESSING PATH ---
            //Fetch an initial, broader set of professionals from Firestore.
            const uniqueProfessionalsMap = await fetchInitialProfessionalsIntoMap(filters, filterFlags)
            let allRelevantProfessionals = Array.from(uniqueProfessionalsMap.values())

            //Apply remaining filters in memory.
            allRelevantProfessionals = applyInMemoryFilters(allRelevantProfessionals, filters, filterFlags)

            //Sort the professionals in memory.
            allRelevantProfessionals = sortProfessionalsInMemory(allRelevantProfessionals, filters.orderBy)

            //Apply pagination (limit and offset) to the in-memory results.
            finalTotalCount = allRelevantProfessionals.length
            const startIndex = filters.offset || 0
            const endIndex = startIndex + (filters.limit || 20)

            finalGqlProfessionalsForNodes = allRelevantProfessionals.slice(startIndex, endIndex)
        } else {
            // --- DIRECT FIRESTORE QUERY PATH ---
            // If no complex in-memory processing is needed, perform a direct, more efficient Firestore query.
            const { nodes, totalCount } = await performFirestoreQuery(filters)

            finalGqlProfessionalsForNodes = nodes
            finalTotalCount = totalCount
        }
        return {
            data: {
                nodes: finalGqlProfessionalsForNodes,
                totalCount: finalTotalCount
            },
            hasErrors: false
        }
    } catch (error) {
        logger.error(`ERROR: Error retrieving healthcare professionals by filters ${JSON.stringify(filters)}: ${error}`)
        return {
            data: { nodes: [], totalCount: 0 },
            hasErrors: true,
            errors: [{ field: 'searchHealthcareProfessionals', errorCode: ErrorCode.INTERNAL_SERVER_ERROR, httpStatus: 500 }]
        }
    }
}

/**
 * Creates a HealthcareProfessional.
 * - if you add any facilityids, it will update the corresponding facility by adding this healthcare professional id to their list
 * - business logic: a healthcare professional must be associated with at least one facility (otherwise no one can find them)
 * @param input the new HealthcareProfessional object
 * @param healthcareProfessionalRef optional: if you have an open firebase transaction, you can pass it here
 * @returns the newly created HealthcareProfessional so you don't have to query it after
 */
export async function createHealthcareProfessional(
    input: gqlTypes.CreateHealthcareProfessionalInput,
    updatedBy: string
): Promise<Result<gqlTypes.HealthcareProfessional>> {
    try {
        const validationResult = validateCreateProfessionalInput(input)

        if (validationResult.hasErrors) {
            return validationResult as Result<gqlTypes.HealthcareProfessional>
        }

        const healthcareProfessionalRef = dbInstance.collection('healthcareProfessionals').doc()
        const newHealthcareProfessionalId = healthcareProfessionalRef.id
        const newHealthcareProfessional = mapGqlEntityToDbEntity(newHealthcareProfessionalId, input)

        /*
        let's wrap all of our updates in a transaction so we can roll back if anything fails. 
        (for example we don't want to update the professional if updating the associated facility updates fail)
        */
        await dbInstance.runTransaction(async t => {
            //this will update only the fields that are provided and are not undefined.
            await t.set(healthcareProfessionalRef, newHealthcareProfessional, {merge: true})
            
            //let's update all the facilities that should add or remove this professional id from their healthcareProfessionalIds array
            if (newHealthcareProfessional.facilityIds && newHealthcareProfessional.facilityIds.length > 0) {
                const facilityUpdateResults = await processFacilityRelationshipChanges(
                    newHealthcareProfessional.id,
                    newHealthcareProfessional.facilityIds.map(id => ({
                        otherEntityId: id,
                        action: gqlTypes.RelationshipAction.Create
                    } satisfies gqlTypes.Relationship)),
                    t
                )
    
                // if we didn't get it back or have errors, this is an actual error.
                if (facilityUpdateResults.hasErrors || !facilityUpdateResults.data) {
                    throw new Error(`Error updating healthcare professional facilityIds: ${JSON.stringify(facilityUpdateResults.errors)}`)
                }
            }

            // Make sure we store a more readable object in our audit log
            const newHealthcareProfessionalAuditLogEntity = mapDbEntityTogqlEntity(newHealthcareProfessional)

            const createdAuditLog = await createAuditLog(
                gqlTypes.ActionType.Create, 
                gqlTypes.ObjectType.HealthcareProfessional, 
                updatedBy, 
                JSON.stringify(newHealthcareProfessionalAuditLogEntity),
                null,
                t
            )

            if (!createdAuditLog.isSuccesful) {
                throw new Error(`Failed to create and audit log on ${gqlTypes.ActionType.Create}`)
            }
        })
        
        logger.info(`\nDB-CREATE: Created healthcare professional ${newHealthcareProfessionalId}.\nEntity: ${JSON.stringify(newHealthcareProfessional)}`)

        //let's return the newly created professional. Since we have the full entity, no need to do a new query.
        const createdHealthcareProfessionalResult = mapDbEntityTogqlEntity(newHealthcareProfessional)

        return {
            data: createdHealthcareProfessionalResult,
            hasErrors: false
        }
    } catch (error) {
        logger.error(`ERROR: Error creating healthcare professional: ${error}`)

        return {
            data: {} as gqlTypes.HealthcareProfessional,
            hasErrors: true,
            errors: [{
                field: 'createHealthcareProfessional',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

/**
 * Updates a Healthcare Professional in the database based on the id.
 * - It will only update the fields that are provided and are not undefined.
 * - If you want to create a new HealthcareProfessional, you need to call the `createHealthcareProfessional` function separately. This prevents hidden side effects.
 * - If you want to link an existing HealthcareProfessional to a Facility, add the healthcareprofessionalId to the `healthcareProfessionalIds` array.
     Use the action to add or remove the association. If an id isn't in the list, no change will occur.
 * @param facilityId The ID of the facility in the database.
 * @param fieldsToUpdate The values that should be updated. They will be created if they don't exist.
 * @returns The updated Facility.
 */
export const updateHealthcareProfessional = async (
    id: string,
    fieldsToUpdate: Partial<gqlTypes.UpdateHealthcareProfessionalInput>,
    updatedBy: string
): Promise<Result<gqlTypes.HealthcareProfessional>> => {
    try {
        const validationResult = validateUpdateProfessionalInput(fieldsToUpdate)

        if (validationResult.hasErrors) {
            return validationResult as Result<gqlTypes.HealthcareProfessional>
        }

        const professionalRef = dbInstance.collection('healthcareProfessionals').doc(id)
        
        // //let's wrap all of our updates in a transaction so we can roll back if anything fails. (for example we don't want to update the professional if updating the associated facility updates fail)
        const updatedProfessional = await dbInstance.runTransaction(async t => {
            const dbDocument = await t.get(professionalRef)
            const dbProfessionalToUpdate = dbDocument.data() as dbSchema.HealthcareProfessional
            const oldHealthcareProfessionalDataAuditLogEntity: string = JSON.stringify(
                mapDbEntityTogqlEntity(dbProfessionalToUpdate)
            )
            
            const originalFacilityIdsForHealthcareProfessional
                = dbProfessionalToUpdate.facilityIds

            //let's update the fields that were provided
            MapDefinedFields(fieldsToUpdate, dbProfessionalToUpdate)
            
            //Business rule: always timestamp when the entity was updated.
            dbProfessionalToUpdate.updatedDate = new Date().toISOString()
            
            //let's update all the facilities that should add or remove this professional id from their healthcareProfessionalIds array
            if (fieldsToUpdate.facilityIds && fieldsToUpdate.facilityIds.length > 0) {
                const facilityUpdateResults = await processFacilityRelationshipChanges(
                    dbProfessionalToUpdate.id,
                    fieldsToUpdate.facilityIds,
                    t,
                    originalFacilityIdsForHealthcareProfessional ?? []
                )
    
                // if we didn't get it back or have errors, this is an actual error.
                if (facilityUpdateResults.hasErrors || !facilityUpdateResults.data) {
                    throw new Error(`ERROR: Error updating healthcare professional facilityIds: ${JSON.stringify(facilityUpdateResults.errors)}`)
                }
    
                //let's update the professional with the new facility ids
                dbProfessionalToUpdate.facilityIds = facilityUpdateResults.data
            }

            t.set(professionalRef, dbProfessionalToUpdate, { merge: true })

            // Make sure we store a more readable object in our audit log
            const updatedHealthcareProfessionalAuditLogEntity: string = JSON.stringify(
                mapDbEntityTogqlEntity(dbProfessionalToUpdate)
            )

            const createdAuditLog = await createAuditLog(
                gqlTypes.ActionType.Update, 
                gqlTypes.ObjectType.HealthcareProfessional, 
                updatedBy,
                updatedHealthcareProfessionalAuditLogEntity,
                oldHealthcareProfessionalDataAuditLogEntity,
                t
            )

            if (!createdAuditLog.isSuccesful) {
                throw new Error(`Faild to create and audit log on ${gqlTypes.ActionType.Update}`) 
            }

            return dbProfessionalToUpdate
        })
        
        logger.info(`\nDB-UPDATE: Updated healthcare professional ${id}.\nEntity: ${JSON.stringify(updatedProfessional)}`)
        const updatedProfessionalResult = await getHealthcareProfessionalById(id)

        // if we didn't get it back or have errors, this is an actual error.
        if (updatedProfessionalResult.hasErrors || !updatedProfessionalResult.data) {
            throw new Error(`ERROR: Error updating healthcare professional: ${JSON.stringify(updatedProfessionalResult.errors)}`)
        }

        return {
            data: updatedProfessionalResult.data,
            hasErrors: false
        }
    } catch (error) {
        logger.error(`ERROR: Error updating healthcareProfessional ${id}: ${error}`)

        return {
            data: {} as gqlTypes.HealthcareProfessional,
            hasErrors: true,
            errors: [{
                field: 'updateHealthcareProfessional',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

/**
 * This deletes a Healthcare Professional from the database. If the Healthcare Professional doesn't exist, it will return a validation error.
 * @param id The ID of the professional in the database to delete.
 */
export async function deleteHealthcareProfessional(id: string, updatedBy: string)
    : Promise<Result<gqlTypes.DeleteResult>> {
    try {
        const dbRef = dbInstance.collection('healthcareProfessionals')
        const query = dbRef.where('id', '==', id)
        const dbDocument = await query.get()
        
        if (dbDocument.empty) {
            logger.warn(`Validation Error: User tried deleting non-existant healthcare professional: ${id}`)
            return {
                data: {
                    isSuccessful: false
                },
                hasErrors: true,
                errors: [{
                    field: 'deleteHealthcareProfessional',
                    errorCode: ErrorCode.INVALID_ID,
                    httpStatus: 404
                }]
            }
        }
        
        if (dbDocument.docs.length > 1) {
            logger.error(`ERROR: Found multiple healthcare professionals with id ${id}. This should never happen.`)
            
            return {
                data: {
                    isSuccessful: false
                },
                hasErrors: true,
                errors: [{
                    field: 'deleteFacility',
                    errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                    httpStatus: 500
                }]
            }
        }
        
        const professional = dbDocument.docs[0].data() as dbSchema.HealthcareProfessional
        
        /*
        let's wrap all of our updates in a transaction so we can roll back if anything fails. 
        (for example we don't want to update the professional if updating the associated facility updates fail)
        */
        await dbInstance.runTransaction(async t => {
            //let's update all the facilities that should remove this healthcareProfessionalId from their healthcareProfessionalIds array
            const facilityUpdateResults = await processFacilityRelationshipChanges(
                id,
                professional.facilityIds.map(
                    facilityId => ({
                        otherEntityId: facilityId,
                        action: gqlTypes.RelationshipAction.Delete
                    } satisfies gqlTypes.Relationship)
                ),
                t
            )

            // if we have errors, this is an actual error.
            if (facilityUpdateResults.hasErrors) {
                throw new Error(`ERROR: Error updating healthcare professional facilityIds: ${JSON.stringify(facilityUpdateResults.errors)}`)
            }

            t.delete(dbDocument.docs[0].ref)

            // Make sure we store a more readable object in our audit log
            const oldHealthcareProfessionalDataAuditLogEntity: string = JSON.stringify(
                mapDbEntityTogqlEntity(professional)
            )

            const createdAuditLog = await createAuditLog(
                gqlTypes.ActionType.Delete, 
                gqlTypes.ObjectType.HealthcareProfessional, 
                updatedBy,
                null,
                JSON.stringify(oldHealthcareProfessionalDataAuditLogEntity),
                t
            )

            if (!createdAuditLog.isSuccesful) {
                throw new Error(`Faild to create and audit log on ${gqlTypes.ActionType.Delete}`) 
            }
        })

        logger.info(`\nDB-DELETE: healthcare professional ${id} was deleted.\nEntity: ${JSON.stringify(dbDocument)}`)

        return {
            data: {
                isSuccessful: true
            },
            hasErrors: false
        }
    } catch (error) {
        logger.error(`ERROR: Error deleting professional ${id}: ${error}`)

        return {
            data: {
                isSuccessful: false
            },
            hasErrors: true,
            errors: [{
                field: 'deleteFacility',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

/**
 * Updates all the facilities that have an id in the facilityIds array. It will add or delete based on the action provided.
 * @param healthcareProfessionalId The ID of the healthcare professional in the database.
 * @param facilityRelationshipChanges The changes to the facility relationships.
 * @param batch - The batch that we add the db writes to. The parent controls when the batch is committed.
 * @param originalFacilityIds The original facility ids for the healthcare professional.
 * @returns The updated facility ids for the healthcare professional based on the action.
*/
async function processFacilityRelationshipChanges(healthcareProfessionalId: string,
    facilityRelationshipChanges: gqlTypes.Relationship[],
    t: Transaction,
    originalFacilityIds: string[] = [])
    : Promise<Result<string[]>> {
    // deep clone the array so we don't modify the original
    let updatedFacilityIdsArray = [...originalFacilityIds]

    facilityRelationshipChanges.forEach(change => {
        switch (change.action) {
            case gqlTypes.RelationshipAction.Create:
                updatedFacilityIdsArray.push(change.otherEntityId)
                break
            case gqlTypes.RelationshipAction.Delete:
                updatedFacilityIdsArray = updatedFacilityIdsArray.filter(id => id !== change.otherEntityId)
                break
            default:
                break
        }
    })

    //update all the associated facilities (note: this should be contained within a transaction with the professional  so we can roll back if anything fails)
    const facilityUpdateResults = await updateFacilitiesWithHealthcareProfessionalIdChanges(
        facilityRelationshipChanges,
        healthcareProfessionalId,
        t
    )

    return {
        //let's return the updated facilityIds array so we can update the healthcare professional
        data: updatedFacilityIdsArray,
        hasErrors: facilityUpdateResults.hasErrors,
        errors: facilityUpdateResults.errors
    }
}

/**
    * This function updates the facilityIds list for each healthcare professional listed.
    * Based on the action, it will add or remove the facility id from the existing list of facilityIds.
    * @param professionalRelationshipsToUpdate - The list of healthcare professionals to update.
    * @param facilityId - The id of the facility that is being added or removed.
    * @param batch - The batch that we add the db writes to. The parent controls when the batch is committed.
    * @returns Result containing any errors that occurred.
*/

export async function updateHealthcareProfessionalsWithFacilityIdChanges(
    professionalRelationshipsToUpdate: gqlTypes.Relationship[],
    facilityId: string,
    t: Transaction
): Promise<Result<void>> {
    try {
        if (!professionalRelationshipsToUpdate || professionalRelationshipsToUpdate.length < 1) {
            return {
                data: undefined,
                hasErrors: false
            }
        }

        const MAX_BATCH_SIZE = 30

        const allProfessionalIds = professionalRelationshipsToUpdate.map(f => f.otherEntityId)
        const chunks = chunkArray(allProfessionalIds, MAX_BATCH_SIZE)

        // A Firestore transaction requires all reads before any writes — esegui tutte le query prima
        const querySnapshots = await Promise.all(
            chunks.map(chunk =>
                dbInstance.collection('healthcareProfessionals').where('id', 'in', chunk).get())
        )

        const allProfessionalDocuments = querySnapshots.flatMap(snapshot => snapshot.docs)
        //const professionalsQuery = dbInstance.collection('healthcareProfessionals').where('id', 'in', professionalRelationshipsToUpdate.map(f => f.otherEntityId))
        // A Firestore transaction requires all reads to happen before any writes, so we'll query all the professionals first.
        //const allProfessionalDocuments = await professionalsQuery.get()
        const dbProfessionalsToUpdate = allProfessionalDocuments.map(document => ({
            ref: document.ref,
            data: document.data()
        }))

        dbProfessionalsToUpdate.forEach(({ ref, data: dbProfessional }) => {
            const matchingRelationship
                = professionalRelationshipsToUpdate.find(f => f.otherEntityId === dbProfessional.id)
            const dbProfessionalData = dbProfessional as dbSchema.HealthcareProfessional
            
            if (!matchingRelationship) {
                throw new Error(`ERROR: updating professional facilityId list for ${dbProfessional.id}. Could not find matching relationship.`)
            }

            //we want to add or remove the healthcareprofessional id from the list based on the action.
            switch (matchingRelationship.action) {
                case gqlTypes.RelationshipAction.Create:
                    dbProfessionalData.facilityIds.push(facilityId)
                    break
                case gqlTypes.RelationshipAction.Delete:
                    dbProfessionalData.facilityIds = dbProfessionalData.facilityIds
                        .filter(id => id !== facilityId)
                    break
                default:
                    logger.error(`ERROR: updating healthcare professional's facilityId list for ${matchingRelationship.otherEntityId}. Contained an invalid relationship action of ${matchingRelationship.action}`)
                    break
            }

            //business rule: we always timestamp when the entity was updated.
            dbProfessionalData.updatedDate = new Date().toISOString()
            //This will add the record update to the transaction, but we don't want to commit until later when all changes are done
            t.set(ref, dbProfessionalData, { merge: true })
            logger.info(`\nDB-UPDATE: Updated healthcare professional ${dbProfessionalData.id} related facility ids. Updated values: ${JSON.stringify(dbProfessionalData)}`)
        })

        return {
            data: undefined,
            hasErrors: false
        }
    } catch (error) {
        logger.error(`Error updating healthcareProfessional facilityId list: ${error}`)

        return {
            data: undefined,
            hasErrors: true,
            errors: [{
                field: 'updateHealthcareprofessionalFacilityAssociations',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

function mapGqlEntityToDbEntity(newHealthcareProfessionalId: string,
    input: gqlTypes.CreateHealthcareProfessionalInput)
    : dbSchema.HealthcareProfessional {
    return {
        id: newHealthcareProfessionalId,
        acceptedInsurance: input.acceptedInsurance as gqlTypes.Insurance[],
        degrees: input.degrees as dbSchema.Degree[],
        names: input.names as dbSchema.LocalizedName[],
        specialties: input.specialties as dbSchema.Specialty[],
        spokenLanguages: input.spokenLanguages as gqlTypes.Locale[],
        facilityIds: input.facilityIds ?? [] as string[],
        //business rule: createdDate cannot be set by the user.
        createdDate: new Date().toISOString(),
        //business rule: updatedDate is updated on every change.
        updatedDate: new Date().toISOString(),
        additionalInfoForPatients: input.additionalInfoForPatients ?? ''
    } satisfies dbSchema.HealthcareProfessional
}

function mapDbEntityTogqlEntity(dbEntity: DocumentData)
    : gqlTypes.HealthcareProfessional {
    const gqlEntity = {
        id: dbEntity.id,
        names: dbEntity.names,
        degrees: dbEntity.degrees,
        spokenLanguages: dbEntity.spokenLanguages,
        specialties: dbEntity.specialties,
        acceptedInsurance: dbEntity.acceptedInsurance,
        facilityIds: dbEntity.facilityIds,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        additionalInfoForPatients: dbEntity.additionalInfoForPatients
    } satisfies gqlTypes.HealthcareProfessional

    return gqlEntity
}

function validateUpdateProfessionalInput(input: Partial<gqlTypes.UpdateHealthcareProfessionalInput>)
    : Result<unknown> {
    const validationResults: Result<unknown> = {
        data: undefined,
        hasErrors: false,
        errors: []
    }

    if (Object.keys(input).length < 1) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'input',
            errorCode: ErrorCode.MISSING_INPUT,
            httpStatus: 400
        })
        return validationResults
    }

    if (input.names) {
        validateNames(input.names, validationResults)
    }
    if (input.degrees) {
        validateDegrees(input.degrees, validationResults)
    }

    if (input.specialties) {
        validateSpecialties(input.specialties, validationResults)
    }

    if (input.acceptedInsurance) {
        validateInsurance(input.acceptedInsurance, validationResults)
    }

    if (input.spokenLanguages) {
        validateSpokenLanguages(input.spokenLanguages, validationResults)
    }

    return validationResults
}

function validateCreateProfessionalInput(input: gqlTypes.CreateHealthcareProfessionalInput)
    : Result<unknown> {
    const validationResults: Result<unknown> = {
        data: undefined,
        hasErrors: false,
        errors: []
    }

    //business rule: at least one facility id is required
    if (!input.facilityIds || input.facilityIds.length < 1) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'facilityIds',
            errorCode: ErrorCode.CREATEPROFFESIONAL_FACILITYIDS_REQUIRED,
            httpStatus: 400
        })
    }

    validateNames(input.names, validationResults)
    validateDegrees(input.degrees, validationResults)
    validateSpecialties(input.specialties, validationResults)
    validateInsurance(input.acceptedInsurance, validationResults)
    validateSpokenLanguages(input.spokenLanguages, validationResults)

    return validationResults
}
