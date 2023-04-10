import { HealthcareProfessional, LocaleName, Degree, 
    Specialty, SpecialtyName, SpokenLanguage, Insurance } from '../typeDefs/dbSchema'
import { getFirestore } from 'firebase-admin/firestore'

const tempFirebaseDbGet = () => {
    const name : LocaleName = {
        lastName: '',
        firstName: '',
        middleName: '',
        locale: ''
    }
    const degree : Degree = {
        id: '',
        nameJa: '',
        nameEn: '',
        abbreviation: ''
    }

    const spokenLanguage : SpokenLanguage = {
        iso639_3: '',
        nameJa: '',
        nameEn: '',
        nameNative: ''
    }
    
    const specialtyName : SpecialtyName = {
        name: '',
        locale: ''
    }

    const specialty : Specialty = {
        id: '',
        names: [specialtyName]
    }

    const healthcareProfessional : HealthcareProfessional = {
        id: '',
        names: [name],
        degrees: [degree],
        spokenLanguages: [spokenLanguage],
        specialties: [specialty],
        acceptedInsurance: [Insurance.INTERNATIONAL_HEALTH_INSURANCE]
    }

    return [healthcareProfessional]
}

export const getHealthcareProfessionalById = async (id: string) => {
    const db = getFirestore()
    const hpRef = db.collection('healthcareProfessionals')
    const snapshot = await hpRef.where('id', '=', id).get()
    var healthcareProfessionals = []
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
    var healthcareProfessionals = []
    snapshot.forEach(doc => {
      healthcareProfessionals.push(doc.data())
    })

  return healthcareProfessionals
}

export const getHealthcareProfessionalsByIds = async (ids : string[]) => {
    const db = getFirestore()
    const hpRef = db.collection('healthcareProfessionals')
    const snapshot = await hpRef.where('id', 'in', ids).get()
    var healthcareProfessionals = []
    snapshot.forEach(doc => {
      healthcareProfessionals.push(doc.data())
    })

  return healthcareProfessionals
}
