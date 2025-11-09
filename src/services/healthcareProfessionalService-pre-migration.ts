import * as gqlTypes from '../typeDefs/gqlTypes.js'
import * as dbSchema from '../typeDefs/dbSchema.js'
import { ErrorCode, Result } from '../result.js'
import { validateProfessionalsSearchInput, validateUpdateProfessionalInput, validateCreateProfessionalInput } from '../validation/validationHealthcareProfessional.js'
import { validateIdInput } from '../validation/validateFacility.js'
import { logger } from '../logger.js'
import { supabaseClient } from '../supabaseClient.js'
import { createAuditLogSQL } from './auditLogServiceSupabase.js'

// Build only provided scalar fields for UPDATE
function buildHpUpdatePayload(fields: Partial<gqlTypes.UpdateHealthcareProfessionalInput>) {
    const payload: Partial<dbSchema.DbHealthcareProfessionalRow> = {}

    if (fields.names !== null) { payload.names = fields.names }
    if (fields.degrees !== null) { payload.degrees = fields.degrees }
    if (fields.spokenLanguages !== null) { payload.spokenLanguages = fields.spokenLanguages }
    if (fields.specialties !== null) { payload.specialties = fields.specialties }
    if (fields.acceptedInsurance !== null) { payload.acceptedInsurance = fields.acceptedInsurance }
    if (fields.additionalInfoForPatients !== undefined) {
        payload.additionalInfoForPatients = fields.additionalInfoForPatients
    }
    payload.updatedDate = new Date().toISOString()
    return payload
}

// Sets the single facility for an HP
async function setHpFacility(hpId: string, facilityId: string | null): Promise<void> {
    if (!facilityId) {
        throw new Error('HealthcareProfessional must be linked to at least one Facility')
    }
    // remove all current links for the HP
    const { error: delErr } = await supabaseClient
        .from('hps_facilities')
        .delete()
        .eq('hps_id', hpId)

    if (delErr) { throw delErr }

    if (facilityId) {
        const { error: upsertErr } = await supabaseClient
            .from('hps_facilities')
            //eslint-disable-next-line
            .upsert([{ hps_id: hpId, facilities_id: facilityId }],
                    { onConflict: 'hps_id,facilities_id', ignoreDuplicates: true })

        if (upsertErr) { throw upsertErr }
    }
}

type Containsable<B> = {
    contains: (
        column: string,
        //eslint-disable-next-line
        value: string | readonly any[] | Record<string, unknown>
    ) => B
}

function applyHpFilters<B extends Containsable<B>>(
  hpSelect: B,
  filters: gqlTypes.HealthcareProfessionalSearchFilters
): B {
    let query = hpSelect

    if (filters.degrees?.length) {
        query = query.contains('degrees', filters.degrees as gqlTypes.Degree[])
    }
    if (filters.specialties?.length) {
        query = query.contains('specialties', filters.specialties as gqlTypes.Specialty[])
    }
    if (filters.spokenLanguages?.length) {
        query = query.contains('spokenLanguages', filters.spokenLanguages as gqlTypes.Locale[])
    }
    if (filters.acceptedInsurance?.length) {
        query = query.contains('acceptedInsurance', filters.acceptedInsurance as gqlTypes.Insurance[])
    }

    return query
}

function toHpInsertPayload(
  input: gqlTypes.CreateHealthcareProfessionalInput
): dbSchema.HealthcareProfessionalInsertRow {
    return {
        names: input.names,
        degrees: input.degrees!,
        spokenLanguages: input.spokenLanguages!,
        specialties: input.specialties!,
        acceptedInsurance: input.acceptedInsurance!,
        additionalInfoForPatients: input.additionalInfoForPatients ?? null,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString()
    }
}

function resolveFacilityIdFromRelationships(
  relationss: gqlTypes.Relationship[] | null | undefined
): { newFacilityId: string | null; error?: { field: string; httpStatus: number } } {
    if (!relationss || relationss.length === 0) {
        return {
            newFacilityId: null
        }
    }

    const creates = relationss.filter(relation => relation.action === gqlTypes.RelationshipAction.Create)
    const deletes = relationss.filter(relation => relation.action === gqlTypes.RelationshipAction.Delete)

    if (creates.length > 1) { 
        return {
            newFacilityId: null,
            error: {
                field: 'facilityIds',
                httpStatus: 400
            } 
        }
    }
    if (creates.length === 0 && deletes.length > 0) {
        return { newFacilityId: null, error: { field: 'facilityIds', httpStatus: 400 } }
    }
    if (creates.length === 1) { 
        return {
            newFacilityId: creates[0].otherEntityId
        }
    }
    if (deletes.length > 0) {
        return {
            newFacilityId: null
        }
    }
    return {
        newFacilityId: null
    }
}

async function getHpFacilityCount(hpId: string): Promise<number> {
    const { count: facilityCount, error: facilityCountError } = await supabaseClient
        .from('hps_facilities')
        .select('hps_id', { count: 'exact', head: true })
        .eq('hps_id', hpId)
        
    if (facilityCountError) {
        throw facilityCountError
    }

    return facilityCount ?? 0
}

/**
 * Gets the Healthcare Professional from the database that matches on the id.
 * @param id A string that matches the id of the Supabase for the professional.
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

        // Query the 'hps' table using the ID and expect exactly one row because of .single()
        const { data: healthcareProfessionalRow, error: healthcareProfessionalRowError } = await supabaseClient
            .from('hps')
            .select('*')
            .eq('id', id)
            .single()
        
        // PGRST116 = no rows found for single()
        if (healthcareProfessionalRowError?.code === 'PGRST116' || !healthcareProfessionalRow) {
            return {
                data: {} as gqlTypes.HealthcareProfessional,
                hasErrors: true,
                errors: [{ field: 'id', errorCode: ErrorCode.NOT_FOUND, httpStatus: 404 }]
            }
        }

        // Handle other DB errors
        if (healthcareProfessionalRowError) {
            throw healthcareProfessionalRowError
        }

        //Fetch related facility from the join table
        const { data: relatedRows, error: relatedErrors } = await supabaseClient
            .from('hps_facilities')
            .select('facilities_id')
            .eq('hps_id', id)

        if (relatedErrors) {
            throw relatedErrors
        }

        //Collect facilityIds into a simple array
        const facilityIds = (relatedRows ?? []).map(row => row.facilities_id as string)

        //Cast DB row to our typed schema and map to GraphQL type
        const dbHealthcareProfessional = healthcareProfessionalRow as dbSchema.DbHealthcareProfessionalRow
        const gqlHealthcareProfessional = mapDbHpToGql(dbHealthcareProfessional, facilityIds)

        return {
            data: gqlHealthcareProfessional,
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
        const validation = validateProfessionalsSearchInput(filters)

        if (validation.hasErrors) {
            return { data: [], hasErrors: true, errors: validation.errors }
        }
        
        const limit = filters.limit ?? 20
        const offset = filters.offset ?? 0

        // Build the base query and apply JSONB filters
        let hpQuery = applyHpFilters(supabaseClient.from('hps').select('*'), filters)

        const orderBy = filters.orderBy?.[0]

        if (orderBy?.fieldToOrder) {
            hpQuery = hpQuery.order(orderBy.fieldToOrder, {
                ascending: orderBy.orderDirection !== 'desc'
            })
        } else {
            hpQuery = hpQuery.order('createdDate', { ascending: false })
        }

        // Page the results
        const { data: hpRows, error: hpRowsError } = await hpQuery.range(offset, offset + limit - 1)

        if (hpRowsError) { throw hpRowsError }

        // Empty page
        if (!hpRows?.length) {
            return { data: [], hasErrors: false }
        }

        // Collect HP ids for this page to fetch facility relations in one query
        const hpIds = hpRows.map(related => related.id as string)

        // If for some reason no ids, skip relation query
        if (hpIds.length === 0) {
            const list = (hpRows as dbSchema.DbHealthcareProfessionalRow[]).map(hp => mapDbHpToGql(hp, []))

            return { data: list, hasErrors: false }
        }

        // Load relations for this page from the junction table
        const { data: facilityRelationsForHPs, error: facilityRelationsForHPsError } = await supabaseClient
            .from('hps_facilities')
            .select('hps_id, facilities_id')
            .in('hps_id', hpIds)

        if (facilityRelationsForHPsError) { throw facilityRelationsForHPsError }

        // Map for avoid N+1 issue, used like a lookup table because O(1)
        const facilityIdsByHp = new Map<string, string[]>()

        for (const relationshipRow of facilityRelationsForHPs ?? []) {
            const hpId = relationshipRow.hps_id as string
            const list = facilityIdsByHp.get(hpId) ?? []

            list.push(relationshipRow.facilities_id as string)
            facilityIdsByHp.set(hpId, list)
        }

        // Map the paginated DB rows to the final GraphQL shape, injecting the associated Facility IDs
        const list: gqlTypes.HealthcareProfessional[] = (hpRows as dbSchema.DbHealthcareProfessionalRow[]).map(hp => {
            const dbHealthcareProfessionalModel: dbSchema.DbHealthcareProfessionalRow & { facilityIds: string[] } = {
                ...hp,
                facilityIds: facilityIdsByHp.get(hp.id) ?? []
            }

            return mapDbHpToGql(dbHealthcareProfessionalModel, dbHealthcareProfessionalModel.facilityIds)
        })

        return { data: list, hasErrors: false }
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

        // Build a COUNT(*) query with the same JSONB filters used in search
        const countQuery = applyHpFilters(
            supabaseClient.from('hps').select('*', { count: 'exact', head: true }),
            filters
        )

        // Execute the count query
        const { count: hpCount, error: hpCountError } = await countQuery

        if (hpCountError) { throw hpCountError }

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
 */
export async function createHealthcareProfessional(
    input: gqlTypes.CreateHealthcareProfessionalInput,
    updatedBy: string
): Promise<Result<gqlTypes.HealthcareProfessional>> {
    let createdHpId: string | null = null

    try {
        const validationResult = validateCreateProfessionalInput(input)

        if (validationResult.hasErrors) {
            return validationResult as Result<gqlTypes.HealthcareProfessional>
        }

        //Business rule: HP → at least ONE facility
        const requestedFacilityIds: string[] = Array.isArray(input.facilityIds)
            ? (input.facilityIds as unknown[]).filter((facId): facId is string => typeof facId === 'string')
            : []

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

        const insertPayload = toHpInsertPayload(input)

        const { data: insertedRow, error: insertErr } = await supabaseClient
            .from('hps')
            .insert(insertPayload)
            .select('*')
            .single()

        if (insertErr) {
            throw insertErr
        }

        createdHpId = insertedRow.id as string
        
        //Join: enforce at most one facility link
        let facilityIdsForResponse: string[] = []

        if (requestedFacilityIds.length === 1) {
            const oneFacilityId = requestedFacilityIds[0]

            // Idempotent upsert on the junction table
            const { error: upsertRelationErr } = await supabaseClient
                .from('hps_facilities')
                .upsert(
                    //eslint-disable-next-line
                    [{ hps_id: createdHpId, facilities_id: oneFacilityId }],
                    { onConflict: 'hps_id,facilities_id', ignoreDuplicates: true }
                )

            if (upsertRelationErr) {
                logger.error(`Join hps_facilities failed for HP ${createdHpId}: ${upsertRelationErr.message}`)
            } else {
                facilityIdsForResponse = [oneFacilityId]
            }
        }
        
        const gqlHealthcareProfessional = mapDbHpToGql(
            insertedRow as dbSchema.DbHealthcareProfessionalRow,
            facilityIdsForResponse
        )
        
        await createAuditLogSQL({
            actionType: 'CREATE',
            objectType: 'HealthcareProfessional',
            updatedBy,
            newValue: gqlHealthcareProfessional
        })

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

        const oldValue = currentState.data

        // prepare the update payload for the hps tables
        const updatePayload = buildHpUpdatePayload(fieldsToUpdate)

        // If there are scalar fields (besides updatedDate) we issue a normal UPDATE,
        // otherwise we just "touch" updatedDate.
        const hasAnyScalarChange = Object.keys(updatePayload).length > 1

        if (hasAnyScalarChange) {
            const { error: updateErr } = await supabaseClient
                .from('hps')
                .update(updatePayload)
                .eq('id', id)

            if (updateErr) { throw updateErr }
        } else {
        // If we still want to update updatedDate to track the entity "touch"?
            const { error: touchErr } = await supabaseClient
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
            await setHpFacility(id, newFacilityId)
        }

        // Return the refreshed HP with relations included
        const refreshedResult = await getHealthcareProfessionalById(id)

        if (refreshedResult.hasErrors || !refreshedResult.data) {
            throw new Error('Could not reload updated healthcare professional.')
        }

        await createAuditLogSQL({
            actionType: 'UPDATE',
            objectType: 'HealthcareProfessional',
            updatedBy,
            oldValue,
            newValue: refreshedResult.data
        })

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

        const { error: hpDeleteErr } = await supabaseClient
            .from('hps')
            .delete()
            .eq('id', id)

        if (hpDeleteErr) {
            throw new Error(`Failed to delete professional: ${hpDeleteErr.message}`)
        }

        await createAuditLogSQL({
            actionType: 'DELETE',
            objectType: 'HealthcareProfessional',
            updatedBy,
            oldValue: existingHp.data
        })

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

        // 1) Split incoming relationships into ids to create/delete
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

        // INSERT/UPSERT relations first (idempotent)
        if (relationsToCreate.length > 0) {
            const { error: upsertErr } = await supabaseClient
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
            const { error: deleteErr } = await supabaseClient
                .from('hps_facilities')
                .delete()
                .eq('facilities_id', facilityId)
                .in('hps_id', idsToDelete)

            const hpCounts = await Promise.all(idsToDelete.map(async hpId => ({
                hpId,
                count: await getHpFacilityCount(hpId)
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

