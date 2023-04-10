// import { HealthcareProfessional, LocaleName, Degree, 
//     Specialty, SpecialtyName, SpokenLanguage, Insurance } from '../typeDefs/dbSchema'
import { getFirestore } from 'firebase-admin/firestore'

export const getHealthcareProfessionalById = async (id: string) => {
    const db = getFirestore()
    const hpRef = db.collection('healthcareProfessionals')
    const snapshot = await hpRef.where('id', '=', id).get()
    const healthcareProfessionals = []

    snapshot.forEach(doc => {
        healthcareProfessionals.push(doc.data())
    })

    return healthcareProfessionals
}

export const addHealthcareProfessional = async (healthcareProfessionalsRef, healthcareProfessional) => {
    healthcareProfessionalsRef.add(healthcareProfessional)
}

export const getHealthcareProfessionals = async () => {
    const db = getFirestore()
    const hpRef = db.collection('healthcareProfessionals')

    const snapshot = await hpRef.get()
    const healthcareProfessionals = []

    snapshot.forEach(doc => {
        healthcareProfessionals.push(doc.data())
    })

    return healthcareProfessionals
}

export const getHealthcareProfessionalsByIds = async (ids : string[]) => {
    const db = getFirestore()
    const hpRef = db.collection('healthcareProfessionals')
    const snapshot = await hpRef.where('id', 'in', ids).get()
    const healthcareProfessionals = []

    snapshot.forEach(doc => {
        healthcareProfessionals.push(doc.data())
    })

    return healthcareProfessionals
}
