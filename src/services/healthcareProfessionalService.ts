import * as firebase from 'firebase-admin/firestore'
import * as gqlTypes from '../typeDefs/gqlTypes'
import * as dbTypes from '../typeDefs/dbSchema'
import { CustomErrors, Result } from '../result'
import { dbInstance } from '../firebaseDb'

export async function getHealthcareProfessionalById(id: string) {
    const healthcareProfessionalRef = dbInstance.collection('healthcareProfessionals')
    const whereCondition = '=' as firebase.WhereFilterOp
    const snapshot = await healthcareProfessionalRef.where('id', whereCondition, id).get()

    if (snapshot.docs.length < 1) {
        CustomErrors.notFound('The healthcare professional does not exist.')
    }

    const convertedEntity = mapDbEntityTogqlEntity(snapshot.docs[0].data())

    return convertedEntity
}

export async function addHealthcareProfessional( 
    input: gqlTypes.HealthcareProfessional, healthcareProfessionalRef?: 
    FirebaseFirestore.DocumentReference<firebase.DocumentData>
) : Promise<Result<string>> {
    // TODO: add validation

    if (!healthcareProfessionalRef) {
        healthcareProfessionalRef = dbInstance.collection('healthcareProfessionals').doc()
    }

    const newHealthcareProfessional = {
        id: healthcareProfessionalRef.id, 
        acceptedInsurance: validateInsurance(input.acceptedInsurance as gqlTypes.Insurance[]),
        degrees: mapAndValidateDegrees(input.degrees as dbTypes.Degree[]),
        names: mapAndValidateNames(input.names as dbTypes.LocaleName[]),
        specialties: mapAndValidateSpecialties(input.specialties as dbTypes.Specialty[]),
        spokenLanguages: mapAndValidateLanguages(input.spokenLanguages as dbTypes.SpokenLanguage[]),
        isDeleted: false,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString()
    } satisfies dbTypes.HealthcareProfessional

    await healthcareProfessionalRef.set(newHealthcareProfessional)

    return {
        data: newHealthcareProfessional.id,
        hasErrors: false
    }
}

export async function addHealthcareProfessionalToFacility(input: gqlTypes.HealthcareProfessionalInput) {
    const facilityRef = dbInstance.collection('facilities').doc(input.facilityId as string)
    const healthcareProfessionalRef = dbInstance.collection('healthcareProfessionals').doc()

    const newHealthcareProfessional = {
        id: healthcareProfessionalRef.id, 
        acceptedInsurance: validateInsurance(input.acceptedInsurance as []),
        degrees: mapAndValidateDegrees(input.degrees as gqlTypes.Degree[]),
        names: mapAndValidateNames(input.names as gqlTypes.LocaleName[]),
        specialties: mapAndValidateSpecialties(input.specialties as gqlTypes.Specialty[]),
        spokenLanguages: mapAndValidateLanguages(input.spokenLanguages as gqlTypes.SpokenLanguage[]),
        isDeleted: false
    }

    await healthcareProfessionalRef.set(newHealthcareProfessional)

    facilityRef.update(
        'healthcareProfessionalIds', firebase.FieldValue.arrayUnion(healthcareProfessionalRef.id)
    )

    // TODO: decide if something should be returned
}

// export async function searchHealthcareProfessionals(userSearchQuery : string[]) {
// TODO: make it filter by params
// const db = getFirestore()
// const healthcareProfessionalRef = db.collection('healthcareProfessionals')
// const snapshot = await healthcareProfessionalRef.where('id', 'in', userSearchQuery).get()

// const healthcareProfessionals = [] as HealthcareProfessional[]

// snapshot.forEach(doc => {
//     const convertedEntity = mapDbEntityTogqlEntity(doc.data().degrees)

//     healthcareProfessionals.push(convertedEntity)
// })

// return healthcareProfessionals
// }

function mapDbEntityTogqlEntity(dbEntity : firebase.DocumentData) {
    const gqlEntity = {
        id: dbEntity.id,
        names: dbEntity.names,
        degrees: dbEntity.degrees,
        spokenLanguages: dbEntity.spokenLanguages,
        specialties: dbEntity.specialties,
        acceptedInsurance: dbEntity.acceptedInsurance,
        isDeleted: dbEntity.isDeleted
    } satisfies gqlTypes.HealthcareProfessional
    
    return gqlEntity
}

function mapAndValidateDegrees(degreesInput: gqlTypes.Degree[]) {
    try {
        const degrees = degreesInput.map((degree: gqlTypes.Degree) => {
            const newDegree: dbTypes.Degree = {
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

function mapAndValidateSpecialtyNames(specialtyNamesInput: gqlTypes.SpecialtyName[]): dbTypes.SpecialtyName[] {
    try {
        const specialtyNames = specialtyNamesInput.map((name: gqlTypes.SpecialtyName) => {
            const newSpecialtyName : dbTypes.SpecialtyName = {
                name: name.name as string,
                locale: name.locale as gqlTypes.Locale
            }

            return newSpecialtyName
        })

        return specialtyNames as dbTypes.SpecialtyName[]
    } catch (e) {
        throw CustomErrors.missingInput('The specialty names cannot be empty.')
    }
}

function mapAndValidateLanguages(languagesInput: gqlTypes.SpokenLanguage[]): dbTypes.SpokenLanguage[] {
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

        return languages as dbTypes.SpokenLanguage[]
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
