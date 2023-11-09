import * as firebase from 'firebase-admin/firestore'
import * as gqlTypes from '../typeDefs/gqlTypes.js'
import * as dbSchema from '../typeDefs/dbSchema.js'
import { ErrorCode, Result } from '../result.js'
import { dbInstance } from '../firebaseDb.js'
import { updateHealthcareProfessionalIdRelationships as updateFacilitiesWithHealthcareProfessionalIdChanges } from './facilityService.js'

export async function getHealthcareProfessionalById(id: string): Promise<Result<gqlTypes.HealthcareProfessional>> {
    try {
        if (!id || !id.trim()) {
            return {
                data: {} as gqlTypes.HealthcareProfessional,
                hasErrors: true,
                errors: [{
                    field: 'id',
                    errorCode: ErrorCode.REQUIRED,
                    httpStatus: 400
                }]
            }
        }

        const healthcareProfessionalRef = dbInstance.collection('healthcareProfessionals')
        const dbDocument = await healthcareProfessionalRef.doc(id).get()

        if (!dbDocument.exists) {
            throw new Error('No healthcare Professional found with this id')
        }

        const dbEntity = dbDocument.data() as dbSchema.HealthcareProfessional
        const convertedEntity = mapDbEntityTogqlEntity(dbEntity)

        return {
            data: convertedEntity,
            hasErrors: false
        }
    } catch (error) {
        console.log(`ERROR: Error retrieving healthcareProfessional by id ${id}: ${error}`)

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
 * Creates a HealthcareProfessional.
 * - if you add any facilityids, it will update the corresponding facility by adding this healthcare professional id to their list
 * - business logic: a healthcare professional must be associated with at least one facility (otherwise no one can find them)
 * @param input the new HealthcareProfessional object
 * @param healthcareProfessionalRef optional: if you have an open firebase transaction, you can pass it here
 * @returns the newly created HealthcareProfessional so you don't have to query it after
 */
export async function createHealthcareProfessional(
    input: gqlTypes.CreateHealthcareProfessionalInput
): Promise<Result<gqlTypes.HealthcareProfessional>> {
    try {
        const validationResult = validateCreateProfessionalInput(input)

        if (validationResult.hasErrors) {
            return validationResult as Result<gqlTypes.HealthcareProfessional>
        }

        const healthcareProfessionalRef = dbInstance.collection('healthcareProfessionals').doc()
        const newHealthcareProfessionalId = healthcareProfessionalRef.id
        const newHealthcareProfessional = mapGqlEntityToDbEntity(newHealthcareProfessionalId, input)

        await healthcareProfessionalRef.set(newHealthcareProfessional)

        console.log(`DB-CREATE: Created healthcare professional ${newHealthcareProfessionalId}.\nEntity: ${JSON.stringify(newHealthcareProfessional)}`)

        //TODO: add healthcare professional id to associated facility

        const createdHealthcareProfessionalResult = await getHealthcareProfessionalById(newHealthcareProfessionalId)

        // if we didn't get it back or have errors, this is an actual error.
        if (createdHealthcareProfessionalResult.hasErrors || !createdHealthcareProfessionalResult.data) {
            throw new Error(`Error creating healthcare professional: ${JSON.stringify(createdHealthcareProfessionalResult.errors)}`)
        }

        return {
            data: createdHealthcareProfessionalResult.data,
            hasErrors: false
        }
    } catch (error) {
        console.log(`ERROR: Error creating healthcare professional: ${error}`)

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
    fieldsToUpdate: Partial<gqlTypes.UpdateHealthcareProfessionalInput>
): Promise<Result<gqlTypes.HealthcareProfessional>> => {
    try {
        const validationResult = validateUpdateProfessionalInput(fieldsToUpdate)

        if (validationResult.hasErrors) {
            return validationResult as Result<gqlTypes.HealthcareProfessional>
        }

        //let's wrap all of our updates in a transaction so we can roll back if anything fails. (for example we don't want to update the professional if updating the associated facility updates fail)
        await dbInstance.runTransaction(async (transaction: firebase.Transaction) => {

            const professionalRef = dbInstance.collection('healthcareProfessionals').doc(id)
            const dbDocument = await transaction.get(professionalRef)
            const dbProfessionalToUpdate = dbDocument.data() as dbSchema.HealthcareProfessional
            const updatedDbProfessional: dbSchema.HealthcareProfessional = {
                ...dbProfessionalToUpdate,
                //TODO: the partial update should happen right here
                updatedDate: new Date().toISOString()
            }

            //let's update all the facilities that should add or remove this professional id from their healthcareProfessionalIds array 
            if (fieldsToUpdate.facilityIds && fieldsToUpdate.facilityIds.length > 0) {
                const facilityUpdateResults = await updateFacilityRelationships(dbProfessionalToUpdate.id, fieldsToUpdate.facilityIds, dbProfessionalToUpdate.facilityIds)

                // if we didn't get it back or have errors, this is an actual error.
                if (facilityUpdateResults.hasErrors || !facilityUpdateResults.data) {
                    throw new Error(`ERROR: Error updating healthcare professional facilityIds: ${JSON.stringify(facilityUpdateResults.errors)}`)
                }

                //let's update the professional with the new facility ids
                updatedDbProfessional.facilityIds = facilityUpdateResults.data
            }

            //this will update only the fields that are provided and are not undefined.
            await transaction.update(updatedDbProfessional, { merge: true })
            console.log(`DB-UPDATE: Updated healthcare professional ${id}.\nEntity: ${JSON.stringify(updatedDbProfessional)}`)
        })

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
        console.log(`ERROR: Error updating healthcareProfessional ${id}: ${error}`)

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
 * Updates all the facilities that have an id in the facilityIds array. It will add or delete based on the action provided. 
 * @param healthcareProfessionalId The ID of the healthcare professional in the database.
 * @param facilityRelationshipChanges The changes to the facility relationships.
 * @param originalFacilityIds The original facility ids for the healthcare professional.
 * @returns The updated facility ids for the healthcare professional based on the action.
*/
async function updateFacilityRelationships(healthcareProfessionalId: string, facilityRelationshipChanges: gqlTypes.Relationship[], originalFacilityIds: string[])
: Promise<Result<string[]>> {
    // deep clone the array so we don't modify the original
    let updatedFacilityIdsArray = [...originalFacilityIds]

    facilityRelationshipChanges.forEach(change => {
        switch (change.action) {
            case gqlTypes.RelationshipAction.Create:
                updatedFacilityIdsArray.push(change.otherEntityId)
                break;
            case gqlTypes.RelationshipAction.Delete:
                updatedFacilityIdsArray = updatedFacilityIdsArray.filter(id => id !== change.otherEntityId)
                break;
            default:
                break;
        }
    });

    //update all the associated facilities (note: this should be contained within a transaction with the professional  so we can roll back if anything fails)
    const facilityUpdateResults = await updateFacilitiesWithHealthcareProfessionalIdChanges(facilityRelationshipChanges, healthcareProfessionalId)
    
    return {
        //let's return the updated facilityIds array so we can update the healthcare professional
        data: updatedFacilityIdsArray,
        hasErrors: facilityUpdateResults.hasErrors,
        errors: facilityUpdateResults.errors
    }
}

function mapGqlEntityToDbEntity(newHealthcareProfessionalId: string, input: gqlTypes.CreateHealthcareProfessionalInput) {
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
        updatedDate: new Date().toISOString()
    } satisfies dbSchema.HealthcareProfessional
}

function mapDbEntityTogqlEntity(dbEntity: firebase.DocumentData) {
    const gqlEntity = {
        id: dbEntity.id,
        names: dbEntity.names,
        degrees: dbEntity.degrees,
        spokenLanguages: dbEntity.spokenLanguages,
        specialties: dbEntity.specialties,
        acceptedInsurance: dbEntity.acceptedInsurance,
        facilityIds: dbEntity.facilityIds,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString()
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

    //business rule: at least one facility id is required
    if (!input.facilityIds || input.facilityIds.length < 1) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'facilityIds',
            errorCode: ErrorCode.UPDATEPROFFESIONAL_FACILITYIDS_REQUIRED,
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

function validateDegrees(
    degrees: gqlTypes.InputMaybe<gqlTypes.Degree[]> | undefined,
    validationResults: Result<unknown>
): void {
    if (!degrees) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'degrees',
            errorCode: ErrorCode.REQUIRED,
            httpStatus: 400
        })
    }

    if (degrees && degrees.length > 64) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'degrees',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    degrees?.forEach(degree => {
        if (degree.nameJa && degree.nameJa.length > 64) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'degrees',
                errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
                httpStatus: 400
            })
        }

        if (degree.nameEn && degree.nameEn.length > 64) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'degrees',
                errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
                httpStatus: 400
            })
        }

        if (degree.abbreviation && degree.abbreviation.length > 64) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'degrees',
                errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
                httpStatus: 400
            })
        }
    })

    //TODO validate each degree
}

function validateNames(
    names: gqlTypes.LocalizedNameInput[] | undefined | null,
    validationResults: Result<unknown>
): void {
    if (!names) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'names',
            errorCode: ErrorCode.REQUIRED,
            httpStatus: 400
        })
    }

    if (names && names.length > 16) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'names',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    //TODO validate each name
}

function validateSpecialties(
    specialties: gqlTypes.SpecialtyInput[] | undefined | null,
    validationResults: Result<unknown>
): void {
    if (!specialties) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'specialties',
            errorCode: ErrorCode.REQUIRED,
            httpStatus: 400
        })
    }

    if (specialties && specialties.length > 16) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'specialties',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    //TODO validate each specialty
}

function validateInsurance(
    insurance: gqlTypes.Insurance[] | undefined | null,
    validationResults: Result<unknown>
): void {
    if (!insurance) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'insurance',
            errorCode: ErrorCode.REQUIRED,
            httpStatus: 400
        })
    }

    if (insurance && insurance.length > 16) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'insurance',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    //TODO validate each insurance
}

function validateSpokenLanguages(
    spokenLanguages: gqlTypes.Locale[] | undefined | null,
    validationResults: Result<unknown>
): void {
    if (!spokenLanguages || spokenLanguages.length < 1) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'spokenLanguages',
            errorCode: ErrorCode.REQUIRED,
            httpStatus: 400
        })
    }

    if (spokenLanguages && spokenLanguages.length > 32) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'spokenLanguages',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    //TODO validate each spoken Language
}
