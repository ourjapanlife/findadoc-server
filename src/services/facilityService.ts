import * as firebase from 'firebase-admin/firestore'
import * as gqlTypes from '../typeDefs/gqlTypes'
import { addHealthcareProfessional } from './healthcareProfessionalService'
import { dbInstance } from '../firebaseDb'

export const getFacilityById = async (id: string) : Promise<gqlTypes.Facility | null> => {
    const facilityRef = dbInstance.collection('facilities')
    const whereCondition = '=' as firebase.WhereFilterOp
    const snapshot = await facilityRef.where('id', whereCondition, id).get()

    if (snapshot.docs.length < 1) {
        return null
    }

    const convertedEntity = mapDbEntityTogqlEntity(snapshot.docs[0].data())

    return convertedEntity
}

export async function addFacility(input: gqlTypes.Facility) {
    const facilityRef = dbInstance.collection('facilities').doc()
    const healthcareProfessionalRef = dbInstance.collection('healthcareProfessionals').doc()

    if (input.healthcareProfessionals !== null 
        && input.healthcareProfessionals !== undefined 
        && input.healthcareProfessionals.length > 0) {
        addHealthcareProfessional(
            input.healthcareProfessionals[0] as gqlTypes.HealthcareProfessional, healthcareProfessionalRef
        )
    }
    
    const newFacility = {
        id: facilityRef.id,
        contact: validateContactInput(input.contact as gqlTypes.Contact),
        healthcareProfessionalIds: [healthcareProfessionalRef.id],
        nameEn: validateNameEnInput(input.nameEn as string),
        nameJa: validateNameJaInput(input.nameJa as string), 
        isDeleted: false
    } satisfies gqlTypes.Facility
    
    await facilityRef.set(newFacility)

    return newFacility as gqlTypes.Facility
}

export const searchFacilities = async (userSearchQuery : string[]) : Promise<gqlTypes.Facility[]> => {
    const hpRef = dbInstance.collection('facilities')
    // make this a real query
    // this is still incomplete
    const snapshot = await hpRef.where('id', 'in', userSearchQuery).get()

    const facilities = [] as gqlTypes.Facility[]

    snapshot.forEach(doc => {
        const convertedEntity = mapDbEntityTogqlEntity(doc.data())

        facilities.push(convertedEntity)
    })

    return facilities
}

const mapDbEntityTogqlEntity = (dbEntity : firebase.DocumentData) : gqlTypes.Facility => {
    const gqlEntity = {
        nameEn: dbEntity.nameEn,
        nameJa: dbEntity.nameJa,
        contact: dbEntity.contact,
        healthcareProfessionalIds: dbEntity.healthcareProfessionalIds,
        healthcareProfessionals: dbEntity.healthcareProfessionals
    } satisfies gqlTypes.Facility
    
    return gqlEntity
}

function validateContactInput(contactInput: gqlTypes.Contact) : gqlTypes.Contact {
    const facilityContact = {
        address: contactInput.address as gqlTypes.PhysicalAddress,
        email: contactInput.email as string,
        mapsLink: contactInput.mapsLink as string,
        phone: contactInput.phone as string,
        website: contactInput.website as string
    }

    return facilityContact
}

function validateNameEnInput(nameEnInput: string) : string {
    const nameEn = nameEnInput

    return nameEn
}

function validateNameJaInput(nameJaInput: string) : string {
    const nameJa = nameJaInput

    return nameJa
}

