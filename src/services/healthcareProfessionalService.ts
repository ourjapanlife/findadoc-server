import { HealthcareProfessional, LocaleName, Degree, 
    Specialty, SpecialtyName, SpokenLanguage, Insurance } from '../typeDefs/dbSchema'
import { DocumentData, WhereFilterOp, getFirestore } from 'firebase-admin/firestore'

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

export const addHealthcareProfessional = async (input : any) : Promise<[string]> => {
    const db = getFirestore()
   
    const healthcareProRef = db.collection('healthcareProfessionals')

    const newHealthcareProfessional = {
        acceptedInsurance: mapAndValidateInsurance(input.acceptedInsurance),
        degrees: mapAndValidateDegrees(input.degrees),
        names: mapAndValidateNames(input.names),
        specialties: mapAndValidateSpecialties(input.specialties),
        spokenLanguages: mapAndValidateLanguages(input.spokenLanguages)
    }

    const idList: any = []
    
    await healthcareProRef.add(newHealthcareProfessional).then((docRef: any) => idList.push(docRef.id))
    
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

function mapAndValidateDegrees(degreesInput: any) {
    // TODO: Write conditional to check if already exists
    // TODO: This should save to the degrees collection and return an array of IDs
    const degrees = degreesInput.map((degree: any) => {
        const newDegree = {nameJa: degree.nameJa,
            nameEn: degree.nameEn,
            abbreviation: degree.abbreviation}

        return newDegree
    })

    return degrees
}

function mapAndValidateNames(namesInput: any) {
    // TODO: Write conditional to check if already exists
    const names = namesInput.map((name: any) => {
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

function mapAndValidateSpecialties(specialtiesInput: any) {
    // TODO: Write conditional to check if already exists
    // TODO: This should save to the specialties collection and return an array of IDs
    const specialties = specialtiesInput.map((specialty: any) => {
        const newSpecialty = {
            
            names: mapAndValidateSpecialtyNames(specialty.names)
        }

        return newSpecialty
    })

    return specialties
}

function mapAndValidateSpecialtyNames(specialtyNamesInput: any) {
    // TODO: Write conditional to check if already exists
    const specialtyNames = specialtyNamesInput.map((name: any) => {
        const newSpecialtyName = {
            name: name.name,
            locale: name.locale
        }

        return newSpecialtyName
    })

    return specialtyNames
}

function mapAndValidateLanguages(languagesInput: any) {
    // TODO: Write conditional to check if already exists
    const languages = languagesInput.map((language: any) => {
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

function mapAndValidateInsurance(insuranceInput: any) {
    // TODO: Write conditional to check if already exists

    const insurance = insuranceInput

    return insurance
}
