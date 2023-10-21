import * as firebase from 'firebase-admin/firestore'
import * as gqlTypes from '../typeDefs/gqlTypes'
import * as dbSchema from '../typeDefs/dbSchema'
import { CustomErrors, ErrorCode, Result } from '../result'
import { dbInstance } from '../firebaseDb'

export async function getHealthcareProfessionalById(id: string) {
    try {
        const healthcareProfessionalRef = dbInstance.collection('healthcareProfessionals')
        const whereCondition = '=' as firebase.WhereFilterOp
        const snapshot = await healthcareProfessionalRef.where('id', whereCondition, id).get()

        if (snapshot.docs.length < 1) {
            throw new Error('No healthcare Professional found with this id')
        }

        const convertedEntity = mapDbEntityTogqlEntity(snapshot.docs[0].data())

        return convertedEntity
    } catch (error) {
        throw new Error(`Error retrieving healthcare professional ${error}`)
    }
}

/**
 * Creates a HealthcareProfessional.
 * - if you add any facilityids, it will update the corresponding facility by adding this healthcare professional id to their list
 * - business logic: a healthcare professional must be associated with at least one facility (otherwise no one can find them)
 * @param input the new HealthcareProfessional object
 * @param healthcareProfessionalRef optional: if you have an open firebase transaction, you can pass it here
 * @returns the id of the newly created HealthcareProfessional. (if you need the full object, query it by id)
 */
export async function createHealthcareProfessional(
    input: gqlTypes.CreateHealthcareProfessionalInput, healthcareProfessionalRef?:
        FirebaseFirestore.DocumentReference<firebase.DocumentData>
): Promise<Result<string>> {
    // TODO: add validation
    try {
        if (!healthcareProfessionalRef) {
            healthcareProfessionalRef = dbInstance.collection('healthcareProfessionals').doc()
        }

        const newHealthcareProfessional = {
            id: healthcareProfessionalRef.id,
            acceptedInsurance: validateInsurance(input.acceptedInsurance as gqlTypes.Insurance[]),
            degrees: mapAndValidateDegrees(input.degrees as dbSchema.Degree[]),
            names: mapAndValidateNames(input.names as dbSchema.LocaleName[]),
            specialties: mapAndValidateSpecialties(input.specialties as dbSchema.Specialty[]),
            spokenLanguages: mapAndValidateLanguages(input.spokenLanguages as dbSchema.SpokenLanguage[]),
            facilityIds: input.facilityIds ?? [] as string[],
            isDeleted: false,
            createdDate: new Date().toISOString(),
            updatedDate: new Date().toISOString()
        } satisfies dbSchema.HealthcareProfessional

        await healthcareProfessionalRef.set(newHealthcareProfessional)

        console.log(`DB-CREATE: Created healthcare professional ${newHealthcareProfessional.id}. Entity: ${JSON.stringify(newHealthcareProfessional)}`)

        return {
            data: newHealthcareProfessional.id,
            hasErrors: false
        }
    } catch (error) {
        throw new Error(`Error creating healthcare professional: ${error}`)
    }
}

/**
 * Updates a Healthcare Professional in the database based on the id. 
 * - It will only update the fields that are provided and are not null.
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
): Promise<Result<void>> => {
    try {
        const validationResult = validateUpdateProfessionalInput(fieldsToUpdate)

        if (validationResult.hasErrors) {
            return validationResult as Result<void>
        }

        const updatedProfessionalResult: Result<void> = {
            hasErrors: false,
            errors: []
        }

        const professionalRef = dbInstance.collection('healthcareProfessionals').doc(id)
        const snapshot = await professionalRef.get()
        const dbProfessionalToUpdate = snapshot.data() as dbSchema.HealthcareProfessional
        const updatedDbProfessional: dbSchema.HealthcareProfessional = {
            ...dbProfessionalToUpdate,
            updatedDate: new Date().toISOString()
        }

        ///////


        await professionalRef.set(updatedDbProfessional, { merge: true })

        console.log(`DB-UPDATE: Updated healthcare professional ${professionalRef.id}. Entity: ${JSON.stringify(updatedDbProfessional)}`)

        return updatedProfessionalResult
    } catch (error) {
        throw new Error(`Error updating healthcare professional: ${error}`)
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

function convertToDbHealthcareProfessional(
    id: string, healthcareProfessionalInput: gqlTypes.HealthcareProfessional
) {
    return {
        id: id,
        acceptedInsurance: validateInsurance(healthcareProfessionalInput.acceptedInsurance as gqlTypes.Insurance[]),
        degrees: mapAndValidateDegrees(healthcareProfessionalInput.degrees as dbSchema.Degree[]),
        names: mapAndValidateNames(healthcareProfessionalInput.names as dbSchema.LocaleName[]),
        specialties: mapAndValidateSpecialties(healthcareProfessionalInput.specialties as dbSchema.Specialty[]),
        spokenLanguages: mapAndValidateLanguages(
            healthcareProfessionalInput.spokenLanguages as dbSchema.SpokenLanguage[]
        ),
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString()
    } as dbSchema.HealthcareProfessional
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

function mapAndValidateDegrees(degreesInput: gqlTypes.Degree[]) {
    try {
        const degrees = degreesInput.map((degree: gqlTypes.Degree) => {
            const newDegree: dbSchema.Degree = {
                nameJa: degree.nameJa as string,
                nameEn: degree.nameEn as string,
                abbreviation: degree.abbreviation as string
            }

            return newDegree
        })

        return degrees
    } catch (e) {
        throw CustomErrors.missingInput('The degree cannot be empty.')
    }
}

function mapAndValidateNames(namesInput: gqlTypes.LocaleName[]) {
    try {
        const names = namesInput.map((name: gqlTypes.LocaleName) => {
            const newLocaleName = {
                lastName: name.lastName as string,
                firstName: name.firstName as string,
                middleName: name.middleName as string,
                locale: name.locale as gqlTypes.Locale
            }

            return newLocaleName
        })

        return names
    } catch (e) {
        throw CustomErrors.missingInput('The name cannot be empty.')
    }
}

function mapAndValidateSpecialties(specialtiesInput: gqlTypes.Specialty[]) {
    try {
        const specialties = specialtiesInput.map((specialty: gqlTypes.Specialty) => {
            const newSpecialty = {

                names: mapAndValidateSpecialtyNames(specialty.names as gqlTypes.SpecialtyName[])
            }

            return newSpecialty
        })

        return specialties
    } catch (e) {
        throw CustomErrors.missingInput('The specialties cannot be empty.')
    }
}

function mapAndValidateSpecialtyNames(specialtyNamesInput: gqlTypes.SpecialtyName[]): dbSchema.SpecialtyName[] {
    try {
        const specialtyNames = specialtyNamesInput.map((name: gqlTypes.SpecialtyName) => {
            const newSpecialtyName: dbSchema.SpecialtyName = {
                name: name.name as string,
                locale: name.locale as gqlTypes.Locale
            }

            return newSpecialtyName
        })

        return specialtyNames as dbSchema.SpecialtyName[]
    } catch (e) {
        throw CustomErrors.missingInput('The specialty names cannot be empty.')
    }
}

function mapAndValidateLanguages(languagesInput: gqlTypes.SpokenLanguage[]): dbSchema.SpokenLanguage[] {
    // TODO: Write conditional to check if already exists
    try {
        const languages = languagesInput.map((language: gqlTypes.SpokenLanguage) => {
            const newLanguage = {
                iso639_3: language.iso639_3,
                nameJa: language.nameJa,
                nameEn: language.nameEn,
                nameNative: language.nameNative
            }

            return newLanguage
        })

        return languages as dbSchema.SpokenLanguage[]
    } catch (e) {
        throw CustomErrors.missingInput('The languages cannot be empty.')
    }
}

function validateInsurance(insuranceInput: gqlTypes.Insurance[] | undefined) {
    if (insuranceInput == undefined || insuranceInput.length < 1) {
        throw CustomErrors.missingInput('The insurance cannot be empty.')
    } else {
        return insuranceInput
    }
}


function validateUpdateProfessionalInput(input: Partial<gqlTypes.UpdateFacilityInput>): Result<string> {
    return validateCreateProfessionalInput(input as gqlTypes.CreateHealthcareProfessionalInput)
}

function validateCreateProfessionalInput(input: gqlTypes.CreateHealthcareProfessionalInput): Result<string> {
    const validationResults: Result<string> = {
        hasErrors: false,
        errors: []
    }

    if (!input.names) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'names',
            errorCode: ErrorCode.REQUIRED,
            httpStatus: 400
        })
    }

    if (input.names && input.names.length > 16) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'names',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (!input.degrees) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'degrees',
            errorCode: ErrorCode.REQUIRED,
            httpStatus: 400
        })
    }

    if(input.degrees && input.degrees.length > 64) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'degrees',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    input.degrees?.forEach(degree => {
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
    }

    if(!input.specialties) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'specialties',
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
