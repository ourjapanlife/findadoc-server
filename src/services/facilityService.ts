// import { HealthcareProfessional, LocaleName, Degree, 
//     Specialty, SpecialtyName, SpokenLanguage, Insurance, Facility } from '../typeDefs/dbSchema'
import { getFirestore } from 'firebase-admin/firestore'
import { getHealthcareProfessionalsByIds } from './healthcareProfessionalService'

export const getFacilityById = async (id: string) => {
    const db = getFirestore()
    const facilityRef = db.collection('facilities')
    const snapshot = await facilityRef.where('id', '=', id).get()
    const facilities = []

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
    const facilities = []

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
    const healthcareProfessionals = await getHealthcareProfessionalsByIds(facility.healthcareProfessionals)

    facility.healthcareProfessionals = healthcareProfessionals

    return facility
}
