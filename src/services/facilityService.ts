import { HealthcareProfessional, LocaleName, Degree, 
    Specialty, SpecialtyName, SpokenLanguage, Insurance, Facility } from '../typeDefs/dbSchema'
import { getFirestore } from 'firebase-admin/firestore'
import { getHealthcareProfessionalsByIds } from './healthcareProfessionalService'

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

    const facility : Facility = {
        id: '',
        nameEn: '',
        nameJa: '',
        contact: {
            email: '',
            phone: '',
            website: '',
            mapsLink: ''
        },
        healthcareProfessionals: [healthcareProfessional]
    }

    return [facility]
}

export const getFacilityById = async (id: string) => {
    const db = getFirestore()
    const facilityRef = db.collection('facilities')
    const snapshot = await facilityRef.where('id', '=', id).get()
    var facilities = []
    snapshot.forEach(doc => {
      facilities.push(doc.data())
    })

    for await (const facility of facilities) {
      await hydrateFacility(facility)
    }

  return facilities
}

export async function addFacility(facilityRef, facility) {
  facilityRef.add(transformFacilityForFirestore(facility))
}

function transformFacilityForFirestore(facility) {
  const healthcareProfessionalIds = facility.healthcareProfessionals.map(hp => hp.id)
  facility.healthcareProfessionals = healthcareProfessionalIds

  return facility
}

export const getFacilities = async () => {
    const db = getFirestore()
    const facilitiesRef = db.collection('facilities')

    const snapshot = await facilitiesRef.get()
    var facilities = []
    snapshot.forEach(doc => {
      facilities.push(doc.data())
    })

    for await (const facility of facilities) {
      await hydrateFacility(facility)
    }

    return facilities
}

async function hydrateFacility(facility) {
    const db = getFirestore()
    const hpRef = db.collection('healthcareProfessionals')
    // const snapshot = await hpRef.where('id', 'in', facility.healthcareProfessionals).get()
    const healthcareProfessionals = await getHealthcareProfessionalsByIds(facility.healthcareProfessionals)

  facility.healthcareProfessionals = healthcareProfessionals

  return facility
}
