import { HealthcareProfessional, LocaleName, Contact, Degree, 
    Specialty, SpokenLanguage, Insurance, Facility } from '../typeDefs/dbSchema'
import { DocumentData, WhereFilterOp, getFirestore } from 'firebase-admin/firestore'
import { FacilityInput, PhysicalAddress, ContactInput, HealthcareProfessionalInput } from '../typeDefs/gqlTypes'
import { mapAndValidateHealthcareProInput } from './healthcareProfessionalService'

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

export const addFacility = async (input: FacilityInput) : Promise<Facility> => {
    const db = getFirestore()
   
    const facilityRef = db.collection('facilities')

    const healthcareProfessionalIds = await mapAndValidateHealthcareProInput(
        input.healthcareProfessionals as HealthcareProfessionalInput[]
    )
    
    const newFacility = {
        contact: validateContactInput(input.contact as Contact),
        healthcareProfessionalIds: healthcareProfessionalIds,
        healthcareProfessionals: [],
        nameEn: validateNameEnInput(input.nameEn as string),
        nameJa: validateNameJaInput(input.nameJa as string)
    } satisfies Facility
    
    await facilityRef.add(newFacility)

    return newFacility as Facility
}

export const searchFacilities = async (userSearchQuery : string[]) : Promise<Facility[]> => {
    const db = getFirestore()
    const hpRef = db.collection('facilities')
    // make this a real query
    // this is still incomplete
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
        nameEn: dbEntity.nameEn,
        nameJa: dbEntity.nameJa,
        contact: dbEntity.contact,
        healthcareProfessionalIds: dbEntity.healthcareProfessionalIds,
        healthcareProfessionals: dbEntity.healthcareProfessionals
    } satisfies Facility
    
    return gqlEntity
}

function validateContactInput(contactInput: Contact) : Contact {
    const facilityContact = {
        address: contactInput.address as PhysicalAddress,
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

