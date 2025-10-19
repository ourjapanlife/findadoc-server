import { DocumentData, Transaction } from 'firebase-admin/firestore'
import * as gqlTypes from '../typeDefs/gqlTypes.js'
import * as dbSchema from '../typeDefs/dbSchema.js'
import { ErrorCode, Result } from '../result.js'
import { dbInstance } from '../firebaseDb.js'
import { validateNames, validateDegrees, validateProfessionalsSearchInput, validateInsurance, validateSpecialties, validateSpokenLanguages } from '../validation/validationHealthcareProfessional.js'
import { updateFacilitiesWithHealthcareProfessionalIdChanges, validateIdInput } from './facilityService-pre-migration.js'
import { MapDefinedFields } from '../../utils/objectUtils.js'
import { logger } from '../logger.js'
import { createAuditLog } from './auditLogService.js'
import { chunkArray } from '../../utils/arrayUtils.js'
import { buildBaseHealthcareProfessionalsQuery } from '../../utils/searchHealthcareProfessionalQueryUtils.js'

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

/**
 * Searches for healthcare professionals based on provided filters.
 * Returns a paginated list of professionals.
 * @param filters An object that contains parameters to filter on.
 * @returns An object containing `data` (an array of GraphQL HealthcareProfessionals), `hasErrors` flag, and optional `errors` array.
 */
export async function searchProfessionals(filters: gqlTypes.HealthcareProfessionalSearchFilters = {}):
Promise<Result<gqlTypes.HealthcareProfessional[]>> {
    try {
        const validationResult = validateProfessionalsSearchInput(filters)

        if (validationResult.hasErrors) {
            return {
                data: [],
                hasErrors: true,
                errors: validationResult.errors
            }
        }

        let finalGqlProfessionalsForNodes: gqlTypes.HealthcareProfessional[] = []

        // Use the new helper function to build the base query/list
        const baseQueryResult = await buildBaseHealthcareProfessionalsQuery(filters)

        if (baseQueryResult.hasErrors) {
            return {
                data: [],
                hasErrors: true,
                errors: baseQueryResult.errors
            }
        }

        if (baseQueryResult.list) {
            // If in-memory processing was used, baseQueryResult.list already contains filtered and sorted data
            // Apply pagination (limit/offset) to this list
            const allFilteredAndSorted = baseQueryResult.list
            const startIndex = filters.offset || 0
            const limit = filters.limit || 20
            const endIndex = startIndex + limit

            finalGqlProfessionalsForNodes = allFilteredAndSorted.slice(startIndex, endIndex)
        } else if (baseQueryResult.query) {
            // If Firestore query was built, execute it with limit/offset and map results
            let searchRef = baseQueryResult.query
            const limit = filters.limit || 20
            const offset = filters.offset || 0

            searchRef = searchRef.limit(limit).offset(offset)
            const dbDocument = await searchRef.get()
            const dbProfessionals = dbDocument.docs

            finalGqlProfessionalsForNodes = dbProfessionals.map(dbProfessional =>
                mapDbEntityTogqlEntity(dbProfessional.data() as dbSchema.HealthcareProfessional))
        }

        // Apply final ID filtering if 'ids' filter is provided
        if (filters.ids && filters.ids?.length > 0) {
            finalGqlProfessionalsForNodes = finalGqlProfessionalsForNodes.filter(professional =>
                filters.ids?.includes(professional.id))
        }

        return {
            data: finalGqlProfessionalsForNodes,
            hasErrors: false
        }
    } catch (error: unknown) {
        logger.error(`ERROR: Error searching healthcare professionals by filters ${JSON.stringify(filters)}: ${error}`)

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
 * Gets the total count of healthcare professionals matching the given filters.
 * @param filters An object that contains parameters to filter on.
 * @returns An object containing `data` (the total count), `hasErrors` flag, and optional `errors` array.
 */
export async function countProfessionals(filters: gqlTypes.HealthcareProfessionalSearchFilters = {}):
Promise<Result<number>> {
    try {
        const validationResult = validateProfessionalsSearchInput(filters)

        if (validationResult.hasErrors) {
            return {
                data: 0,
                hasErrors: true,
                errors: validationResult.errors
            }
        }

        // Use the new helper function to build the base query/list
        const baseQueryResult = await buildBaseHealthcareProfessionalsQuery(filters)

        if (baseQueryResult.hasErrors) {
            return {
                data: 0,
                hasErrors: true,
                errors: baseQueryResult.errors
            }
        }

        let totalCount = 0

        if (baseQueryResult.list) {
            // If in-memory processing was used, the totalCount is simply the length of the list
            totalCount = baseQueryResult.list.length
        } else if (baseQueryResult.query) {
            // If Firestore query was built, use the totalCountForQueryPath returned by the builder
            totalCount = baseQueryResult.totalCountForQueryPath || 0
        }

        return {
            data: totalCount,
            hasErrors: false
        }
    } catch (error: unknown) {
        logger.error(`ERROR: Error counting healthcare professionals by filters ${JSON.stringify(filters)}: ${error}`)
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

export function mapGqlEntityToDbEntity(newHealthcareProfessionalId: string,
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

export function mapDbEntityTogqlEntity(dbEntity: DocumentData)
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
