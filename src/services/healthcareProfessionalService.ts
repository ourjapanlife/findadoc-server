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

export const addHealthcareProfessional = async (healthcareProfessional : HealthcareProfessional) : Promise<void> => {
    // add acceptedInsurance
    // add degrees
    // add names
    // add specialties
    // add spokenLanguages
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
        id: dbEntity.id,
        names: dbEntity.names,
        degrees: dbEntity.degrees,
        spokenLanguages: dbEntity.spokenLanguages,
        specialties: dbEntity.specialties,
        acceptedInsurance: dbEntity.acceptedInsurance
    } satisfies HealthcareProfessional
    
    return gqlEntity
}
