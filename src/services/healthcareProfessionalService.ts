import * as firebase from 'firebase-admin/firestore'
import * as typeDefs from '../typeDefs/gqlTypes'
import CustomErrors from '../errors'
import { dbInstance } from '../firebaseDb'

export async function getHealthcareProfessionalById(id: string) {
    const healthcareProfessionalRef = dbInstance.collection('healthcareProfessionals')
    const whereCondition = '=' as firebase.WhereFilterOp
    const snapshot = await healthcareProfessionalRef.where('id', whereCondition, id).get()

    if (snapshot.docs.length < 1) {
        CustomErrors.notFound('Healthcare professional not found.')
    }

    const convertedEntity = mapDbEntityTogqlEntity(snapshot.docs[0].data())

    return convertedEntity
}

export async function addHealthcareProfessional( 
    input: typeDefs.HealthcareProfessional, healthcareProfessionalRef?: 
    FirebaseFirestore.DocumentReference<firebase.DocumentData>
) {
    if (!healthcareProfessionalRef) {
        healthcareProfessionalRef = dbInstance.collection('healthcareProfessionals').doc()
    }

    const newHealthcareProfessional = {
        id: healthcareProfessionalRef.id, 
        acceptedInsurance: mapAndValidateInsurance(input.acceptedInsurance as typeDefs.Insurance[]),
        degrees: mapAndValidateDegrees(input.degrees as typeDefs.Degree[]),
        names: mapAndValidateNames(input.names as typeDefs.LocaleName[]),
        specialties: mapAndValidateSpecialties(input.specialties as typeDefs.Specialty[]),
        spokenLanguages: mapAndValidateLanguages(input.spokenLanguages as typeDefs.SpokenLanguage[]),
        isDeleted: false
    }

    await healthcareProfessionalRef.set(newHealthcareProfessional)

    await healthcareProfessionalRef.set(newHealthcareProfessional)

    // TODO: decide if something should be returned
}

export async function addHealthcareProfessionalToFacility(input: typeDefs.HealthcareProfessionalInput) {
    const facilityRef = dbInstance.collection('facilities').doc(input.facilityId as string)
    const healthcareProfessionalRef = dbInstance.collection('healthcareProfessionals').doc()

    const newHealthcareProfessional = {
        id: healthcareProfessionalRef.id, 
        acceptedInsurance: mapAndValidateInsurance(input.acceptedInsurance as []),
        degrees: mapAndValidateDegrees(input.degrees as typeDefs.Degree[]),
        names: mapAndValidateNames(input.names as typeDefs.LocaleName[]),
        specialties: mapAndValidateSpecialties(input.specialties as typeDefs.Specialty[]),
        spokenLanguages: mapAndValidateLanguages(input.spokenLanguages as typeDefs.SpokenLanguage[]),
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
    } satisfies typeDefs.HealthcareProfessional
    
    return gqlEntity
}

function mapAndValidateDegrees(degreesInput: typeDefs.Degree[]) {
    try {
        const degrees = degreesInput.map((degree: typeDefs.Degree) => {
            const newDegree = {nameJa: degree.nameJa,
                nameEn: degree.nameEn,
                abbreviation: degree.abbreviation}
    
            return newDegree
        })
    
        return degrees
    } catch (e) {
        throw CustomErrors.missingInput('The degree cannot be empty.')
    }
}

function mapAndValidateNames(namesInput: typeDefs.LocaleName[]) {
    try {
        const names = namesInput.map((name: typeDefs.LocaleName) => {
            const newLocaleName = {
                lastName: name.lastName as string,
                firstName: name.firstName as string,
                middleName: name.middleName as string,
                locale: name.locale as typeDefs.Locale
            }

            return newLocaleName
        })

        return names
    } catch (e) {
        throw CustomErrors.missingInput('The name cannot be empty.')
    }
}

function mapAndValidateSpecialties(specialtiesInput: typeDefs.Specialty[]) {
    try {
        const specialties = specialtiesInput.map((specialty: typeDefs.Specialty) => {
            const newSpecialty = {
            
                names: mapAndValidateSpecialtyNames(specialty.names as typeDefs.SpecialtyName[])
            }

            return newSpecialty
        })

        return specialties
    } catch (e) {
        throw CustomErrors.missingInput('The specialties cannot be empty.')
    }
}

function mapAndValidateSpecialtyNames(specialtyNamesInput: typeDefs.SpecialtyName[]) {
    try {
        const specialtyNames = specialtyNamesInput.map((name: typeDefs.SpecialtyName) => {
            const newSpecialtyName = {
                name: name.name,
                locale: name.locale
            }

            return newSpecialtyName
        })

        return specialtyNames
    } catch (e) {
        throw CustomErrors.missingInput('The specialty names cannot be empty.')
    }
}

function mapAndValidateLanguages(languagesInput: typeDefs.SpokenLanguage[]) {
    // TODO: Write conditional to check if already exists
    try {
        const languages = languagesInput.map((language: typeDefs.SpokenLanguage) => {
            const newLanguage = {
                iso639_3: language.iso639_3,
                nameJa: language.nameJa,
                nameEn: language.nameEn,
                nameNative: language.nameNative
            }

            return newLanguage
        })

        return languages
    } catch (e) {
        throw CustomErrors.missingInput('The languages cannot be empty.')
    }
}

function mapAndValidateInsurance(insuranceInput: typeDefs.Insurance[]) {
    if (insuranceInput == undefined || insuranceInput.length < 1) {
        throw CustomErrors.missingInput('The insurance cannot be empty.')
    } else {
        return insuranceInput
    }
}
