import * as firebase from 'firebase-admin/firestore'
import * as gqlTypes from '../typeDefs/gqlTypes'
import * as dbSchema from '../typeDefs/dbSchema'
import { ErrorCode, Result } from '../result'
import { dbInstance } from '../firebaseDb'

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
        const whereCondition = '=' as firebase.WhereFilterOp
        const snapshot = await healthcareProfessionalRef.where('id', whereCondition, id).get()

        if (snapshot.docs.length < 1) {
            throw new Error('No healthcare Professional found with this id')
        }

        const convertedEntity = mapDbEntityTogqlEntity(snapshot.docs[0].data())

        return {
            data: convertedEntity,
            hasErrors: false
        }
    } catch (error) {
        console.log(`Error retrieving healthcareProfessional by id ${id}: ${error}`)

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
    input: gqlTypes.CreateHealthcareProfessionalInput,
    healthcareProfessionalRef?: FirebaseFirestore.DocumentReference<firebase.DocumentData>
): Promise<Result<gqlTypes.HealthcareProfessional>> {
    try {
        const validationResult = validateCreateProfessionalInput(input)

        if (validationResult.hasErrors) {
            return validationResult as Result<gqlTypes.HealthcareProfessional>
        }

        if (!healthcareProfessionalRef) {
            healthcareProfessionalRef = dbInstance.collection('healthcareProfessionals').doc()
        }

        const newHealthcareProfessional = {
            id: healthcareProfessionalRef.id,
            acceptedInsurance: input.acceptedInsurance as gqlTypes.Insurance[],
            degrees: input.degrees as dbSchema.Degree[],
            names: input.names as dbSchema.LocalizedName[],
            specialties: input.specialties as dbSchema.Specialty[],
            spokenLanguages: input.spokenLanguages as gqlTypes.Locale[],
            facilityIds: input.facilityIds ?? [] as string[],
            createdDate: new Date().toISOString(),
            updatedDate: new Date().toISOString()
        } satisfies dbSchema.HealthcareProfessional

        await healthcareProfessionalRef.set(newHealthcareProfessional)

        console.log(`DB-CREATE: Created healthcare professional ${newHealthcareProfessional.id}. Entity: ${JSON.stringify(newHealthcareProfessional)}`)

        //TODO: add healthcare professional id to associated facility

        const createdHealthcareProfessional = await getHealthcareProfessionalById(newHealthcareProfessional.id)

        return {
            data: createdHealthcareProfessional.data,
            hasErrors: false
        }
    } catch (error) {
        console.log(`Error creating healthcare professional: ${error}`)

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

        const professionalRef = dbInstance.collection('healthcareProfessionals').doc(id)
        const snapshot = await professionalRef.get()
        const dbProfessionalToUpdate = snapshot.data() as dbSchema.HealthcareProfessional
        const updatedDbProfessional: dbSchema.HealthcareProfessional = {
            ...dbProfessionalToUpdate,
            updatedDate: new Date().toISOString()
        }

        //TODO: process facility id changes. Update the facility with the associations as well. 

        await professionalRef.set(updatedDbProfessional, { merge: true })

        console.log(`DB-UPDATE: Updated healthcare professional ${professionalRef.id}. Entity: ${JSON.stringify(updatedDbProfessional)}`)

        const updatedProfessional = await getHealthcareProfessionalById(professionalRef.id)

        return {
            data: updatedProfessional.data,
            hasErrors: false
        }
    } catch (error) {
        console.log(`Error updating healthcareProfessional ${id}: ${error}`)

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

//TODO solve this later
// /**
//  * Creates a HealthcareProfessional and adds it to the listed facilities
//  * @param healthcareProfessionalInput 
//  * @returns A HealthcareProfessional object
//  */
// export async function addHealthcareProfessionalToFacility( 
//     healthcareProfessionalInput: gqlTypes.CreateHealthcareProfessionalInput
// ) {
//     const addHealthcareProfessionalResult : Result<dbSchema.HealthcareProfessional> = {
//         hasErrors: false,
//         errors: []
//     }

//     if (!healthcareProfessionalInput.facilityIds.length) {
//         addHealthcareProfessionalResult.hasErrors = true
//         addHealthcareProfessionalResult.errors?.push({
//             field: 'facilityId',
//             errorCode: ErrorCode.CREATEPROFFESIONAL_FACILITYIDS_REQUIRED,
//             httpStatus: 400
//         })
//         return addHealthcareProfessionalResult
//     }

//     try {
//         const healthcareProfessionalRef = dbInstance.collection('healthcareProfessionals').doc()

//         const newHealthcareProfessional = convertToDbHealthcareProfessional(
//             healthcareProfessionalRef.id, healthcareProfessionalInput
//         )

//         await healthcareProfessionalRef.set(newHealthcareProfessional)

//         const facilities = healthcareProfessionalInput.facilityIds

//         facilities.map(async facilityId => {
//             const facilityRef = dbInstance.collection('facilities').doc(facilityId)

//             facilityRef.update(
//                 'healthcareProfessionalIds', firebase.FieldValue.arrayUnion(healthcareProfessionalRef.id)
//             )
//         })

//         addHealthcareProfessionalResult.data = newHealthcareProfessional

//         return addHealthcareProfessionalResult
//     } catch (error) {
//         throw new Error(`Error adding healthcare professional to Facility: ${error}`)
//     }
// }

// function convertToDbHealthcareProfessional(
//     id: string, healthcareProfessionalInput: gqlTypes.HealthcareProfessional
// ) {
//     return {
//         id: id,
//         acceptedInsurance: validateInsurance(healthcareProfessionalInput.acceptedInsurance as gqlTypes.Insurance[]),
//         degrees: mapAndValidateDegrees(healthcareProfessionalInput.degrees as dbSchema.Degree[]),
//         names: mapAndValidateNames(healthcareProfessionalInput.names as dbSchema.LocaleName[]),
//         specialties: mapAndValidateSpecialties(healthcareProfessionalInput.specialties as dbSchema.Specialty[]),
//         spokenLanguages: mapAndValidateLanguages(
//             healthcareProfessionalInput.spokenLanguages as dbSchema.SpokenLanguage[]
//         ),
//         createdDate: new Date().toISOString(),
//         updatedDate: new Date().toISOString()
//     } as dbSchema.HealthcareProfessional
// }

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
