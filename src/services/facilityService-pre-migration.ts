import * as gqlTypes from '../typeDefs/gqlTypes.js'
import * as dbSchema from '../typeDefs/dbSchema.js'
import { ErrorCode, Result } from '../result.js'
import { logger } from '../logger.js'
import { getSupabaseClient } from '../supabaseClient.js'
import { createAuditLogSQL } from './auditLogServiceSupabase.js'
import { validateIdInput, validateCreateFacilityInput, validateFacilitiesSearchInput, validateUpdateFacilityInput } from '../validation/validateFacility.js'
import { buildFacilityUpdatePatch, applyFacilityFilters } from './helperFunctionsServices.js'

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
    // Tracking variables for rollback
    let createdFacilityId: string | null = null
    let createdRelations = false

    try {
        const validationResult = validateCreateFacilityInput(facilityInput)

        if (validationResult.hasErrors) {
            return validationResult as Result<gqlTypes.Facility>
        }

        // Prepare row for 'facilities' (Postgres will generate UUID)
        const facilityRow = {
            // ID NOT set, generated by DB
            nameEn: facilityInput.nameEn,
            nameJa: facilityInput.nameJa,
            contact: facilityInput.contact,
            mapLatitude: facilityInput.mapLatitude ?? null,
            mapLongitude: facilityInput.mapLongitude ?? null,
            createdDate: new Date().toISOString(),
            updatedDate: new Date().toISOString()
        }

        const supabase = getSupabaseClient()

        // Insert facility and get the generated row back
        const { data: insertedFacility, error: insertedFacilityError } = await supabase
            .from('facilities')
            .insert(facilityRow)
            .select('*')
            .single()

        if (insertedFacilityError) {
            throw insertedFacilityError
        }

        // Track that facility was created
        createdFacilityId = insertedFacility.id as string
        const hpIds = (facilityInput.healthcareProfessionalIds ?? []) as string[]

        // If HPs were provided, create rows in join table
        if (hpIds.length > 0) {
            const joinRows = hpIds.map(hpsId => ({
                //eslint-disable-next-line
                hps_id: hpsId, facilities_id: createdFacilityId
            }))

            // Use upsert for insert relations
            const { error: relationsError } = await supabase
                .from('hps_facilities')
                .upsert(joinRows, { onConflict: 'hps_id,facilities_id', ignoreDuplicates: true })

            if (relationsError) {
                throw relationsError
            }

            // Track that relations were created
            createdRelations = true
        }

        try {
            await createAuditLogSQL({
                actionType: gqlTypes.ActionType.Create,
                objectType: gqlTypes.ObjectType.Facility,
                updatedBy,
                newValue: { ...insertedFacility, healthcareProfessionalIds: hpIds }
            })
        } catch (auditError) {
            logger.error(`CRITICAL: Audit log failed for facility ${createdFacilityId}: ${auditError}`)
            logger.warn(`Rolling back facility ${createdFacilityId} due to audit log failure`)
            
            // Delete relations first (foreign key constraint)
            if (createdRelations && hpIds.length > 0) {
                await supabase
                    .from('hps_facilities')
                    .delete()
                    .eq('facilities_id', createdFacilityId)
            }
            
            // Then delete the facility
            await supabase
                .from('facilities')
                .delete()
                .eq('id', createdFacilityId)
            
            // Return error to caller
            throw new Error(`Failed to create audit log: ${auditError}`)
        }

        // Build GraphQL shape (include HP ids )
        const gqlFacility: gqlTypes.Facility = {
            id: createdFacilityId,
            nameEn: insertedFacility.nameEn,
            nameJa: insertedFacility.nameJa,
            contact: insertedFacility.contact,
            mapLatitude: insertedFacility.mapLatitude,
            mapLongitude: insertedFacility.mapLongitude,
            healthcareProfessionalIds: hpIds,
            createdDate: insertedFacility.createdDate,
            updatedDate: insertedFacility.updatedDate
        }

        logger.info(`\nDB-CREATE: CREATE facility ${createdFacilityId}.\nEntity: ${JSON.stringify(insertedFacility)}`)

        return {
            data: gqlFacility,
            hasErrors: false
        }
    } catch (error) {
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
        const facilityIds = paginationRows.map(r => r.id as string)

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
    // Track original state for rollback
    let originalFacility: gqlTypes.Facility | null = null
    let originalRelations: string[] = []
    let facilityWasUpdated = false
    let relationsWereUpdated = false

    try {
        const validationResult = validateUpdateFacilityInput(fieldsToUpdate)

        if (validationResult.hasErrors) {
            return validationResult as Result<gqlTypes.Facility>
        }

        // Retrieve current state (for rollback)
        const currentState = await getFacilityById(facilityId)

        if (currentState.hasErrors || !currentState.data) {
            throw new Error(`Could not find facility with id ${facilityId} to update.`)
        }
        originalFacility = currentState.data
        originalRelations = currentState.data.healthcareProfessionalIds ?? []

        // Prepare the update payload for the facilities table
        const updatePayload = buildFacilityUpdatePatch(fieldsToUpdate)

        const supabase = getSupabaseClient()

        // If there are no scalar fields to update, skip the UPDATE on facilities.
        if (Object.keys(updatePayload).length > 1) {
            const { error: updateErr } = await supabase
                .from('facilities')
                .update(updatePayload)
                .eq('id', facilityId)
                .select('*')
                .single()

            if (updateErr) {
                throw updateErr
            }

            facilityWasUpdated = true
            logger.info(`DB-UPDATE: facilities ${facilityId} scalar fields updated.`)
        } else {
        // If we still want to update updatedDate to track the entity "touch"?
            const { error: touchError } = await supabase
                .from('facilities')
                .update({ updatedDate: new Date().toISOString() })
                .eq('id', facilityId)

            if (touchError) {
                throw touchError
            }
        }

        // Here we expect an array of Relationship with Create/Delete actions.
        if (fieldsToUpdate.healthcareProfessionalIds && fieldsToUpdate.healthcareProfessionalIds.length > 0) {
            const relResult = await processHealthcareProfessionalRelationshipChanges(
                facilityId,
                fieldsToUpdate.healthcareProfessionalIds,
                originalRelations
            )

            if (relResult.hasErrors) {
                throw new Error('Error updating facility healthcareProfessionalIds')
            }

            relationsWereUpdated = true
        }

        // Return the updated HP with relations included
        const refreshed = await getFacilityById(facilityId)

        if (refreshed.hasErrors || !refreshed.data) {
            throw new Error('Error updating facility. Couldnt query the updated facility.')
        }

        // Create audit log with error handling and rollback
        try {
            await createAuditLogSQL({
                actionType: gqlTypes.ActionType.Update,
                objectType: gqlTypes.ObjectType.Facility,
                updatedBy,
                oldValue: originalFacility,
                newValue: refreshed.data
            })
        } catch (auditError) {
            // Audit log failed
            logger.error(`CRITICAL: Audit log failed for facility ${facilityId}: ${auditError}`)
            logger.warn(`Rolling back facility ${facilityId} update due to audit log failure`)

            // ROLLBACK: Restore original state
            
            // Rollback relations if they were updated
            if (relationsWereUpdated && fieldsToUpdate.healthcareProfessionalIds) {
                // Delete current relations
                await supabase
                    .from('hps_facilities')
                    .delete()
                    .eq('facilities_id', facilityId)

                // Restore original relations
                if (originalRelations.length > 0) {
                    const originalJoinRows = originalRelations.map(hpId => ({
                        hps_id: hpId,
                        facilities_id: facilityId
                    }))
                    
                    await supabase
                        .from('hps_facilities')
                        .insert(originalJoinRows)
                }
            }

            // Rollback facility fields if they were updated
            if (facilityWasUpdated && originalFacility) {
                await supabase
                    .from('facilities')
                    .update({
                        nameEn: originalFacility.nameEn,
                        nameJa: originalFacility.nameJa,
                        contact: originalFacility.contact,
                        mapLatitude: originalFacility.mapLatitude,
                        mapLongitude: originalFacility.mapLongitude,
                        updatedDate: originalFacility.updatedDate
                    })
                    .eq('id', facilityId)
            }

            throw new Error(`Failed to create audit log: ${auditError}`)
        }

        return { data: refreshed.data, hasErrors: false }
    } catch (error) {
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
  facilityId: string,
  changes: gqlTypes.Relationship[],
  originalHpIds: string[] = []
): Promise<Result<string[]>> {
    try {
        if (!changes || changes.length === 0) {
            return { data: originalHpIds, hasErrors: false }
        }

        // Split creates / deletes
        const toCreate = changes
            .filter(c => c.action === gqlTypes.RelationshipAction.Create)
            //eslint-disable-next-line
            .map(c => ({ hps_id: c.otherEntityId, facilities_id: facilityId }))

        const toDelete = changes
            .filter(c => c.action === gqlTypes.RelationshipAction.Delete)
            .map(c => c.otherEntityId)

        const supabase = getSupabaseClient()

        // Do inserts first
        if (toCreate.length > 0) {
            const { error: upsertError } = await supabase
                .from('hps_facilities')
                .upsert(toCreate, { onConflict: 'hps_id,facilities_id', ignoreDuplicates: true })
    
            if (upsertError) {
                return {
                    data: originalHpIds,
                    hasErrors: true,
                    errors: [{ 
                        field: 'processHealthcareProfessionalRelationshipChanges',
                        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                        httpStatus: 500
                    }]
                }
            }
        }

        // Deletes
        if (toDelete.length > 0) {
            const { error: deletionError } = await supabase
                .from('hps_facilities')
                .delete()
                .eq('facilities_id', facilityId)
                .in('hps_id', toDelete)

            if (deletionError) {
                return {
                    data: originalHpIds,
                    hasErrors: true,
                    errors: [{
                        field: 'processHealthcareProfessionalRelationshipChanges',
                        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                        httpStatus: 500
                    }]
                }
            }
        }

        // Return the final list of HPs for this facility
        const { data: relatedRows, error: relErr } = await supabase
            .from('hps_facilities')
            .select('hps_id')
            .eq('facilities_id', facilityId)

        if (relErr) {
            return {
                data: originalHpIds,
                hasErrors: true,
                errors: [{
                    field: 'processHealthcareProfessionalRelationshipChanges',
                    errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                    httpStatus: 500
                }]
            }
        }

        const finalHpIds = (relatedRows ?? []).map(related => related.hps_id as string)

        return { data: finalHpIds, hasErrors: false }
    } catch (e) {
        return {
            data: originalHpIds,
            hasErrors: true,
            errors: [{
                field: 'processHealthcareProfessionalRelationshipChanges',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

/**
    * This function updates the facilityIds list for each facilities listed.
    * Based on the action, it will add or remove the hp id from the existing list of HpIds.
    * @param healthcareProfessionalId - The id of the facility that is being added or removed.
    * @returns Result containing any errors that occurred.
*/
export async function updateFacilitiesWithHealthcareProfessionalIdChanges(
  facilitiesToUpdate: gqlTypes.Relationship[],
  healthcareProfessionalId: string
): Promise<Result<void>> {
    try {
        if (!facilitiesToUpdate || facilitiesToUpdate.length === 0) {
            return { data: undefined, hasErrors: false }
        }

        const toCreate = facilitiesToUpdate
            .filter(r => r.action === gqlTypes.RelationshipAction.Create)
            //eslint-disable-next-line
            .map(r => ({ hps_id: healthcareProfessionalId, facilities_id: r.otherEntityId }))

        const toDeleteIds = facilitiesToUpdate
            .filter(r => r.action === gqlTypes.RelationshipAction.Delete)
            .map(r => r.otherEntityId)

        const supabase = getSupabaseClient()

        if (toCreate.length > 0) {
            const { error: upsertErr } = await supabase
                .from('hps_facilities')
                .upsert(toCreate, { onConflict: 'hps_id,facilities_id', ignoreDuplicates: true })

            if (upsertErr) {
                return {
                    data: undefined,
                    hasErrors: true,
                    errors: [{
                        field: 'updateFacilitiesWithHealthcareProfessionalIdChanges',
                        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                        httpStatus: 500
                    }]
                }
            }
        }

        if (toDeleteIds.length > 0) {
            const { error: deleteError } = await supabase
                .from('hps_facilities')
                .delete()
                .eq('hps_id', healthcareProfessionalId)
                .in('facilities_id', toDeleteIds)

            if (deleteError) {
                return {
                    data: undefined,
                    hasErrors: true,
                    errors: [{
                        field: 'updateFacilitiesWithHealthcareProfessionalIdChanges',
                        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                        httpStatus: 500 
                    }]
                }
            }
        }

        return { data: undefined, hasErrors: false }
    } catch (e) {
        return {
            data: undefined,
            hasErrors: true,
            errors: [{
                field: 'updateFacilitiesWithHealthcareProfessionalIdChanges',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
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
    // Track what we delete for potential restore
    let deletedFacility: gqlTypes.Facility | null = null
    let deletedRelations: Array<{ hps_id: string, facilities_id: string }> = []
    try {
        const validationResult = validateIdInput(id)

        if (validationResult.hasErrors) {
            logger.warn(`Validation Error: invalid id for deleteFacility: ${id}`)
            return {
                data: { isSuccessful: false },
                hasErrors: true,
                errors: validationResult.errors
            }
        }

        // Ensure the facility exists
        const existingFacility = await getFacilityById(id)

        if (existingFacility.hasErrors || !existingFacility.data) {
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

        deletedFacility = existingFacility.data

        const supabase = getSupabaseClient()
        
        // Save relations for potential restore
        const { data: relations } = await supabase
            .from('hps_facilities')
            .select('hps_id, facilities_id')
            .eq('facilities_id', id)

        if (relations) {
            deletedRelations = relations as Array<{ hps_id: string, facilities_id: string }>
        }

        // Delete the main facility record. Delete join table (hps_facilities) rows 
        // is handled by a Supabase ONCASCADE trigger.
        const { error: facilityDeleteError } = await supabase
            .from('facilities')
            .delete()
            .eq('id', id)

        if (facilityDeleteError) {
            throw new Error(`Failed to delete facility: ${facilityDeleteError.message}`)
        }

        // Create audit log with error handling and rollback
        try {
            await createAuditLogSQL({
                actionType: gqlTypes.ActionType.Delete,
                objectType: gqlTypes.ObjectType.Facility,
                updatedBy,
                oldValue: deletedFacility
            })
        } catch (auditError) {
            //Audit log failed
            logger.error(`CRITICAL: Audit log failed for deleted facility ${id}: ${auditError}`)
            logger.warn(`Rolling back facility ${id} deletion due to audit log failure`)

            // ROLLBACK: Restore the deleted facility
            
            // Restore facility
            await supabase
                .from('facilities')
                .insert({
                    id: deletedFacility.id,
                    nameEn: deletedFacility.nameEn,
                    nameJa: deletedFacility.nameJa,
                    contact: deletedFacility.contact,
                    mapLatitude: deletedFacility.mapLatitude,
                    mapLongitude: deletedFacility.mapLongitude,
                    createdDate: deletedFacility.createdDate,
                    updatedDate: deletedFacility.updatedDate
                })

            // Restore relations
            if (deletedRelations.length > 0) {
                await supabase
                    .from('hps_facilities')
                    .insert(deletedRelations)
            }

            throw new Error(`Failed to create audit log: ${auditError}`)
        }

        logger.info(`\nDB-DELETE: facility ${id} was deleted.\nEntity: ${JSON.stringify(id)}`)

        return {
            data: { isSuccessful: true },
            hasErrors: false
        }
    } catch (error) {
        logger.error(`ERROR: Error deleting facility ${id}: ${error}`)

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

