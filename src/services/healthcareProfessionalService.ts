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

export async function addHealthcareProfessional( 
    input: gqlTypes.HealthcareProfessionalInput, healthcareProfessionalRef?: 
    FirebaseFirestore.DocumentReference<firebase.DocumentData>
) : Promise<Result<string>> {
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
            isDeleted: false,
            createdDate: new Date().toISOString(),
            updatedDate: new Date().toISOString()
        } satisfies dbSchema.HealthcareProfessional
    
        await healthcareProfessionalRef.set(newHealthcareProfessional)

        console.log(`DB-ADD: Added healthcare professional ${newHealthcareProfessional.id}`)
    
        return {
            data: newHealthcareProfessional.id,
            hasErrors: false
        }
    } catch (error) {
        throw new Error(`Error adding healthcare professional: ${error}`)
    }
}

/**
 * Creates a HealthcareProfessional and adds it to the listed facilities
 * @param healthcareProfessionalInput 
 * @returns A HealthcareProfessional object
 */
export async function addHealthcareProfessionalToFacility( 
    healthcareProfessionalInput: gqlTypes.HealthcareProfessionalInput
) {
    const addHealthcareProfessionalResult : Result<dbSchema.HealthcareProfessional> = {
        hasErrors: false,
        errors: []
    }

    if (!healthcareProfessionalInput.facilityIds.length) {
        addHealthcareProfessionalResult.hasErrors = true
        addHealthcareProfessionalResult.errors?.push({
            field: 'facilityId',
            errorCode: ErrorCode.ADDHEALTHCAREPROF_FACILITYIDS_REQUIRED,
            httpStatus: 400
        })
        throw CustomErrors.missingInput('The list of facilityIds cannot be empty.')
    }

    try {
        const healthcareProfessionalRef = dbInstance.collection('healthcareProfessionals').doc()
    
        const newHealthcareProfessional = convertToDbHealthcareProfessional(
            healthcareProfessionalRef.id, healthcareProfessionalInput
        )

        await healthcareProfessionalRef.set(newHealthcareProfessional)

        const facilities = healthcareProfessionalInput.facilityIds

        facilities.map(async facilityId => {
            const facilityRef = dbInstance.collection('facilities').doc(facilityId)
                
            facilityRef.update(
                'healthcareProfessionalIds', firebase.FieldValue.arrayUnion(healthcareProfessionalRef.id)
            )
        })

        addHealthcareProfessionalResult.data = newHealthcareProfessional

        return addHealthcareProfessionalResult
    } catch (error) {
        throw new Error(`Error adding healthcare professional to Facility: ${error}`)
    }
}

function convertToDbHealthcareProfessional(
    id: string, healthcareProfessionalInput: gqlTypes.HealthcareProfessionalInput
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
        isDeleted: false,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString()
    } as dbSchema.HealthcareProfessional
}

function mapDbEntityTogqlEntity(dbEntity : firebase.DocumentData) {
    const gqlEntity = {
        id: dbEntity.id,
        names: dbEntity.names,
        degrees: dbEntity.degrees,
        spokenLanguages: dbEntity.spokenLanguages,
        specialties: dbEntity.specialties,
        acceptedInsurance: dbEntity.acceptedInsurance,
        isDeleted: dbEntity.isDeleted,
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
            const newSpecialtyName : dbSchema.SpecialtyName = {
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

