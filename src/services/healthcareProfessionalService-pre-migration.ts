import * as gqlTypes from '../typeDefs/gqlTypes.js'
import * as dbSchema from '../typeDefs/dbSchema.js'
import { ErrorCode, Result } from '../result.js'
import { validateProfessionalsSearchInput, validateUpdateProfessionalInput, validateCreateProfessionalInput } from '../validation/validationHealthcareProfessional.js'
import { validateIdInput } from '../validation/validateFacility.js'
import { logger } from '../logger.js'
import { supabase } from '../supabaseClient.js'
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
    const { error: delErr } = await supabase
        .from('hps_facilities')
        .delete()
        .eq('hps_id', hpId)

    if (delErr) { throw delErr }

    if (facilityId) {
        const { error: upsertErr } = await supabase
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
    const { count: facilityCount, error: facilityCountError } = await supabase
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
        const { data: healthcareProfessionalRow, error: healthcareProfessionalRowError } = await supabase
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
        const { data: relatedRows, error: relatedErrors } = await supabase
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
        let hpQuery = applyHpFilters(supabase.from('hps').select('*'), filters)

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
        const { data: facilityRelationsForHPs, error: facilityRelationsForHPsError } = await supabase
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
            supabase.from('hps').select('*', { count: 'exact', head: true }),
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

            if (upsertRelationErr) {
                logger.error(`Join hps_facilities failed for HP ${createdHpId}: ${upsertRelationErr.message}`)
            } else {
                facilityIdsForResponse = [oneFacilityId]
            }
        })
        
        logger.info(`\nDB-CREATE: Created healthcare professional ${newHealthcareProfessionalId}.\nEntity: ${JSON.stringify(newHealthcareProfessional)}`)

        //let's return the newly created professional. Since we have the full entity, no need to do a new query.
        const createdHealthcareProfessionalResult = mapDbEntityTogqlEntity(newHealthcareProfessional)

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
        const dbRef = dbInstance.collection('healthcareProfessionals')
        const query = dbRef.where('id', '==', id)
        const dbDocument = await query.get()
        
        if (dbDocument.empty) {
            logger.warn(`Validation Error: User tried deleting non-existant healthcare professional: ${id}`)
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

