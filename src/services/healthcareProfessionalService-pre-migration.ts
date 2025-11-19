import * as gqlTypes from '../typeDefs/gqlTypes.js'
import * as dbSchema from '../typeDefs/dbSchema.js'
import { ErrorCode, Result } from '../result.js'
import { validateProfessionalsSearchInput, validateUpdateProfessionalInput, validateCreateProfessionalInput } from '../validation/validationHealthcareProfessional.js'
import { validateIdInput } from '../validation/validateFacility.js'
import { logger } from '../logger.js'
import { getSupabaseClient } from '../supabaseClient.js'
import { createAuditLogSQL } from './auditLogServiceSupabase.js'
import { applyHpFilters, mapCreateInputToHpInsertRow, resolveFacilityIdFromRelationships, buildHpUpdatePatch} from './helperFunctionsServices.js'

// Sets the single facility for an HP
async function setSingleFacilityForHp(hpId: string, facilityId: string | null): Promise<void> {
    if (!facilityId) {
        throw new Error('HealthcareProfessional must be linked to at least one Facility')
    }

    const supabase = getSupabaseClient()

    // First remove all existing links for this HP from the junction table
    const { error: deleteError } = await supabase
        .from('hps_facilities')
        .delete()
        .eq('hps_id', hpId)

    if (deleteError) { throw deleteError }

    // If we have a facilityId, insert the new link
    if (facilityId) {
        const { error: upsertError } = await supabase
            .from('hps_facilities')
            // Upsert ensures idempotency; ignoreDuplicates avoids conflicts on existing unique pairs
            //eslint-disable-next-line
            .upsert([{ hps_id: hpId, facilities_id: facilityId }],
                    { onConflict: 'hps_id,facilities_id', ignoreDuplicates: true })
        // If insertion/upsert fails, propagate the error

        if (upsertError) { throw upsertError }
    }
}

// Returns how many facilities are currently linked to a given HP
async function countFacilitiesForHp(hpId: string): Promise<number> {
    const supabase = getSupabaseClient()
    // Count the number of rows in the junction table for this HP
    const { count: facilityCount, error: facilityCountError } = await supabase
        .from('hps_facilities')
        .select('hps_id', { count: 'exact', head: true })
        .eq('hps_id', hpId)
  
    if (facilityCountError) {
        throw facilityCountError
    }
    // Normalize to 0 when count is null/undefined
    return facilityCount ?? 0
}

/**
 * Gets the Healthcare Professional from the database that matches on the id.
 * @param id A string that matches the id of the Supabase for the professional.
 * @returns A Healthcare Professional object.
 */
export async function getHealthcareProfessionalById(
    id: string
): Promise<Result<gqlTypes.HealthcareProfessional>> {
    try {
        // Validate the incoming id
        const validationResult = validateIdInput(id)

        if (validationResult.hasErrors) {
            logger.warn(`Validation Error: User passed invalid HP id: ${id}`)

            return {
                data: {} as gqlTypes.HealthcareProfessional,
                hasErrors: true,
                errors: (validationResult.errors ?? []).map(err => ({
                    ...err,
                    field: 'getHealthcareProfessionalById'
                }))
            }
        }

        const supabase = getSupabaseClient()

        // Fetch the HP row by primary key; .single() requires exactly one row
        const { data: hpRow, error: hpRowError } = await supabase
            .from('hps')
            .select('*')
            .eq('id', id)
            .single()

        // Supabase returns PGRST116 when .single() finds no rows.
        if (hpRowError?.code === 'PGRST116' || !hpRow) {
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

        if (hpRowError) {
            throw hpRowError
        }

        // Load relations from junction table (facility links for this HP)
        const { data: facilityLinkRows, error: facilityLinkRowsError } = await supabase
            .from('hps_facilities')
            .select('facilities_id')
            .eq('hps_id', id)

        if (facilityLinkRowsError) {
            throw facilityLinkRowsError
        }

        // Normalize facility IDs to a string array
        const facilityIds = (facilityLinkRows ?? []).map(row => row.facilities_id as string)

        // Cast DB row to internal schema and map to GraphQL shape including relations
        const dbHp = hpRow as dbSchema.DbHealthcareProfessionalRow
        const gqlHp = mapDbHpToGql(dbHp, facilityIds)

        return {
            data: gqlHp,
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

/**
 * Searches for a paginated list of HealthcareProfessionals based on various criteria.
 * This function handles multi-step filtering:
 * - It optionally applies a filter based on associated Facility
 * by performing a preliminary lookup to get a subset of HP IDs.
 * - It applies scalar filters, ordering, and pagination to the main hps table.
 * @param filters Optional search and pagination filters for HP.
 * @returns A Promise that resolves to a Result object containing an array of HPs.
 */
export async function searchProfessionals(
  filters: gqlTypes.HealthcareProfessionalSearchFilters = {}
): Promise<Result<gqlTypes.HealthcareProfessional[]>> {
    try {
    // Validate incoming filters
        const validation = validateProfessionalsSearchInput(filters)

        if (validation.hasErrors) {
            return { data: [], hasErrors: true, errors: validation.errors }
        }

        if (Array.isArray(filters.ids) && filters.ids.length === 0) {
            return { data: [], hasErrors: false }
        }

        if (Array.isArray(filters.ids) && filters.ids.length > 0) {
            const looksInvalid = filters.ids.some(id => !/^[0-9a-fA-F-]{36}$/.test(id))

            if (looksInvalid) {
                return { data: [], hasErrors: false }
            }
        }

        const limit = filters.limit ?? 20
        const offset = filters.offset ?? 0

        const supabase = getSupabaseClient()

        // Start base query on hps table and apply JSONB filters via helper
        let hpSelect = applyHpFilters(supabase.from('hps').select('*'), filters)

        if (Array.isArray(filters.ids)) {
            if (filters.ids.length === 0) {
                // user explicitly asked for "no ids" → return empty list right away
                return { data: [], hasErrors: false }
            }

            // only return the professionals whose id is in filters.ids
            hpSelect = hpSelect.in('id', filters.ids)
        }

        // Fallback to createdDate DESC.
        const orderBy = filters.orderBy?.[0]

        if (orderBy?.fieldToOrder) {
            hpSelect = hpSelect.order(orderBy.fieldToOrder, {
                ascending: orderBy.orderDirection !== 'desc'
            })
        } else {
            hpSelect = hpSelect.order('createdDate', { ascending: false })
        }

        /**
         * Perform paged fetch after all filters are applied so the page is computed
         * on the correctly filtered set — this matches test expectations.
         */
        const { data: hpRows, error: hpRowsError } = await hpSelect.range(
            offset,
            offset + limit - 1
        )

        if (hpRowsError) {
            throw hpRowsError
        }

        /// If there’s no data on this page, return early
        if (!hpRows?.length) {
            return { data: [], hasErrors: false }
        }

        // Extract IDs from this page to batch-load relations from the junction table
        const hpIds = hpRows.map(row => row.id as string)

        if (hpIds.length === 0) {
            // extremely defensive; should not happen, but keeps the function safe
            const list = (hpRows as dbSchema.DbHealthcareProfessionalRow[])
                .map(hp => mapDbHpToGql(hp, []))

            return { data: list, hasErrors: false }
        }

        // Load facilities relations for these HPs to avoid N+1 queries
        const { data: facilityRelationsForHPs, error: facilityRelationsForHPsError} = await supabase
            .from('hps_facilities')
            .select('hps_id, facilities_id')
            .in('hps_id', hpIds)

        if (facilityRelationsForHPsError) {
            throw facilityRelationsForHPsError
        }

        // Build a lookup map: hpId → [facilityId, ...]
        const facilityIdsByHpId = new Map<string, string[]>()

        for (const relation of facilityRelationsForHPs ?? []) {
            const hpId = relation.hps_id as string
            const list = facilityIdsByHpId.get(hpId) ?? []

            list.push(relation.facilities_id as string)
            facilityIdsByHpId.set(hpId, list)
        }

        // Map DB rows to GraphQL shape, merging each HP row with its facilityIds
        const result: gqlTypes.HealthcareProfessional[] =
            (hpRows as dbSchema.DbHealthcareProfessionalRow[])
                .map(hp => {
                    const facilityIds = facilityIdsByHpId.get(hp.id) ?? []

                    return mapDbHpToGql(hp, facilityIds)
                })

        return { data: result, hasErrors: false }
    } catch (err) {
        logger.error(`ERROR: searchProfessionals ${JSON.stringify(filters)} -> ${err}`)
        return {
            data: [],
            hasErrors: true,
            errors: [{
                field: 'searchProfessionals',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

/**
 * Counts the total number of Healthcare Professionals (HP) matching the provided filters.
 * This function applies direct scalar filters to the professional data
 * and returns the exact count of the results.
 * @param filters An optional object of search filters for Healthcare Professionals.
 * @returns A Promise that resolves to a Result object containing the count (number) or errors.
 */
export async function countProfessionals(
  filters: gqlTypes.HealthcareProfessionalSearchFilters = {}
): Promise<Result<number>> {
    try {
        const validationResult = validateProfessionalsSearchInput(filters)

        if (validationResult.hasErrors) {
            return { data: 0, hasErrors: true, errors: validationResult.errors }
        }

        const supabase = getSupabaseClient()

        // Build a COUNT(*) query with the same JSONB-based filters used in the search endpoint.
        // The 'head: true' flag means no rows are actually returned, only metadata.
        const countQuery = applyHpFilters(
            supabase.from('hps').select('*', { count: 'exact', head: true }),
            filters
        )

        // Execute the count query and extract count 
        const { count: hpCount, error: hpCountError } = await countQuery

        if (hpCountError) { throw hpCountError }

        // Return normalized result (0 fallback if count is null)
        return { data: hpCount ?? 0, hasErrors: false }
    } catch (err) {
        logger.error(`ERROR: countProfessionals ${JSON.stringify(filters)} -> ${err}`)
        return {
            data: 0,
            hasErrors: true,
            errors: [{
                field: 'countProfessionals',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

/**
 * Creates a Healthcare Professional (Supabase/Postgres).
 * Business rule: an HP can be linked to at least ONE facility.
 * This function inserts a new HP row and optionally creates a single facility link.
 */
export async function createHealthcareProfessional(
    input: gqlTypes.CreateHealthcareProfessionalInput,
    updatedBy: string
): Promise<Result<gqlTypes.HealthcareProfessional>> {
    // Keep reference to created HP id for audit/logging even if something fails
    // Tracking variables for rollback
    let createdHpId: string | null = null
    let createdRelation = false

    try {
        const validationResult = validateCreateProfessionalInput(input)

        if (validationResult.hasErrors) {
            return validationResult as Result<gqlTypes.HealthcareProfessional>
        }

        // Business rule: HP must be linked to at least one Facility (and at most one for now)
        const requestedFacilityIds: string[] = Array.isArray(input.facilityIds)
            ? (input.facilityIds as unknown[]).filter((facId): facId is string => typeof facId === 'string')
            : []

        // Enforce single facility rule — multiple IDs are invalid input
        if (requestedFacilityIds.length > 1) {
            return {
                data: {} as gqlTypes.HealthcareProfessional,
                hasErrors: true,
                errors: [{
                    field: 'facilityIds',
                    errorCode: ErrorCode.INVALID_INPUT,
                    httpStatus: 400
                }]
            }
        }

        // Convert GraphQL input → DB insert shape (adds timestamps)
        const insertPayload = mapCreateInputToHpInsertRow(input)

        const supabase = getSupabaseClient()

        // Insert the HP record, returning the inserted row
        const { data: insertedRow, error: insertErr } = await supabase
            .from('hps')
            .insert(insertPayload)
            .select('*')
            .single()

        if (insertErr) {
            throw insertErr
        }

        createdHpId = insertedRow.id as string
        
        //Join: enforce at most one facility link
        let linkedFacilityIds: string[] = []

        // If exactly one facility ID was requested, create the join record
        if (requestedFacilityIds.length === 1) {
            const oneFacilityId = requestedFacilityIds[0]

            // Idempotent upsert on the junction table
            const { error: upsertRelationErr } = await supabase
                .from('hps_facilities')
                .upsert(
                    //eslint-disable-next-line
                    [{ hps_id: createdHpId, facilities_id: oneFacilityId }],
                    { onConflict: 'hps_id,facilities_id', ignoreDuplicates: true }
                )

            if (upsertRelationErr) {
                throw upsertRelationErr
            }

            // Track created relation
            createdRelation = true
            linkedFacilityIds = [oneFacilityId]
        }
        
        // Map inserted DB row into GraphQL shape including related facility ids
        const gqlHealthcareProfessional = mapDbHpToGql(
            insertedRow as dbSchema.DbHealthcareProfessionalRow,
            linkedFacilityIds
        )
        
        // Wrap audit log in try-catch with rollback
        try {
            await createAuditLogSQL({
                actionType: gqlTypes.ActionType.Create,
                objectType: gqlTypes.ObjectType.HealthcareProfessional,
                updatedBy,
                newValue: gqlHealthcareProfessional
            })
        } catch (auditError) {
            logger.error(`CRITICAL: Audit log failed for HP ${createdHpId}: ${auditError}`)
            logger.warn(`Rolling back HP ${createdHpId} due to audit log failure`)

            // ROLLBACK: Delete relation first
            if (createdRelation) {
                await supabase
                    .from('hps_facilities')
                    .delete()
                    .eq('hps_id', createdHpId)
            }

            // Then delete the HP
            await supabase
                .from('hps')
                .delete()
                .eq('id', createdHpId)

            throw new Error(`Failed to create audit log: ${auditError}`)
        }

        logger.info(`DB-CREATE: Created healthcare professional ${createdHpId}.`)

        return {
            data: gqlHealthcareProfessional,
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

/*
 * Updates a Healthcare Professional.
 * Rules:
 * - Scalar fields are updated on `hps`
 * - Relationship: accepts at least ONE facility. If provided, it replaces any existing link
 * - return the updated Healthcare Professional
 */
export const updateHealthcareProfessional = async (
    id: string,
    fieldsToUpdate: Partial<gqlTypes.UpdateHealthcareProfessionalInput>,
    updatedBy: string
): Promise<Result<gqlTypes.HealthcareProfessional>> => {
    // Tracking variables for rollback
    let originalHp: gqlTypes.HealthcareProfessional | null = null
    let originalFacilityIds: string[] = []
    let hpWasUpdated = false
    let relationsWereUpdated = false

    try {
        const validationResult = validateUpdateProfessionalInput(fieldsToUpdate)

        if (validationResult.hasErrors) {
            return validationResult as Result<gqlTypes.HealthcareProfessional>
        }

        // Ensure the HP exists
        const currentState = await getHealthcareProfessionalById(id)

        if (currentState.hasErrors || !currentState.data) {
            return {
                data: {} as gqlTypes.HealthcareProfessional,
                hasErrors: true,
                errors: [{ field: 'id', errorCode: ErrorCode.INVALID_ID, httpStatus: 404 }]
            }
        }

        originalHp = currentState.data
        originalFacilityIds = currentState.data.facilityIds ?? []

        // prepare the update payload for the hps tables
        const updatePayload = buildHpUpdatePatch(fieldsToUpdate)

        // If there are scalar fields (besides updatedDate) we issue a normal UPDATE,
        // otherwise we just "touch" updatedDate.
        const hasAnyScalarChange = Object.keys(updatePayload).length > 1

        const supabase = getSupabaseClient()

        if (hasAnyScalarChange) {
            const { error: updateErr } = await supabase
                .from('hps')
                .update(updatePayload)
                .eq('id', id)

            if (updateErr) { throw updateErr }

            hpWasUpdated = true
        } else {
        // If we still want to update updatedDate to track the entity "touch"?
            const { error: touchErr } = await supabase
                .from('hps')
                .update({ updatedDate: new Date().toISOString() })
                .eq('id', id)

            if (touchErr) { throw touchErr }
        }

        if (fieldsToUpdate.facilityIds !== undefined) {
            const { newFacilityId, error } = resolveFacilityIdFromRelationships(fieldsToUpdate.facilityIds ?? null)

            if (error) {
                return {
                    data: {} as gqlTypes.HealthcareProfessional,
                    hasErrors: true,
                    errors: [{ field: 'facilityIds', errorCode: ErrorCode.INVALID_INPUT, httpStatus: 400 }]
                }
            }
            // This clears existing links and optionally sets a new one
            await setSingleFacilityForHp(id, newFacilityId)
            relationsWereUpdated = true
        }

        // Return the refreshed HP with relations included
        const refreshedResult = await getHealthcareProfessionalById(id)

        if (refreshedResult.hasErrors || !refreshedResult.data) {
            throw new Error('Could not reload updated healthcare professional.')
        }

        // Wrap audit log in try-catch with rollback
        try {
            await createAuditLogSQL({
                actionType: gqlTypes.ActionType.Update,
                objectType: gqlTypes.ObjectType.HealthcareProfessional,
                updatedBy,
                oldValue: originalHp,
                newValue: refreshedResult.data
            })
        } catch (auditError) {
            logger.error(`CRITICAL: Audit log failed for HP ${id}: ${auditError}`)
            logger.warn(`Rolling back HP ${id} update due to audit log failure`)

            // ROLLBACK: Restore relations if they were updated
            if (relationsWereUpdated) {
                // Delete current relations
                await supabase
                    .from('hps_facilities')
                    .delete()
                    .eq('hps_id', id)

                // Restore original relations
                if (originalFacilityIds.length > 0) {
                    const originalRelations = originalFacilityIds.map(facId => ({
                        hps_id: id,
                        facilities_id: facId
                    }))

                    await supabase
                        .from('hps_facilities')
                        .insert(originalRelations)
                }
            }

            // Rollback scalar fields if they were updated
            if (hpWasUpdated && originalHp) {
                await supabase
                    .from('hps')
                    .update({
                        names: originalHp.names,
                        degrees: originalHp.degrees,
                        spokenLanguages: originalHp.spokenLanguages,
                        specialties: originalHp.specialties,
                        acceptedInsurance: originalHp.acceptedInsurance,
                        additionalInfoForPatients: originalHp.additionalInfoForPatients,
                        updatedDate: originalHp.updatedDate
                    })
                    .eq('id', id)
            }

            throw new Error(`Failed to create audit log: ${auditError}`)
        }

        return { data: refreshedResult.data, hasErrors: false }
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
 * This deletes a Healthcare Professional from the database.
 * If the Healthcare Professional doesn't exist, it will return a validation error.
 * @param id The ID of the professional in the database to delete.
 */
export async function deleteHealthcareProfessional(
    id: string,
    updatedBy: string
): Promise<Result<gqlTypes.DeleteResult>> {
    // Tracking variables for rollback
    let deletedHp: gqlTypes.HealthcareProfessional | null = null
    let deletedRelations: Array<{ hps_id: string, facilities_id: string }> = []

    try {
        const validationResult = validateIdInput(id)

        if (validationResult.hasErrors) {
            logger.warn(`Validation Error: invalid id for deleteHealtchareProfessional: ${id}`)
            return {
                data: { isSuccessful: false },
                hasErrors: true,
                errors: validationResult.errors
            }
        }

        // Ensure the HP exists
        const existingHp = await getHealthcareProfessionalById(id)

        if (existingHp.hasErrors || !existingHp.data) {
            logger.warn(`deleteHealthcareProfessional: professional not found: ${id}`)
            return {
                data: { isSuccessful: false},
                hasErrors: true,
                errors: [{
                    field: 'deleteHealthcareProfessional',
                    errorCode: ErrorCode.INVALID_ID,
                    httpStatus: 404
                }]
            }
        }

        deletedHp = existingHp.data

        const supabase = getSupabaseClient()

        // Save relations for potential restore
        const { data: relations } = await supabase
            .from('hps_facilities')
            .select('hps_id, facilities_id')
            .eq('hps_id', id)

        if (relations) {
            deletedRelations = relations as Array<{ hps_id: string, facilities_id: string }>
        }

        const { error: hpDeleteErr } = await supabase
            .from('hps')
            .delete()
            .eq('id', id)

        if (hpDeleteErr) {
            throw new Error(`Failed to delete professional: ${hpDeleteErr.message}`)
        }

         try {
            await createAuditLogSQL({
                actionType: gqlTypes.ActionType.Delete,
                objectType: gqlTypes.ObjectType.HealthcareProfessional,
                updatedBy,
                oldValue: deletedHp
            })
        } catch (auditError) {
            logger.error(`CRITICAL: Audit log failed for deleted HP ${id}: ${auditError}`)
            logger.warn(`Rolling back HP ${id} deletion due to audit log failure`)

            // ROLLBACK: Restore the deleted HP
            await supabase
                .from('hps')
                .insert({
                    id: deletedHp.id,
                    names: deletedHp.names,
                    degrees: deletedHp.degrees,
                    spokenLanguages: deletedHp.spokenLanguages,
                    specialties: deletedHp.specialties,
                    acceptedInsurance: deletedHp.acceptedInsurance,
                    additionalInfoForPatients: deletedHp.additionalInfoForPatients,
                    createdDate: deletedHp.createdDate,
                    updatedDate: deletedHp.updatedDate
                })

            // Restore relations
            if (deletedRelations.length > 0) {
                await supabase
                    .from('hps_facilities')
                    .insert(deletedRelations)
            }

            throw new Error(`Failed to create audit log: ${auditError}`)
        }

        logger.info(`\nDB-DELETE: healthcare professional ${id} was deleted.\nEntity: ${JSON.stringify(id)}`)

        return {
            data: { isSuccessful: true },
            hasErrors: false
        }

    } catch (error) {
        logger.error(`ERROR: Error deleting professional ${id}: ${error}`)

        return {
            data: { isSuccessful: false },
            hasErrors: true,
            errors: [{
                field: 'deleteHealthcareProfessional',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

/**
    * This function updates the facilityIds list for each healthcare professional listed.
    * Based on the action, it will add or remove the facility id from the existing list of facilityIds.
    * @param professionalRelationshipsToUpdate - The list of healthcare professionals to update.
    * @param facilityId - The id of the facility that is being added or removed.
    * @returns Result containing any errors that occurred.
*/
export async function updateHealthcareProfessionalsWithFacilityIdChanges(
    professionalRelationshipsToUpdate: gqlTypes.Relationship[],
    facilityId: string
): Promise<Result<void>> {
    try {
        if (!professionalRelationshipsToUpdate || professionalRelationshipsToUpdate.length < 1) {
            return {
                data: undefined,
                hasErrors: false
            }
        }

        // Split incoming relationships into ids to create/delete
        const hpIdsToCreate: string[] = professionalRelationshipsToUpdate
            .filter(r => r.action === gqlTypes.RelationshipAction.Create)
            .map(r => r.otherEntityId)

        const hpIdsToDelete: string[] = professionalRelationshipsToUpdate
            .filter(r => r.action === gqlTypes.RelationshipAction.Delete)
            .map(r => r.otherEntityId)

        const createSet = new Set<string>(hpIdsToCreate)
        const deleteSet = new Set<string>(hpIdsToDelete)

        // Resolve conflicts: if an HP is in both, remove from both (no-op)
        for (const hpId of Array.from(createSet)) {
            if (deleteSet.has(hpId)) {
                createSet.delete(hpId)
                deleteSet.delete(hpId)
            }
        }

        // Build rows for INSERT/UPSERT
        const relationsToCreate =
            Array.from(createSet).map(hpsId =>
                //eslint-disable-next-line
                ({ hps_id: hpsId, facilities_id: facilityId }))

        const idsToDelete = Array.from(deleteSet)

        const supabase = getSupabaseClient()

        // INSERT/UPSERT relations first (idempotent)
        if (relationsToCreate.length > 0) {
            const { error: upsertErr } = await supabase
                .from('hps_facilities')
                .upsert(relationsToCreate, {
                    onConflict: 'hps_id,facilities_id',
                    ignoreDuplicates: true
                })

            if (upsertErr) {
                return {
                    data: undefined,
                    hasErrors: true,
                    errors: [{
                        field: 'updateHealthcareProfessionalsWithFacilityIdChanges',
                        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                        httpStatus: 500
                    }]
                }
            }
        }
        // DELETE relations
        if (idsToDelete.length > 0) {
            const { error: deleteErr } = await supabase
                .from('hps_facilities')
                .delete()
                .eq('facilities_id', facilityId)
                .in('hps_id', idsToDelete)

            const hpCounts = await Promise.all(idsToDelete.map(async hpId => ({
                hpId,
                count: await countFacilitiesForHp(hpId)
            })))

            // If HP has count === 1 and we are deleting this link
            const wouldBreak = hpCounts.filter(x => x.count <= 1)

            if (wouldBreak.length > 0) {
                return {
                    data: undefined,
                    hasErrors: true,
                    errors: [{
                        field: 'facilityIds',
                        errorCode: ErrorCode.INVALID_INPUT,
                        httpStatus: 400
                    }]
                }
            }
            if (deleteErr) {
                return {
                    data: undefined,
                    hasErrors: true,
                    errors: [{
                        field: 'updateHealthcareProfessionalsWithFacilityIdChanges',
                        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                        httpStatus: 500
                    }]
                }
            }
        }
       
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

export function mapGqlEntityToDbEntity(
    input: gqlTypes.CreateHealthcareProfessionalInput
)
    : dbSchema.HealthcareProfessionalInsertRow {
    return {
        acceptedInsurance: input.acceptedInsurance as gqlTypes.Insurance[],
        degrees: input.degrees as dbSchema.Degree[],
        names: input.names as dbSchema.LocalizedName[],
        specialties: input.specialties as dbSchema.Specialty[],
        spokenLanguages: input.spokenLanguages as gqlTypes.Locale[],
        //business rule: createdDate cannot be set by the user.
        createdDate: new Date().toISOString(),
        //business rule: updatedDate is updated on every change.
        updatedDate: new Date().toISOString(),
        additionalInfoForPatients: input.additionalInfoForPatients ?? null
    } satisfies dbSchema.HealthcareProfessionalInsertRow
}

export function mapDbHpToGql(
  hp: dbSchema.DbHealthcareProfessionalRow,
  facilityIds: string[]
): gqlTypes.HealthcareProfessional {
    return {
        id: hp.id,
        names: hp.names ?? [],
        degrees: hp.degrees ?? [],
        spokenLanguages: hp.spokenLanguages ?? [],
        specialties: hp.specialties ?? [],
        acceptedInsurance: hp.acceptedInsurance ?? [],
        facilityIds,
        createdDate: hp.createdDate,
        updatedDate: hp.updatedDate,
        additionalInfoForPatients: hp.additionalInfoForPatients
    }
}

