import { HealthcareProfessional, LocaleName, Degree, 
    Specialty, SpecialtyName, SpokenLanguage, Insurance, Facility } from '../typeDefs/dbSchema'
import { DocumentData, WhereFilterOp, getFirestore } from 'firebase-admin/firestore'
import { searchHealthcareProfessionals } from './healthcareProfessionalService'

export const getFacilityById = async (id: string) : Promise<Facility | null> => {
    const db = getFirestore()
    const facilityRef = db.collection('facilities')
    const whereCondition = '=' as WhereFilterOp
    const snapshot = await facilityRef.where('id', whereCondition, id).get()

    if (snapshot.docs.length < 1) {
        return null
    }

    const convertedEntity = mapDbEntityTogqlEntity(snapshot.docs[0].data())

    return convertedEntity
}

export const addFacility = async (facility : Facility) : Promise<void> => {
    //todo
}

export const searchFacilities = async (userSearchQuery : string[]) : Promise<Facility[]> => {
    const db = getFirestore()
    const hpRef = db.collection('healthcareProfessionals')
    // make this a real query
    const snapshot = await hpRef.where('id', 'in', userSearchQuery).get()

    const facilities = [] as Facility[]

    snapshot.forEach(doc => {
        const convertedEntity = mapDbEntityTogqlEntity(doc.data())

        facilities.push(convertedEntity)
    })

    return facilities
}

const mapDbEntityTogqlEntity = (dbEntity : DocumentData) : Facility => {
    const gqlEntity = {
        id: dbEntity.id,
        nameEn: dbEntity.nameEn,
        nameJa: dbEntity.nameJa,
        contact: dbEntity.contact,
        healthcareProfessionals: dbEntity.healthcareProfessionals
    } satisfies Facility
    
    return gqlEntity
}
