import { DocumentData, Query, WriteBatch } from 'firebase-admin/firestore'
import * as gqlTypes from '../typeDefs/gqlTypes.js'
import * as dbSchema from '../typeDefs/dbSchema.js'
import { ErrorCode, Result } from '../result.js'
import { dbInstance } from '../firebaseDb.js'
import { hasSpecialCharacters, isValidEmail, isValidPhoneNumber, isValidWebsite } from '../../utils/stringUtils.js'
import { MapDefinedFields } from '../../utils/objectUtils.js'
import { updateHealthcareProfessionalsWithFacilityIdChanges } from './healthcareProfessionalService.js'
import { logger } from '../logger.js'

/**
 * Gets the Facility from the database that matches on the id.
 * @param id A string that matches the id of the Firestore Document for the Facility.
 * @returns A Facility object.
 */
export const getFacilityById = async (id: string)
    : Promise<Result<gqlTypes.Facility>> => {
    try {
        const validationResult = validateIdInput(id)

        if (validationResult.hasErrors) {
            logger.warn(`Validation Error: User passed in invalid id: ${id}}`)
            return validationResult as Result<gqlTypes.Facility>
        }

        //using .doc(id) pulls from a stale cache, so we use a .where() query instead.
        const facilityRef = dbInstance.collection('facilities').where('id', '==', id)
        const dbQueryResults = await facilityRef.get()
        const dbDocs = dbQueryResults.docs

        if (dbDocs.length != 1) {
            throw new Error(`No facility found with id: ${id}`)
        }

        const dbFacility = dbDocs[0].data() as dbSchema.Facility
        const convertedEntity = mapDbEntityTogqlEntity(dbFacility)

        return {
            data: convertedEntity,
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
 * This is a search function that will return a list of Facilities that match the filters. 
 * - At the moment, filters have to match exactly, and there is no fuzzy search.
 * @param filters All the optional filters that can be applied to the search.
 * @returns The matching Facilities.
 */
export async function searchFacilities(filters: gqlTypes.FacilitySearchFilters = {}):
    Promise<Result<gqlTypes.Facility[]>> {
    try {
        const validationResult = validateFacilitiesSearchInput(filters)

        if (validationResult.hasErrors) {
            return validationResult as Result<gqlTypes.Facility[]>
        }

        let searchRef: Query<DocumentData> = dbInstance.collection('facilities')

        if (filters.nameEn) {
            searchRef = searchRef.where('nameEn', '==', filters.nameEn)
        }

        if (filters.nameJa) {
            searchRef = searchRef.where('nameJa', '==', filters.nameJa)
        }

        if (filters.healthcareProfessionalIds && filters.healthcareProfessionalIds.length > 0) {
            searchRef = searchRef.where('healthcareProfessionalIds', 'array-contains-any', filters.healthcareProfessionalIds)
        }

        if (filters.createdDate) {
            searchRef = searchRef.where('createdDate', '==', filters.createdDate)
        }

        if (filters.updatedDate) {
            searchRef = searchRef.where('updatedDate', '==', filters.updatedDate)
        }

        if (filters.orderBy && Array.isArray(filters.orderBy)) {
            filters.orderBy.forEach(order => {
                if (order) {
                    searchRef = searchRef.orderBy(order.fieldToOrder as string,
                        order.orderDirection as gqlTypes.OrderDirection)
                }
            })
        } else {
            searchRef = searchRef.orderBy('createdDate', gqlTypes.OrderDirection.Desc)
        }

        searchRef = searchRef.limit(filters.limit || 20)
        searchRef = searchRef.offset(filters.offset || 0)

        const dbDocument = await searchRef.get()
        const dbFacilities = dbDocument.docs
        const gqlFacilities = dbFacilities.map(dbFacility =>
            mapDbEntityTogqlEntity(dbFacility.data() as dbSchema.Facility))

        return {
            data: gqlFacilities,
            hasErrors: false
        }
    } catch (error) {
        logger.error(`ERROR: Error retrieving facilities by filters ${JSON.stringify(filters)}: ${error}`)

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
 * Creates a new Facility. 
 * Any healthcareprofessionalIds will build an association, but it won't create a healthcare professional. 
 * You need to call the `createHealthcareProfessional` function separately. This prevents hidden side effects.
 * @param facilityInput 
 * @returns A Facility with a list containing the ID of the initial HealthcareProfessional that was created.
 */
export async function createFacility(facilityInput: gqlTypes.CreateFacilityInput): Promise<Result<gqlTypes.Facility>> {
    try {
        const validationResult = validateCreateFacilityInput(facilityInput)

        if (validationResult.hasErrors) {
            return validationResult as Result<gqlTypes.Facility>
        }

        const facilityRef = dbInstance.collection('facilities').doc()
        const newFacilityId = facilityRef.id
        const newDbFacility = mapGqlCreateInputToDbEntity(facilityInput, newFacilityId)

        //let's wrap all of our updates in a batch so we can roll back if anything fails. (for example we don't want to update the professional if updating the associated facility updates fail)
        const batch = dbInstance.batch()

        //let's update all the healthcareProfessionals that should add this facilityId to their facilityIds array
        if (newDbFacility.healthcareProfessionalIds && newDbFacility.healthcareProfessionalIds.length > 0) {
            const healthcareProfessionalUpdateResults = await processHealthcareProfessionalRelationshipChanges(
                newDbFacility.id,
                newDbFacility.healthcareProfessionalIds.map(id => ({
                    otherEntityId: id,
                    action: gqlTypes.RelationshipAction.Create
                } satisfies gqlTypes.Relationship)),
                batch
            )

            // if we didn't get it back or have errors, this is an actual error.
            if (healthcareProfessionalUpdateResults.hasErrors || !healthcareProfessionalUpdateResults.data) {
                throw new Error(`ERROR: Error updating facility's healthcareProfessionalIds: ${JSON.stringify(healthcareProfessionalUpdateResults.errors)}`)
            }
        }

        batch.set(facilityRef, newDbFacility)
        logger.info(`\nDB-CREATE: CREATE facility ${newFacilityId}.\nEntity: ${JSON.stringify(newDbFacility)}`)

        await batch.commit()

        //let's return the newly created facility. Since we have the full entity, no need to do a new query. 
        const createdGqlEntity = mapDbEntityTogqlEntity(newDbFacility)

        return {
            data: createdGqlEntity,
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
 * Updates a Facility in the database with the params in the database based on the id. 
 * - It will only update the fields that are provided and are not undefined.
 * - If you want to create a new HealthcareProfessional, you need to call the `createHealthcareProfessional` function separately. This prevents hidden side effects.
 * - If you want to link an existing HealthcareProfessional to a Facility, add the healthcareprofessionalId to the `healthcareProfessionalIds` array. 
     Use the action to add or remove the association. If an id isn't in the list, no change will occur. 
 * @param facilityId The ID of the facility in the database.
 * @param fieldsToUpdate The values that should be updated. They will be created if they don't exist.
 * @returns The updated Facility.
 */
export const updateFacility = async (facilityId: string, fieldsToUpdate: Partial<gqlTypes.UpdateFacilityInput>)
    : Promise<Result<gqlTypes.Facility>> => {
    try {
        const validationResult = validateUpdateFacilityInput(fieldsToUpdate)

        if (validationResult.hasErrors) {
            return validationResult as Result<gqlTypes.Facility>
        }

        //let's wrap all of our updates in a batch so we can roll back if anything fails. (for example we don't want to update the professional if updating the associated facility updates fail)
        const batch = dbInstance.batch()
        const facilityRef = dbInstance.collection('facilities').doc(facilityId)
        const dbDocument = await facilityRef.get()
        const dbFacilityToUpdate = dbDocument.data() as dbSchema.Facility

        //let's update the fields that were provided
        MapDefinedFields(fieldsToUpdate, dbFacilityToUpdate)

        //Business rule: always timestamp when the entity was updated.
        dbFacilityToUpdate.updatedDate = new Date().toISOString()

        //let's update all the healthcareProfessionals that should add or remove this facilityId from their facilityIds array 
        if (fieldsToUpdate.healthcareProfessionalIds && fieldsToUpdate.healthcareProfessionalIds.length > 0) {
            const healthcareProfessionalUpdateResults = await processHealthcareProfessionalRelationshipChanges(
                dbFacilityToUpdate.id,
                fieldsToUpdate.healthcareProfessionalIds,
                batch,
                dbFacilityToUpdate.healthcareProfessionalIds ?? []
            )

            // if we didn't get it back or have errors, this is an actual error.
            if (healthcareProfessionalUpdateResults.hasErrors || !healthcareProfessionalUpdateResults.data) {
                throw new Error(`Error updating facility's healthcareProfessionalIds: ${JSON.stringify(healthcareProfessionalUpdateResults.errors)}`)
            }

            //let's update the professional with the new facility ids
            dbFacilityToUpdate.healthcareProfessionalIds = healthcareProfessionalUpdateResults.data
        }

        batch.set(facilityRef, dbFacilityToUpdate, { merge: true })
        logger.info(`\nDB-UPDATE: Updated facility ${facilityRef.id}.\n Entity: ${JSON.stringify(dbFacilityToUpdate)}`)

        // This will commit all the changes across the facility and the associated professionals.
        await batch.commit()

        const queriedFacilityResult = await getFacilityById(facilityId)

        // if we didn't get it back or have errors, this is an actual error.
        if (queriedFacilityResult.hasErrors || !queriedFacilityResult.data) {
            throw new Error(`Error updating facility. Couldn't query the updated facility: ${JSON.stringify(queriedFacilityResult.errors)}`)
        }

        return {
            data: queriedFacilityResult.data,
            hasErrors: false
        }
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
 * Updates all the healthcare professionals that have an id in the healthcareProfessionalIds array. It will add or delete based on the action provided. 
 * @param facilityId The ID of the facility in the database.
 * @param healthcareProfessionalRelationshipChanges The changes to the healthcare professional relationships.
* @param batch - The batch that we add the db writes to. The parent controls when the batch is committed.
 * @param originalHealthcareProfessionalIds The original healthcare professional ids for the facility.
 * @returns The updated facility ids for the healthcare professional based on the action.
*/
async function processHealthcareProfessionalRelationshipChanges(facilityId: string,
    healthcareProfessionalRelationshipChanges: gqlTypes.Relationship[],
    batch: WriteBatch,
    originalHealthcareProfessionalIds: string[] = [])
    : Promise<Result<string[]>> {
    // deep clone the array so we don't modify the original
    let updatedProfessionalIdsArray = [...originalHealthcareProfessionalIds]

    healthcareProfessionalRelationshipChanges.forEach(change => {
        switch (change.action) {
            case gqlTypes.RelationshipAction.Create:
                updatedProfessionalIdsArray.push(change.otherEntityId)
                break
            case gqlTypes.RelationshipAction.Delete:
                updatedProfessionalIdsArray = updatedProfessionalIdsArray.filter(id => id !== change.otherEntityId)
                break
            default:
                break
        }
    })

    //update all the associated healthcare professionals (note: this should be contained within a transaction with the facility so we can roll back if anything fails)
    const healthcareProfessionalUpdateResults = await updateHealthcareProfessionalsWithFacilityIdChanges(
        healthcareProfessionalRelationshipChanges,
        facilityId,
        batch
    )

    return {
        //let's return the updated healthcareProfessionalIds array so we can update the facility
        data: updatedProfessionalIdsArray,
        hasErrors: healthcareProfessionalUpdateResults.hasErrors,
        errors: healthcareProfessionalUpdateResults.errors
    }
}

/**
    * This function updates the healthcareprofessional id list for each facility listed. 
    * Based on the action, it will add or remove the healthcareprofessional id from the existing list of healthcare professional ids.
    * @param facilitiesToUpdate - The list of facilities to update. 
    * @param healthcareProfessionalId - The id of the healthcareprofessional that is being added or removed. 
    * @param batch - The batch that we add the db writes to. The parent controls when the batch is committed.
    * @returns Result containing any errors that occurred.
*/
export async function updateFacilitiesWithHealthcareProfessionalIdChanges(
    facilitiesToUpdate: gqlTypes.Relationship[],
    healthcareProfessionalId: string,
    batch: WriteBatch
): Promise<Result<void>> {
    try {
        if (!facilitiesToUpdate || facilitiesToUpdate.length === 0) {
            return {
                data: undefined,
                hasErrors: false
            }
        }

        const facilityQuery = dbInstance.collection('facilities').where('id', 'in', facilitiesToUpdate.map(f => f.otherEntityId))
        // A Firestore transaction requires all reads to happen before any writes, so we'll query all the professionals first. 
        const allFacilityDocuments = await facilityQuery.get()
        const dbFacilitiesToUpdate = allFacilityDocuments.docs ?? []

        dbFacilitiesToUpdate.forEach(dbFacility => {
            // await Promise.all(dbFacilitiesToUpdate.map(async dbFacility => {
            // for await (const dbFacility of dbFacilitiesToUpdate) {
            const matchingRelationship = facilitiesToUpdate.find(f => f.otherEntityId === dbFacility.id)
            const dbFacilityData = dbFacility.data() as dbSchema.Facility

            if (!matchingRelationship) {
                throw new Error(`updating facility healthcareprofessional id list for ${dbFacility.id}. Could not find matching relationship.`)
            }

            //we want to add or remove the healthcareprofessional id from the list based on the action.
            switch (matchingRelationship.action) {
                case gqlTypes.RelationshipAction.Create:
                    dbFacilityData.healthcareProfessionalIds.push(healthcareProfessionalId)
                    break
                case gqlTypes.RelationshipAction.Delete:
                    dbFacilityData.healthcareProfessionalIds = dbFacilityData.healthcareProfessionalIds
                        .filter(id => id !== healthcareProfessionalId)
                    break
                default:
                    logger.error(`ERROR: updating facility healthcareprofessional id list for ${matchingRelationship.otherEntityId}. Contained an invalid relationship action of ${matchingRelationship.action}`)
                    break
            }

            //business rule: we always timestamp when the entity was updated.
            dbFacilityData.updatedDate = new Date().toISOString()

            //This will add the record update to the batch, but we don't want to commit at this point. 
            batch.set(dbFacility.ref, dbFacilityData, { merge: true })
            logger.info(`\nDB-UPDATE: Updated facility ${dbFacilityData.id} healthcareprofessional relation ids.\n Updated values: ${JSON.stringify(dbFacilityData)}`)
        })

        return {
            data: undefined,
            hasErrors: false
        }
    } catch (error) {
        logger.error(`ERROR: Error updating facility healthcareprofessional id list: ${error}`)

        return {
            data: undefined,
            hasErrors: true,
            errors: [{
                field: 'updateFacilityHealthcareprofessionalAssociations',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

/**
 * This deletes a Facility from the database. If the Facility doesn't exist, it will return a validation error.
 * @param id The ID of the facility in the database to delete.
 */
export async function deleteFacility(id: string)
    : Promise<Result<gqlTypes.DeleteResult>> {
    try {
        //let's wrap all of our updates in a batch so we can roll back if anything fails. (for example we don't want to update the professional if updating the associated facility updates fail)
        const batch = dbInstance.batch()
        const facilityRef = dbInstance.collection('facilities').where('id', '==', id)
        const dbDocument = await facilityRef.get()

        if (dbDocument.empty) {
            logger.warn(`Validation Error: User tried deleting non-existant facility: ${id}`)

            return {
                data: {
                    isSuccessful: false
                },
                hasErrors: true,
                errors: [{
                    field: 'deleteFacility',
                    errorCode: ErrorCode.INVALID_ID,
                    httpStatus: 404
                }]
            }
        }

        if (dbDocument.docs.length > 1) {
            logger.error(`ERROR: Found multiple facilities with id ${id}. This should never happen.`)

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

        const facility = dbDocument.docs[0].data() as dbSchema.Facility

        //let's update all the healthcareProfessionals that should remove this facilityId from their facilityIds array
        const professionalUpdateResults = await processHealthcareProfessionalRelationshipChanges(
            id,
            facility.healthcareProfessionalIds.map(
                professionalId => ({
                    otherEntityId: professionalId,
                    action: gqlTypes.RelationshipAction.Delete
                } satisfies gqlTypes.Relationship)
            ),
            batch
        )

        // if we have errors, this is an actual error.
        if (professionalUpdateResults.hasErrors) {
            throw new Error(`ERROR: Error updating associated facility's healthcareProfessionalIds: ${JSON.stringify(professionalUpdateResults.errors)}`)
        }

        batch.delete(dbDocument.docs[0].ref)
        logger.info(`\nDB-DELETE: facility ${id} was deleted.\nEntity: ${JSON.stringify(dbDocument)}`)

        // This will commit all the changes across the facility and the associated professionals.
        await batch.commit()

        return {
            data: {
                isSuccessful: true
            },
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
 * Converts the values for FacilityInput to the format they will be stored as in the database.
 * @param input - The `FacilityInput` variables that were passed in the API request.
 * @param newId - The ID of the Facility in the Firestore collection.
 * @returns 
 */
function mapGqlCreateInputToDbEntity(input: gqlTypes.CreateFacilityInput, newId: string): dbSchema.Facility {
    return {
        id: newId,
        nameEn: input.nameEn,
        nameJa: input.nameJa,
        contact: input.contact,
        mapLatitude: input.mapLatitude,
        mapLongitude: input.mapLongitude,
        healthcareProfessionalIds: input.healthcareProfessionalIds as string[],
        //business rule: createdDate cannot be set by the user.
        createdDate: new Date().toISOString(),
        //business rule: updatedDate is updated on every change.
        updatedDate: new Date().toISOString()

    } satisfies dbSchema.Facility
}

const mapDbEntityTogqlEntity = (dbEntity: dbSchema.Facility): gqlTypes.Facility => {
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

export function validateIdInput(id: string): Result<unknown> {
    const validationResults: Result<unknown> = {
        data: undefined,
        hasErrors: false,
        errors: []
    }

    if (id && (hasSpecialCharacters(id) || id.length > 4096)) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'id',
            errorCode: ErrorCode.INVALID_ID,
            httpStatus: 400
        })
    }

    return validationResults
}

function validateFacilitiesSearchInput(searchInput: gqlTypes.FacilitySearchFilters): Result<unknown> {
    const validationResults: Result<unknown> = {
        data: [],
        hasErrors: false,
        errors: []
    }

    if (searchInput.nameEn && searchInput.nameEn.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'nameEn',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (searchInput.nameJa && searchInput.nameJa.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'nameJa',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (searchInput.limit && searchInput.limit > 1000) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'limit',
            errorCode: ErrorCode.MAX_LIMIT,
            httpStatus: 400
        })
    }

    if (searchInput.limit && searchInput.limit < 0) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'limit',
            errorCode: ErrorCode.MIN_LIMIT,
            httpStatus: 400
        })
    }

    return validationResults
}

function validateUpdateFacilityInput(input: Partial<gqlTypes.UpdateFacilityInput>): Result<unknown> {
    const validationResults: Result<unknown> = {
        data: undefined,
        hasErrors: false,
        errors: []
    }

    if (input.nameEn && input.nameEn.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'nameEn',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (input.nameJa && input.nameJa.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'nameJa',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (input.contact) {
        const contactValidationResults = validateContactInput(input.contact)

        if (contactValidationResults.hasErrors) {
            validationResults.hasErrors = true
            validationResults.errors?.push(...contactValidationResults.errors as [])
        }
    }

    return validationResults
}

function validateCreateFacilityInput(input: gqlTypes.CreateFacilityInput): Result<unknown> {
    const validationResults: Result<unknown> = {
        data: undefined,
        hasErrors: false,
        errors: []
    }

    if (!input.nameEn) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'nameEn',
            errorCode: ErrorCode.REQUIRED,
            httpStatus: 400
        })
    }

    if (input.nameEn && input.nameEn.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'nameEn',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (!input.nameJa) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'nameJa',
            errorCode: ErrorCode.REQUIRED,
            httpStatus: 400
        })
    }

    if (input.nameJa && input.nameJa.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'nameJa',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (input.contact) {
        const contactValidationResults = validateContactInput(input.contact)

        if (contactValidationResults.hasErrors) {
            validationResults.hasErrors = true
            validationResults.errors?.push(...contactValidationResults.errors as [])
        }
    }

    return validationResults
}

function validateContactInput(contactInput: gqlTypes.Contact): Result<unknown> {
    const validationResults: Result<unknown> = {
        data: undefined,
        hasErrors: false,
        errors: []
    }

    if (!contactInput) {
        return validationResults
    }

    if (contactInput.email && (!isValidEmail(contactInput.email) || contactInput.email.length > 128)) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'email',
            errorCode: ErrorCode.INVALID_EMAIL,
            httpStatus: 400
        })
    }

    if (contactInput.phone && !isValidPhoneNumber(contactInput.phone)) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'phone',
            errorCode: ErrorCode.INVALID_PHONE_NUMBER,
            httpStatus: 400
        })
    }

    if (contactInput.website && !isValidWebsite(contactInput.website)) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'website',
            errorCode: ErrorCode.INVALID_WEBSITE,
            httpStatus: 400
        })
    }

    if (contactInput.address) {
        const addressValidationResults = validateAddressInput(contactInput.address)

        if (addressValidationResults.hasErrors) {
            validationResults.hasErrors = true
            validationResults.errors?.push(...addressValidationResults.errors as [])
        }
    }

    return validationResults
}

function validateAddressInput(input: gqlTypes.PhysicalAddress): Result<unknown> {
    const validationResults: Result<unknown> = {
        data: undefined,
        hasErrors: false,
        errors: []
    }

    if (input.addressLine1En && input.addressLine1En.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'addressLine1En',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (input.addressLine2En && input.addressLine2En.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'addressLine2En',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (input.addressLine1Ja && input.addressLine1Ja.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'addressLine1Ja',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (input.addressLine2Ja && input.addressLine2Ja.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'addressLine2Ja',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (input.cityEn && input.cityEn.length > 64) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'cityEn',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (input.cityJa && input.cityJa.length > 64) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'cityJa',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (input.postalCode && input.postalCode.length > 18) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'postalCode',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (input.prefectureEn && input.prefectureEn.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'prefectureEn',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (input.prefectureJa && input.prefectureJa.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'prefectureJa',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    return validationResults
}
