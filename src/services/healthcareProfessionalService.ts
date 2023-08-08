import { HealthcareProfessional, LocaleName, Degree, 
    Specialty, SpecialtyName, SpokenLanguage, Insurance } from '../typeDefs/dbSchema'
import { DocumentData, DocumentReference, WhereFilterOp, getFirestore } from 'firebase-admin/firestore'
import { DegreeInput, 
    HealthcareProfessionalInput, 
    LocaleNameInput, 
    SpecialtyInput, 
    SpecialtyNameInput, 
    SpokenLanguageInput } from '../typeDefs/gqlTypes'

export const getHealthcareProfessionalById = async (id: string) : Promise<HealthcareProfessional | null> => {
    const db = getFirestore()
    const hpRef = db.collection('healthcareProfessionals')
    const whereCondition = '=' as WhereFilterOp
    const snapshot = await hpRef.where('id', whereCondition, id).get()

    if (snapshot.docs.length < 1) {
        return null
    }

    const convertedEntity = mapDbEntityTogqlEntity(snapshot.docs[0].data())

    return convertedEntity
}

export const addHealthcareProfessional = async (input : HealthcareProfessionalInput) : Promise<string[]> => {
    const db = getFirestore()
   
    const healthcareProRef = db.collection('healthcareProfessionals')

    const newHealthcareProfessional = {
        acceptedInsurance: mapAndValidateInsurance(input.acceptedInsurance as []),
        degrees: mapAndValidateDegrees(input.degrees as DegreeInput[]),
        names: mapAndValidateNames(input.names as LocaleNameInput[]),
        specialties: mapAndValidateSpecialties(input.specialties as SpecialtyInput[]),
        spokenLanguages: mapAndValidateLanguages(input.spokenLanguages as SpokenLanguageInput[])
    }

    const idList: string[] = []
    
    await healthcareProRef.add(newHealthcareProfessional).then((docRef: DocumentReference) => idList.push(docRef.id))
    
    return idList
}

export const searchHealthcareProfessionals = async (userSearchQuery : string[]) 
: Promise<HealthcareProfessional[]> => {
    const db = getFirestore()
    const hpRef = db.collection('healthcareProfessionals')
    const snapshot = await hpRef.where('id', 'in', userSearchQuery).get()

    const healthcareProfessionals = [] as HealthcareProfessional[]

    snapshot.forEach(doc => {
        const convertedEntity = mapDbEntityTogqlEntity(doc.data())

        healthcareProfessionals.push(convertedEntity)
    })

    return healthcareProfessionals
}

const mapDbEntityTogqlEntity = (dbEntity : DocumentData) : HealthcareProfessional => {
    const gqlEntity = {
        names: dbEntity.names,
        degrees: dbEntity.degrees,
        spokenLanguages: dbEntity.spokenLanguages,
        specialties: dbEntity.specialties,
        acceptedInsurance: dbEntity.acceptedInsurance
    } satisfies HealthcareProfessional
    
    return gqlEntity
}

function mapAndValidateDegrees(degreesInput: DegreeInput[]) {
    // TODO: Write conditional to check if already exists
    // TODO: This should save to the degrees collection and return an array of IDs
    const degrees = degreesInput.map((degree: DegreeInput) => {
        const newDegree = {nameJa: degree.nameJa,
            nameEn: degree.nameEn,
            abbreviation: degree.abbreviation}

        return newDegree
    })

    return degrees
}

function mapAndValidateNames(namesInput: LocaleNameInput[]) {
    // TODO: Write conditional to check if already exists
    const names = namesInput.map((name: LocaleNameInput) => {
        const newLocaleName = {
            lastName: name.lastName,
            firstName: name.firstName,
            middleName: name.middleName,
            locale: name.locale
        }

        return newLocaleName
    })

    return names
}

function mapAndValidateSpecialties(specialtiesInput: SpecialtyInput[]) {
    // TODO: Write conditional to check if already exists
    // TODO: This should save to the specialties collection and return an array of IDs
    const specialties = specialtiesInput.map((specialty: SpecialtyInput) => {
        const newSpecialty = {
            
            names: mapAndValidateSpecialtyNames(specialty.names as SpecialtyNameInput[])
        }

        return newSpecialty
    })

    return specialties
}

function mapAndValidateSpecialtyNames(specialtyNamesInput: SpecialtyNameInput[]) {
    // TODO: Write conditional to check if already exists
    const specialtyNames = specialtyNamesInput.map((name: SpecialtyNameInput) => {
        const newSpecialtyName = {
            name: name.name,
            locale: name.locale
        }

        return newSpecialtyName
    })

    return specialtyNames
}

function mapAndValidateLanguages(languagesInput: SpokenLanguageInput[]) {
    // TODO: Write conditional to check if already exists
    const languages = languagesInput.map((language: SpokenLanguageInput) => {
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
    // TODO: Write conditional to check if already exists

    const insurance = insuranceInput

    return insurance
}
