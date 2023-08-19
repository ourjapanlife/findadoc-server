import { DocumentData, WhereFilterOp, getFirestore, UpdateData, FieldValue } from 'firebase-admin/firestore'
import {Degree,
    Insurance,
    HealthcareProfessional,
    LocaleName, 
    Locale,
    Specialty,
    SpecialtyName,
    SpokenLanguage } from '../typeDefs/gqlTypes'

export const getHealthcareProfessionalById = async (id: string) : Promise<HealthcareProfessional | null> => {
    const db = getFirestore()
    const healthcareProfessionalRef = db.collection('healthcareProfessionals')
    const whereCondition = '=' as WhereFilterOp
    const snapshot = await healthcareProfessionalRef.where('id', whereCondition, id).get()

    if (snapshot.docs.length < 1) {
        return null
    }

    const convertedEntity = mapDbEntityTogqlEntity(snapshot.docs[0].data())

    return convertedEntity
}

export async function addHealthcareProfessional(
    healthcareProfessionalRef: 
    FirebaseFirestore.DocumentReference<DocumentData>, 
    input: HealthcareProfessional
) {
    const newHealthcareProfessional = {
        id: healthcareProfessionalRef.id, 
        acceptedInsurance: mapAndValidateInsurance(input.acceptedInsurance as []),
        degrees: mapAndValidateDegrees(input.degrees as Degree[]),
        names: mapAndValidateNames(input.names as LocaleName[]),
        specialties: mapAndValidateSpecialties(input.specialties as Specialty[]),
        spokenLanguages: mapAndValidateLanguages(input.spokenLanguages as SpokenLanguage[])
    }
    
    await healthcareProfessionalRef.set(newHealthcareProfessional)

    // TODO: decide if something should be returned
}

export async function addHealthcareProfessionalToFacility(input: any) {
    const db = getFirestore()
    const facilityRef = db.collection('facilities').doc(input.facilityId)
    const healthcareProfessionalRef = db.collection('healthcareProfessionals').doc()

    const newHealthcareProfessional = {
        id: healthcareProfessionalRef.id, 
        acceptedInsurance: mapAndValidateInsurance(input.acceptedInsurance as []),
        degrees: mapAndValidateDegrees(input.degrees as Degree[]),
        names: mapAndValidateNames(input.names as LocaleName[]),
        specialties: mapAndValidateSpecialties(input.specialties as Specialty[]),
        spokenLanguages: mapAndValidateLanguages(input.spokenLanguages as SpokenLanguage[])
    }
    
    await healthcareProfessionalRef.set(newHealthcareProfessional)

    facilityRef.update(
        'healthcareProfessionalIds', FieldValue.arrayUnion(healthcareProfessionalRef.id)
    )

    // TODO: decide if something should be returned
}

export const searchHealthcareProfessionals = async (userSearchQuery : string[]) 
: Promise<HealthcareProfessional[]> => {
    const db = getFirestore()
    const healthcareProfessionalRef = db.collection('healthcareProfessionals')
    const snapshot = await healthcareProfessionalRef.where('id', 'in', userSearchQuery).get()

    const healthcareProfessionals = [] as HealthcareProfessional[]

    snapshot.forEach(doc => {
        const convertedEntity = mapDbEntityTogqlEntity(doc.data().degrees)

        healthcareProfessionals.push(convertedEntity)
    })

    return healthcareProfessionals
}

const mapDbEntityTogqlEntity = (dbEntity : DocumentData) : HealthcareProfessional => {
    const gqlEntity = {
        id: dbEntity.id,
        names: dbEntity.names,
        degrees: dbEntity.degrees,
        spokenLanguages: dbEntity.spokenLanguages,
        specialties: dbEntity.specialties,
        acceptedInsurance: dbEntity.acceptedInsurance
    } satisfies HealthcareProfessional
    
    return gqlEntity
}

function mapAndValidateDegrees(degreesInput: Degree[]) {
    const degrees = degreesInput.map((degree: Degree) => {
        const newDegree = {nameJa: degree.nameJa,
            nameEn: degree.nameEn,
            abbreviation: degree.abbreviation}

        return newDegree
    })

    return degrees
}

function mapAndValidateNames(namesInput: LocaleName[]) {
    const names = namesInput.map((name: LocaleName) => {
        const newLocaleName = {
            lastName: name.lastName as string,
            firstName: name.firstName as string,
            middleName: name.middleName as string,
            locale: name.locale as Locale
        }

        return newLocaleName
    })

    return names
}

function mapAndValidateSpecialties(specialtiesInput: Specialty[]) {
    const specialties = specialtiesInput.map((specialty: Specialty) => {
        const newSpecialty = {
            
            names: mapAndValidateSpecialtyNames(specialty.names as SpecialtyName[])
        }

        return newSpecialty
    })

    return specialties
}

function mapAndValidateSpecialtyNames(specialtyNamesInput: SpecialtyName[]) {
    const specialtyNames = specialtyNamesInput.map((name: SpecialtyName) => {
        const newSpecialtyName = {
            name: name.name,
            locale: name.locale
        }

        return newSpecialtyName
    })

    return specialtyNames
}

function mapAndValidateLanguages(languagesInput: SpokenLanguage[]) {
    // TODO: Write conditional to check if already exists
    const languages = languagesInput.map((language: SpokenLanguage) => {
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

function mapAndValidateInsurance(insuranceInput: Insurance[]) {
    return insuranceInput
}
