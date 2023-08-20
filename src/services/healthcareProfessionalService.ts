import * as firebase from 'firebase-admin/firestore'
import * as typeDefs from '../typeDefs/gqlTypes'

export async function getHealthcareProfessionalById(id: string) {
    const db = firebase.getFirestore()
    const healthcareProfessionalRef = db.collection('healthcareProfessionals')
    const whereCondition = '=' as firebase.WhereFilterOp
    const snapshot = await healthcareProfessionalRef.where('id', whereCondition, id).get()

    if (snapshot.docs.length < 1) {
        return null
    }

    const convertedEntity = mapDbEntityTogqlEntity(snapshot.docs[0].data())

    return convertedEntity
}

export async function addHealthcareProfessional(
    healthcareProfessionalRef: 
    FirebaseFirestore.DocumentReference<firebase.DocumentData>, 
    input: typeDefs.HealthcareProfessional
) {
    const newHealthcareProfessional = {
        id: healthcareProfessionalRef.id, 
        acceptedInsurance: mapAndValidateInsurance(input.acceptedInsurance as []),
        degrees: mapAndValidateDegrees(input.degrees as typeDefs.Degree[]),
        names: mapAndValidateNames(input.names as typeDefs.LocaleName[]),
        specialties: mapAndValidateSpecialties(input.specialties as typeDefs.Specialty[]),
        spokenLanguages: mapAndValidateLanguages(input.spokenLanguages as typeDefs.SpokenLanguage[])
    }
    
    await healthcareProfessionalRef.set(newHealthcareProfessional)

    // TODO: decide if something should be returned
}

export async function addHealthcareProfessionalToFacility(input: any) {
    const db = firebase.getFirestore()
    const facilityRef = db.collection('facilities').doc(input.facilityId)
    const healthcareProfessionalRef = db.collection('healthcareProfessionals').doc()

    const newHealthcareProfessional = {
        id: healthcareProfessionalRef.id, 
        acceptedInsurance: mapAndValidateInsurance(input.acceptedInsurance as []),
        degrees: mapAndValidateDegrees(input.degrees as typeDefs.Degree[]),
        names: mapAndValidateNames(input.names as typeDefs.LocaleName[]),
        specialties: mapAndValidateSpecialties(input.specialties as typeDefs.Specialty[]),
        spokenLanguages: mapAndValidateLanguages(input.spokenLanguages as typeDefs.SpokenLanguage[])
    }
    
    await healthcareProfessionalRef.set(newHealthcareProfessional)

    facilityRef.update(
        'healthcareProfessionalIds', firebase.FieldValue.arrayUnion(healthcareProfessionalRef.id)
    )

    // TODO: decide if something should be returned
}

export async function searchHealthcareProfessionals(userSearchQuery : string[]) {
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
}

function mapDbEntityTogqlEntity(dbEntity : firebase.DocumentData) {
    const gqlEntity = {
        id: dbEntity.id,
        names: dbEntity.names,
        degrees: dbEntity.degrees,
        spokenLanguages: dbEntity.spokenLanguages,
        specialties: dbEntity.specialties,
        acceptedInsurance: dbEntity.acceptedInsurance
    } satisfies typeDefs.HealthcareProfessional
    
    return gqlEntity
}

function mapAndValidateDegrees(degreesInput: typeDefs.Degree[]) {
    const degrees = degreesInput.map((degree: typeDefs.Degree) => {
        const newDegree = {nameJa: degree.nameJa,
            nameEn: degree.nameEn,
            abbreviation: degree.abbreviation}

        return newDegree
    })

    return degrees
}

function mapAndValidateNames(namesInput: typeDefs.LocaleName[]) {
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
}

function mapAndValidateSpecialties(specialtiesInput: typeDefs.Specialty[]) {
    const specialties = specialtiesInput.map((specialty: typeDefs.Specialty) => {
        const newSpecialty = {
            
            names: mapAndValidateSpecialtyNames(specialty.names as typeDefs.SpecialtyName[])
        }

        return newSpecialty
    })

    return specialties
}

function mapAndValidateSpecialtyNames(specialtyNamesInput: typeDefs.SpecialtyName[]) {
    const specialtyNames = specialtyNamesInput.map((name: typeDefs.SpecialtyName) => {
        const newSpecialtyName = {
            name: name.name,
            locale: name.locale
        }

        return newSpecialtyName
    })

    return specialtyNames
}

function mapAndValidateLanguages(languagesInput: typeDefs.SpokenLanguage[]) {
    // TODO: Write conditional to check if already exists
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
}

function mapAndValidateInsurance(insuranceInput: typeDefs.Insurance[]) {
    return insuranceInput
}
