import * as gqlTypes from '../typeDefs/gqlTypes.js'
import * as dbSchema from '../typeDefs/dbSchema.js'
import { db } from '../kyselyClient.js'
import { ErrorCode, Result } from '../result.js'
import { logger } from '../logger.js'
import { getSupabaseClient } from '../supabaseClient.js'
import { createAuditLog } from './auditLogServiceSupabase.js'
import { validateIdInput, validateCreateFacilityInput, validateFacilitiesSearchInput, validateUpdateFacilityInput } from '../validation/validateFacility.js'

// Capabilities for Supabase-like query builders
export type HasIlike = {
    ilike: (column: string, pattern: string) => unknown
}

// Builds a partial update patch for Facility rows.
export function buildFacilityUpdatePatch(fields: Partial<gqlTypes.UpdateFacilityInput>) {
    const updatePatch: Record<string, unknown> = {}

    // Map only requested field
    if (fields.nameEn !== undefined) {
        updatePatch.nameEn = fields.nameEn
    }
    if (fields.nameJa !== undefined) {
        updatePatch.nameJa = fields.nameJa
    }
    if (fields.contact !== undefined) {
        updatePatch.contact = fields.contact
    }
    if (fields.mapLatitude !== undefined) {
        updatePatch.mapLatitude = fields.mapLatitude
    }
    if (fields.mapLongitude !== undefined) {
        updatePatch.mapLongitude = fields.mapLongitude
    }

    // Business rule: always timestamp when the entity is updated
    updatePatch.updatedDate = new Date().toISOString()

    return updatePatch
}

/**
 * Applies text-based filters to a Supabase query builder for Facilities.
 * Can be reused by both search and count queries.
 *
 * @param facilitySelect - The base query builder instance.
 * @param filters - The facility search filters from GraphQL input.
 * @returns The same query builder instance, modified with applied filters.
 */
export function applyFacilityFilters<B extends HasIlike>(
  facilitySelect: B,
  filters: gqlTypes.FacilitySearchFilters
): B {
    let query = facilitySelect

    // Text filters (case-insensitive contains)
    if (filters.nameEn) {
        query = query.ilike('nameEn', `%${filters.nameEn}%`) as B
    }
    if (filters.nameJa) {
        query = query.ilike('nameJa', `%${filters.nameJa}%`) as B
    }

    return query
}

/**
 * Gets the Facility from the database that matches on the id.
 * @param id A string that matches the id of the Supabase for the Facility.
 * @returns A Facility object.
 */
export const getFacilityById = async (
    id: string
): Promise<Result<gqlTypes.Facility>> => {
    try {
        // Validate the incoming id
        const validationResult = validateIdInput(id)

        if (validationResult.hasErrors) {
            logger.warn(`Validation Error: User passed in invalid facility id: ${id}`)
            return {
                data: {} as gqlTypes.Facility,
                hasErrors: true,
                errors: (validationResult.errors ?? []).map(err => ({
                    ...err,
                    field: 'getFacilityById'
                }))
            }
        }

        const supabase = getSupabaseClient()

        // Fetch the facility row
        const { data: facilityRow, error: facilityRowError } = await supabase
            .from('facilities')
            .select('*')
            .eq('id', id)
            .single()

        // Supabase says "no rows" and tests want INTERNAL_SERVER_ERROR, not NOT_FOUND.
        if (facilityRowError?.code === 'PGRST116' || !facilityRow) {
            return {
                data: {} as gqlTypes.Facility,
                hasErrors: true,
                errors: [{
                    field: 'getFacilityById',
                    errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                    httpStatus: 500
                }]
            }
        }

        if (facilityRowError) {
            throw facilityRowError
        }

        // Fetch related HP IDs from the join table
        const { data: relatedRows, error: relatedRowsError } = await supabase
            .from('hps_facilities')
            .select('hps_id')
            .eq('facilities_id', id)

        if (relatedRowsError) {
            throw relatedRowsError
        }

        const healthcareProfessionalIds = (relatedRows ?? []).map(
            row => row.hps_id as string
        )

        // Merge the scalar facility data with the relational IDs
        const dbFacilityModel: dbSchema.Facility = {
            ...(facilityRow as dbSchema.DbFacilityRow),
            healthcareProfessionalIds
        }

        return {
            data: mapDbEntityTogqlEntity(dbFacilityModel),
            hasErrors: false
        }
    } catch (error) {
        logger.error(`ERROR: Error retrieving facility by id: ${error}`)
        return {
            data: {} as gqlTypes.Facility,
            hasErrors: true,
            errors: [{
                field: 'getFacilityById',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

/**
 * Returns the set of Facility IDs that are linked to any of the given HP IDs.
 * Why a Set?
 * - A single facility can be linked to multiple HPs. Using a Set automatically
 * removes duplicates so the caller gets unique facility IDs.
 * @param hpIds Array of Healthcare Professional IDs to look up.
 * @returns A Set of facility IDs that have at least one relation with the provided HPs.
 * @throws Propagates a Supabase/PostgREST error if the query fails.
 */
async function getFacilityIdsByHpIds(hpIds: string[]): Promise<Set<string>> {
    const supabase = getSupabaseClient()
    // Query the junction table to find all facility ids related to the given HP ids
    const { data, error } = await supabase
        .from('hps_facilities')
        .select('facilities_id')
        .in('hps_id', hpIds)

    // If the DB call failed, bubble up the error to the caller
    if (error) {
        throw error
    }

    // Use a Set to ensure each facility id appears only once
    const idsList = new Set<string>()

    //data may be null
    for (const row of data ?? []) {
        if (row.facilities_id) {
            idsList.add(row.facilities_id as string)
        }
    }
    return idsList
}

/**
 * Creates a new Facility. 
 * Any healthcareprofessionalIds will build an association, but it won't create a healthcare professional. 
 * You need to call the createHealthcareProfessional function separately. This prevents hidden side effects.
 * @param facilityInput 
 * @returns A Facility with a list containing the ID of the initial HealthcareProfessional that was created.
 */
export async function createFacility(
    facilityInput: gqlTypes.CreateFacilityInput,
    updatedBy: string
): Promise<Result<gqlTypes.Facility>> {
    try {
        // Validate input before attempting database operations
        const validationResult = validateCreateFacilityInput(facilityInput)

        if (validationResult.hasErrors) {
            return validationResult as Result<gqlTypes.Facility>
        }

        // Extract HP IDs for convenience
        const hpIds = (facilityInput.healthcareProfessionalIds ?? []) as string[]

        // Execute all database operations in a single atomic transaction
        // If any operation fails, everything is automatically rolled back
        const result = await db.transaction().execute(async (trx) => {
            // Insert facility (PostgreSQL generates UUID automatically)
            const insertedFacility = await trx
                .insertInto('facilities')
                .values({
                    nameEn: facilityInput.nameEn,
                    nameJa: facilityInput.nameJa,
                    contact: facilityInput.contact,
                    mapLatitude: facilityInput.mapLatitude ?? 0,
                    mapLongitude: facilityInput.mapLongitude ?? 0,
                    createdDate: new Date().toISOString(),
                    updatedDate: new Date().toISOString()
                })
                .returningAll()
                .executeTakeFirstOrThrow() // Throws if insert fails

            // Create associations with healthcare professionals (if any)
            if (hpIds.length > 0) {
                // Build join table rows
                const joinRows = hpIds.map(hpsId => ({
                    hps_id: hpsId,
                    facilities_id: insertedFacility.id
                }))

                // Insert relations into junction table
                // onConflict handles duplicate prevention (composite primary key)
                await trx
                    .insertInto('hps_facilities')
                    .values(joinRows)
                    .onConflict((oc) => oc
                        .columns(['hps_id', 'facilities_id'])
                        .doNothing() // Ignore duplicates instead of failing, similar to ignoreDuplicates on supabase
                    )
                    .execute()
            }

            // Create audit log entry
            await createAuditLog(trx, {
                actionType: gqlTypes.ActionType.Create,
                objectType: gqlTypes.ObjectType.Facility,
                updatedBy,
                newValue: { ...insertedFacility, healthcareProfessionalIds: hpIds }
            })

            // Return the inserted facility for mapping
            return insertedFacility
        })

        // Map database result to GraphQL type
        // This separates database concerns from API concerns
        const dbFacility: dbSchema.Facility = {
            ...result,
            contact: result.contact as gqlTypes.Contact,
            healthcareProfessionalIds: hpIds
        }

        const gqlFacility = mapDbEntityTogqlEntity(dbFacility)

        logger.info(`\nDB-CREATE: CREATE facility ${result.id}.\nEntity: ${JSON.stringify(result)}`)

        return {
            data: gqlFacility,
            hasErrors: false
        }
    } catch (error) {
        // If we reach here, the transaction was automatically rolled back
        // No need for manual cleanup - the database guarantees consistency
        logger.error(`ERROR: Error creating facility: ${error}`)

        return {
            data: {} as gqlTypes.Facility,
            hasErrors: true,
            errors: [{
                field: 'createFacility',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

/**
 * Searches for a paginated list of Facilities based on various criteria.
 * This function handles multi-step filtering:
 * - It optionally applies a filter based on associated Healthcare Professional IDs (HP)
 * by performing a preliminary lookup to get a subset of Facility IDs.
 * - It applies scalar filters, ordering, and pagination to the main facilities table.
 * @param filters Optional search and pagination filters for Facilities.
 * @returns A Promise that resolves to a Result object containing an array of Facilities.
 */
export async function searchFacilities(
  filters: gqlTypes.FacilitySearchFilters = {}
): Promise<Result<gqlTypes.Facility[]>> {
    try {
        const validationResult = validateFacilitiesSearchInput(filters)

        if (validationResult.hasErrors) {
            return { data: [], hasErrors: true, errors: validationResult.errors }
        }

        const limit = filters.limit ?? 20
        const offset = filters.offset ?? 0

        // If there is a filter on HPs, first get the facility IDs from the join table.
        let facilityIdSubset: string[] | null = null

        if (filters.healthcareProfessionalIds?.length) {
            // Fetch all Facility IDs associated with the given HP IDs from the join table.
            const idSet = await getFacilityIdsByHpIds(filters.healthcareProfessionalIds as string[])

            if (idSet.size === 0) {
                return { data: [], hasErrors: false }
            }
            // Convert the Set to an Array for use in the main query `IN` later
            facilityIdSubset = Array.from(idSet)
        }

        const supabase = getSupabaseClient()

        // Base query on facilities + scalar filters.
        let baseQuery = applyFacilityFilters(
            supabase.from('facilities').select('*'),
            filters
        )

        // If there is a subset of IDs (from HPs), filter with IN.
        if (facilityIdSubset) {
            baseQuery = baseQuery.in('id', facilityIdSubset)
        }

        // Determine the field and direction for ordering, falling back to nameEn if no order is specified
        const orderBy = filters.orderBy?.[0]

        if (orderBy?.fieldToOrder) {
            baseQuery = baseQuery.order(orderBy.fieldToOrder, { ascending: orderBy.orderDirection !== 'desc' })
        } else {
            baseQuery = baseQuery.order('nameEn', { ascending: true })
        }

        // Execute the main query, applying the offset and limit for the current page
        const { data: paginationRows, error: paginationRowsError } = await baseQuery.range(offset, offset + limit - 1)

        if (paginationRowsError) {
            throw paginationRowsError
        }

        if (!paginationRows || paginationRows.length === 0) {
            return { data: [], hasErrors: false }
        }

        // Extract the IDs of only the facilities that are present on the current, paginated results
        const facilityIds = paginationRows.map(relatedRow => relatedRow.id as string)

        // Fetching ALL Healthcare Professional (HP) relationships for the facilities on the current page with a SINGLE query
        const { data: hpRelationsForFacilities, error: hpRelationsForFacilitiesError } = await supabase
            .from('hps_facilities')
            .select('hps_id, facilities_id')
            .in('facilities_id', facilityIds)

        if (hpRelationsForFacilitiesError) { throw hpRelationsForFacilitiesError }

        // Map for avoid N+1 issue, used like a lookup table because O(1)
        const hpIdsByFacility = new Map<string, string[]>()

        for (const relationshipRow of hpRelationsForFacilities ?? []) {
            const facilityId = relationshipRow.facilities_id as string
            // All the Hps ID related to the Facility ID
            const list = hpIdsByFacility.get(facilityId) ?? []

            // Add the current HP ID to the list associated with the facility.
            list.push(relationshipRow.hps_id as string)
            hpIdsByFacility.set(facilityId, list)
        }

        // Map the paginated DB rows to the final GraphQL shape, injecting the associated HP IDs
        const list: gqlTypes.Facility[] = (paginationRows ?? []).map((facility: dbSchema.DbFacilityRow) => {
            const dbFacility: dbSchema.Facility = {
                ...facility,
                healthcareProfessionalIds: hpIdsByFacility.get(facility.id) ?? []
            }

            return mapDbEntityTogqlEntity(dbFacility)
        })

        return { data: list, hasErrors: false }
    } catch (err) {
        logger.error(`ERROR: searchFacilities ${JSON.stringify(filters)} -> ${err}`)
        return {
            data: [],
            hasErrors: true,
            errors: [{
                field: 'searchFacilities',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

/**
 * Counts the total number of Facilities matching the provided filters.
 * This function applies direct scalar filters to the professional data
 * and returns the exact count of the results.
 * add an extra filter if we wanna search only a type of hps
 * @param filters An optional object of search filters for Facilities
 * @returns A Promise that resolves to a Result object containing the count (number) or errors.
 */
export async function countFacilities(
  filters: gqlTypes.FacilitySearchFilters = {}
): Promise<Result<number>> {
    try {
        const validationResult = validateFacilitiesSearchInput(filters)

        if (validationResult.hasErrors) {
            return { data: 0, hasErrors: true, errors: validationResult.errors }
        }

        const supabase = getSupabaseClient()

        // Base query on facilities + scalar filters
        let baseQuery = applyFacilityFilters(
            supabase.from('facilities').select('*', { count: 'exact', head: true }),
            filters
        )

        // filter on HPs (as in searchFacilities)
        if (filters.healthcareProfessionalIds?.length) {
            const idSet = await getFacilityIdsByHpIds(filters.healthcareProfessionalIds as string[])

            if (idSet.size === 0) {
                return { data: 0, hasErrors: false }
            }
            baseQuery = baseQuery.in('id', Array.from(idSet))
        }

        const { count: facilyCount, error: facilityCountError } = await baseQuery

        if (facilityCountError) { throw facilityCountError }

        return { data: facilyCount ?? 0, hasErrors: false }
    } catch (err) {
        logger.error(`ERROR: countFacilities ${JSON.stringify(filters)} -> ${err}`)
        return {
            data: 0,
            hasErrors: true,
            errors: [{
                field: 'countFacilities',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

/**
 * Updates a Facility in the database based on the id.
 * - Scalar fields are updated on facilities
 * - Relationship changes (HPs) are applied in hps_facilities via the provided actions
 * - Returns the updated Facility
*/
export const updateFacility = async (
    facilityId: string,
    fieldsToUpdate: Partial<gqlTypes.UpdateFacilityInput>,
    updatedBy: string
): Promise<Result<gqlTypes.Facility>> => {
    try {
        // Validate input before attempting database operations
        const validationResult = validateUpdateFacilityInput(fieldsToUpdate)

        if (validationResult.hasErrors) {
            return validationResult as Result<gqlTypes.Facility>
        }

        // Execute all database operations in a single atomic transaction
        const result = await db.transaction().execute(async (trx) => {
            // Step 1: Fetch the current facility state (for audit log and validation)
            const originalFacility = await trx
                .selectFrom('facilities')
                .selectAll()
                .where('id', '=', facilityId)
                .executeTakeFirst()

            if (!originalFacility) {
                throw new Error(`Could not find facility with id ${facilityId} to update.`)
            }

            // Fetch original HP relations
            const originalRelations = await trx
                .selectFrom('hps_facilities')
                .select('hps_id')
                .where('facilities_id', '=', facilityId)
                .execute()

            const originalHpIds = originalRelations.map(r => r.hps_id)

            // Update scalar fields on facilities table (if any provided)
            const updatePayload = buildFacilityUpdatePatch(fieldsToUpdate)
            
            let updatedFacility = originalFacility

            if (Object.keys(updatePayload).length > 1) {
                // Has fields to update beyond just updatedDate
                updatedFacility = await trx
                    .updateTable('facilities')
                    .set(updatePayload)
                    .where('id', '=', facilityId)
                    .returningAll()
                    .executeTakeFirstOrThrow()

                logger.info(`DB-UPDATE: facilities ${facilityId} scalar fields updated.`)
            } else {
                // No scalar fields to update, but touch updatedDate to track the change
                updatedFacility = await trx
                    .updateTable('facilities')
                    .set({ updatedDate: new Date().toISOString() })
                    .where('id', '=', facilityId)
                    .returningAll()
                    .executeTakeFirstOrThrow()
            }

            // Update relationships (if any provided)
            let finalHpIds = originalHpIds

            if (fieldsToUpdate.healthcareProfessionalIds && fieldsToUpdate.healthcareProfessionalIds.length > 0) {
                finalHpIds = await processHealthcareProfessionalRelationshipChanges(
                    trx,
                    facilityId,
                    fieldsToUpdate.healthcareProfessionalIds
                )
            }

            // Create audit log entry
            // If this fails, the entire transaction (including updates) is rolled back
            await createAuditLog(trx, {
                actionType: gqlTypes.ActionType.Update,
                objectType: gqlTypes.ObjectType.Facility,
                updatedBy,
                oldValue: { ...originalFacility, healthcareProfessionalIds: originalHpIds },
                newValue: { ...updatedFacility, healthcareProfessionalIds: finalHpIds }
            })

            // Return the updated facility and final HP IDs for mapping
            return { facility: updatedFacility, hpIds: finalHpIds }
        })

        // Map database result to GraphQL type
        const dbFacility: dbSchema.Facility = {
            ...result.facility,
            contact: result.facility.contact as gqlTypes.Contact,
            healthcareProfessionalIds: result.hpIds
        }

        const gqlFacility = mapDbEntityTogqlEntity(dbFacility)

        return { data: gqlFacility, hasErrors: false }
    } catch (error) {
        // If we reach here, the transaction was automatically rolled back
        // The facility remains in its original state
        const errorMessage = (error as Error).message
        
        if (errorMessage.includes('Could not find facility')) {
            logger.warn(`updateFacility: facility not found: ${facilityId}`)
            return {
                data: {} as gqlTypes.Facility,
                hasErrors: true,
                errors: [{
                    field: 'updateFacility',
                    errorCode: ErrorCode.INVALID_ID,
                    httpStatus: 404
                }]
            }
        }

        logger.error(`ERROR: Error updating facility ${facilityId}: ${error}`)
        return {
            data: {} as gqlTypes.Facility,
            hasErrors: true,
            errors: [{
                field: 'updateFacility',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

/**
 * Apply relationship changes (Create/Delete) between ONE facility and MANY HPs.
 * In SQL this means insert/delete rows in the join table hps_facilities.
 * @returns the final list of HP ids for that facility
 */
async function processHealthcareProfessionalRelationshipChanges(
    trx: any, // Kysely Transaction type
    facilityId: string,
    changes: gqlTypes.Relationship[]
): Promise<string[]> {
    if (!changes || changes.length === 0) {
        // No changes, return current state
        const currentRelations = await trx
            .selectFrom('hps_facilities')
            .select('hps_id')
            .where('facilities_id', '=', facilityId)
            .execute()
        
        return currentRelations.map((r: any) => r.hps_id)
    }

    // Split creates and deletes
    const toCreate = changes
        .filter(c => c.action === gqlTypes.RelationshipAction.Create)
        .map(c => ({
            hps_id: c.otherEntityId,
            facilities_id: facilityId
        }))

    const toDelete = changes
        .filter(c => c.action === gqlTypes.RelationshipAction.Delete)
        .map(c => c.otherEntityId)

    // Process inserts (if any)
    if (toCreate.length > 0) {
        await trx
            .insertInto('hps_facilities')
            .values(toCreate)
            .onConflict((oc: any) => oc
                .columns(['hps_id', 'facilities_id'])
                .doNothing() // Ignore duplicates
            )
            .execute()
    }

    // Process deletes (if any)
    if (toDelete.length > 0) {
        await trx
            .deleteFrom('hps_facilities')
            .where('facilities_id', '=', facilityId)
            .where('hps_id', 'in', toDelete)
            .execute()
    }

    // Return the final list of HPs for this facility
    const finalRelations = await trx
        .selectFrom('hps_facilities')
        .select('hps_id')
        .where('facilities_id', '=', facilityId)
        .execute()

    return finalRelations.map((r: any) => r.hps_id)
}

/**
 * This deletes a Facility from the database.
 * If the Facility doesn't exist, it will return a validation error.
 * @param id The ID of the facility in the database to delete.
 */
export async function deleteFacility(
    id: string,
    updatedBy: string
): Promise<Result<gqlTypes.DeleteResult>> {
    try {
        // Validate the facility ID format
        const validationResult = validateIdInput(id)

        if (validationResult.hasErrors) {
            logger.warn(`Validation Error: invalid id for deleteFacility: ${id}`)
            return {
                data: { isSuccessful: false },
                hasErrors: true,
                errors: validationResult.errors
            }
        }

        // Execute deletion and audit log in a single atomic transaction
        await db.transaction().execute(async (trx) => {
            // Fetch the existing facility to verify it exists and for audit log
            const existingFacility = await trx
                .selectFrom('facilities')
                .selectAll()
                .where('id', '=', id)
                .executeTakeFirst()

            // If facility doesn't exist, throw error to rollback transaction
            if (!existingFacility) {
                throw new Error(`Facility not found: ${id}`)
            }

            // Fetch related HP IDs for the audit log
            // (Relations will be deleted automatically by ON DELETE CASCADE)
            const relations = await trx
                .selectFrom('hps_facilities')
                .select('hps_id')
                .where('facilities_id', '=', id)
                .execute()

            const hpIds = relations.map(r => r.hps_id)

            // Delete the facility
            // ON DELETE CASCADE will automatically delete rows in hps_facilities
            await trx
                .deleteFrom('facilities')
                .where('id', '=', id)
                .execute()

            //Create audit log entry
            // If this fails, the entire transaction (including the delete) is rolled back
            await createAuditLog(trx, {
                actionType: gqlTypes.ActionType.Delete,
                objectType: gqlTypes.ObjectType.Facility,
                updatedBy,
                oldValue: { ...existingFacility, healthcareProfessionalIds: hpIds }
            })

        })

        logger.info(`\nDB-DELETE: facility ${id} was deleted.`)

        return {
            data: { isSuccessful: true },
            hasErrors: false
        }
    } catch (error) {
        // If we reach here, the transaction was automatically rolled back
        // The facility still exists in the database no manual cleanup needed
        
        // Check if it's a "not found" error vs other database errors
        const errorMessage = (error as Error).message
        if (errorMessage.includes('Facility not found')) {
            logger.warn(`deleteFacility: facility not found: ${id}`)
            return {
                data: { isSuccessful: false },
                hasErrors: true,
                errors: [{
                    field: 'deleteFacility',
                    errorCode: ErrorCode.INVALID_ID,
                    httpStatus: 404
                }]
            }
        }

        logger.error(`ERROR: Error deleting facility ${id}: ${error}`)

        return {
            data: { isSuccessful: false },
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
 * Maps a database entity (dbSchema.Facility) to its GraphQL representation (gqlTypes.Facility)
 * This function ensures the data shape matches the API contract.
 */
export const mapDbEntityTogqlEntity = (dbEntity: dbSchema.Facility): gqlTypes.Facility => {
    const gqlEntity = {
        id: dbEntity.id,
        nameEn: dbEntity.nameEn,
        nameJa: dbEntity.nameJa,
        contact: dbEntity.contact,
        mapLatitude: dbEntity.mapLatitude,
        mapLongitude: dbEntity.mapLongitude,
        healthcareProfessionalIds: dbEntity.healthcareProfessionalIds,
        createdDate: dbEntity.createdDate,
        updatedDate: dbEntity.updatedDate
    } satisfies gqlTypes.Facility

    return gqlEntity
}